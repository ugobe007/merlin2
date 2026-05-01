const MAX_INLINE_IMAGE_BYTES = 8 * 1024 * 1024;

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('Could not read image file.'));
    reader.readAsDataURL(file);
  });
}

function createLocalEpcEstimate({ file, location }) {
  const sizeMb = file?.size ? file.size / (1024 * 1024) : 0;
  const confidence = sizeMb > 1.5 ? 0.48 : sizeMb > 0.4 ? 0.42 : 0.35;
  const locationLabel = [location?.city, location?.state, location?.zip].filter(Boolean).join(', ');

  return {
    source: 'local-fallback',
    confidence,
    roofSqft: null,
    usableSolarSqft: null,
    equipmentNotes: [
      'Photo captured for EPC review.',
      'Automated visual extraction requires /api/analyze-site plus an AI vision key.',
      locationLabel ? `Location context attached: ${locationLabel}.` : 'No confirmed location context attached yet.',
    ],
    risks: [
      'Preliminary scan only — verify roof dimensions, setbacks, obstructions, and service gear on site.',
    ],
    recommendedNextStep: 'Run npm run dev:full locally or set OPENAI_API_KEY in deployment for automatic extraction.',
  };
}

export async function analyzeEpcSitePhoto({ file, imageDataUrl, location }) {
  if (!file) throw new Error('No site photo selected.');
  if (file.size > MAX_INLINE_IMAGE_BYTES) {
    return {
      ...createLocalEpcEstimate({ file, location }),
      confidence: 0.25,
      risks: ['Image is larger than 8 MB; compress before automated analysis.'],
      recommendedNextStep: 'Compress the photo or upload a smaller site image for automated scan.',
    };
  }

  const configuredApiUrl = import.meta.env?.VITE_EPC_ANALYZE_API_URL;
  const shouldCallApi = configuredApiUrl || !import.meta.env?.DEV;
  if (!shouldCallApi) return createLocalEpcEstimate({ file, location });

  try {
    const response = await fetch(configuredApiUrl || '/api/analyze-site', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageDataUrl,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        location,
      }),
    });

    if (!response.ok) throw new Error(`Site analysis API returned ${response.status}`);
    const data = await response.json();
    return { source: 'api', ...data };
  } catch {
    return createLocalEpcEstimate({ file, location });
  }
}
