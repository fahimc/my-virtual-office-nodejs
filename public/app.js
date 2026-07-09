const canvas = document.getElementById('officeCanvas');
const ctx = canvas.getContext('2d');
const TILE = 40;
const DPR = Math.max(1, window.devicePixelRatio || 1);

const state = {
  config: null,
  agents: [],
  activity: [],
  stats: {},
  camera: { x: 0, y: 0, scale: 1 },
  drag: null,
  editMode: false,
  bubbles: true,
  cameraReady: false,
  userCamera: false,
  selectedAgent: null,
  selectedFurniture: null,
  lastTick: performance.now(),
  cpu: 0,
  ram: 0
};

const branchColors = {
  BRANCH_1: '#427bff',
  BRANCH_2: '#ff6600',
  CEO: '#ffd600',
  UNASSIGNED: '#9aa4b2'
};

const furnitureBounds = {
  desk: [82, 58],
  bossDesk: [130, 90],
  meetingTable: [240, 120],
  vendingMachine: [45, 86],
  engLounge: [164, 50],
  kitchenCounter: [76, 42],
  waterCooler: [32, 58],
  plant: [22, 34],
  tallPlant: [28, 58],
  endTable: [24, 28],
  bookshelf: [52, 90],
  interactiveWindow: [44, 52],
  clock: [34, 34],
  whiteboard: [34, 48],
  tv: [56, 42],
  coffeeTable: [68, 38],
  trashCan: [22, 26],
  filingCabinet: [34, 60],
  pingPongTable: [92, 58],
  dartBoard: [46, 68],
  couch: [122, 54],
  coffeeMaker: [28, 28],
  microwave: [38, 28],
  toaster: [24, 22],
  textLabel: [120, 28]
};

const tools = {
  editToggle: document.getElementById('editToggle'),
  saveLayout: document.getElementById('saveLayout'),
  resetCamera: document.getElementById('resetCamera'),
  expandBubbles: document.getElementById('expandBubbles'),
  minimizeBubbles: document.getElementById('minimizeBubbles'),
  furniturePicker: document.getElementById('furniturePicker'),
  editHint: document.getElementById('editHint'),
  agentPanel: document.getElementById('agentPanel'),
  agentTitle: document.getElementById('agentTitle'),
  agentMeta: document.getElementById('agentMeta'),
  chatLog: document.getElementById('chatLog'),
  chatForm: document.getElementById('chatForm'),
  chatInput: document.getElementById('chatInput'),
  closeAgent: document.getElementById('closeAgent'),
  branchList: document.getElementById('branchList'),
  activityLog: document.getElementById('activityLog')
};

async function boot() {
  const [configRes, agentRes] = await Promise.all([
    fetch('/api/office-config'),
    fetch('/api/agents')
  ]);
  state.config = await configRes.json();
  applySnapshot(await agentRes.json());
  connectSocket();
  resizeCanvas();
  wireEvents();
  requestAnimationFrame(loop);
  if (window.lucide) window.lucide.createIcons();
}

function applySnapshot(data) {
  if (data.agents) {
    for (const incoming of data.agents) {
      const existing = state.agents.find(agent => agent.id === incoming.id);
      if (existing) {
        Object.assign(existing, incoming);
      } else {
        state.agents.push({
          ...incoming,
          target: incoming.target || { x: incoming.x, y: incoming.y },
          phase: Math.random() * Math.PI * 2
        });
      }
    }
  }
  if (data.activity) state.activity = data.activity;
  if (data.stats) state.stats = data.stats;
  renderDashboard();
}

function connectSocket() {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  const ws = new WebSocket(`${proto}://${location.host}`);
  ws.addEventListener('message', event => {
    const data = JSON.parse(event.data);
    if (data.type === 'config') state.config = data.config;
    applySnapshot(data);
  });
  ws.addEventListener('close', () => setTimeout(connectSocket, 1200));
}

function resizeCanvas() {
  const box = canvas.getBoundingClientRect();
  canvas.width = Math.floor(box.width * DPR);
  canvas.height = Math.floor(box.height * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (state.config && !state.userCamera) fitCameraToOffice();
}

function wireEvents() {
  window.addEventListener('resize', resizeCanvas);
  tools.editToggle.addEventListener('click', () => {
    state.editMode = !state.editMode;
    tools.editToggle.classList.toggle('active', state.editMode);
    tools.editHint.classList.toggle('hidden', !state.editMode);
  });
  tools.saveLayout.addEventListener('click', saveLayout);
  tools.resetCamera.addEventListener('click', () => {
    state.userCamera = false;
    fitCameraToOffice();
  });
  tools.expandBubbles.addEventListener('click', () => { state.bubbles = true; });
  tools.minimizeBubbles.addEventListener('click', () => { state.bubbles = false; });
  tools.closeAgent.addEventListener('click', closeAgentPanel);
  tools.chatForm.addEventListener('submit', sendChat);

  canvas.addEventListener('wheel', event => {
    event.preventDefault();
    state.userCamera = true;
    const before = screenToWorld(event.offsetX, event.offsetY);
    const direction = Math.sign(event.deltaY);
    state.camera.scale = clamp(state.camera.scale * (direction > 0 ? 0.92 : 1.08), 0.55, 2.2);
    const after = worldToScreen(before.x, before.y);
    state.camera.x += event.offsetX - after.x;
    state.camera.y += event.offsetY - after.y;
  }, { passive: false });

  canvas.addEventListener('pointerdown', event => {
    canvas.setPointerCapture(event.pointerId);
    canvas.classList.add('dragging');
    const world = screenToWorld(event.offsetX, event.offsetY);
    if (state.editMode) {
      const hit = hitFurniture(world.x, world.y);
      if (hit) {
        state.selectedFurniture = hit;
        state.drag = { kind: 'furniture', item: hit, dx: hit.x - world.x, dy: hit.y - world.y };
      } else {
        addFurniture(world.x, world.y);
      }
      return;
    }
    const agent = hitAgent(world.x, world.y);
    if (agent) {
      openAgentPanel(agent);
      return;
    }
    state.userCamera = true;
    state.drag = { kind: 'camera', sx: event.clientX, sy: event.clientY, ox: state.camera.x, oy: state.camera.y };
  });

  canvas.addEventListener('pointermove', event => {
    if (!state.drag) return;
    if (state.drag.kind === 'camera') {
      state.camera.x = state.drag.ox + event.clientX - state.drag.sx;
      state.camera.y = state.drag.oy + event.clientY - state.drag.sy;
    }
    if (state.drag.kind === 'furniture') {
      const world = screenToWorld(event.offsetX, event.offsetY);
      state.drag.item.x = snap(world.x + state.drag.dx, 10);
      state.drag.item.y = snap(world.y + state.drag.dy, 10);
    }
  });

  canvas.addEventListener('pointerup', () => {
    canvas.classList.remove('dragging');
    state.drag = null;
  });
}

function loop(now) {
  const dt = Math.min(0.05, (now - state.lastTick) / 1000);
  state.lastTick = now;
  updateAgents(dt);
  draw();
  requestAnimationFrame(loop);
}

function fitScale() {
  if (!state.config) return 1;
  const box = canvas.getBoundingClientRect();
  return Math.min(box.width / state.config.canvasWidth, box.height / state.config.canvasHeight);
}

function fitCameraToOffice() {
  if (!state.config) return;
  const box = canvas.getBoundingClientRect();
  if (box.width < 100 || box.height < 100) return;
  const scale = fitScale();
  state.camera.scale = scale;
  state.camera.x = Math.max(0, (box.width - state.config.canvasWidth * scale) / 2);
  state.camera.y = 0;
  state.cameraReady = true;
}

function draw() {
  if (!state.config) return;
  const box = canvas.getBoundingClientRect();
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.clearRect(0, 0, box.width, box.height);
  if (!state.cameraReady || !state.userCamera) fitCameraToOffice();

  ctx.save();
  ctx.translate(state.camera.x, state.camera.y);
  ctx.scale(state.camera.scale, state.camera.scale);
  drawEnvironment();
  drawFurniture();
  drawPet();
  drawAgents();
  if (state.editMode) drawEditOverlay();
  ctx.restore();

  drawPerformance();
}

function drawEnvironment() {
  const { canvasWidth: W, canvasHeight: H, floor, walls } = state.config;
  for (let y = 0; y < H; y += TILE) {
    for (let x = 0; x < W; x += TILE) {
      ctx.fillStyle = ((x / TILE + y / TILE) % 2 === 0) ? floor.color1 : floor.color2;
      ctx.fillRect(x, y, TILE, TILE);
      ctx.strokeStyle = 'rgba(0,0,0,0.08)';
      ctx.strokeRect(x, y, TILE, TILE);
    }
  }

  const top = walls.topWall || { color: '#546e7a', accentColor: '#37474f', trimColor: '#37474f' };
  ctx.fillStyle = top.color;
  ctx.fillRect(0, 0, W, walls.height || 90);
  ctx.fillStyle = top.accentColor;
  ctx.fillRect(0, (walls.height || 90) - 22, W, 22);
  ctx.fillStyle = top.trimColor || '#37474f';
  ctx.fillRect(0, (walls.height || 90) - 4, W, 4);

  for (const wall of walls.interior || []) {
    const x1 = wall.x1 * TILE;
    const y1 = wall.y1 * TILE;
    const x2 = wall.x2 * TILE;
    const y2 = wall.y2 * TILE;
    ctx.strokeStyle = wall.trim2Color || '#263238';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.strokeStyle = wall.color || '#455a64';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
}

function drawFurniture() {
  const items = (state.config.furniture || []).slice().sort((a, b) => (a.y || 0) - (b.y || 0));
  for (const item of items) drawFurnitureItem(item);
}

function drawFurnitureItem(item) {
  switch (item.type) {
    case 'desk': return drawDesk(item.x, item.y);
    case 'bossDesk': return drawBossDesk(item.x, item.y);
    case 'meetingTable': return drawMeetingTable(item.x, item.y);
    case 'vendingMachine': return drawVendingMachine(item.x, item.y);
    case 'engLounge':
    case 'couch': return drawCouch(item.x, item.y, item.couchColor);
    case 'kitchenCounter': return drawCounter(item.x, item.y);
    case 'waterCooler': return drawWaterCooler(item.x, item.y);
    case 'plant': return drawPlant(item.x, item.y, false);
    case 'tallPlant': return drawPlant(item.x, item.y, true);
    case 'endTable': return drawTable(item.x, item.y, 24, 24);
    case 'bookshelf': return drawBookshelf(item.x, item.y);
    case 'interactiveWindow': return drawWindow(item.x, item.y, item.showSun);
    case 'clock': return drawClock(item.x, item.y);
    case 'whiteboard': return drawWhiteboard(item.x, item.y);
    case 'tv': return drawTv(item.x, item.y);
    case 'coffeeTable': return drawTable(item.x, item.y, 68, 34);
    case 'trashCan': return drawTrash(item.x, item.y);
    case 'filingCabinet': return drawCabinet(item.x, item.y);
    case 'pingPongTable': return drawPingPong(item.x, item.y);
    case 'dartBoard': return drawDartBoard(item.x, item.y);
    case 'coffeeMaker': return drawAppliance(item.x, item.y, '#222', '#7dd3fc');
    case 'microwave': return drawAppliance(item.x, item.y, '#555', '#38bdf8');
    case 'toaster': return drawAppliance(item.x, item.y, '#bbb', '#f59e0b');
    case 'textLabel': return drawLabel(item);
    default: return drawGeneric(item.x, item.y);
  }
}

function shadow(x, y, w, h) {
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(x + 4, y + h - 4, w, 9);
}

function drawDesk(x, y) {
  shadow(x - 40, y - 24, 84, 60);
  ctx.fillStyle = '#7b6564';
  ctx.fillRect(x - 38, y - 22, 76, 50);
  ctx.fillStyle = '#5f4e50';
  ctx.fillRect(x - 34, y - 18, 68, 8);
  drawMonitor(x - 18, y - 48);
  ctx.fillStyle = '#9aa4b2';
  ctx.fillRect(x + 24, y + 4, 8, 10);
}

function drawBossDesk(x, y) {
  shadow(x - 66, y - 42, 132, 92);
  ctx.fillStyle = '#765d5d';
  ctx.fillRect(x - 65, y - 45, 130, 86);
  ctx.fillStyle = '#4b3a3c';
  ctx.fillRect(x - 55, y + 24, 110, 10);
  drawMonitor(x - 15, y - 36);
  ctx.fillStyle = '#eceff1';
  ctx.fillRect(x - 48, y - 16, 18, 22);
}

function drawMeetingTable(x, y) {
  shadow(x - 120, y - 58, 240, 120);
  ctx.fillStyle = '#6f5a59';
  ctx.fillRect(x - 118, y - 56, 236, 100);
  ctx.fillStyle = '#4f4448';
  ctx.fillRect(x - 110, y + 30, 220, 10);
  for (let i = -90; i <= 90; i += 40) {
    ctx.fillStyle = '#3d515f';
    ctx.fillRect(x + i, y - 82, 15, 24);
    ctx.fillRect(x + i, y + 54, 15, 24);
  }
}

function drawMonitor(x, y) {
  ctx.fillStyle = '#263238';
  ctx.fillRect(x, y, 42, 28);
  ctx.fillStyle = '#0ea5e9';
  ctx.fillRect(x + 4, y + 4, 34, 16);
  ctx.fillStyle = '#44545e';
  ctx.fillRect(x + 16, y + 28, 10, 8);
  ctx.fillRect(x + 8, y + 35, 26, 5);
}

function drawVendingMachine(x, y) {
  shadow(x, y, 45, 84);
  ctx.fillStyle = '#a61b27';
  ctx.fillRect(x, y, 45, 80);
  ctx.fillStyle = '#ffdd57';
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    ctx.fillStyle = ['#60a5fa', '#22c55e', '#f97316'][c];
    ctx.fillRect(x + 7 + c * 10, y + 10 + r * 12, 8, 9);
  }
  ctx.fillStyle = '#111827';
  ctx.fillRect(x + 7, y + 56, 30, 14);
}

function drawCouch(x, y, color = '#263238') {
  shadow(x - 5, y, 125, 52);
  ctx.fillStyle = color || '#263238';
  ctx.fillRect(x, y, 120, 38);
  ctx.fillStyle = '#1f2933';
  ctx.fillRect(x + 6, y + 8, 30, 20);
  ctx.fillRect(x + 42, y + 8, 30, 20);
  ctx.fillRect(x + 78, y + 8, 30, 20);
  ctx.fillStyle = '#111827';
  ctx.fillRect(x, y + 36, 120, 8);
}

function drawCounter(x, y) {
  shadow(x, y, 76, 42);
  ctx.fillStyle = '#d8dde5';
  ctx.fillRect(x, y + 12, 76, 30);
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(x, y + 8, 76, 8);
  ctx.fillStyle = '#9aa4b2';
  ctx.fillRect(x + 14, y + 20, 18, 12);
  ctx.fillRect(x + 44, y + 20, 18, 12);
}

function drawWaterCooler(x, y) {
  ctx.fillStyle = '#334155';
  ctx.fillRect(x + 8, y + 22, 18, 28);
  ctx.fillStyle = '#0ea5e9';
  ctx.beginPath();
  ctx.ellipse(x + 17, y + 16, 11, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillRect(x + 12, y + 5, 7, 18);
}

function drawPlant(x, y, tall) {
  ctx.fillStyle = '#b45309';
  ctx.fillRect(x, y + (tall ? 36 : 18), 20, tall ? 18 : 14);
  ctx.fillStyle = '#22c55e';
  const leaves = tall ? [[8, 8, 10], [1, 20, 9], [15, 22, 8], [8, 28, 9]] : [[8, 6, 10], [2, 13, 8], [14, 14, 8]];
  for (const [lx, ly, r] of leaves) {
    ctx.beginPath();
    ctx.arc(x + lx, y + ly, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawTable(x, y, w, h) {
  shadow(x, y, w, h);
  ctx.fillStyle = '#6f4e37';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#8b6a4b';
  ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
}

function drawBookshelf(x, y) {
  shadow(x, y, 52, 90);
  ctx.fillStyle = '#6d4c41';
  ctx.fillRect(x, y, 50, 84);
  for (let shelf = 8; shelf < 78; shelf += 23) {
    ctx.fillStyle = '#4e342e';
    ctx.fillRect(x + 4, y + shelf + 15, 42, 4);
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = ['#60a5fa', '#ef4444', '#22c55e', '#facc15', '#a78bfa'][i];
      ctx.fillRect(x + 8 + i * 7, y + shelf, 5, 14);
    }
  }
}

function drawWindow(x, y, sun) {
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(x, y, 44, 52);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x + 5, y + 5, 34, 38);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 22, y + 5);
  ctx.lineTo(x + 22, y + 43);
  ctx.moveTo(x + 5, y + 24);
  ctx.lineTo(x + 39, y + 24);
  ctx.stroke();
  if (sun) {
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(x + 32, y + 14, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawClock(x, y) {
  ctx.fillStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.arc(x, y, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 3;
  ctx.stroke();
  const now = new Date();
  const minute = now.getMinutes() / 60 * Math.PI * 2 - Math.PI / 2;
  const hour = (now.getHours() % 12) / 12 * Math.PI * 2 - Math.PI / 2;
  ctx.strokeStyle = '#111827';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(hour) * 7, y + Math.sin(hour) * 7);
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(minute) * 10, y + Math.sin(minute) * 10);
  ctx.stroke();
}

function drawWhiteboard(x, y) {
  ctx.fillStyle = '#e5e7eb';
  ctx.fillRect(x, y, 34, 48);
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(x + 3, y + 3, 28, 38);
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(x + 8, y + 12, 15, 2);
  ctx.fillStyle = '#0ea5e9';
  ctx.fillRect(x + 10, y + 24, 18, 2);
}

function drawTv(x, y) {
  ctx.fillStyle = '#101820';
  ctx.fillRect(x, y, 56, 36);
  ctx.fillStyle = '#22d3ee';
  ctx.fillRect(x + 6, y + 6, 44, 22);
  ctx.fillStyle = '#334155';
  ctx.fillRect(x + 22, y + 36, 12, 10);
}

function drawTrash(x, y) {
  ctx.fillStyle = '#6b7280';
  ctx.fillRect(x - 8, y, 16, 18);
  ctx.fillStyle = '#9ca3af';
  ctx.fillRect(x - 10, y - 3, 20, 4);
}

function drawCabinet(x, y) {
  shadow(x, y, 34, 60);
  ctx.fillStyle = '#78909c';
  ctx.fillRect(x, y, 32, 56);
  ctx.fillStyle = '#facc15';
  for (let i = 9; i < 50; i += 18) ctx.fillRect(x + 8, y + i, 16, 4);
}

function drawPingPong(x, y) {
  shadow(x - 45, y - 28, 92, 58);
  ctx.fillStyle = '#166534';
  ctx.fillRect(x - 44, y - 26, 88, 52);
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 44, y - 26, 88, 52);
  ctx.beginPath();
  ctx.moveTo(x, y - 26);
  ctx.lineTo(x, y + 26);
  ctx.stroke();
}

function drawDartBoard(x, y) {
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 20, y + 24);
  ctx.lineTo(x, y + 68);
  ctx.moveTo(x + 20, y + 24);
  ctx.lineTo(x + 40, y + 68);
  ctx.stroke();
  ctx.fillStyle = '#111827';
  ctx.beginPath();
  ctx.arc(x + 20, y + 22, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(x + 20, y + 22, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.arc(x + 20, y + 22, 6, 0, Math.PI * 2);
  ctx.fill();
}

function drawAppliance(x, y, body, glow) {
  ctx.fillStyle = body;
  ctx.fillRect(x, y, 28, 24);
  ctx.fillStyle = glow;
  ctx.fillRect(x + 5, y + 6, 14, 8);
}

function drawLabel(item) {
  ctx.font = `800 ${item.fontSize || 16}px Inter, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = item.labelColor || '#ffffff';
  ctx.fillText(item.text || 'LABEL', item.x, item.y);
}

function drawGeneric(x, y) {
  ctx.fillStyle = '#64748b';
  ctx.fillRect(x - 15, y - 15, 30, 30);
}

function drawPet() {
  const pet = state.config.pet;
  if (!pet || !pet.enabled) return;
  const x = 410 + Math.sin(performance.now() / 1200) * 18;
  const y = 680 + Math.cos(performance.now() / 1500) * 8;
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(x - 12, y - 9, 24, 18);
  ctx.fillStyle = '#991b1b';
  ctx.fillRect(x - 18, y - 3, 6, 4);
  ctx.fillRect(x + 12, y - 3, 6, 4);
  ctx.fillStyle = '#111827';
  ctx.fillRect(x - 6, y - 3, 3, 3);
  ctx.fillRect(x + 3, y - 3, 3, 3);
  ctx.fillStyle = '#e5e7eb';
  ctx.font = '12px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(pet.name || 'Pet', x, y - 18);
}

function updateAgents(dt) {
  for (const agent of state.agents) {
    if (!agent.target || Math.hypot(agent.target.x - agent.x, agent.target.y - agent.y) < 4) continue;
    const dx = agent.target.x - agent.x;
    const dy = agent.target.y - agent.y;
    const len = Math.hypot(dx, dy) || 1;
    const speed = agent.status === 'walking' ? 74 : 42;
    agent.x += (dx / len) * speed * dt;
    agent.y += (dy / len) * speed * dt;
  }
}

function drawAgents() {
  const ordered = state.agents.slice().sort((a, b) => a.y - b.y);
  for (const agent of ordered) drawAgent(agent);
}

function drawAgent(agent) {
  const bob = Math.sin(performance.now() / 180 + agent.phase) * 2;
  ctx.save();
  ctx.translate(agent.x, agent.y + bob);
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(-13, 15, 26, 6);
  ctx.fillStyle = agent.color || '#60a5fa';
  ctx.fillRect(-13, -20, 26, 30);
  ctx.fillStyle = '#f2c9a0';
  ctx.fillRect(-11, -39, 22, 22);
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(-13, -43, 26, 8);
  ctx.fillRect(-16, -35, 5, 9);
  ctx.fillRect(11, -35, 5, 9);
  ctx.fillStyle = '#111827';
  ctx.fillRect(-5, -30, 3, 3);
  ctx.fillRect(4, -30, 3, 3);
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(-9, 10, 7, 18);
  ctx.fillRect(3, 10, 7, 18);
  ctx.restore();

  ctx.fillStyle = agent.color || '#60a5fa';
  const nameWidth = Math.max(44, ctx.measureText(agent.name).width + 16);
  ctx.fillRect(agent.x - nameWidth / 2, agent.y - 68, nameWidth, 20);
  ctx.fillStyle = '#fff';
  ctx.font = '700 12px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(agent.name, agent.x, agent.y - 53);

  if (state.bubbles && agent.bubble && agent.bubbleUntil > Date.now()) {
    drawBubble(agent.x + 18, agent.y - 86, agent.bubble);
  }
}

function drawBubble(x, y, text) {
  ctx.font = '12px Inter, sans-serif';
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > 160 && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  const width = Math.min(180, Math.max(80, ...lines.map(item => ctx.measureText(item).width + 18)));
  const height = 18 + lines.length * 16;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
  roundRect(x, y - height, width, height, 8);
  ctx.fill();
  ctx.fillStyle = '#e2e8f0';
  lines.forEach((item, index) => ctx.fillText(item, x + width / 2, y - height + 18 + index * 16));
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
}

function drawEditOverlay() {
  ctx.strokeStyle = 'rgba(255, 212, 59, 0.55)';
  ctx.lineWidth = 2 / state.camera.scale;
  for (let x = 0; x <= state.config.canvasWidth; x += TILE) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, state.config.canvasHeight);
    ctx.stroke();
  }
  for (let y = 0; y <= state.config.canvasHeight; y += TILE) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(state.config.canvasWidth, y);
    ctx.stroke();
  }
  if (state.selectedFurniture) {
    const [w, h] = boundsFor(state.selectedFurniture);
    ctx.strokeStyle = '#ffd43b';
    ctx.strokeRect(state.selectedFurniture.x - w / 2, state.selectedFurniture.y - h / 2, w, h);
  }
}

function drawPerformance() {
  state.cpu = (state.cpu * 0.94) + (Math.random() * 20 + 8) * 0.06;
  state.ram = (state.ram * 0.96) + (Math.random() * 25 + 32) * 0.04;
  document.getElementById('cpuValue').textContent = `${Math.round(state.cpu)}%`;
  document.getElementById('ramValue').textContent = `${Math.round(state.ram)}%`;
  document.getElementById('cpuBar').style.width = `${state.cpu}%`;
  document.getElementById('ramBar').style.width = `${state.ram}%`;
}

function renderDashboard() {
  if (!state.config) return;
  const branches = state.config.branches || [];
  const branchCards = branches.concat([{ id: 'UNASSIGNED', name: 'Unassigned', emoji: '?' }]).map(branch => {
    const members = state.agents.filter(agent => (agent.branch || 'UNASSIGNED') === branch.id);
    const rows = members.map(agent => (
      `<div class="agent-row"><span>${agent.name}</span><small>${agent.status}</small></div>`
    )).join('');
    const color = branch.color || branchColors[branch.id] || '#8b95aa';
    return `<div class="branch-card" style="border-left-color:${color}"><strong>${branch.emoji || ''} ${branch.name}</strong><small>${members.length} agent${members.length === 1 ? '' : 's'}</small>${rows}</div>`;
  }).join('');
  tools.branchList.innerHTML = branchCards;
  document.getElementById('statWorking').textContent = state.stats.working || 0;
  document.getElementById('statMeeting').textContent = state.stats.meeting || 0;
  document.getElementById('statIdle').textContent = state.stats.idle || 0;
  document.getElementById('statBreak').textContent = state.stats.break || 0;
  tools.activityLog.innerHTML = state.activity.slice(-24).reverse().map(entry => {
    const t = new Date(entry.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return `<li>[${t}] ${escapeHtml(entry.message)}</li>`;
  }).join('');
}

function hitAgent(x, y) {
  return state.agents.find(agent => Math.abs(agent.x - x) < 24 && Math.abs(agent.y - y) < 52);
}

function hitFurniture(x, y) {
  return [...(state.config.furniture || [])].reverse().find(item => {
    const [w, h] = boundsFor(item);
    return x >= item.x - w / 2 && x <= item.x + w / 2 && y >= item.y - h / 2 && y <= item.y + h / 2;
  });
}

function boundsFor(item) {
  return furnitureBounds[item.type] || [40, 40];
}

function addFurniture(x, y) {
  const type = tools.furniturePicker.value;
  const item = {
    id: `node_${Date.now()}`,
    type,
    x: snap(x, 20),
    y: snap(y, 20)
  };
  if (type === 'textLabel') {
    item.text = 'NEW LABEL';
    item.labelColor = '#ffffff';
    item.fontSize = 16;
  }
  state.config.furniture.push(item);
  state.selectedFurniture = item;
}

async function saveLayout() {
  await fetch('/api/office-config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state.config)
  });
}

function openAgentPanel(agent) {
  state.selectedAgent = agent;
  tools.agentPanel.classList.remove('hidden');
  tools.agentTitle.textContent = agent.name;
  tools.agentMeta.textContent = `${agent.role} - ${agent.status}`;
  tools.chatLog.innerHTML = `<div class="message">${agent.name}: ${agent.bubble || 'Ready for work.'}</div>`;
  tools.chatInput.focus();
}

function closeAgentPanel() {
  state.selectedAgent = null;
  tools.agentPanel.classList.add('hidden');
}

async function sendChat(event) {
  event.preventDefault();
  if (!state.selectedAgent) return;
  const text = tools.chatInput.value.trim();
  if (!text) return;
  tools.chatInput.value = '';
  appendMessage(text, 'user');
  const res = await fetch(`/api/agents/${state.selectedAgent.id}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: text })
  });
  const data = await res.json();
  appendMessage(data.reply || 'No reply.');
}

function appendMessage(text, kind = '') {
  const el = document.createElement('div');
  el.className = `message ${kind}`;
  el.textContent = text;
  tools.chatLog.append(el);
  tools.chatLog.scrollTop = tools.chatLog.scrollHeight;
}

function screenToWorld(x, y) {
  return {
    x: (x - state.camera.x) / state.camera.scale,
    y: (y - state.camera.y) / state.camera.scale
  };
}

function worldToScreen(x, y) {
  return {
    x: x * state.camera.scale + state.camera.x,
    y: y * state.camera.scale + state.camera.y
  };
}

function snap(value, size) {
  return Math.round(value / size) * size;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[ch]));
}

boot().catch(error => {
  console.error(error);
  document.body.innerHTML = `<pre style="padding:24px;color:#fff">${escapeHtml(error.stack || error.message)}</pre>`;
});
