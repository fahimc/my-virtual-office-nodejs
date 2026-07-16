import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { promises as fs, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import { isLuxuryPropertyBrief, renderLuxuryPropertyWebsite } from './src/templates/luxuryPropertyTemplate.js';
import { premiumTemplateConfigForBrief } from './src/templates/premiumTemplateCatalog.js';

const SERVERLESS = process.env.NETLIFY === 'true' || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);
const LAMBDA_TASK_ROOT = process.env.LAMBDA_TASK_ROOT;
const APP_FILENAME = LAMBDA_TASK_ROOT ? path.join(LAMBDA_TASK_ROOT, 'server.js') : fileURLToPath(import.meta.url);
const APP_DIR = LAMBDA_TASK_ROOT || path.dirname(APP_FILENAME);
loadEnvFile(path.join(APP_DIR, '.env'));
const PORT = Number(process.env.PORT || process.env.VO_PORT || 3000);
const DATA_DIR = process.env.DATA_DIR || (SERVERLESS ? path.join('/tmp', 'my-virtual-office-nodejs-data') : path.join(APP_DIR, 'data'));
const DEFAULT_CONFIG = path.join(DATA_DIR, 'default-office-config.json');
const DEFAULT_CONFIG_SEED = path.join(APP_DIR, 'data', 'default-office-config.json');
const USER_CONFIG = path.join(DATA_DIR, 'office-config.json');
const AGENTS_FILE = path.join(DATA_DIR, 'agents.json');
const EMAILS_FILE = path.join(DATA_DIR, 'emails.json');
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gemma4:e4b';
const OFFICE_EMAIL_DOMAIN = process.env.OFFICE_EMAIL_DOMAIN || 'virtual-office.local';
const PLACEHOLDER_MANIFEST = loadPlaceholderManifest();

const app = express();
const server = SERVERLESS ? undefined : createServer(app);
const wss = server ? new WebSocketServer({ server }) : undefined;

app.use(express.json({ limit: '25mb' }));
let agencyApisMounted = false;

async function mountAgencyApis() {
  if (agencyApisMounted) return;
  try {
    const { createAgencyRouter } = await import('./dist/agency/api/agencyRoutes.js');
    const { createCompanyRouter } = await import('./dist/agency/api/companyRoutes.js');
    const { createClientPortalRouter, createAgencyClientPortalRouter, createAgencyPreviewRouter } = await import('./dist/agency/client-portal/clientPortalRoutes.js');
    app.use('/api/agency', createAgencyRouter({ dataDir: DATA_DIR, workspaceRoot: APP_DIR }));
    app.use('/api/company', createCompanyRouter({ dataDir: DATA_DIR, workspaceRoot: APP_DIR }));
    app.use('/api/portal', createClientPortalRouter({ dataDir: DATA_DIR, workspaceRoot: APP_DIR }));
    app.use('/api/agency/client-portal', createAgencyClientPortalRouter({ dataDir: DATA_DIR, workspaceRoot: APP_DIR }));
    app.use('/api/agency/previews', createAgencyPreviewRouter({ dataDir: DATA_DIR, workspaceRoot: APP_DIR }));
    agencyApisMounted = true;
  } catch (error) {
    console.warn('Agency API is not available until TypeScript is built:', error.message);
  }
}

app.use('/api', async (_req, res, next) => {
  try {
    await initializeRuntime();
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    return;
  }
  next();
});

function loadEnvFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const separator = line.indexOf('=');
      if (separator === -1) continue;
      const key = line.slice(0, separator).trim();
      const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '');
      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch {
    // Local .env is optional; production hosts should use managed environment variables.
  }
}

async function readJsonFileWithRetry(filePath, attempts = 5) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return JSON.parse(await fs.readFile(filePath, 'utf8'));
    } catch (error) {
      lastError = error;
      if (!(error instanceof SyntaxError) || attempt === attempts - 1) break;
      await new Promise(resolve => setTimeout(resolve, 40 + attempt * 40));
    }
  }
  throw lastError;
}

async function readJsonFileOrEmpty(filePath) {
  const blobData = await readJsonFromBlob(path.basename(filePath));
  if (blobData) return blobData;
  try {
    return await readJsonFileWithRetry(filePath);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return {};
    }
    throw error;
  }
}

async function readJsonFromBlob(key) {
  if (!(process.env.NETLIFY === 'true' || process.env.AWS_LAMBDA_FUNCTION_NAME)) return undefined;
  try {
    const { getStore } = await import('@netlify/blobs');
    const store = getStore({ name: process.env.AGENCY_BLOB_STORE || 'agency-data', consistency: 'strong' });
    return await store.get(key, { type: 'json' });
  } catch (error) {
    console.warn(`Netlify Blob read unavailable for ${key}: ${error instanceof Error ? error.message : String(error)}`);
    return undefined;
  }
}

app.get(['/previews/:projectId', '/previews/:projectId/'], async (req, res) => {
  try {
    const storePath = path.join(DATA_DIR, 'agency-store.json');
    const data = await readJsonFileOrEmpty(storePath);
    const project = data.projects?.find(item => item.id === req.params.projectId);
    if (!project) return res.status(404).send('Preview project not found');
    if (process.env.PREVIEW_REQUIRE_TOKEN === 'true') {
      const token = typeof req.query.previewToken === 'string' ? req.query.previewToken : '';
      const allowed = (data.previewVersions || []).some(item => item.projectId === project.id && item.accessToken === token);
      if (!allowed) return res.status(403).send('Preview access token is required');
    }
    const artifacts = (data.artifacts || []).filter(item => item.projectId === project.id);
    res.type('html').send(renderProjectPreview(project, artifacts, data));
  } catch (error) {
    res.status(500).send(`Preview unavailable: ${error.message}`);
  }
});

app.get(['/design-concepts/:projectId/:directionId', '/design-concepts/:projectId/:directionId/'], async (req, res) => {
  try {
    const storePath = path.join(DATA_DIR, 'agency-store.json');
    const data = await readJsonFileOrEmpty(storePath);
    const project = data.projects?.find(item => item.id === req.params.projectId) || fallbackDesignProject(req.params.projectId, req.params.directionId);
    const fallbackDirection = fallbackDesignDirection(req.params.directionId, project.id);
    data.design = {
      ...(data.design || {}),
      creativeDirections: [
        ...((data.design?.creativeDirections || []).filter(item => item.projectId !== project.id || item.id !== fallbackDirection.id)),
        fallbackDirection
      ]
    };
    const artifacts = (data.artifacts || []).filter(item => item.projectId === project.id);
    res.type('html').send(renderProjectPreview(project, artifacts, data, { directionId: req.params.directionId, concept: true }));
  } catch (error) {
    res.status(500).send(`Design concept unavailable: ${error.message}`);
  }
});

app.get(['/portal', '/portal/*'], (_req, res) => {
  res.sendFile(path.join(APP_DIR, 'public', 'portal.html'));
});

app.get('/generated-images/:projectId/:fileName', async (req, res, next) => {
  if (!SERVERLESS) return next();
  const safeProjectId = String(req.params.projectId || '').replace(/[^a-zA-Z0-9_-]/g, '');
  const safeFileName = String(req.params.fileName || '').replace(/[^a-zA-Z0-9._-]/g, '');
  if (!safeProjectId || !safeFileName) return res.status(400).send('Invalid generated image path');
  try {
    const { getStore } = await import('@netlify/blobs');
    const store = getStore({ name: process.env.AGENCY_BLOB_STORE || 'agency-data', consistency: 'strong' });
    const key = `generated-images/${safeProjectId}/${safeFileName}`;
    const data = await store.get(key, { type: 'arrayBuffer' });
    if (!data) return res.status(404).send('Generated image not found');
    res.setHeader('content-type', contentTypeForFile(safeFileName));
    res.setHeader('cache-control', 'public, max-age=31536000, immutable');
    res.send(Buffer.from(data));
  } catch (error) {
    res.status(500).send(`Generated image unavailable: ${error instanceof Error ? error.message : String(error)}`);
  }
});

app.get('/generated/brand-guidelines/:projectId/:fileName', async (req, res, next) => {
  if (!SERVERLESS) return next();
  const safeProjectId = String(req.params.projectId || '').replace(/[^a-zA-Z0-9_-]/g, '');
  const safeFileName = String(req.params.fileName || '').replace(/[^a-zA-Z0-9._-]/g, '');
  if (!safeProjectId || !['brand-guidelines.html', 'brand-guidelines.pdf'].includes(safeFileName)) {
    return res.status(400).send('Invalid brand guidelines path');
  }
  try {
    const { getStore } = await import('@netlify/blobs');
    const store = getStore({ name: process.env.AGENCY_BLOB_STORE || 'agency-data', consistency: 'strong' });
    const key = `generated/brand-guidelines/${safeProjectId}/${safeFileName}`;
    const data = await store.get(key, { type: 'arrayBuffer' });
    if (!data) return res.status(404).send('Brand guidelines not found');
    res.setHeader('content-type', safeFileName.endsWith('.pdf') ? 'application/pdf' : 'text/html; charset=utf-8');
    res.setHeader('cache-control', 'private, max-age=300');
    res.send(Buffer.from(data));
  } catch (error) {
    res.status(500).send(`Brand guidelines unavailable: ${error instanceof Error ? error.message : String(error)}`);
  }
});

app.use(express.static(path.join(APP_DIR, 'public')));

function contentTypeForFile(fileName) {
  const lower = String(fileName || '').toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.svg')) return 'image/svg+xml; charset=utf-8';
  return 'application/octet-stream';
}

const defaultSpawnedAgents = [
  {
    id: 'ai-person-1',
    name: 'AI Person 1',
    roleName: 'Client Concierge',
    role: 'Front Desk / Client Intake Manager',
    job: 'Welcome visitors, capture project briefs, qualify leads, summarize needs, identify missing details, and route work to the right office team.',
    personality: 'Warm, concise, organized, calm under pressure, politely curious, and excellent at turning messy client requests into clear intake notes.',
    branch: 'CEO',
    color: '#ffd43b',
    status: 'intake',
    x: 500,
    y: 115,
    managed: true,
    email: 'ai-person-1@virtual-office.local',
    capabilities: { email: true },
    llm: { provider: 'ollama', model: OLLAMA_MODEL }
  }
];

const baseAgents = [
  { id: 'calen', name: 'Calen', branch: 'CEO', color: '#5fbf60', role: 'Lead operator', status: 'browsing', x: 610, y: 100 },
  { id: 'flo', name: 'Flo', branch: 'BRANCH_2', color: '#8a2be2', role: 'Kitchen ops', status: 'watching TV', x: 735, y: 110 },
  { id: 'alan', name: 'Alan', branch: 'BRANCH_2', color: '#ff6d00', role: 'Support', status: 'walking', x: 545, y: 210 },
  { id: 'ana', name: 'Ana', branch: 'BRANCH_1', color: '#536dfe', role: 'Engineer', status: 'working', x: 720, y: 330 },
  { id: 'plan', name: 'Plan', branch: 'UNASSIGNED', color: '#90a4ae', role: 'Planner', status: 'idle', x: 730, y: 455 },
  { id: 'elix', name: 'Elix', branch: 'UNASSIGNED', color: '#ffd700', role: 'Office AI', status: 'watching TV', x: 390, y: 250 },
  { id: 'moe', name: 'Moe', branch: 'BRANCH_1', color: '#d32f2f', role: 'Ops', status: 'idle', x: 115, y: 340 },
  { id: 'mark', name: 'Mark', branch: 'BRANCH_1', color: '#7d5a4f', role: 'Engineer', status: 'chatting', x: 205, y: 350 },
  { id: 'cash', name: 'Cash', branch: 'UNASSIGNED', color: '#ffab00', role: 'Finance', status: 'walking', x: 415, y: 620 },
  { id: 'mike', name: 'Mike', branch: 'BRANCH_1', color: '#1976d2', role: 'Integrator', status: 'meeting', x: 60, y: 690 },
  { id: 'filer', name: 'Filer', branch: 'BRANCH_1', color: '#009688', role: 'Archivist', status: 'working', x: 155, y: 690 },
  { id: 'reva', name: 'Reva', branch: 'BRANCH_2', color: '#ff6d00', role: 'Reviewer', status: 'break', x: 245, y: 690 },
  { id: 'tasky', name: 'Tasky', branch: 'CEO', color: '#4caf50', role: 'Scheduler', status: 'working', x: 605, y: 690 },
  { id: 'itty', name: 'Itty', branch: 'UNASSIGNED', color: '#00bcd4', role: 'Assistant', status: 'idle', x: 690, y: 690 },
  { id: 'trainer', name: 'Gen Trainer', branch: 'UNASSIGNED', color: '#ec407a', role: 'Trainer', status: 'working', x: 770, y: 690 }
];

let spawnedAgents = [];
let emailStore = { messages: [] };

const activityLog = [
  logEntry('Office booted'),
  logEntry('Agents discovered'),
  logEntry(`Ollama model set to ${OLLAMA_MODEL}`)
];

function logEntry(message) {
  return { time: new Date().toISOString(), message };
}

async function ensureConfig() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DEFAULT_CONFIG);
  } catch {
    const seed = await fs.readFile(DEFAULT_CONFIG_SEED, 'utf8');
    await fs.writeFile(DEFAULT_CONFIG, seed);
  }
  try {
    await fs.access(USER_CONFIG);
  } catch {
    const seed = await fs.readFile(DEFAULT_CONFIG, 'utf8');
    await fs.writeFile(USER_CONFIG, seed);
  }
}

async function ensureAgents() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(AGENTS_FILE, 'utf8');
    spawnedAgents = JSON.parse(raw).map(ensureAgentCapabilities);
    await saveSpawnedAgents();
  } catch {
    spawnedAgents = defaultSpawnedAgents.map(agent => ensureAgentCapabilities({ ...agent }));
    await saveSpawnedAgents();
  }
}

async function saveSpawnedAgents() {
  await fs.writeFile(AGENTS_FILE, JSON.stringify(spawnedAgents, null, 2));
}

async function ensureEmails() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    emailStore = JSON.parse(await fs.readFile(EMAILS_FILE, 'utf8'));
    if (!Array.isArray(emailStore.messages)) emailStore = { messages: [] };
  } catch {
    emailStore = { messages: [] };
    await saveEmailStore();
  }
}

async function saveEmailStore() {
  await fs.writeFile(EMAILS_FILE, JSON.stringify(emailStore, null, 2));
}

async function readConfig() {
  await ensureConfig();
  const raw = await fs.readFile(USER_CONFIG, 'utf8');
  return JSON.parse(raw);
}

async function writeConfig(config) {
  await fs.writeFile(USER_CONFIG, JSON.stringify(config, null, 2));
  broadcast({ type: 'config', config });
}

function broadcast(payload) {
  if (!wss) return;
  const body = JSON.stringify(payload);
  for (const client of wss.clients) {
    if (client.readyState === 1) client.send(body);
  }
}

function getAgents() {
  return [...spawnedAgents, ...baseAgents];
}

function findAgent(id) {
  return getAgents().find(item => item.id === id);
}

function snapshot() {
  const agents = getAgents();
  return {
    agents,
    activity: activityLog.slice(-80),
    email: { smtpEnabled: smtpEnabled(), domain: OFFICE_EMAIL_DOMAIN },
    stats: {
      working: agents.filter(a => a.status === 'working').length,
      meeting: agents.filter(a => a.status === 'meeting').length,
      idle: agents.filter(a => a.status === 'idle').length,
      break: agents.filter(a => a.status === 'break').length
    }
  };
}

function makeAgentEmail(id) {
  return `${id}@${OFFICE_EMAIL_DOMAIN}`;
}

function ensureAgentCapabilities(agent) {
  if (!agent.managed) return agent;
  agent.email = agent.email || makeAgentEmail(agent.id);
  agent.capabilities = { ...(agent.capabilities || {}), email: true };
  agent.llm = agent.llm || { provider: 'ollama', model: OLLAMA_MODEL };
  return agent;
}

function buildAgentPrompt(agent, text) {
  return [
    `You are ${agent.name}, working inside a virtual office.`,
    `Role name: ${agent.roleName || agent.role || 'Office Agent'}.`,
    `Job: ${agent.job || agent.role || 'Help the user with office work.'}`,
    `Personality: ${agent.personality || 'Helpful, concise, and practical.'}`,
    'Stay in character. Answer as this office agent. Be concise, ask for missing intake details when needed, and turn vague requests into clear next steps.',
    '',
    `User message: ${text}`
  ].join('\n');
}

async function askOllama(agent, text) {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: agent.llm?.model || OLLAMA_MODEL,
      prompt: buildAgentPrompt(agent, text),
      stream: false,
      options: {
        temperature: 0.55,
        top_p: 0.9,
        num_predict: 320
      }
    }),
    signal: AbortSignal.timeout(180000)
  });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Ollama ${response.status}: ${body || response.statusText}`);
  }
  const data = await response.json();
  return String(data.response || '').trim();
}

async function draftEmailWithAgent(agent, payload) {
  const to = String(payload.to || '').trim();
  const subject = String(payload.subject || '').trim();
  const brief = String(payload.brief || payload.body || '').trim();
  const prompt = [
    'Draft an email for this office agent.',
    `Agent: ${agent.name}`,
    `Role: ${agent.roleName || agent.role}`,
    `Job: ${agent.job || agent.role}`,
    `Personality: ${agent.personality || 'Helpful and concise.'}`,
    `Recipient: ${to || 'unspecified'}`,
    `Subject: ${subject || 'unspecified'}`,
    `Brief: ${brief || 'No brief provided.'}`,
    '',
    'Return only the email body. Keep it professional, concise, and useful. Include a clear next step.'
  ].join('\n');
  const draft = await askOllama(agent, prompt);
  if (!draft.trim()) throw new Error('Ollama returned an empty email draft');
  return draft;
}

function smtpEnabled() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransporter() {
  if (!smtpEnabled()) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === '1' || process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

async function sendEmail(agent, payload) {
  const to = String(payload.to || '').trim();
  const subject = String(payload.subject || '').trim();
  const body = String(payload.body || '').trim();
  if (!to || !subject || !body) {
    const error = new Error('Email requires to, subject, and body');
    error.statusCode = 400;
    throw error;
  }
  const message = {
    id: `email-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    agentId: agent.id,
    agentName: agent.name,
    from: agent.email,
    to,
    subject,
    body,
    status: smtpEnabled() ? 'sending' : 'recorded',
    transport: smtpEnabled() ? 'smtp' : 'local-outbox',
    createdAt: new Date().toISOString()
  };
  const transporter = getTransporter();
  if (transporter) {
    const result = await transporter.sendMail({
      from: process.env.SMTP_FROM || `"${agent.name}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text: body,
      replyTo: agent.email.includes('@virtual-office.local') ? undefined : agent.email
    });
    message.status = 'sent';
    message.smtpMessageId = result.messageId;
    message.sentAt = new Date().toISOString();
  }
  emailStore.messages.unshift(message);
  emailStore.messages = emailStore.messages.slice(0, 500);
  await saveEmailStore();
  return message;
}

function createAgent(payload = {}) {
  const name = String(payload.name || `AI Person ${spawnedAgents.length + 1}`).trim();
  const roleName = String(payload.roleName || 'Office Manager').trim();
  const role = String(payload.role || roleName).trim();
  const job = String(payload.job || 'Handle office requests and route work to the right person.').trim();
  const personality = String(payload.personality || 'Helpful, organized, and concise.').trim();
  const idBase = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `agent-${Date.now()}`;
  let id = idBase;
  let suffix = 2;
  const existing = new Set(getAgents().map(agent => agent.id));
  while (existing.has(id)) {
    id = `${idBase}-${suffix}`;
    suffix += 1;
  }
  return {
    id,
    name,
    roleName,
    role,
    job,
    personality,
    branch: payload.branch || 'UNASSIGNED',
    color: payload.color || '#ffd43b',
    status: 'intake',
    x: Number(payload.x || 500),
    y: Number(payload.y || 115),
    managed: true,
    email: payload.email || makeAgentEmail(id),
    capabilities: { email: true },
    llm: { provider: 'ollama', model: payload.model || OLLAMA_MODEL }
  };
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, name: 'my-virtual-office-nodejs' });
});

app.get('/api/office-config', async (_req, res, next) => {
  try {
    res.json(await readConfig());
  } catch (error) {
    next(error);
  }
});

app.post('/api/office-config', async (req, res, next) => {
  try {
    await writeConfig(req.body);
    activityLog.push(logEntry('Office layout saved'));
    broadcast({ type: 'activity', ...snapshot() });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post('/api/reset-config', async (_req, res, next) => {
  try {
    await fs.copyFile(DEFAULT_CONFIG, USER_CONFIG);
    const config = await readConfig();
    activityLog.push(logEntry('Office layout reset'));
    broadcast({ type: 'config', config });
    res.json({ ok: true, config });
  } catch (error) {
    next(error);
  }
});

app.get('/api/agents', (_req, res) => {
  res.json({ ...snapshot(), llm: { provider: 'ollama', model: OLLAMA_MODEL, baseUrl: OLLAMA_BASE_URL } });
});

app.get('/api/llm/health', async (_req, res) => {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error(response.statusText);
    const data = await response.json();
    const models = Array.isArray(data.models) ? data.models.map(model => model.name) : [];
    res.json({
      ok: true,
      provider: 'ollama',
      model: OLLAMA_MODEL,
      baseUrl: OLLAMA_BASE_URL,
      modelAvailable: models.includes(OLLAMA_MODEL),
      models
    });
  } catch (error) {
    res.status(503).json({
      ok: false,
      provider: 'ollama',
      model: OLLAMA_MODEL,
      baseUrl: OLLAMA_BASE_URL,
      error: error.message
    });
  }
});

app.post('/api/agents', async (req, res, next) => {
  try {
    const agent = ensureAgentCapabilities(createAgent(req.body || {}));
    spawnedAgents.unshift(agent);
    await saveSpawnedAgents();
    activityLog.push(logEntry(`${agent.name} spawned as ${agent.roleName}`));
    broadcast({ type: 'activity', ...snapshot() });
    res.status(201).json({ ok: true, agent, ...snapshot() });
  } catch (error) {
    next(error);
  }
});

app.get('/api/agents/:id/emails', (req, res) => {
  const agent = findAgent(req.params.id);
  if (!agent) {
    res.status(404).json({ error: 'Agent not found' });
    return;
  }
  if (!agent.managed || !agent.capabilities?.email) {
    res.status(403).json({ error: 'Email is only enabled for spawned agents' });
    return;
  }
  const messages = emailStore.messages.filter(message => message.agentId === agent.id);
  res.json({ ok: true, agentId: agent.id, email: agent.email, smtpEnabled: smtpEnabled(), messages });
});

app.post('/api/agents/:id/email/draft', async (req, res) => {
  const agent = findAgent(req.params.id);
  if (!agent) {
    res.status(404).json({ error: 'Agent not found' });
    return;
  }
  if (!agent.managed || !agent.capabilities?.email) {
    res.status(403).json({ error: 'Email is only enabled for spawned agents' });
    return;
  }
  try {
    const body = await draftEmailWithAgent(agent, req.body || {});
    res.json({ ok: true, body });
  } catch (error) {
    const brief = String(req.body?.brief || '').trim();
    res.json({
      ok: true,
      body: `Hello,\n\nThank you for reaching out. I captured the request${brief ? `: ${brief}` : ''}.\n\nThe next step is for us to confirm the goal, timeline, decision maker, budget range, and any files or links we should review.\n\nBest,\n${agent.name}`,
      llmError: error.message
    });
  }
});

app.post('/api/agents/:id/email/send', async (req, res, next) => {
  try {
    const agent = findAgent(req.params.id);
    if (!agent) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }
    if (!agent.managed || !agent.capabilities?.email) {
      res.status(403).json({ error: 'Email is only enabled for spawned agents' });
      return;
    }
    const message = await sendEmail(agent, req.body || {});
    agent.status = 'emailing';
    agent.bubble = `Email ${message.status === 'sent' ? 'sent' : 'saved'} to ${message.to}`;
    agent.bubbleUntil = Date.now() + 9000;
    activityLog.push(logEntry(`${agent.name} ${message.status === 'sent' ? 'sent email' : 'recorded email'} to ${message.to}`));
    broadcast({ type: 'activity', ...snapshot() });
    res.json({ ok: true, message });
  } catch (error) {
    next(error);
  }
});

app.post('/api/agents/:id/chat', async (req, res) => {
  const agent = findAgent(req.params.id);
  if (!agent) {
    res.status(404).json({ error: 'Agent not found' });
    return;
  }
  const text = String(req.body?.message || '').trim();
  let reply;
  let llmError = null;
  if (text) {
    try {
      reply = await askOllama(agent, text);
    } catch (error) {
      llmError = error.message;
      reply = `${agent.name}: I captured that. Ollama is not reachable right now, so I saved the request as an intake note: "${text}".`;
    }
  } else {
    reply = `${agent.name}: ready when you are.`;
  }
  agent.status = 'chatting';
  agent.bubble = reply;
  agent.bubbleUntil = Date.now() + 9000;
  activityLog.push(logEntry(llmError ? `${agent.name} used fallback chat` : `${agent.name} replied with ${agent.llm?.model || OLLAMA_MODEL}`));
  broadcast({ type: 'chat', agentId: agent.id, reply, ...snapshot() });
  res.json({ ok: true, reply, llmError });
});

function renderProjectPreview(project, artifacts, data = {}, options = {}) {
  const brief = project.structuredBrief || {};
  const byType = type => artifacts.filter(item => item.type === type);
  const latest = type => byType(type).at(-1)?.metadata || {};
  const designOptions = latest('design_options').options || data.design?.creativeDirections?.filter(item => item.projectId === project.id) || [];
  const selectedRecord = latest('creative_direction').selectedDirection || data.design?.selectedDirections?.filter(item => item.projectId === project.id).at(-1);
  const selectedDirectionId = options.directionId || selectedRecord?.selectedDirectionId;
  const direction = designOptions.find(item => item.id === selectedDirectionId) || designOptions[0] || defaultDirection(project);
  const handoff = latest('design_handoff');
  const implementationPlan = latest('implementation_plan');
  const context = projectContext(project, data);
  const template = implementationPlan.templateSelected || inferTemplate(context);
  const content = buildTemplateContent(context, brief, template);
  const tokens = designTokensFromDirection(direction, context);
  const profile = templateProfileFor(template, context, direction);
  content.images = previewImagesFor(project.id, data, profile.imageCategory, 18);
  content.profile = profile;
  const isConcept = Boolean(options.concept);
  const templateContext = `${context.businessType} ${context.originalBrief} ${context.style.join(' ')}`;
  if (template === 'luxuryPropertyTemplate' || isLuxuryPropertyBrief(templateContext)) {
    const premiumPreset = premiumTemplateConfigForBrief(templateContext, content.brand);
    const directionTheme = Object.fromEntries(Object.entries(luxuryThemeFromDirection(direction)).filter(([, value]) => Boolean(value)));
    return renderLuxuryPropertyWebsite({
      ...(premiumPreset?.config || {}),
      mode: premiumPreset?.template.luxuryMode || (isPropertyContext(context) ? 'property' : 'luxury'),
      brand: content.brand,
      summary: professionalSubhead(context),
      headline: premiumPreset?.template.headline || luxuryPropertyHeadline(context, content.brand),
      heroKicker: premiumPreset?.template.badge || (isPropertyContext(context) ? 'Private property advisory' : 'Private client practice'),
      primaryCta: premiumPreset?.template.cta || (isPropertyContext(context) ? 'Request a private viewing' : 'Begin a private enquiry'),
      secondaryCta: premiumPreset?.template.secondary || (isPropertyContext(context) ? 'Explore selected properties' : 'Explore the collection'),
      images: content.images,
      theme: { ...(premiumPreset?.config?.theme || {}), ...directionTheme },
      metaDescription: professionalSubhead(context),
      isConcept
    });
  }
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(content.brand)} - ${escapeHtml(isConcept ? direction.name : 'Website')}</title>
  <link rel="stylesheet" href="/daisyui.css?v=daisyui-system-1">
  <style>
    [data-theme="agency-preview"] {
      color-scheme: light;
      --ink:${tokens.ink};
      --muted:${tokens.muted};
      --line:${tokens.line};
      --brand:${tokens.brand};
      --brand-2:${tokens.brand2};
      --accent:${tokens.accent};
      --accent-2:${tokens.accent2};
      --bg:${tokens.bg};
      --surface:${tokens.surface};
      --soft:${tokens.soft};
      --radius:${tokens.radius};
      --shadow:0 22px 70px rgba(15, 23, 42, .13);
      --color-base-100:${tokens.bg};
      --color-base-200:${tokens.soft};
      --color-base-300:${tokens.line};
      --color-base-content:${tokens.ink};
      --color-primary:${tokens.brand};
      --color-primary-content:${tokens.primaryContent};
      --color-secondary:${tokens.brand2};
      --color-secondary-content:${tokens.secondaryContent};
      --color-accent:${tokens.accent};
      --color-accent-content:${tokens.accentContent};
      --color-neutral:${tokens.ink};
      --color-neutral-content:#ffffff;
      --radius-box:${tokens.radius};
      --radius-field:1rem;
    }
    * { box-sizing:border-box; }
    html { scroll-behavior:smooth; }
    body { margin:0; font-family:Inter,Segoe UI,system-ui,sans-serif; color:var(--ink); background:
      radial-gradient(circle at top left, color-mix(in srgb, var(--accent) 23%, transparent), transparent 35rem),
      linear-gradient(180deg, var(--bg), #fff 58rem); }
    a { color:inherit; }
    .site-header { min-height:72px; padding:14px 28px; position:sticky; top:0; z-index:20; background:color-mix(in srgb, var(--color-base-100) 88%, transparent); border-bottom:1px solid var(--line); backdrop-filter:blur(16px); }
    .brand { font-weight:950; letter-spacing:0; }
    .mark { width:38px; height:38px; border-radius:14px; background:linear-gradient(135deg,var(--brand),var(--accent)); display:grid; place-items:center; color:#fff; box-shadow:0 12px 30px color-mix(in srgb, var(--brand) 32%, transparent); }
    nav { color:var(--muted); font-size:14px; }
    .btn { text-decoration:none; font-weight:900; }
    .btn-primary { color:var(--color-primary-content) !important; }
    .actions .btn-primary { color:#fff !important; }
    .badge { width:auto; height:auto; min-height:0; padding:.44rem .82rem; line-height:1.15; white-space:normal; text-align:center; }
    .eyebrow.badge { display:inline-flex; max-width:100%; align-items:center; justify-content:center; border-radius:999px; }
    main { overflow:hidden; }
    .container { width:min(1160px, calc(100% - 40px)); margin:0 auto; }
    .hero { min-height:calc(100vh - 72px); display:grid; grid-template-columns:minmax(0,1fr) minmax(320px,.9fr); gap:48px; align-items:center; justify-items:stretch; padding:54px 0 42px; }
    .hero > * { min-width:0; grid-column:auto; grid-row:auto; }
    .eyebrow { font-size:13px; font-weight:850; }
    h1 { font-size:clamp(48px,7vw,102px); line-height:.9; margin:18px 0 20px; letter-spacing:0; max-width:850px; }
    h2 { font-size:clamp(30px,4vw,58px); line-height:1; margin:0 0 16px; letter-spacing:0; }
    h3 { font-size:22px; margin:0; letter-spacing:0; }
    p { line-height:1.65; color:#334155; font-size:17px; }
    .lead { max-width:670px; font-size:20px; color:#253247; }
    .actions { margin-top:28px; flex-wrap:wrap; }
    .proof-row { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; margin-top:34px; max-width:720px; }
    .proof-pill { min-height:46px; justify-content:center; font-weight:850; color:#1f2937; padding:.65rem .95rem; }
    .visual-stage { position:relative; min-height:560px; border-radius:42px; background:linear-gradient(145deg, color-mix(in srgb, var(--brand) 84%, white), color-mix(in srgb, var(--accent) 70%, white)); box-shadow:var(--shadow); overflow:hidden; }
    .visual-stage.photo-stage { display:grid; place-items:end stretch; background:var(--ink); isolation:isolate; }
    .visual-stage.photo-stage img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; opacity:.78; transform:scale(1.04); animation:slowZoom 18s ease-in-out infinite alternate; }
    .visual-stage.photo-stage:before { z-index:1; inset:0; width:auto; height:auto; right:auto; top:auto; background:linear-gradient(180deg, transparent, rgba(15,23,42,.88)); border-radius:0; }
    .visual-stage.photo-stage:after { z-index:1; width:260px; height:260px; background:color-mix(in srgb, var(--brand) 55%, transparent); filter:blur(30px); right:-80px; bottom:-80px; left:auto; }
    .stage-caption { position:relative; z-index:2; margin:24px; padding:22px; border-radius:26px; color:#fff; background:rgba(15,23,42,.62); backdrop-filter:blur(14px); border:1px solid rgba(255,255,255,.18); }
    .stage-caption p { color:rgba(255,255,255,.82); margin:8px 0 0; }
    .visual-stage:before,.visual-stage:after { content:""; position:absolute; border-radius:999px; background:rgba(255,255,255,.26); }
    .visual-stage:before { width:280px; height:280px; right:-80px; top:-50px; }
    .visual-stage:after { width:220px; height:220px; left:-70px; bottom:-50px; }
    .bottle-row { position:absolute; inset:70px 28px 50px; display:flex; align-items:end; justify-content:center; gap:16px; transform:rotate(-3deg); }
    .bottle { position:relative; width:86px; height:300px; border-radius:26px 26px 34px 34px; background:linear-gradient(180deg, rgba(255,255,255,.85), var(--flavour)); box-shadow:0 26px 54px rgba(15,23,42,.22); border:3px solid rgba(255,255,255,.72); }
    .bottle:before { content:""; position:absolute; width:38px; height:48px; border-radius:12px 12px 6px 6px; background:var(--ink); left:50%; top:-42px; transform:translateX(-50%); }
    .bottle:after { content:attr(data-label); position:absolute; left:12px; right:12px; top:96px; min-height:88px; border-radius:18px; background:rgba(255,255,255,.8); display:grid; place-items:center; text-align:center; font-weight:950; color:var(--ink); font-size:13px; padding:8px; }
    .fruit { position:absolute; width:76px; height:76px; border-radius:50%; background:var(--fruit); box-shadow:inset -12px -16px 0 rgba(0,0,0,.08), 0 16px 34px rgba(15,23,42,.16); }
    .fruit.one { left:42px; top:62px; --fruit:#ffb703; }
    .fruit.two { right:62px; bottom:58px; --fruit:#fb7185; }
    .fruit.three { right:128px; top:116px; --fruit:#22c55e; width:48px; height:48px; }
    .section { padding:86px 0; }
    .section.soft { background:linear-gradient(180deg, transparent, color-mix(in srgb, var(--soft) 62%, #fff), transparent); }
    .section-head { display:flex; justify-content:space-between; align-items:end; gap:24px; margin-bottom:28px; }
    .section-head p { max-width:520px; margin:0; }
    .grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:18px; }
    .product-card,.feature-card,.review-card,.panel,.media-card { animation:riseIn .7s ease both; animation-delay:var(--delay,0ms); }
    .product-card { overflow:hidden; border-radius:28px; }
    .product-visual { height:230px; border-radius:0; background:linear-gradient(135deg, color-mix(in srgb, var(--flavour) 72%, #fff), #fff); display:grid; place-items:center; overflow:hidden; position:relative; margin:0; }
    .product-visual img { width:100%; height:100%; object-fit:cover; opacity:.92; transition:transform 260ms ease; }
    .product-card:hover .product-visual img { transform:scale(1.07); }
    .mini-bottle { width:58px; height:150px; border-radius:20px 20px 24px 24px; background:linear-gradient(180deg,#fff,var(--flavour)); border:2px solid rgba(255,255,255,.8); box-shadow:0 18px 34px rgba(15,23,42,.16); position:relative; }
    .mini-bottle:before { content:""; position:absolute; width:28px; height:28px; border-radius:8px 8px 4px 4px; background:var(--ink); top:-24px; left:50%; transform:translateX(-50%); }
    .price-row { display:flex; justify-content:space-between; align-items:center; gap:10px; margin-top:14px; }
    .price { font-weight:950; font-size:20px; }
    .tiny-button { font-weight:850; }
    .media-split { display:grid; grid-template-columns:minmax(0,.9fr) minmax(320px,1.1fr); gap:28px; align-items:stretch; }
    .media-card { min-height:460px; border-radius:0; overflow:hidden; position:relative; box-shadow:var(--shadow); background:var(--ink); }
    .media-card img { width:100%; height:100%; object-fit:cover; display:block; }
    .media-card .overlay { position:absolute; left:22px; right:22px; bottom:22px; padding:20px; border-radius:24px; background:rgba(255,255,255,.88); border:1px solid rgba(255,255,255,.5); }
    .metric-row { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; margin-top:22px; }
    .metric b { display:block; font-size:28px; }
    .gallery { display:grid; grid-template-columns:1.1fr .9fr .9fr; grid-auto-rows:230px; gap:14px; }
    .gallery figure { margin:0; border-radius:30px; overflow:hidden; position:relative; background:var(--soft); box-shadow:0 16px 36px rgba(15,23,42,.08); }
    .gallery figure:first-child { grid-row:span 2; }
    .gallery img { width:100%; height:100%; object-fit:cover; display:block; transition:transform 320ms ease; }
    .gallery figure:hover img { transform:scale(1.06); }
    .gallery figcaption { position:absolute; left:14px; right:14px; bottom:14px; border-radius:18px; background:rgba(255,255,255,.88); padding:10px 12px; font-weight:900; }
    .process { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:14px; counter-reset:step; }
    .process-card { counter-increment:step; background:linear-gradient(180deg,#fff,color-mix(in srgb,var(--soft) 50%,#fff)); }
    .process-card:before { content:counter(step, decimal-leading-zero); display:inline-grid; place-items:center; width:48px; height:48px; border-radius:16px; background:var(--ink); color:#fff; font-weight:950; margin-bottom:16px; }
    .faq-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; }
    .icon { width:44px; height:44px; border-radius:16px; background:color-mix(in srgb, var(--accent) 22%, #fff); display:grid; place-items:center; margin-bottom:14px; font-weight:950; }
    .split { display:grid; grid-template-columns:minmax(0,.95fr) minmax(320px,1.05fr); gap:28px; align-items:center; }
    .case-builder { border-radius:36px; padding:28px; background:var(--ink); color:#fff; box-shadow:var(--shadow); }
    .case-builder p { color:#dbeafe; }
    .case-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-top:20px; }
    .case-slot { min-height:86px; border-radius:20px; background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.14); display:grid; place-items:center; font-weight:900; }
    .band { border-radius:40px; background:linear-gradient(135deg,var(--brand),var(--accent)); color:#fff; padding:52px; display:grid; grid-template-columns:1fr auto; gap:26px; align-items:center; box-shadow:var(--shadow); }
    .band p { color:rgba(255,255,255,.88); }
    .newsletter { display:grid; grid-template-columns:1fr auto; gap:12px; background:#fff; border:1px solid var(--line); border-radius:999px; padding:8px; box-shadow:0 14px 40px rgba(15,23,42,.08); }
    footer { padding:44px 0; color:var(--muted); border-top:1px solid var(--line); }
    .concept-bar { position:fixed; right:18px; bottom:18px; z-index:50; border-radius:999px; background:var(--ink); color:#fff; padding:12px 16px; box-shadow:var(--shadow); font-weight:850; font-size:13px; }
    @keyframes riseIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
    @keyframes slowZoom { from { transform:scale(1.02); } to { transform:scale(1.12); } }
    @keyframes floatBottle { 0%,100% { transform:translateY(0) rotate(-2deg); } 50% { transform:translateY(-12px) rotate(2deg); } }
    .bottle { animation:floatBottle 5s ease-in-out infinite; animation-delay:var(--delay,0ms); }
    @media (prefers-reduced-motion: reduce) { *, *:before, *:after { animation:none !important; transition:none !important; scroll-behavior:auto !important; } }
    @media (max-width:900px) {
      nav { display:none; }
      .site-header { min-height:64px; padding:12px 16px; }
      .container { width:min(100% - 32px, 1160px); }
      .hero,.split,.band,.newsletter,.media-split { grid-template-columns:1fr; }
      .hero { min-height:auto; gap:28px; align-items:start; padding:42px 0 56px; }
      h1 { font-size:clamp(38px,11.5vw,52px); line-height:1.02; max-width:100%; margin:16px 0 16px; }
      h2 { font-size:clamp(30px,9vw,44px); line-height:1.05; }
      .lead { font-size:18px; max-width:100%; }
      .actions { gap:10px; }
      .actions.join { display:flex; }
      .actions .btn { border-radius:999px !important; }
      .proof-row { grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; margin-top:24px; max-width:100%; }
      .proof-pill { min-height:42px; white-space:normal; text-align:center; padding:.6rem .8rem; }
      .visual-stage,.media-card { min-height:360px; border-radius:30px; }
      .stage-caption { margin:16px; padding:18px; border-radius:22px; }
      .grid,.metric-row,.process,.faq-grid,.gallery { grid-template-columns:1fr; }
      .gallery figure:first-child { grid-row:auto; }
      .section { padding:62px 0; }
      .band { padding:34px 24px; }
    }
    @media (max-width:600px) {
      body { overflow-x:hidden; }
      .hero > div:first-child { max-width:100%; overflow:hidden; }
      h1 { font-size:clamp(30px,8.2vw,36px); line-height:1.1; max-width:9.2em; }
      .lead { font-size:16px; max-width:34ch; }
      .proof-row { grid-template-columns:1fr; }
      .actions .btn { width:100%; }
      .section-head { display:grid; align-items:start; }
      .eyebrow.badge { justify-content:flex-start; text-align:left; }
      .visual-stage,.media-card { min-height:330px; }
    }
  </style>
</head>
<body data-theme="agency-preview" class="bg-base-100 text-base-content">
  <header class="site-header navbar">
    <div class="navbar-start"><a class="brand btn btn-ghost text-lg" href="#"><span class="mark">${escapeHtml(content.brandInitial)}</span><span>${escapeHtml(content.brand)}</span></a></div>
    <nav class="navbar-end gap-4">${content.nav.map(item => `<a class="link link-hover" href="#${slug(item)}">${escapeHtml(item)}</a>`).join('')}<a class="btn btn-primary rounded-full" href="#shop">${escapeHtml(content.primaryCta)}</a></nav>
  </header>
  <main>
    <section class="container hero">
      <div>
        <span class="eyebrow badge badge-primary badge-lg">${escapeHtml(content.heroEyebrow)}</span>
        <h1>${escapeHtml(content.headline)}</h1>
        <p class="lead">${escapeHtml(content.subhead)}</p>
        <div class="actions join join-horizontal">
          <a class="btn btn-primary join-item rounded-full" href="#shop">${escapeHtml(content.primaryCta)}</a>
          <a class="btn btn-outline join-item rounded-full" href="#wholesale">${escapeHtml(content.secondaryCta)}</a>
        </div>
        <div class="proof-row">${content.proofs.map(item => `<div class="proof-pill badge badge-outline badge-lg">${escapeHtml(item)}</div>`).join('')}</div>
      </div>
      ${renderHeroVisual(content)}
    </section>
    ${renderStorySection(content)}
    <section class="section soft" id="shop">
      <div class="container">
        <div class="section-head"><div><span class="eyebrow badge badge-primary badge-lg">${escapeHtml(content.productEyebrow)}</span><h2>${escapeHtml(content.productHeading)}</h2></div><p>${escapeHtml(content.productIntro)}</p></div>
        <div class="grid">${content.products.map((item, index) => renderProductCard(item, content.images[index + 4], index)).join('')}</div>
      </div>
    </section>
    <section class="section" id="why">
      <div class="container">
        <div class="section-head"><div><span class="eyebrow badge badge-accent badge-lg">${escapeHtml(content.benefitEyebrow)}</span><h2>${escapeHtml(content.benefitHeading)}</h2></div><p>${escapeHtml(content.benefitIntro)}</p></div>
        <div class="grid">${content.benefits.map((item, index) => `<article class="feature-card card bg-base-100 border border-base-300 shadow-xl"><div class="card-body"><div class="icon badge badge-primary badge-lg">${index + 1}</div><h3 class="card-title">${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text)}</p></div></article>`).join('')}</div>
      </div>
    </section>
    ${renderGallerySection(content)}
    <section class="section" id="mixed-case">
      <div class="container split">
        <div>
          <span class="eyebrow badge badge-secondary badge-lg">${escapeHtml(content.caseEyebrow)}</span>
          <h2>${escapeHtml(content.caseHeading)}</h2>
          <p>${escapeHtml(content.caseText)}</p>
          <div class="actions join join-horizontal"><a class="btn btn-primary join-item rounded-full" href="#shop">${escapeHtml(content.caseCta)}</a><a class="btn btn-outline join-item rounded-full" href="#contact">Ask a question</a></div>
        </div>
        <div class="case-builder">
          <h3>Build your case</h3>
          <p>${escapeHtml(content.caseBuilderText)}</p>
          <div class="case-grid">${content.products.slice(0, 6).map(item => `<div class="case-slot" style="background:${item.color}22">${escapeHtml(item.short)}</div>`).join('')}</div>
        </div>
      </div>
    </section>
    ${renderProcessSection(content)}
    <section class="section soft" id="reviews">
      <div class="container">
        <div class="section-head"><div><span class="eyebrow badge badge-primary badge-lg">Trust signals</span><h2>${escapeHtml(content.reviewHeading)}</h2></div><p>${escapeHtml(content.reviewIntro)}</p></div>
        <div class="grid">${content.reviews.map(item => `<article class="review-card card bg-base-100 border border-base-300 shadow-xl"><div class="card-body"><p>${escapeHtml(item.quote)}</p><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.meta)}</span></div></article>`).join('')}</div>
      </div>
    </section>
    ${renderFaqSection(content)}
    <section class="section" id="wholesale">
      <div class="container">
        <div class="band">
          <div><h2>${escapeHtml(content.wholesaleHeading)}</h2><p>${escapeHtml(content.wholesaleText)}</p></div>
          <a class="btn btn-secondary rounded-full" href="#contact">${escapeHtml(content.wholesaleCta)}</a>
        </div>
      </div>
    </section>
    <section class="section" id="contact">
      <div class="container split">
        <div>
          <span class="eyebrow badge badge-accent badge-lg">${escapeHtml(content.newsletterEyebrow)}</span>
          <h2>${escapeHtml(content.newsletterHeading)}</h2>
          <p>${escapeHtml(content.newsletterText)}</p>
        </div>
        <form class="newsletter join"><input class="input input-bordered join-item" aria-label="Email address" placeholder="Email address"><button class="btn btn-primary join-item rounded-full" type="button">${escapeHtml(content.newsletterCta)}</button></form>
      </div>
    </section>
  </main>
  <footer class="footer footer-center p-10 bg-base-200 text-base-content"><div>${escapeHtml(content.footerText)}</div></footer>
</body>
</html>`;
}

function projectContext(project, data = {}) {
  const customer = data.customers?.find(item => item.id === project.customerId) || {};
  const original = String(project.originalBrief || '');
  const structured = project.structuredBrief || {};
  const clientName = original.match(/client\s*:\s*([^\n]+)/i)?.[1];
  const explicitName = original.match(/project name\s*\n+\s*\*\*?([^*\n]+)\*\*?/i)?.[1] || original.match(/project name\s*[:\-]\s*([^\n]+)/i)?.[1] || clientName;
  const industry = original.match(/industry\s*:\s*([^\n]+)/i)?.[1] || original.match(/website type\s*:\s*([^\n]+)/i)?.[1];
  const brand = cleanText(explicitName || customer.businessName || project.title || structured.businessSummary || 'Client Brand').slice(0, 52);
  const overview = original.match(/business overview\s*\n+([\s\S]*?)(?:\n---|\n##|\n#|$)/i)?.[1];
  const tagline = original.match(/brand tagline\s*\n+\s*\*\*?([^*\n]+)\*\*?/i)?.[1] || 'Sharper websites. Stronger enquiries. Smarter growth.';
  return {
    brand,
    businessType: cleanText(industry || customer.businessType || structured.businessSummary || ''),
    originalBrief: original,
    summary: cleanText(overview || structured.businessSummary || original).slice(0, 340),
    tagline: cleanText(tagline),
    pages: arrayList(structured.pagesNeeded || []),
    features: arrayList(structured.featuresNeeded || []),
    style: arrayList(structured.stylePreferences || [])
  };
}

function inferTemplate(context) {
  const text = `${context.businessType} ${context.originalBrief}`.toLowerCase();
  if (isLuxuryPropertyBrief(text)) return 'luxuryPropertyTemplate';
  if (isAgencyContext(context)) return 'agencyTemplate';
  if (/(software|saas|subscription|platform|b2b app)/.test(text)) return 'saasTemplate';
  if (/(shop|ecommerce|e-commerce|checkout|basket|cart|online store|mixed case|drink|juice|bottle)/.test(text)) return 'ecommerceTemplate';
  if (/(portfolio|photographer|creator|designer)/.test(text)) return 'portfolioTemplate';
  if (/(plumber|electrician|clinic|salon|restaurant|cafe|local)/.test(text)) return 'localBusinessTemplate';
  return 'agencyTemplate';
}

function buildTemplateContent(context, brief, template) {
  const isAgency = isAgencyContext(context);
  const isDrink = !isAgency && /(fruit|drink|juice|beverage|flavour|flavor|bottle|mixed case)/i.test(`${context.businessType} ${context.originalBrief}`);
  const products = isDrink ? [
    { name: 'Mango Burst', short: 'Mango', color: '#FFB703', desc: 'Smooth tropical mango with a rich, naturally sweet finish.', price: 'from GBP 2.49' },
    { name: 'Strawberry Splash', short: 'Strawberry', color: '#FB7185', desc: 'Bright strawberry refreshment with a clean juicy finish.', price: 'from GBP 2.49' },
    { name: 'Tropical Twist', short: 'Tropical', color: '#F97316', desc: 'Pineapple, passion fruit, mango and orange in one vivid bottle.', price: 'from GBP 2.79' },
    { name: 'Berry Blast', short: 'Berry', color: '#A855F7', desc: 'A bold mixed berry drink with a crisp, refreshing edge.', price: 'from GBP 2.79' },
    { name: 'Orange Sunrise', short: 'Orange', color: '#FB923C', desc: 'Smooth citrus flavour for breakfast, lunchboxes and sunny breaks.', price: 'from GBP 2.49' },
    { name: 'Watermelon Wave', short: 'Watermelon', color: '#22C55E', desc: 'Light watermelon, apple and lime for warmer days.', price: 'from GBP 2.49' }
  ] : isAgency ? [
    { name: 'Web Design', short: 'Sites', color: '#2563EB', desc: 'High-converting websites with clear offers, strong design systems, and fast static previews.', price: 'Core' },
    { name: 'Brand Identity', short: 'Brand', color: '#7C3AED', desc: 'Visual direction, guidelines, messaging, and reusable components for a consistent launch.', price: 'Studio' },
    { name: 'AI Automation', short: 'AI', color: '#16A34A', desc: 'Intake, follow-up, content, and workflow automation that removes manual bottlenecks.', price: 'Growth' },
    { name: 'Digital Marketing', short: 'Growth', color: '#F97316', desc: 'Campaign pages, SEO foundations, and lead capture journeys built around measurable action.', price: 'Scale' }
  ] : [
    { name: 'Strategy Session', short: 'Plan', color: '#2563EB', desc: 'A focused session to clarify goals, offers, audiences, and next steps.', price: 'Popular' },
    { name: 'Launch Website', short: 'Site', color: '#7C3AED', desc: 'A polished website built to present the offer clearly and capture enquiries.', price: 'Core' },
    { name: 'Growth Support', short: 'Grow', color: '#16A34A', desc: 'Ongoing improvements for content, conversion, and customer communication.', price: 'Add-on' }
  ];
  const pages = isAgency ? ['Home', 'Services', 'Work', 'Process', 'About', 'Contact'] : context.pages.length ? context.pages : template === 'ecommerceTemplate' ? ['Home', 'Shop', 'Mixed Case', 'About', 'Wholesale', 'Contact'] : ['Home', 'Services', 'About', 'Contact'];
  const brand = context.brand;
  return {
    brand,
    brandInitial: brand.slice(0, 1).toUpperCase(),
    nav: pages.slice(0, 5),
    heroEyebrow: isDrink ? 'Fresh fruit drinks' : isAgency ? 'Digital agency' : 'Professional services',
    headline: isDrink ? 'Fruit flavour that hits differently.' : isAgency ? 'Websites, brands, and automation built to win better clients.' : professionalHeadline(context, brand),
    subhead: isDrink ? 'Discover refreshing real-fruit drinks, colourful flavour packs, mixed cases, and wholesale options for shops, cafes, gyms and events.' : isAgency ? 'A professional marketing site for web design, branding, AI automation, and digital growth services, shaped around trust, proof, and qualified enquiries.' : professionalSubhead(context),
    primaryCta: isDrink ? 'Shop the Drinks' : isAgency ? 'Book a Strategy Call' : 'Start a Project',
    secondaryCta: isDrink ? 'Build a Mixed Case' : isAgency ? 'View Services' : 'See Services',
    proofs: isDrink ? ['Real fruit juice', 'No artificial colours', 'UK delivery'] : isAgency ? ['Web design', 'Branding', 'AI automation'] : ['Responsive', 'Accessible', 'Built for conversion'],
    metrics: isDrink ? [
      ['6', 'launch flavours'],
      ['24h', 'chilled dispatch window'],
      ['100%', 'colourful shelf impact']
    ] : [
      ['3', 'clear service paths'],
      ['48h', 'fast response target'],
      ['AA', 'accessibility-minded layout']
    ],
    storyEyebrow: isDrink ? 'From fridge to first sip' : isAgency ? 'Positioning and proof' : 'Built around the customer journey',
    storyHeading: isDrink ? 'A bright shopping journey that makes every flavour easy to understand.' : isAgency ? 'A polished agency journey from offer clarity to qualified enquiry.' : 'A polished website journey with the right proof at the right moment.',
    storyText: isDrink ? 'The page opens with appetite appeal, moves into flavour comparison, then gives wholesale buyers and retail customers separate paths without making the experience feel busy.' : isAgency ? 'The page leads with a clear agency promise, moves into services and case-study proof, then makes it easy for serious prospects to book a conversation.' : 'The layout moves from a clear promise to services, proof, process, and contact so visitors always know why they should trust the business and what to do next.',
    productEyebrow: isDrink ? 'Flavour range' : 'Services',
    productHeading: isDrink ? 'Meet the flavour range' : isAgency ? 'Services designed for sharper growth' : 'Choose the support you need',
    productIntro: isDrink ? 'Explore the launch flavours, compare pack options, and find the drinks that fit your fridge, event, or next stock order.' : isAgency ? 'Each service is framed around a business outcome: clearer positioning, better leads, faster delivery, and stronger client experience.' : 'Clear service options help visitors understand what is available and take the next step with confidence.',
    products,
    benefitEyebrow: isDrink ? 'Why Zestora' : isAgency ? 'Why clients choose the agency' : 'Why choose us',
    benefitHeading: isDrink ? 'Why customers choose Zestora' : isAgency ? 'Clear thinking, strong design, and practical automation.' : 'Why customers choose us',
    benefitIntro: isDrink ? 'Every section is shaped around simple product proof: flavour, freshness, convenience, and trust before checkout.' : isAgency ? 'The site proves the agency can think strategically, design with taste, and build systems that actually help clients move faster.' : 'The page makes the offer easy to scan, supports quick decisions, and guides visitors toward enquiry.',
    benefits: isDrink ? [
      { title: 'Real fruit character', text: 'Bright flavour notes, clear ingredients, and simple product proof help shoppers choose quickly.' },
      { title: 'Easy to shop', text: 'Product cards make flavour, pack options, pricing, ratings, and basket actions easy to compare.' },
      { title: 'Wholesale pathway', text: 'Retailers and hospitality buyers get a direct enquiry route without distracting consumer shoppers.' }
    ] : isAgency ? [
      { title: 'Design-led strategy', text: 'The offer is framed around outcomes, proof, and a clear next step rather than a generic list of services.' },
      { title: 'Automation fluency', text: 'AI and workflow services are positioned as practical business leverage, not vague future-facing theatre.' },
      { title: 'Conversion discipline', text: 'Every section supports qualified enquiries with service clarity, trust markers, and repeated calls to action.' }
    ] : [
      { title: 'Clear offer', text: 'Visitors can understand the service, benefits, and next step without hunting through the page.' },
      { title: 'Trust first', text: 'Proof points, testimonials, and practical details support confident enquiries.' },
      { title: 'Mobile friendly', text: 'The experience is designed for quick reading and simple action on every screen size.' }
    ],
    caseEyebrow: isDrink ? 'Mix and match' : isAgency ? 'Project fit' : 'Flexible support',
    caseHeading: isDrink ? "Can't pick one? Try them all." : isAgency ? 'Start with the work that moves the business first.' : 'Start small, then grow',
    caseText: isDrink ? 'Create a mixed case with your favourite flavours, keep track of bottle counts, and add the full box to your basket in one tap.' : isAgency ? 'Package strategy, design, automation, and marketing into a focused roadmap instead of selling disconnected deliverables.' : 'Choose the level of support that fits today, then add more services when the business is ready.',
    caseBuilderText: isDrink ? 'Pick six bottles, balance your flavours, and create a case that fits your fridge or event.' : isAgency ? 'Plan the first sprint around positioning, website delivery, launch content, and follow-up automation.' : 'Plan the next step around your goals, budget, and timeline.',
    caseCta: isDrink ? 'Build Your Case' : isAgency ? 'Plan a Sprint' : 'Get Started',
    galleryEyebrow: isDrink ? 'Fresh moments' : isAgency ? 'Agency system' : 'Visual direction',
    galleryHeading: isDrink ? 'Colour, chill, pour, repeat.' : isAgency ? 'Strategy, design, build, and automation in one system.' : 'A richer visual system for modern visitors.',
    galleryCaptions: isDrink ? ['Fresh ingredients', 'Cold shelf impact', 'Mixed case moments', 'Wholesale-ready'] : isAgency ? ['Strategy workshop', 'Design system', 'Build pipeline', 'Launch review'] : ['Clear first impression', 'Human proof', 'Useful details', 'Conversion moments'],
    processEyebrow: isDrink ? 'How it works' : 'Simple process',
    processHeading: isDrink ? 'From flavour pick to doorstep delivery.' : isAgency ? 'From unclear brief to launched growth system.' : 'From first enquiry to a sharper website.',
    processSteps: isDrink ? [
      ['Choose flavours', 'Pick single flavours or start with a mixed case.'],
      ['Build your box', 'Balance favourites, seasonal specials, and discovery bottles.'],
      ['Checkout clearly', 'See delivery, pack sizes, and key product details before payment.'],
      ['Restock easily', 'Join the launch list or ask about wholesale cases.']
    ] : isAgency ? [
      ['Diagnose', 'Clarify the audience, offer, conversion goal, and strongest trust signals.'],
      ['Design', 'Create a distinctive visual direction, component system, and brand-guideline handoff.'],
      ['Build', 'Turn the approved handoff into a responsive, accessible, reusable website.'],
      ['Automate', 'Connect follow-up, intake, notifications, and improvement loops where they add value.']
    ] : [
      ['Share the goal', 'Explain the business, audience, offer, and current blockers.'],
      ['Shape the direction', 'Align the page structure, messaging, visuals, and conversion path.'],
      ['Launch with proof', 'Publish a clear experience that earns trust quickly.'],
      ['Improve over time', 'Use feedback and analytics to sharpen the next version.']
    ],
    reviewHeading: isDrink ? 'Proof that tastes like a repeat order' : isAgency ? 'Proof that turns attention into enquiries' : 'Trust and proof',
    reviewIntro: isDrink ? 'Customer quotes and product proof help new shoppers feel confident before checkout.' : isAgency ? 'The preview is structured to show case-study evidence, process confidence, and clear reasons to start a conversation.' : 'Real proof, helpful details, and direct calls to action help visitors move from interest to enquiry.',
    reviews: isDrink ? [
      { quote: 'Bright, refreshing, and not too sweet. Mango Burst disappeared from the fridge in a day.', name: 'Aisha R.', meta: 'Purchased Mango Burst' },
      { quote: 'The mixed case is ideal for events. Every flavour has its own moment.', name: 'Ben M.', meta: 'Discovery box customer' },
      { quote: 'Exactly the kind of colourful drink our cafe fridge needed.', name: 'Hannah P.', meta: 'Wholesale buyer' }
    ] : isAgency ? [
      { quote: 'The offer finally felt premium, specific, and easy to buy into.', name: 'Founder', meta: 'Brand and website sprint' },
      { quote: 'The automation ideas were practical, not gimmicky, and saved real follow-up time.', name: 'Ops Lead', meta: 'AI workflow project' },
      { quote: 'The new site made our services much easier to understand.', name: 'Marketing Director', meta: 'Digital agency client' }
    ] : [
      { quote: 'Clear, polished, and easy to act on.', name: 'Sarah K.', meta: 'Client' },
      { quote: 'The offer finally feels simple to explain.', name: 'James R.', meta: 'Founder' },
      { quote: 'We started getting better enquiries within the first week.', name: 'Priya M.', meta: 'Director' }
    ],
    wholesaleHeading: isDrink ? 'Want to stock Zestora?' : isAgency ? 'Ready to sharpen the next launch?' : 'Ready to talk?',
    wholesaleText: isDrink ? 'Shops, cafes, restaurants, gyms and distributors can enquire about pricing, cases, samples and launch availability.' : isAgency ? 'Share the goal, the current blockers, and the kind of client you want to win. The first step is a focused strategy conversation.' : 'Send a few details and get a practical next step for the website, campaign, or service package.',
    wholesaleCta: isDrink ? 'Make a Wholesale Enquiry' : 'Book a Call',
    newsletterEyebrow: isDrink ? 'Launch list' : isAgency ? 'Agency notes' : 'Updates',
    newsletterHeading: isDrink ? 'Get the juicy updates.' : isAgency ? 'Get practical growth notes.' : 'Stay in the loop',
    newsletterText: isDrink ? 'Get launch discounts, new flavour drops, competitions and product updates straight to your inbox.' : isAgency ? 'Short notes on better websites, brand systems, automation, and lead-generation decisions.' : 'Get useful updates, offers, and practical guidance straight to your inbox.',
    newsletterCta: isDrink ? 'Join the Fruit List' : 'Subscribe',
    faqs: isDrink ? [
      ['Can I build a mixed case?', 'Yes. The shopping flow is designed around choosing different flavours and reviewing the case before checkout.'],
      ['Do you support wholesale orders?', 'Yes. Shops, cafes, gyms and event buyers can use the wholesale enquiry path.'],
      ['Are final ingredients confirmed?', 'The page is ready for final product claims once the client supplies approved ingredient and nutrition details.'],
      ['Is the site mobile-first?', 'Yes. Product cards, case building, and enquiry actions are designed for quick thumb-friendly browsing.']
    ] : isAgency ? [
      ['What kind of projects are a fit?', 'Websites, brand identity, service positioning, automation, AI workflow, and digital marketing projects with a clear commercial goal.'],
      ['Do you only design websites?', 'No. The strongest work combines offer strategy, visual design, build quality, and practical automation.'],
      ['Can this start with a small sprint?', 'Yes. A focused discovery or landing-page sprint can establish direction before a larger build.'],
      ['Will the website be easy to update?', 'The system is built from reusable sections, tokens, and components so future pages stay consistent.']
    ] : [
      ['What happens after I enquire?', 'The team reviews your goals and replies with the best next step.'],
      ['Can the website grow later?', 'Yes. The structure supports new pages, services, testimonials, and campaign sections.'],
      ['Is it suitable for mobile visitors?', 'Yes. The page prioritises readable copy, clear actions, and touch-friendly sections.'],
      ['Can the copy be edited?', 'Yes. The preview is structured so content can be refined before launch.']
    ],
    footerText: isDrink ? `${brand} - real-fruit refreshment, mixed cases, and wholesale enquiries.` : isAgency ? `${brand} - websites, branding, automation, and growth systems for better enquiries.` : `${brand} - practical support for better websites, clearer offers, and stronger enquiries.`
  };
}

function designTokensFromDirection(direction, context) {
  const palette = direction?.palette || [];
  const byName = name => palette.find(item => item.name?.toLowerCase().includes(name))?.hex;
  const fruit = !isAgencyContext(context) && /(fruit|drink|juice|beverage|bottle)/i.test(`${context.businessType} ${context.originalBrief}`);
  const brand = byName('mango') || byName('electric') || palette[0]?.hex || (fruit ? '#FFB703' : '#2563EB');
  const accent = byName('leaf') || byName('watermelon') || byName('coral') || palette[2]?.hex || '#22C55E';
  return {
    ink: byName('charcoal') || byName('night') || byName('ink') || '#172033',
    muted: '#64748b',
    line: 'rgba(15, 23, 42, .13)',
    brand,
    brand2: byName('berry') || byName('purple') || palette[1]?.hex || '#C026D3',
    accent,
    accent2: byName('citrus') || byName('orange') || palette[3]?.hex || '#F97316',
    bg: byName('cream') || byName('warm') || '#FFF7E8',
    surface: '#FFFFFF',
    soft: byName('mint') || '#FEF3C7',
    radius: fruit ? '30px' : '18px',
    primaryContent: readableContentColor(brand),
    secondaryContent: '#FFFFFF',
    accentContent: readableContentColor(accent)
  };
}

function loadPlaceholderManifest() {
  try {
    return JSON.parse(readFileSync(path.join(APP_DIR, 'public', 'placeholders', 'manifest.json'), 'utf8'));
  } catch {
    return { categories: {} };
  }
}

function templateProfileFor(template, context, direction) {
  const text = `${template} ${context.businessType} ${context.originalBrief} ${direction?.name || ''}`.toLowerCase();
  if (isAgencyContext(context)) {
    return { name: 'Premium agency growth system', imageCategory: 'agency', description: 'Strategy, design, automation, and lead-generation proof are arranged as a serious agency website.', motion: 'editorial-rise' };
  }
  if (/(drink|juice|fruit|beverage|shop|ecommerce|checkout|basket|cart)/.test(text)) {
    return { name: 'Bright product-led shopping', imageCategory: 'food-drink', description: 'Colour, product clarity, and quick buying paths keep the page lively without losing trust.', motion: 'float-and-reveal' };
  }
  if (/(software|saas|dashboard|platform|subscription)/.test(text)) {
    return { name: 'Product-led launch system', imageCategory: 'saas', description: 'A calm structure explains the value, shows proof, and gets visitors to the next action quickly.', motion: 'soft-rise' };
  }
  if (/(portfolio|photographer|creator|designer)/.test(text)) {
    return { name: 'Visual portfolio showcase', imageCategory: 'portfolio', description: 'Large imagery, concise proof, and selective detail make the work easy to scan.', motion: 'gallery-focus' };
  }
  if (/(restaurant|cafe|food)/.test(text)) {
    return { name: 'Warm local hospitality', imageCategory: 'restaurant', description: 'Atmosphere, menus, location, and booking actions are arranged for quick decisions.', motion: 'warm-editorial' };
  }
  if (/(clinic|health|wellness)/.test(text)) {
    return { name: 'Calm service trust', imageCategory: 'healthcare', description: 'Gentle visuals, clear services, and proof points support confident enquiries.', motion: 'calm-proof' };
  }
  if (/(salon|beauty|spa)/.test(text)) {
    return { name: 'Polished booking journey', imageCategory: 'beauty', description: 'Service cards, gallery moments, and booking prompts keep the experience premium and direct.', motion: 'polished-reveal' };
  }
  if (/(real estate|house|property|architecture|interior design|hotel|hospitality|resort|retreat)/.test(text)) {
    return { name: 'Image-led property showcase', imageCategory: 'real-estate', description: 'Strong photography, trust markers, and simple enquiry paths put the property first.', motion: 'image-led' };
  }
  if (/(jewellery|jewelry|atelier|watch|couture|luxury fashion)/.test(text)) {
    return { name: 'Luxury atelier collection', imageCategory: 'ecommerce', description: 'Cinematic product imagery and private-service storytelling support considered high-value enquiries.', motion: 'cinematic-detail' };
  }
  if (/(plumber|electrician|builder|trade|construction)/.test(text)) {
    return { name: 'Proof-first local service', imageCategory: 'trades', description: 'Fast contact, service clarity, and trust signals help local buyers act quickly.', motion: 'proof-first' };
  }
  return { name: 'Premium service journey', imageCategory: 'agency', description: 'A refined service flow balances positioning, proof, process, and enquiry.', motion: 'editorial-rise' };
}

function placeholderImagesFor(category, count = 12) {
  const categories = PLACEHOLDER_MANIFEST.categories || {};
  const selected = categories[category] || [];
  const fallback = categories.agency || categories['local-business'] || Object.values(categories).flat() || [];
  const pool = selected.length ? selected : fallback;
  return pool.slice(0, count);
}

function previewImagesFor(projectId, data, category, count = 12) {
  const generated = (data.generatedImages || [])
    .filter(item => item.projectId === projectId && item.url)
    .sort((a, b) => {
      const rankDelta = imageRank(a) - imageRank(b);
      if (rankDelta) return rankDelta;
      const createdA = Number.isFinite(Date.parse(a.createdAt || '')) ? Date.parse(a.createdAt || '') : 0;
      const createdB = Number.isFinite(Date.parse(b.createdAt || '')) ? Date.parse(b.createdAt || '') : 0;
      return createdB - createdA;
    })
    .map(item => ({ file: item.url, title: item.title, generated: true }));
  const used = new Set(generated.map(item => item.file));
  const fallback = placeholderImagesFor(category, count).filter(item => !used.has(item.file));
  return [...generated, ...fallback].slice(0, count);
}

function imageRank(image) {
  const title = String(image.title || '').toLowerCase();
  if (title.includes('hero')) return 0;
  if (title.includes('services')) return 1;
  if (title.includes('about')) return 2;
  if (title.includes('proof')) return 3;
  if (title.includes('background')) return 4;
  return 9;
}

function imageUrl(image) {
  return image?.file || image?.url || '';
}

function isAgencyContext(context) {
  return /(digital agency|marketing agency|web design|branding|ai automation|digital marketing|professional marketing website|agency|lead generation)/i.test(`${context.businessType} ${context.originalBrief}`);
}

function isPropertyContext(context) {
  return /\b(property|properties|real[ -]?estate|estate agent|realtor|residence|residential|home developer|house builder|architecture|interior design)\b/i.test(`${context.businessType} ${context.originalBrief}`);
}

function luxuryPropertyHeadline(context, brand) {
  if (isPropertyContext(context)) return 'Exceptional property, represented with discretion.';
  if (/\b(hotel|resort|hospitality)\b/i.test(`${context.businessType} ${context.originalBrief}`)) return 'Remarkable places, presented with precision.';
  return `${brand}, considered in every detail.`;
}

function luxuryThemeFromDirection(direction) {
  const palette = Array.isArray(direction?.palette) ? direction.palette : [];
  const find = pattern => palette.find(item => pattern.test(String(item?.name || '')))?.hex;
  return {
    ink: find(/ink|charcoal|night|navy|black/i),
    paper: find(/paper|ivory|cream|white|warm/i),
    paperAlt: find(/stone|sand|mist|soft|neutral/i),
    gold: find(/gold|bronze|brass|ochre|accent/i)
  };
}

function professionalHeadline(context, brand) {
  if (/software|saas|platform|dashboard/i.test(`${context.businessType} ${context.originalBrief}`)) return 'A calmer way to understand and act on the product.';
  return `${brand} helps customers move from interest to action.`;
}

function professionalSubhead(context) {
  const summary = cleanText(context.summary || '');
  if (!summary) return 'A clear, professional website shaped around trust, proof, service clarity, and conversion.';
  return summary.length > 220 ? `${summary.slice(0, 217).trim()}...` : summary;
}

function renderHeroVisual(content) {
  const heroImage = content.images?.[0];
  if (heroImage) {
    return `<div class="visual-stage photo-stage" aria-label="${escapeHtml(content.brand)} hero visual">
      <img src="${escapeHtml(imageUrl(heroImage))}" alt="">
      <div class="stage-caption">
        <strong>${escapeHtml(content.profile.name)}</strong>
        <p>${escapeHtml(content.storyText)}</p>
      </div>
    </div>`;
  }
  return renderProductStage(content);
}

function renderStorySection(content) {
  const image = content.images?.[1];
  return `<section class="section" id="story">
    <div class="container media-split">
      <div>
        <span class="eyebrow badge badge-primary badge-lg">${escapeHtml(content.storyEyebrow)}</span>
        <h2>${escapeHtml(content.storyHeading)}</h2>
        <p>${escapeHtml(content.storyText)}</p>
        <div class="metric-row stats stats-vertical lg:stats-horizontal shadow">${content.metrics.map(([value, label]) => `<div class="metric stat"><b class="stat-value">${escapeHtml(value)}</b><span class="stat-desc">${escapeHtml(label)}</span></div>`).join('')}</div>
      </div>
      <div class="media-card">${image ? `<img src="${escapeHtml(imageUrl(image))}" alt="">` : renderProductStage(content)}<div class="overlay"><strong>${escapeHtml(content.profile.name)}</strong><p>${escapeHtml(content.profile.description)}</p></div></div>
    </div>
  </section>`;
}

function renderGallerySection(content) {
  const images = (content.images || []).slice(2, 6);
  if (!images.length) return '';
  return `<section class="section soft" id="gallery">
    <div class="container">
      <div class="section-head"><div><span class="eyebrow badge badge-secondary badge-lg">${escapeHtml(content.galleryEyebrow)}</span><h2>${escapeHtml(content.galleryHeading)}</h2></div><p>${escapeHtml(content.storyText)}</p></div>
      <div class="gallery">${images.map((image, index) => `<figure style="--delay:${index * 80}ms"><img src="${escapeHtml(imageUrl(image))}" alt=""><figcaption>${escapeHtml(content.galleryCaptions[index] || content.brand)}</figcaption></figure>`).join('')}</div>
    </div>
  </section>`;
}

function renderProcessSection(content) {
  return `<section class="section" id="process">
    <div class="container">
      <div class="section-head"><div><span class="eyebrow badge badge-primary badge-lg">${escapeHtml(content.processEyebrow)}</span><h2>${escapeHtml(content.processHeading)}</h2></div><p>${escapeHtml(content.caseText)}</p></div>
      <div class="process">${content.processSteps.map(([title, text], index) => `<article class="process-card card bg-base-100 border border-base-300 shadow-xl" style="--delay:${index * 80}ms"><div class="card-body"><h3 class="card-title">${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p></div></article>`).join('')}</div>
    </div>
  </section>`;
}

function renderFaqSection(content) {
  return `<section class="section" id="faq">
    <div class="container">
      <div class="section-head"><div><span class="eyebrow badge badge-accent badge-lg">Questions</span><h2>Good to know before you start.</h2></div><p>${escapeHtml(content.newsletterText)}</p></div>
      <div class="faq-grid">${content.faqs.map(([question, answer]) => `<article class="faq-item collapse collapse-arrow bg-base-100 border border-base-300"><input type="checkbox"><h3 class="collapse-title text-xl font-bold">${escapeHtml(question)}</h3><div class="collapse-content"><p>${escapeHtml(answer)}</p></div></article>`).join('')}</div>
    </div>
  </section>`;
}

function renderProductStage(content) {
  return `<div class="visual-stage" aria-label="${escapeHtml(content.brand)} product visual">
    <div class="fruit one"></div><div class="fruit two"></div><div class="fruit three"></div>
    <div class="bottle-row">${content.products.slice(0, 4).map((item, index) => `<div class="bottle" data-label="${escapeHtml(item.short)}" style="--flavour:${item.color}; height:${270 + index * 14}px; --delay:${index * 170}ms"></div>`).join('')}</div>
  </div>`;
}

function renderProductCard(item, image, index = 0) {
  return `<article class="product-card card bg-base-100 border border-base-300 shadow-xl" style="--flavour:${item.color}; --delay:${index * 80}ms">
    <figure class="product-visual">${image ? `<img src="${escapeHtml(imageUrl(image))}" alt="">` : '<div class="mini-bottle"></div>'}</figure>
    <div class="card-body">
      <h3 class="card-title">${escapeHtml(item.name)}</h3>
      <p>${escapeHtml(item.desc)}</p>
      <div class="price-row card-actions"><span class="price">${escapeHtml(item.price)}</span><button class="tiny-button btn btn-neutral btn-sm rounded-full" type="button">Add</button></div>
    </div>
  </article>`;
}

function defaultDirection(project) {
  return fallbackDesignDirection('template-preview', project.id);
}

function fallbackDesignProject(projectId, directionId) {
  const direction = fallbackDesignDirection(directionId, projectId);
  return {
    id: projectId,
    customerId: 'customer-design-preview',
    status: 'awaiting_approval',
    title: 'Design concept preview',
    originalBrief: 'Design concept preview',
    structuredBrief: {
      businessSummary: `${direction.name} website concept`,
      targetAudience: 'Prospective customers',
      pagesNeeded: ['Home', 'Services', 'About', 'Contact'],
      featuresNeeded: ['Lead capture form', 'Contact form routing'],
      stylePreferences: [direction.summary],
      contentRequirements: ['Clear positioning', 'Service proof', 'Primary CTA'],
      assetsRequired: ['Brand imagery'],
      technicalRequirements: ['Responsive website'],
      assumptions: ['Client assets can be added later'],
      missingInformation: [],
      estimatedComplexity: 'medium'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function fallbackDesignDirection(directionId, projectId = 'project-design-preview') {
  const directions = {
    'trust-first': {
      name: 'Trust First',
      summary: 'Calm, credible, and conversion-aware with proof close to each major CTA.',
      targetEmotion: 'Confidence',
      palette: [
        { name: 'Ink', hex: '#172033' },
        { name: 'Canvas', hex: '#FFFFFF' },
        { name: 'Action Blue', hex: '#2563EB' },
        { name: 'Success', hex: '#16A34A' }
      ]
    },
    'premium-editorial': {
      name: 'Premium Editorial',
      summary: 'More spacious and polished, using editorial hierarchy and selective visual moments.',
      targetEmotion: 'Prestige',
      palette: [
        { name: 'Charcoal', hex: '#111827' },
        { name: 'Warm White', hex: '#FAF7F0' },
        { name: 'Gold', hex: '#C8A24A' },
        { name: 'Slate', hex: '#475569' }
      ]
    },
    'conversion-studio': {
      name: 'Conversion Studio',
      summary: 'Sharp, benefit-led, and built around fast comprehension and repeated action.',
      targetEmotion: 'Momentum',
      palette: [
        { name: 'Graphite', hex: '#1F2937' },
        { name: 'White', hex: '#FFFFFF' },
        { name: 'Electric Blue', hex: '#0EA5E9' },
        { name: 'Coral', hex: '#F97316' }
      ]
    }
  };
  const base = directions[directionId] || {
    name: 'Template Preview',
    summary: 'A polished template preview using agency design-system components.',
    targetEmotion: 'Direction',
    palette: [
      { name: 'Mango', hex: '#FFB703' },
      { name: 'Berry', hex: '#C026D3' },
      { name: 'Leaf', hex: '#22C55E' },
      { name: 'Citrus', hex: '#F97316' },
      { name: 'Charcoal', hex: '#172033' }
    ]
  };
  return {
    id: directionId || 'template-preview',
    projectId,
    brandPersonality: ['professional', 'clear', 'polished'],
    bestFor: 'Client-facing design review.',
    risks: ['Preview recovered from a stateless serverless request.'],
    typography: { heading: 'Inter Tight or refined display', body: 'Inter/system-ui', scale: '1.25 modular scale', notes: 'Clear hierarchy and readable body copy' },
    layoutStyle: 'Responsive agency landing page with strong hero and proof sections',
    sectionStyle: 'Reusable DaisyUI sections with polished spacing',
    buttonStyle: 'High-contrast rounded CTA buttons',
    cardStyle: 'Bordered cards with restrained shadow',
    iconStyle: 'Simple line icons where useful',
    imageryStyle: 'High-quality client-relevant photography or generated imagery',
    animationStyle: 'Subtle reveal and hover transitions',
    homepageStructure: ['Hero', 'Services', 'Proof', 'Process', 'FAQ', 'Contact'],
    mobileApproach: 'Single-column sections, clear CTA, no horizontal scrolling',
    rationale: 'Recovered fallback keeps the design review surface available even if serverless local state has moved.',
    ...base
  };
}

function readableContentColor(hex) {
  const value = String(hex || '').replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(value)) return '#172033';
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.58 ? '#172033' : '#ffffff';
}

function cleanText(value) {
  return String(value || '')
    .replace(/\[[^\]]+\]\([^)]+\)/g, '')
    .replace(/[#*_`>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function slug(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';
}

function arrayList(value) {
  return Array.isArray(value) && value.length ? value.map(item => String(item)) : [];
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(error.statusCode || 500).json({ error: error.statusCode ? error.message : 'Server error' });
});

if (wss) {
  wss.on('connection', ws => {
    ws.send(JSON.stringify({ type: 'snapshot', ...snapshot() }));
  });
}

const statuses = ['working', 'idle', 'meeting', 'break', 'walking', 'browsing', 'watching TV'];

function startOfficeActivityLoop() {
  setInterval(() => {
    const agents = getAgents();
    const agent = agents[Math.floor(Math.random() * agents.length)];
    agent.status = statuses[Math.floor(Math.random() * statuses.length)];
    agent.target = {
      x: Math.max(35, Math.min(965, agent.x + (Math.random() * 260 - 130))),
      y: Math.max(110, Math.min(705, agent.y + (Math.random() * 220 - 110)))
    };
    if (Math.random() > 0.55) {
      agent.bubble = `${agent.status}...`;
      agent.bubbleUntil = Date.now() + 5000;
    }
    activityLog.push(logEntry(`${agent.name} is ${agent.status}`));
    if (activityLog.length > 120) activityLog.shift();
    broadcast({ type: 'activity', ...snapshot() });
  }, 4500);
}

let runtimeReady;
export async function initializeRuntime() {
  runtimeReady ||= (async () => {
    await mountAgencyApis();
    await ensureConfig();
    await ensureAgents();
    await ensureEmails();
  })();
  return runtimeReady;
}

export { app };

if (!SERVERLESS) {
  initializeRuntime()
    .then(() => {
      startOfficeActivityLoop();
      server.listen(PORT, () => {
        console.log(`Virtual Office Node server running at http://localhost:${PORT}`);
        console.log(`Ollama: ${OLLAMA_BASE_URL} model ${OLLAMA_MODEL}`);
        console.log(`Email: ${smtpEnabled() ? 'SMTP enabled' : 'local outbox mode'}`);
      });
    })
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
