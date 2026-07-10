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
  app.use('/api/agency', createAgencyRouter({ dataDir: DATA_DIR, workspaceRoot: __dirname }));
} catch (error) {
  console.warn('Agency API is not available until TypeScript is built:', error.message);
}
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
