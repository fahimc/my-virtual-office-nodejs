import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || process.env.VO_PORT || 3000);
const DATA_DIR = path.join(__dirname, 'data');
const DEFAULT_CONFIG = path.join(DATA_DIR, 'default-office-config.json');
const USER_CONFIG = path.join(DATA_DIR, 'office-config.json');
const AGENTS_FILE = path.join(DATA_DIR, 'agents.json');
const EMAILS_FILE = path.join(DATA_DIR, 'emails.json');
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gemma4:e4b';
const OFFICE_EMAIL_DOMAIN = process.env.OFFICE_EMAIL_DOMAIN || 'virtual-office.local';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json({ limit: '2mb' }));
try {
  const { createAgencyRouter } = await import('./dist/agency/api/agencyRoutes.js');
  const { createCompanyRouter } = await import('./dist/agency/api/companyRoutes.js');
  app.use('/api/agency', createAgencyRouter({ dataDir: DATA_DIR, workspaceRoot: __dirname }));
  app.use('/api/company', createCompanyRouter({ dataDir: DATA_DIR, workspaceRoot: __dirname }));
} catch (error) {
  console.warn('Agency API is not available until TypeScript is built:', error.message);
}

app.get(['/previews/:projectId', '/previews/:projectId/'], async (req, res) => {
  try {
    const storePath = path.join(DATA_DIR, 'agency-store.json');
    const data = JSON.parse(await fs.readFile(storePath, 'utf8'));
    const project = data.projects?.find(item => item.id === req.params.projectId);
    if (!project) return res.status(404).send('Preview project not found');
    const artifacts = (data.artifacts || []).filter(item => item.projectId === project.id);
    res.type('html').send(renderProjectPreview(project, artifacts, data));
  } catch (error) {
    res.status(500).send(`Preview unavailable: ${error.message}`);
  }
});

app.get(['/design-concepts/:projectId/:directionId', '/design-concepts/:projectId/:directionId/'], async (req, res) => {
  try {
    const storePath = path.join(DATA_DIR, 'agency-store.json');
    const data = JSON.parse(await fs.readFile(storePath, 'utf8'));
    const project = data.projects?.find(item => item.id === req.params.projectId);
    if (!project) return res.status(404).send('Design concept project not found');
    const artifacts = (data.artifacts || []).filter(item => item.projectId === project.id);
    res.type('html').send(renderProjectPreview(project, artifacts, data, { directionId: req.params.directionId, concept: true }));
  } catch (error) {
    res.status(500).send(`Design concept unavailable: ${error.message}`);
  }
});

app.use(express.static(path.join(__dirname, 'public')));

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
  const isConcept = Boolean(options.concept);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(content.brand)} - ${escapeHtml(isConcept ? direction.name : 'Preview')}</title>
  <style>
    :root {
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
    }
    * { box-sizing:border-box; }
    html { scroll-behavior:smooth; }
    body { margin:0; font-family:Inter,Segoe UI,system-ui,sans-serif; color:var(--ink); background:
      radial-gradient(circle at top left, color-mix(in srgb, var(--accent) 23%, transparent), transparent 35rem),
      linear-gradient(180deg, var(--bg), #fff 58rem); }
    a { color:inherit; }
    .site-header { min-height:72px; padding:14px 28px; display:flex; justify-content:space-between; align-items:center; gap:22px; position:sticky; top:0; z-index:20; background:rgba(255,255,255,.82); border-bottom:1px solid var(--line); backdrop-filter:blur(16px); }
    .brand { display:flex; align-items:center; gap:10px; font-weight:950; letter-spacing:0; }
    .mark { width:38px; height:38px; border-radius:14px; background:linear-gradient(135deg,var(--brand),var(--accent)); display:grid; place-items:center; color:#fff; box-shadow:0 12px 30px color-mix(in srgb, var(--brand) 32%, transparent); }
    nav { display:flex; align-items:center; gap:18px; color:var(--muted); font-size:14px; }
    .nav-cta,.button { min-height:46px; display:inline-flex; align-items:center; justify-content:center; border-radius:999px; padding:0 18px; text-decoration:none; font-weight:900; border:1px solid transparent; }
    .button.primary,.nav-cta { background:var(--ink); color:#fff; box-shadow:0 16px 36px rgba(15,23,42,.18); }
    .button.secondary { background:#fff; color:var(--ink); border-color:var(--line); }
    main { overflow:hidden; }
    .container { width:min(1160px, calc(100% - 40px)); margin:0 auto; }
    .hero { min-height:calc(100vh - 72px); display:grid; grid-template-columns:minmax(0,1fr) minmax(320px,.9fr); gap:48px; align-items:center; padding:54px 0 42px; }
    .eyebrow { display:inline-flex; align-items:center; gap:8px; min-height:30px; padding:0 12px; border-radius:999px; background:color-mix(in srgb, var(--accent) 18%, #fff); color:var(--ink); font-size:13px; font-weight:850; }
    h1 { font-size:clamp(48px,7vw,102px); line-height:.9; margin:18px 0 20px; letter-spacing:0; max-width:850px; }
    h2 { font-size:clamp(30px,4vw,58px); line-height:1; margin:0 0 16px; letter-spacing:0; }
    h3 { font-size:22px; margin:0; letter-spacing:0; }
    p { line-height:1.65; color:#334155; font-size:17px; }
    .lead { max-width:670px; font-size:20px; color:#253247; }
    .actions { display:flex; flex-wrap:wrap; gap:12px; margin-top:28px; }
    .proof-row { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; margin-top:34px; max-width:720px; }
    .proof-pill { border:1px solid var(--line); border-radius:18px; background:rgba(255,255,255,.74); padding:13px 14px; font-weight:850; color:#1f2937; }
    .visual-stage { position:relative; min-height:560px; border-radius:42px; background:linear-gradient(145deg, color-mix(in srgb, var(--brand) 84%, white), color-mix(in srgb, var(--accent) 70%, white)); box-shadow:var(--shadow); overflow:hidden; }
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
    .product-card,.feature-card,.review-card,.panel { border:1px solid var(--line); border-radius:var(--radius); background:rgba(255,255,255,.88); box-shadow:0 16px 40px rgba(15,23,42,.07); }
    .product-card { padding:18px; overflow:hidden; }
    .product-visual { height:190px; border-radius:28px; background:linear-gradient(135deg, color-mix(in srgb, var(--flavour) 72%, #fff), #fff); display:grid; place-items:center; margin-bottom:16px; }
    .mini-bottle { width:58px; height:150px; border-radius:20px 20px 24px 24px; background:linear-gradient(180deg,#fff,var(--flavour)); border:2px solid rgba(255,255,255,.8); box-shadow:0 18px 34px rgba(15,23,42,.16); position:relative; }
    .mini-bottle:before { content:""; position:absolute; width:28px; height:28px; border-radius:8px 8px 4px 4px; background:var(--ink); top:-24px; left:50%; transform:translateX(-50%); }
    .price-row { display:flex; justify-content:space-between; align-items:center; gap:10px; margin-top:14px; }
    .price { font-weight:950; font-size:20px; }
    .tiny-button { border:0; border-radius:999px; background:var(--ink); color:#fff; padding:10px 12px; font-weight:850; }
    .feature-card,.review-card,.panel { padding:24px; }
    .icon { width:44px; height:44px; border-radius:16px; background:color-mix(in srgb, var(--accent) 22%, #fff); display:grid; place-items:center; margin-bottom:14px; font-weight:950; }
    .split { display:grid; grid-template-columns:minmax(0,.95fr) minmax(320px,1.05fr); gap:28px; align-items:center; }
    .case-builder { border-radius:36px; padding:28px; background:var(--ink); color:#fff; box-shadow:var(--shadow); }
    .case-builder p { color:#dbeafe; }
    .case-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-top:20px; }
    .case-slot { min-height:86px; border-radius:20px; background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.14); display:grid; place-items:center; font-weight:900; }
    .band { border-radius:40px; background:linear-gradient(135deg,var(--brand),var(--accent)); color:#fff; padding:52px; display:grid; grid-template-columns:1fr auto; gap:26px; align-items:center; box-shadow:var(--shadow); }
    .band p { color:rgba(255,255,255,.88); }
    .newsletter { display:grid; grid-template-columns:1fr auto; gap:12px; background:#fff; border:1px solid var(--line); border-radius:999px; padding:8px; box-shadow:0 14px 40px rgba(15,23,42,.08); }
    .newsletter input { border:0; min-height:48px; padding:0 18px; font:inherit; min-width:260px; outline:0; }
    footer { padding:44px 0; color:var(--muted); border-top:1px solid var(--line); }
    .concept-bar { position:fixed; right:18px; bottom:18px; z-index:50; border-radius:999px; background:var(--ink); color:#fff; padding:12px 16px; box-shadow:var(--shadow); font-weight:850; font-size:13px; }
    @media (max-width:900px) { nav { display:none; } .hero,.split,.band,.newsletter { grid-template-columns:1fr; } .visual-stage { min-height:430px; } .proof-row,.grid { grid-template-columns:1fr; } .section { padding:62px 0; } h1 { font-size:clamp(42px,14vw,76px); } }
  </style>
</head>
<body>
  <header class="site-header">
    <a class="brand" href="#"><span class="mark">${escapeHtml(content.brandInitial)}</span><span>${escapeHtml(content.brand)}</span></a>
    <nav>${content.nav.map(item => `<a href="#${slug(item)}">${escapeHtml(item)}</a>`).join('')}<a class="nav-cta" href="#shop">${escapeHtml(content.primaryCta)}</a></nav>
  </header>
  <main>
    <section class="container hero">
      <div>
        <span class="eyebrow">${escapeHtml(direction.name)} design concept</span>
        <h1>${escapeHtml(content.headline)}</h1>
        <p class="lead">${escapeHtml(content.subhead)}</p>
        <div class="actions">
          <a class="button primary" href="#shop">${escapeHtml(content.primaryCta)}</a>
          <a class="button secondary" href="#wholesale">${escapeHtml(content.secondaryCta)}</a>
        </div>
        <div class="proof-row">${content.proofs.map(item => `<div class="proof-pill">${escapeHtml(item)}</div>`).join('')}</div>
      </div>
      ${renderProductStage(content)}
    </section>
    <section class="section soft" id="shop">
      <div class="container">
        <div class="section-head"><div><span class="eyebrow">Product system</span><h2>${escapeHtml(content.productHeading)}</h2></div><p>${escapeHtml(content.productIntro)}</p></div>
        <div class="grid">${content.products.map(renderProductCard).join('')}</div>
      </div>
    </section>
    <section class="section" id="why">
      <div class="container">
        <div class="section-head"><div><span class="eyebrow">Reusable components</span><h2>${escapeHtml(content.benefitHeading)}</h2></div><p>${escapeHtml(content.benefitIntro)}</p></div>
        <div class="grid">${content.benefits.map((item, index) => `<article class="feature-card"><div class="icon">${index + 1}</div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text)}</p></article>`).join('')}</div>
      </div>
    </section>
    <section class="section" id="mixed-case">
      <div class="container split">
        <div>
          <span class="eyebrow">Template section</span>
          <h2>${escapeHtml(content.caseHeading)}</h2>
          <p>${escapeHtml(content.caseText)}</p>
          <div class="actions"><a class="button primary" href="#shop">${escapeHtml(content.caseCta)}</a><a class="button secondary" href="#contact">Ask a question</a></div>
        </div>
        <div class="case-builder">
          <h3>Build your case</h3>
          <p>Visual interaction plan for the production build.</p>
          <div class="case-grid">${content.products.slice(0, 6).map(item => `<div class="case-slot" style="background:${item.color}22">${escapeHtml(item.short)}</div>`).join('')}</div>
        </div>
      </div>
    </section>
    <section class="section soft" id="reviews">
      <div class="container">
        <div class="section-head"><div><span class="eyebrow">Trust signals</span><h2>${escapeHtml(content.reviewHeading)}</h2></div><p>${escapeHtml(content.reviewIntro)}</p></div>
        <div class="grid">${content.reviews.map(item => `<article class="review-card"><p>${escapeHtml(item.quote)}</p><strong>${escapeHtml(item.name)}</strong><br><span>${escapeHtml(item.meta)}</span></article>`).join('')}</div>
      </div>
    </section>
    <section class="section" id="wholesale">
      <div class="container">
        <div class="band">
          <div><h2>${escapeHtml(content.wholesaleHeading)}</h2><p>${escapeHtml(content.wholesaleText)}</p></div>
          <a class="button secondary" href="#contact">${escapeHtml(content.wholesaleCta)}</a>
        </div>
      </div>
    </section>
    <section class="section" id="contact">
      <div class="container split">
        <div>
          <span class="eyebrow">Client approval preview</span>
          <h2>${escapeHtml(content.newsletterHeading)}</h2>
          <p>${escapeHtml(content.newsletterText)}</p>
        </div>
        <form class="newsletter"><input aria-label="Email address" placeholder="Email address"><button class="button primary" type="button">${escapeHtml(content.newsletterCta)}</button></form>
      </div>
    </section>
  </main>
  <footer><div class="container">${escapeHtml(content.brand)} - ${escapeHtml(template)} built from the agency template system, component sections, and ${escapeHtml(direction.name)} design tokens.</div></footer>
  ${isConcept ? `<div class="concept-bar">Visual concept for approval: ${escapeHtml(direction.name)}</div>` : ''}
</body>
</html>`;
}

function projectContext(project, data = {}) {
  const customer = data.customers?.find(item => item.id === project.customerId) || {};
  const original = String(project.originalBrief || '');
  const structured = project.structuredBrief || {};
  const explicitName = original.match(/project name\s*\n+\s*\*\*?([^*\n]+)\*\*?/i)?.[1] || original.match(/project name\s*[:\-]\s*([^\n]+)/i)?.[1];
  const brand = cleanText(explicitName || customer.businessName || project.title || structured.businessSummary || 'Client Brand').slice(0, 52);
  const overview = original.match(/business overview\s*\n+([\s\S]*?)(?:\n---|\n##|\n#|$)/i)?.[1];
  const tagline = original.match(/brand tagline\s*\n+\s*\*\*?([^*\n]+)\*\*?/i)?.[1] || 'Real fruit. Full flavour. Pure refreshment.';
  return {
    brand,
    businessType: customer.businessType || structured.businessSummary || '',
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
  if (/(shop|ecommerce|e-commerce|checkout|basket|product|drink|juice|bottle|mixed case)/.test(text)) return 'ecommerceTemplate';
  if (/(software|saas|subscription|platform|b2b app)/.test(text)) return 'saasTemplate';
  if (/(portfolio|photographer|creator|designer)/.test(text)) return 'portfolioTemplate';
  if (/(plumber|electrician|clinic|salon|restaurant|cafe|local)/.test(text)) return 'localBusinessTemplate';
  return 'agencyTemplate';
}

function buildTemplateContent(context, brief, template) {
  const isDrink = /(fruit|drink|juice|beverage|flavour|flavor|bottle|mixed case)/i.test(context.originalBrief);
  const products = isDrink ? [
    { name: 'Mango Burst', short: 'Mango', color: '#FFB703', desc: 'Smooth tropical mango with a rich, naturally sweet finish.', price: 'from £2.49' },
    { name: 'Strawberry Splash', short: 'Strawberry', color: '#FB7185', desc: 'Bright strawberry refreshment with a clean juicy finish.', price: 'from £2.49' },
    { name: 'Tropical Twist', short: 'Tropical', color: '#F97316', desc: 'Pineapple, passion fruit, mango and orange in one vivid bottle.', price: 'from £2.79' },
    { name: 'Berry Blast', short: 'Berry', color: '#A855F7', desc: 'A bold mixed berry drink with a crisp, refreshing edge.', price: 'from £2.79' },
    { name: 'Orange Sunrise', short: 'Orange', color: '#FB923C', desc: 'Smooth citrus flavour for breakfast, lunchboxes and sunny breaks.', price: 'from £2.49' },
    { name: 'Watermelon Wave', short: 'Watermelon', color: '#22C55E', desc: 'Light watermelon, apple and lime for warmer days.', price: 'from £2.49' }
  ] : [
    { name: 'Strategy', short: 'Plan', color: '#2563EB', desc: 'Clear planning and a conversion-focused page structure.', price: 'Core' },
    { name: 'Design', short: 'Design', color: '#7C3AED', desc: 'A polished visual system built from approved design tokens.', price: 'Core' },
    { name: 'Build', short: 'Build', color: '#16A34A', desc: 'Reusable responsive sections and accessible components.', price: 'Core' }
  ];
  const pages = context.pages.length ? context.pages : template === 'ecommerceTemplate' ? ['Home', 'Shop', 'Mixed Case', 'About', 'Wholesale', 'Contact'] : ['Home', 'Services', 'About', 'Contact'];
  const brand = context.brand;
  return {
    brand,
    brandInitial: brand.slice(0, 1).toUpperCase(),
    nav: pages.slice(0, 5),
    headline: isDrink ? 'Fruit flavour that hits differently.' : cleanText(brief.businessSummary || `${brand} website`).slice(0, 80),
    subhead: isDrink ? 'Discover refreshing real-fruit drinks, colourful flavour packs, mixed cases, and wholesale options for shops, cafes, gyms and events.' : context.summary,
    primaryCta: isDrink ? 'Shop the Drinks' : 'Start a Project',
    secondaryCta: isDrink ? 'Build a Mixed Case' : 'See Services',
    proofs: isDrink ? ['Real fruit juice', 'No artificial colours', 'UK delivery'] : ['Responsive', 'Accessible', 'Built for conversion'],
    productHeading: isDrink ? 'Meet the flavour range' : 'Reusable section system',
    productIntro: isDrink ? 'Each card is a reusable product component with flavour colour, price, proof, and purchase action built into the template.' : 'Reusable sections keep the client site maintainable instead of one-off page code.',
    products,
    benefitHeading: isDrink ? 'Why customers choose Zestora' : 'Built from a real component system',
    benefitIntro: isDrink ? 'The design turns product benefits into quick visual proof moments across desktop and mobile.' : 'The preview uses template sections, component cards, tokens, and responsive rules.',
    benefits: isDrink ? [
      { title: 'Real fruit character', text: 'Benefit cards explain fruit flavour, ingredient principles, and the final proof claims that need client confirmation.' },
      { title: 'Ecommerce-ready cards', text: 'Product cards include flavour, pack options, pricing, ratings, and Add to Basket actions.' },
      { title: 'Wholesale pathway', text: 'Retailers and hospitality buyers get a direct enquiry route without distracting consumer shoppers.' }
    ] : [
      { title: 'Design tokens', text: 'Colours, spacing, radius, and component variants are mapped from the approved handoff.' },
      { title: 'Section templates', text: 'Hero, services, proof, CTA, FAQ, and contact sections are reusable.' },
      { title: 'QA-ready', text: 'The layout is built to check responsiveness, accessibility, and visual consistency.' }
    ],
    caseHeading: isDrink ? 'Can’t pick one? Try them all.' : 'A flexible page system',
    caseText: isDrink ? 'The mixed-case builder is planned as a mobile-first visual flow with live bottle counts and clear add-to-basket behaviour.' : 'The selected template adapts content into reusable sections rather than hardcoded page chunks.',
    caseCta: isDrink ? 'Build Your Case' : 'View Components',
    reviewHeading: isDrink ? 'Proof that tastes like a repeat order' : 'Trust and proof',
    reviewIntro: isDrink ? 'Review cards and product proof make the site feel credible before checkout.' : 'Trust sections are designed into the template.',
    reviews: isDrink ? [
      { quote: 'Bright, refreshing, and not too sweet. Mango Burst disappeared from the fridge in a day.', name: 'Aisha R.', meta: 'Purchased Mango Burst' },
      { quote: 'The mixed case is ideal for events. Every flavour has its own moment.', name: 'Ben M.', meta: 'Discovery box customer' },
      { quote: 'Exactly the kind of colourful drink our cafe fridge needed.', name: 'Hannah P.', meta: 'Wholesale buyer' }
    ] : [
      { quote: 'Clear, polished, and easy to act on.', name: 'Client review', meta: 'Preview approval' },
      { quote: 'The page structure makes the offer obvious.', name: 'QA note', meta: 'Conversion check' },
      { quote: 'Reusable components keep future changes simple.', name: 'Builder note', meta: 'Handoff' }
    ],
    wholesaleHeading: isDrink ? 'Want to stock Zestora?' : 'Ready for approval',
    wholesaleText: isDrink ? 'A dedicated wholesale CTA gives shops, cafes, restaurants, gyms and distributors a direct path to enquire about pricing, cases and samples.' : 'Approve this preview in the virtual office or request focused changes.',
    wholesaleCta: isDrink ? 'Make a Wholesale Enquiry' : 'Approve Preview',
    newsletterHeading: isDrink ? 'Get the juicy updates.' : 'Stay in the loop',
    newsletterText: isDrink ? 'A reusable signup section captures launch discounts, new flavours, competitions and product updates.' : 'Client update and contact forms are built as reusable components.',
    newsletterCta: isDrink ? 'Join the Fruit List' : 'Subscribe'
  };
}

function designTokensFromDirection(direction, context) {
  const palette = direction?.palette || [];
  const byName = name => palette.find(item => item.name?.toLowerCase().includes(name))?.hex;
  const fruit = /(fruit|drink|juice|beverage|bottle)/i.test(context.originalBrief);
  return {
    ink: byName('charcoal') || byName('night') || byName('ink') || '#172033',
    muted: '#64748b',
    line: 'rgba(15, 23, 42, .13)',
    brand: byName('mango') || byName('electric') || palette[0]?.hex || (fruit ? '#FFB703' : '#2563EB'),
    brand2: byName('berry') || byName('purple') || palette[1]?.hex || '#C026D3',
    accent: byName('leaf') || byName('watermelon') || byName('coral') || palette[2]?.hex || '#22C55E',
    accent2: byName('citrus') || byName('orange') || palette[3]?.hex || '#F97316',
    bg: byName('cream') || byName('warm') || '#FFF7E8',
    surface: '#FFFFFF',
    soft: byName('mint') || '#FEF3C7',
    radius: fruit ? '30px' : '18px'
  };
}

function renderProductStage(content) {
  return `<div class="visual-stage" aria-label="${escapeHtml(content.brand)} product visual">
    <div class="fruit one"></div><div class="fruit two"></div><div class="fruit three"></div>
    <div class="bottle-row">${content.products.slice(0, 4).map((item, index) => `<div class="bottle" data-label="${escapeHtml(item.short)}" style="--flavour:${item.color}; height:${270 + index * 14}px"></div>`).join('')}</div>
  </div>`;
}

function renderProductCard(item) {
  return `<article class="product-card" style="--flavour:${item.color}">
    <div class="product-visual"><div class="mini-bottle"></div></div>
    <h3>${escapeHtml(item.name)}</h3>
    <p>${escapeHtml(item.desc)}</p>
    <div class="price-row"><span class="price">${escapeHtml(item.price)}</span><button class="tiny-button" type="button">Add</button></div>
  </article>`;
}

function defaultDirection(project) {
  return {
    id: 'template-preview',
    name: 'Template Preview',
    summary: 'A polished template preview using agency design-system components.',
    palette: [
      { name: 'Mango', hex: '#FFB703' },
      { name: 'Berry', hex: '#C026D3' },
      { name: 'Leaf', hex: '#22C55E' },
      { name: 'Citrus', hex: '#F97316' },
      { name: 'Charcoal', hex: '#172033' }
    ]
  };
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

wss.on('connection', ws => {
  ws.send(JSON.stringify({ type: 'snapshot', ...snapshot() }));
});

const statuses = ['working', 'idle', 'meeting', 'break', 'walking', 'browsing', 'watching TV'];
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

await ensureConfig();
await ensureAgents();
await ensureEmails();
server.listen(PORT, () => {
  console.log(`Virtual Office Node server running at http://localhost:${PORT}`);
  console.log(`Ollama: ${OLLAMA_BASE_URL} model ${OLLAMA_MODEL}`);
  console.log(`Email: ${smtpEnabled() ? 'SMTP enabled' : 'local outbox mode'}`);
});
