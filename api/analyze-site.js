const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json');
  response.setHeader('Cache-Control', 'no-store');
  response.end(JSON.stringify(payload));
}

function fallbackAnalysis({ fileName, fileSize, location }) {
  const sizeMb = fileSize ? fileSize / (1024 * 1024) : 0;
  const confidence = sizeMb > 1.5 ? 0.52 : sizeMb > 0.4 ? 0.45 : 0.36;
  const locationLabel = [location?.city, location?.state, location?.zip].filter(Boolean).join(', ');

  return {
    source: 'server-fallback',
    confidence,
    roofSqft: null,
    usableSolarSqft: null,
    equipmentNotes: [
      `Received ${fileName || 'site photo'} for EPC site scan.`,
      'Vision model is not configured, so dimensions are queued for manual EPC verification.',
      locationLabel ? `Location context: ${locationLabel}.` : 'No location context was provided.',
    ],
    risks: [
      'Verify roof area, parapets, skylights, HVAC obstructions, and electrical service rating before quote lock.',
    ],
    recommendedNextStep: 'Set OPENAI_API_KEY in the deployment environment to enable automatic image extraction.',
  };
}

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const body = Buffer.concat(chunks).toString('utf8');
  return body ? JSON.parse(body) : {};
}

function normalizeAiAnalysis(value) {
  return {
    confidence: Number(value.confidence) || 0.65,
    roofSqft: Number(value.roofSqft) || null,
    usableSolarSqft: Number(value.usableSolarSqft) || null,
    equipmentNotes: Array.isArray(value.equipmentNotes) ? value.equipmentNotes.slice(0, 6) : [],
    risks: Array.isArray(value.risks) ? value.risks.slice(0, 6) : [],
    recommendedNextStep: value.recommendedNextStep || 'Review extracted site data before quote generation.',
  };
}

async function analyzeWithOpenAI({ imageDataUrl, fileName, location }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_VISION_MODEL || 'gpt-4o-mini',
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are an EPC solar/BESS site intake assistant. Return only valid JSON with keys: confidence, roofSqft, usableSolarSqft, equipmentNotes, risks, recommendedNextStep. Use null for dimensions when not visually inferable. Do not invent precise measurements from a single photo.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this commercial energy site photo for EPC intake. File: ${fileName || 'unknown'}. Location context: ${JSON.stringify(location || {})}. Focus on roof/equipment clues, solar feasibility, visible obstructions, and what must be field-verified.`,
            },
            {
              type: 'image_url',
              image_url: { url: imageDataUrl, detail: 'low' },
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI vision request failed: ${response.status} ${text.slice(0, 200)}`);
  }

  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenAI response did not include analysis content.');
  return normalizeAiAnalysis(JSON.parse(content));
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    sendJson(response, 405, { error: 'Method not allowed' });
    return;
  }

  try {
    const payload = await readJsonBody(request);
    const { imageDataUrl, fileName, fileType, fileSize, location } = payload;

    if (!imageDataUrl || typeof imageDataUrl !== 'string' || !imageDataUrl.startsWith('data:image/')) {
      sendJson(response, 400, { error: 'A base64 image data URL is required.' });
      return;
    }

    if (fileType && !String(fileType).startsWith('image/')) {
      sendJson(response, 400, { error: 'Only image uploads are supported.' });
      return;
    }

    if (fileSize && Number(fileSize) > MAX_IMAGE_BYTES) {
      sendJson(response, 413, { error: 'Image is larger than 8 MB.' });
      return;
    }

    const aiAnalysis = await analyzeWithOpenAI({ imageDataUrl, fileName, location });
    sendJson(response, 200, aiAnalysis || fallbackAnalysis({ fileName, fileSize, location }));
  } catch (error) {
    console.error('[analyze-site]', error);
    sendJson(response, 200, fallbackAnalysis({ fileName: 'site photo', fileSize: 0, location: null }));
  }
}
