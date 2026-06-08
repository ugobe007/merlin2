import express from 'express';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

const RATE_LIMITS = {
  starter: 100,
  professional: 500,
  enterprise: 5000,
};

const rateLimitStore = new Map();
const projectStore = new Map();
let _supabase = null;

const WORKFLOW_STAGES = [
  {
    id: 'intake',
    label: 'Customer intake',
    owner: 'customer-success',
    tasks: [
      'Confirm facility identity and primary contact',
      'Capture utility account, service address, and decision timeline',
    ],
  },
  {
    id: 'site-intelligence',
    label: 'Site intelligence',
    owner: 'merlin-agent',
    tasks: [
      'Resolve utility, rate class, climate zone, and solar resource',
      'Flag grid, demand charge, roof/canopy, and backup-power risks',
    ],
  },
  {
    id: 'quote',
    label: 'Preliminary quote',
    owner: 'quote-engine',
    tasks: [
      'Size solar, storage, generator, and EV charging options',
      'Generate budget range, savings estimate, confidence tier, and next-best action',
    ],
  },
  {
    id: 'documents',
    label: 'Document collection',
    owner: 'customer',
    tasks: [
      'Collect utility bills, interval data, site photos, and single-line diagram',
      'Escalate missing documents before engineering review',
    ],
  },
  {
    id: 'engineering-review',
    label: 'Engineering review',
    owner: 'engineering',
    tasks: [
      'Validate constructability, interconnection path, and equipment fit',
      'Prepare EPC/vendor, financing, and owner approval packet',
    ],
  },
];

function createToken(payload) {
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

function getSupabase() {
  if (_supabase) return _supabase;

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key || url.includes('placeholder')) return null;

  _supabase = createClient(url, key, { auth: { persistSession: false } });
  return _supabase;
}

function toProjectRow(project) {
  return {
    id: project.projectId,
    partner_id: project.partnerId || null,
    status: project.status,
    source: project.source,
    industry: project.industry,
    facility: project.facility,
    contact: project.contact,
    goals: project.goals,
    quote_id: project.quoteId || null,
    webhook_url: project.webhookUrl || null,
    workflow: project.workflow,
    workflow_summary: project.workflowSummary,
  };
}

function fromProjectRow(row) {
  return {
    projectId: row.id,
    status: row.status,
    source: row.source,
    partnerId: row.partner_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    facility: row.facility || {},
    contact: row.contact || {},
    industry: row.industry,
    goals: row.goals || [],
    quoteId: row.quote_id,
    webhookUrl: row.webhook_url || null,
    workflow: row.workflow || [],
    workflowSummary: row.workflow_summary || {},
  };
}

async function saveProject(project) {
  projectStore.set(project.projectId, project);

  const supabase = getSupabase();
  if (!supabase) return { project, storage: 'memory' };

  const { data, error } = await supabase
    .from('merlin_projects')
    .upsert(toProjectRow(project), { onConflict: 'id' })
    .select('*')
    .single();

  if (error) {
    console.warn('[partner-api] workflow persistence fallback', error.message);
    return { project, storage: 'memory', warning: error.message };
  }

  const persisted = fromProjectRow(data);
  projectStore.set(persisted.projectId, persisted);
  return { project: persisted, storage: 'supabase' };
}

async function findProject(projectId) {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from('merlin_projects')
      .select('*')
      .eq('id', projectId)
      .maybeSingle();

    if (!error && data) {
      const project = fromProjectRow(data);
      projectStore.set(project.projectId, project);
      return project;
    }
  }

  return projectStore.get(projectId) || null;
}

async function recordProjectEvent(project, eventType, payload = {}) {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error } = await supabase.from('merlin_project_events').insert({
    project_id: project.projectId,
    partner_id: project.partnerId || null,
    event_type: eventType,
    payload,
  });

  if (error) console.warn('[partner-api] workflow event persistence failed', error.message);
}

function readToken(token) {
  const parts = token.split('.');
  const payload = parts.length === 3 ? parts[1] : parts[0];
  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized — Bearer token required' });
    return;
  }

  try {
    const payload = readToken(header.slice('Bearer '.length));
    req.partner = {
      partnerId: String(payload.sub || 'unknown'),
      tier: payload.tier || 'starter',
    };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function rateLimitMiddleware(req, res, next) {
  const partner = req.partner;
  if (!partner) {
    next();
    return;
  }

  const limit = RATE_LIMITS[partner.tier] || RATE_LIMITS.starter;
  const now = Date.now();
  const key = partner.partnerId;
  const current = rateLimitStore.get(key);

  if (!current || now > current.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + 3600000 });
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', limit - 1);
    next();
    return;
  }

  if (current.count >= limit) {
    res.status(429).json({ error: 'Rate limit exceeded', retryAfter: Math.ceil((current.resetAt - now) / 1000) });
    return;
  }

  current.count += 1;
  res.setHeader('X-RateLimit-Limit', limit);
  res.setHeader('X-RateLimit-Remaining', limit - current.count);
  next();
}

function getLeadValue(industry) {
  const values = {
    'car-wash': 150,
    hotel: 200,
    'data-center': 500,
    'ev-charging': 300,
    restaurant: 100,
    office: 150,
    warehouse: 200,
    manufacturing: 400,
    university: 300,
    hospital: 400,
    agriculture: 150,
    retail: 100,
  };
  return values[industry] || 100;
}

function normalizeIndustry(industry) {
  return String(industry || '')
    .trim()
    .toLowerCase()
    .replace(/_/g, '-');
}

function createWorkflowState() {
  return WORKFLOW_STAGES.map((stage, stageIndex) => ({
    ...stage,
    status: stageIndex === 0 ? 'active' : 'pending',
    tasks: stage.tasks.map((title, taskIndex) => ({
      id: `${stage.id}-${taskIndex + 1}`,
      title,
      status: 'open',
    })),
  }));
}

function refreshWorkflowStageStatuses(workflow) {
  let activeAssigned = false;
  let previousStagesDone = true;

  for (const stage of workflow) {
    const allDone = stage.tasks.every((candidate) => candidate.status === 'done');
    const hasBlocked = stage.tasks.some((candidate) => candidate.status === 'blocked');

    if (hasBlocked) {
      stage.status = 'blocked';
    } else if (allDone) {
      stage.status = 'done';
    } else if (!activeAssigned && previousStagesDone) {
      stage.status = 'active';
      activeAssigned = true;
    } else {
      stage.status = 'pending';
    }

    previousStagesDone = previousStagesDone && allDone;
  }

  return workflow;
}

function summarizeWorkflow(workflow) {
  const tasks = workflow.flatMap((stage) => stage.tasks);
  const completedTasks = tasks.filter((task) => task.status === 'done').length;
  const activeStage = workflow.find((stage) => stage.status === 'active') || workflow[workflow.length - 1];

  return {
    activeStage: activeStage.id,
    completedTasks,
    totalTasks: tasks.length,
    percentComplete: Math.round((completedTasks / tasks.length) * 100),
  };
}

async function fireWebhook(url, event, payload) {
  const body = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
  const signature = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET || 'default')
    .update(body)
    .digest('hex');

  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Merlin-Signature': `sha256=${signature}`,
      'X-Merlin-Event': event,
    },
    body,
  });
}

export async function createWorkflowProject(input = {}, options = {}) {
  const industry = normalizeIndustry(input.industry);
  const errors = [];

  if (!industry) errors.push('industry is required');
  if (!input.facility?.name) errors.push('facility.name is required');
  if (!input.facility?.zipCode || !/^\d{5}$/.test(String(input.facility.zipCode))) errors.push('facility.zipCode must be 5 digits');
  if (!input.contact?.email) errors.push('contact.email is required');

  if (errors.length) {
    const error = new Error('Validation failed');
    error.status = 400;
    error.details = errors.map((message) => ({ message }));
    throw error;
  }

  const now = new Date().toISOString();
  const project = {
    projectId: crypto.randomUUID(),
    status: 'active',
    source: input.source || 'partner-api',
    partnerId: options.partnerId || null,
    createdAt: now,
    updatedAt: now,
    facility: {
      name: String(input.facility.name).trim(),
      address: input.facility.address || null,
      zipCode: String(input.facility.zipCode),
      utilityAccount: input.facility.utilityAccount || null,
    },
    contact: {
      name: input.contact.name || null,
      email: String(input.contact.email).trim().toLowerCase(),
      phone: input.contact.phone || null,
    },
    industry,
    goals: Array.isArray(input.goals) ? input.goals.slice(0, 8) : [],
    quoteId: input.quoteId || null,
    webhookUrl: input.webhookUrl || null,
    workflow: createWorkflowState(),
  };

  project.workflowSummary = summarizeWorkflow(project.workflow);
  const { project: savedProject, storage, warning } = await saveProject(project);
  await recordProjectEvent(savedProject, 'project.created', {
    source: savedProject.source,
    activeStage: savedProject.workflowSummary.activeStage,
    storage,
  });

  if (savedProject.webhookUrl) {
    fireWebhook(savedProject.webhookUrl, 'project.created', savedProject).catch((error) => console.error('[partner-api] webhook failed', error));
  }

  return { project: savedProject, storage, warning };
}

router.post('/auth/token', (req, res) => {
  const { apiKey, apiSecret } = req.body || {};
  const expectedKey = process.env.PARTNER_API_KEY;
  const expectedSecret = process.env.PARTNER_API_SECRET;

  if (!apiKey || !apiSecret) {
    res.status(400).json({ error: 'apiKey and apiSecret required' });
    return;
  }

  if (expectedKey && expectedSecret && (apiKey !== expectedKey || apiSecret !== expectedSecret)) {
    res.status(401).json({ error: 'Invalid partner credentials' });
    return;
  }

  const payload = createToken({ sub: apiKey, tier: process.env.PARTNER_API_TIER || 'professional', iat: Date.now() });
  res.json({ accessToken: `merlin.${payload}.signature`, expiresIn: 3600, tokenType: 'Bearer' });
});

router.get('/v1/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0', benchmarkVersion: 'nrel-atb-2024-v1.2', timestamp: new Date().toISOString() });
});

router.get('/v1/industries', (_req, res) => {
  res.json([
    'car-wash',
    'hotel',
    'data-center',
    'ev-charging',
    'restaurant',
    'office',
    'warehouse',
    'manufacturing',
    'university',
    'hospital',
    'agriculture',
    'retail',
  ].map((slug) => ({ slug, leadValue: getLeadValue(slug), status: 'active' })));
});

router.post('/v1/quotes', authMiddleware, rateLimitMiddleware, async (req, res) => {
  const input = req.body || {};
  const errors = [];
  if (!input.industry) errors.push('industry is required');
  if (!input.peakDemandKw || Number(input.peakDemandKw) < 50) errors.push('peakDemandKw must be >= 50');
  if (!input.monthlyBillDollars || Number(input.monthlyBillDollars) < 100) errors.push('monthlyBillDollars must be >= 100');
  if (!input.zipCode || !/^\d{5}$/.test(String(input.zipCode))) errors.push('zipCode must be 5 digits');

  if (errors.length) {
    res.status(400).json({ error: 'Validation failed', details: errors.map((message) => ({ message })) });
    return;
  }

  const factors = {
    'car-wash': 0.35,
    hotel: 0.4,
    'data-center': 0.9,
    'ev-charging': 0.45,
    restaurant: 0.3,
    office: 0.35,
    warehouse: 0.25,
    manufacturing: 0.55,
    university: 0.4,
    hospital: 0.85,
    agriculture: 0.2,
    retail: 0.3,
  };
  const factor = factors[input.industry] || 0.35;
  const systemSizeMW = Math.ceil(((Number(input.peakDemandKw) * factor) / 1000) * 4) / 4;
  const durationHours = input.primaryUseCase === 'backup-power' ? 8 : 4;
  const systemSizeKwh = systemSizeMW * 1000 * durationHours;
  const totalCost = systemSizeKwh * 380 * 1.35;
  const netCost = totalCost * 0.7;
  const annualSavings = Number(input.monthlyBillDollars) * 12 * 0.2;
  const result = {
    quoteId: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    input,
    recommendation: { systemSizeMW, systemSizeKwh, durationHours, batteryChemistry: 'LFP' },
    financials: {
      totalInstalledCostDollars: Math.round(totalCost),
      netCostAfterITCDollars: Math.round(netCost),
      annualSavingsDollars: Math.round(annualSavings),
      simplePaybackYears: Math.round((netCost / annualSavings) * 10) / 10,
    },
    partnerId: req.partner?.partnerId,
  };

  if (input.webhookUrl) {
    fireWebhook(input.webhookUrl, 'quote.created', result).catch((error) => console.error('[partner-api] webhook failed', error));
  }

  res.json(result);
});

router.post('/v1/leads', authMiddleware, rateLimitMiddleware, (req, res) => {
  const lead = req.body || {};
  if (!lead.industry || !lead.contact?.email) {
    res.status(400).json({ error: 'contact.email and industry are required' });
    return;
  }

  res.status(201).json({
    leadId: crypto.randomUUID(),
    status: 'captured',
    estimatedContactTime: 'Within 24 business hours',
    leadValue: getLeadValue(lead.industry),
  });
});

router.post('/v1/projects', authMiddleware, rateLimitMiddleware, async (req, res) => {
  try {
    const { project, storage, warning } = await createWorkflowProject(req.body || {}, {
      partnerId: req.partner?.partnerId,
    });
    res.status(201).json({ ...project, storage, warning });
  } catch (error) {
    res.status(error.status || 500).json({
      error: error.message || 'Project creation failed',
      details: error.details,
    });
  }
});

router.get('/v1/projects/:projectId/workflow', authMiddleware, rateLimitMiddleware, async (req, res) => {
  const project = await findProject(req.params.projectId);
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  res.json({
    projectId: project.projectId,
    status: project.status,
    workflowSummary: project.workflowSummary,
    workflow: project.workflow,
  });
});

router.patch('/v1/projects/:projectId/tasks/:taskId', authMiddleware, rateLimitMiddleware, async (req, res) => {
  const project = await findProject(req.params.projectId);
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  const nextStatus = req.body?.status;
  if (!['open', 'blocked', 'done'].includes(nextStatus)) {
    res.status(400).json({ error: 'status must be one of: open, blocked, done' });
    return;
  }

  const task = project.workflow.flatMap((stage) => stage.tasks).find((candidate) => candidate.id === req.params.taskId);
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  const previousActiveStage = project.workflowSummary?.activeStage;
  task.status = nextStatus;
  task.updatedAt = new Date().toISOString();
  task.updatedBy = req.partner?.partnerId || 'partner-api';

  refreshWorkflowStageStatuses(project.workflow);

  project.updatedAt = new Date().toISOString();
  project.workflowSummary = summarizeWorkflow(project.workflow);
  const { project: savedProject, storage, warning } = await saveProject(project);
  await recordProjectEvent(savedProject, 'task.updated', {
    taskId: task.id,
    status: task.status,
    activeStage: savedProject.workflowSummary.activeStage,
    previousActiveStage,
  });

  const activeStageChanged = previousActiveStage !== savedProject.workflowSummary.activeStage;
  if (savedProject.webhookUrl) {
    fireWebhook(savedProject.webhookUrl, 'task.updated', {
      projectId: savedProject.projectId,
      task,
      workflowSummary: savedProject.workflowSummary,
    }).catch((error) => console.error('[partner-api] webhook failed', error));

    if (activeStageChanged && savedProject.workflowSummary.activeStage === 'engineering-review') {
      fireWebhook(savedProject.webhookUrl, 'project.ready_for_engineering', savedProject).catch((error) => console.error('[partner-api] webhook failed', error));
    }
  }

  res.json({
    projectId: savedProject.projectId,
    task,
    workflowSummary: savedProject.workflowSummary,
    workflow: savedProject.workflow,
    storage,
    warning,
  });
});

router.post('/v1/webhooks', authMiddleware, (req, res) => {
  const { url, events, secret } = req.body || {};
  if (!url || !Array.isArray(events) || !events.length) {
    res.status(400).json({ error: 'url and events array required' });
    return;
  }

  res.status(201).json({
    webhookId: crypto.randomUUID(),
    url,
    events,
    signingKey: secret || crypto.randomBytes(32).toString('hex'),
  });
});

export default router;