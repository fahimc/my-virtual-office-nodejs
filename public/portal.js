const app = document.querySelector('#portal-app');
const navLinks = [...document.querySelectorAll('[data-section-link]')];
let state = null;
let feedbackPoint = null;

init().catch(error => {
  app.innerHTML = `<div class="panel"><h1>Portal unavailable</h1><p>${escapeHtml(error.message || error)}</p></div>`;
});

async function init() {
  const projectId = projectIdFromPath();
  const projectsResponse = await api('/api/portal/projects');
  const project = projectId ? { projectId } : projectsResponse.projects?.[0];
  if (!project) {
    app.innerHTML = '<div class="panel"><h1>No projects yet</h1><p class="muted">The portal will show projects after customer intake.</p></div>';
    return;
  }
  await loadProject(project.projectId);
  window.addEventListener('hashchange', updateActiveNav);
}

async function loadProject(projectId) {
  state = await api(`/api/portal/projects/${projectId}`);
  render();
  bindActions();
  updateActiveNav();
}

function render() {
  const { project, summary, timeline, updates, design, currentPreview, approvals, feedback, files, messages } = state;
  app.innerHTML = `
    <header class="project-header">
      <div>
        <h1>${escapeHtml(project.title)}</h1>
        <div class="header-meta">
          <span class="pill">${escapeHtml(summary.currentStage)}</span>
          <span class="pill ${summary.approvalStatus === 'Action needed' ? 'gold' : 'green'}">${escapeHtml(summary.approvalStatus)}</span>
          <span class="pill">${escapeHtml(summary.previewStatus)}</span>
        </div>
      </div>
      <a class="primary-action" href="#${summary.approvalStatus === 'Action needed' ? 'approvals' : currentPreview ? 'preview' : 'updates'}">${escapeHtml(summary.nextAction)}</a>
    </header>

    <section id="overview" class="section grid two">
      <article class="panel">
        <h2>Project overview</h2>
        <p>${escapeHtml(summary.nextAction)}</p>
        <p class="muted">Current stage: ${escapeHtml(summary.currentStage)}</p>
      </article>
      <article class="panel">
        <h2>Latest update</h2>
        ${state.latestUpdate ? renderUpdate(state.latestUpdate) : '<p class="empty">No customer update yet.</p>'}
      </article>
    </section>

    <section class="section">
      <div class="section-head"><div><h2>Timeline</h2><p>Simple customer-facing milestones.</p></div></div>
      <div class="timeline">${timeline.map(renderTimeline).join('')}</div>
    </section>

    <section id="updates" class="section">
      <div class="section-head"><div><h2>Updates</h2><p>Agency updates without internal task noise.</p></div></div>
      <div class="feed">${updates.length ? updates.map(renderUpdate).join('') : '<p class="empty">No updates yet.</p>'}</div>
    </section>

    <section id="design" class="section">
      <div class="section-head"><div><h2>Design direction</h2><p>Review the visual direction without needing Figma.</p></div></div>
      ${renderDesign(design)}
    </section>

    <section id="preview" class="section">
      <div class="section-head"><div><h2>Preview</h2><p>Review the current preview version and leave visual comments.</p></div></div>
      ${renderPreview(currentPreview)}
    </section>

    <section id="feedback" class="section">
      <div class="section-head"><div><h2>Feedback</h2><p>Comments become internal agency tasks.</p></div></div>
      <div class="list">${feedback.length ? feedback.map(renderFeedback).join('') : '<p class="empty">No feedback yet.</p>'}</div>
    </section>

    <section id="approvals" class="section">
      <div class="section-head"><div><h2>Approval center</h2><p>Every decision is recorded with a snapshot.</p></div></div>
      <div class="list">${approvals.length ? approvals.map(renderApproval).join('') : '<p class="empty">No approvals yet.</p>'}</div>
    </section>

    <section id="files" class="section">
      <div class="section-head"><div><h2>Files</h2><p>Upload logos, photos, copy, testimonials, and documents.</p></div></div>
      <div class="grid two">
        <form class="panel file-form" id="file-form">
          <h3>Upload file</h3>
          <input type="file" id="file-input" required>
          <select id="file-category">
            ${['logo','brand_guidelines','photos','copy','testimonials','products','documents','old_website','legal','other'].map(category => `<option value="${category}">${category.replaceAll('_', ' ')}</option>`).join('')}
          </select>
          <button class="primary-action" type="submit">Upload</button>
        </form>
        <div class="panel list">${files.length ? files.map(renderFile).join('') : '<p class="empty">No files uploaded yet.</p>'}</div>
      </div>
    </section>

    <section id="messages" class="section">
      <div class="section-head"><div><h2>Messages</h2><p>Portal messages replace scattered email chains.</p></div></div>
      <div class="grid two">
        <form class="panel message-form" id="message-form">
          <h3>Send a message</h3>
          <input id="message-subject" placeholder="Subject" required>
          <textarea id="message-body" rows="5" placeholder="Write your message" required></textarea>
          <button class="primary-action" type="submit">Send</button>
        </form>
        <div class="panel list">${messages.length ? messages.map(renderMessage).join('') : '<p class="empty">No messages yet.</p>'}</div>
      </div>
    </section>

    <section id="launch" class="section">
      <div class="section-head"><div><h2>Launch</h2><p>Live deployment is separate from preview approval.</p></div></div>
      <article class="panel">
        ${project.liveUrl ? `<p>Live URL</p><a class="launch-url" href="${escapeAttr(project.liveUrl)}" target="_blank" rel="noreferrer">${escapeHtml(project.liveUrl)}</a>` : '<p class="muted">Launch has not been approved or completed yet.</p>'}
      </article>
    </section>
  `;
}

function renderTimeline(item) {
  return `<article class="timeline-card ${item.status}"><b>${escapeHtml(item.label)}</b><span>${escapeHtml(item.description)}</span></article>`;
}

function renderUpdate(item) {
  return `<article class="feed-item"><b>${escapeHtml(item.title)}</b><p>${escapeHtml(item.message)}</p><time>${formatDate(item.createdAt)}</time></article>`;
}

function renderDesign(design) {
  const direction = design?.direction;
  const tokens = design?.tokens;
  if (!direction) return '<article class="panel"><p class="empty">Design direction is not ready yet.</p></article>';
  const palette = direction.palette || tokens?.colours || [];
  return `<div class="grid two">
    <article class="panel">
      <h3>${escapeHtml(direction.name || 'Selected direction')}</h3>
      <p>${escapeHtml(direction.summary || '')}</p>
      <div class="swatches">${palette.map(color => `<span class="swatch" title="${escapeAttr(color.name || color.hex || '')}" style="background:${escapeAttr(color.hex || color.value || color)}"></span>`).join('')}</div>
      <p><strong>Typography:</strong> ${escapeHtml(direction.typography || tokens?.typography?.heading || 'Defined in design tokens')}</p>
      <p><strong>Layout:</strong> ${escapeHtml(direction.layoutStyle || 'Structured responsive layout')}</p>
      <p><strong>Imagery:</strong> ${escapeHtml(direction.imageryStyle || 'Generated project-specific imagery')}</p>
    </article>
    <article class="panel">
      <h3>Rationale and notes</h3>
      <p>${escapeHtml(direction.rationale || 'This direction is selected to support the approved brief and conversion goal.')}</p>
      ${Array.isArray(direction.risks) && direction.risks.length ? `<p><strong>Risks:</strong> ${direction.risks.map(escapeHtml).join(', ')}</p>` : ''}
      ${design.artifacts?.length ? `<div class="list">${design.artifacts.map(artifact => `<a class="list-item" href="${escapeAttr(artifact.url || `/api/agency/artifact/${artifact.id}`)}" target="_blank" rel="noreferrer"><b>${escapeHtml(artifact.title)}</b><span>${escapeHtml(artifact.type)}</span></a>`).join('')}</div>` : ''}
    </article>
  </div>`;
}

function renderPreview(preview) {
  if (!preview) return '<article class="panel"><p class="empty">Preview is not ready yet.</p></article>';
  const src = preview.previewUrl || `/previews/${state.project.id}/`;
  return `<article class="panel">
    <div class="button-row">
      <a class="primary-action" href="${escapeAttr(src)}" target="_blank" rel="noreferrer">Open preview</a>
      <button class="secondary-action" id="toggle-feedback" type="button">Leave visual feedback</button>
    </div>
    <p class="muted">Version ${preview.versionNumber} · ${escapeHtml(preview.status)}</p>
    <div class="preview-frame-wrap" id="preview-wrap">
      <iframe class="preview-frame" src="${escapeAttr(src)}" title="Website preview"></iframe>
      <div class="feedback-layer" id="feedback-layer"></div>
    </div>
    <form class="feedback-form" id="feedback-form" hidden>
      <select id="feedback-type">
        ${['design_change','copy_change','bug','mobile_issue','content_missing','image_change','layout_issue','general_comment'].map(type => `<option value="${type}">${type.replaceAll('_', ' ')}</option>`).join('')}
      </select>
      <textarea id="feedback-comment" rows="4" placeholder="Describe the requested change" required></textarea>
      <button class="primary-action" type="submit">Submit feedback</button>
    </form>
    <div class="screenshot-grid">
      ${['desktop','tablet','mobile'].map(key => `<div class="screenshot-box">${preview.screenshots?.[key] ? `<img src="${escapeAttr(preview.screenshots[key])}" alt="${key} screenshot">` : `<span class="muted">${key}</span>`}</div>`).join('')}
    </div>
  </article>`;
}

function renderFeedback(item) {
  return `<article class="list-item"><b>${escapeHtml(item.type.replaceAll('_', ' '))}</b><p>${escapeHtml(item.comment)}</p><span class="pill">${escapeHtml(item.status.replaceAll('_', ' '))}</span><time>${formatDate(item.createdAt)}</time></article>`;
}

function renderApproval(item) {
  const resolved = item.status !== 'pending';
  return `<article class="list-item approval-card ${item.status}">
    <b>${escapeHtml(item.title)}</b>
    <p>${escapeHtml(item.description)}</p>
    <span class="pill ${resolved ? 'green' : 'gold'}">${escapeHtml(item.status.replaceAll('_', ' '))}</span>
    ${item.status === 'pending' ? `<div class="button-row">
      <button class="primary-action" data-approve="${escapeAttr(item.id)}">Approve</button>
      <button class="secondary-action" data-change="${escapeAttr(item.id)}">Request changes</button>
      <button class="secondary-action" data-reject="${escapeAttr(item.id)}">Reject</button>
    </div>` : ''}
  </article>`;
}

function renderFile(file) {
  return `<article class="list-item"><b>${escapeHtml(file.originalFilename)}</b><span>${escapeHtml(file.category.replaceAll('_', ' '))} · ${Math.round(file.size / 1024)} KB</span>${file.publicUrl ? `<a href="${escapeAttr(file.publicUrl)}" target="_blank" rel="noreferrer">Open</a>` : ''}</article>`;
}

function renderMessage(message) {
  return `<article class="list-item"><b>${escapeHtml(message.subject)}</b><p>${escapeHtml(message.body)}</p><time>${formatDate(message.createdAt)}</time></article>`;
}

function bindActions() {
  document.querySelectorAll('[data-approve]').forEach(button => button.addEventListener('click', () => resolveApproval(button.dataset.approve, 'approve')));
  document.querySelectorAll('[data-change]').forEach(button => button.addEventListener('click', () => resolveApproval(button.dataset.change, 'request-changes')));
  document.querySelectorAll('[data-reject]').forEach(button => button.addEventListener('click', () => resolveApproval(button.dataset.reject, 'reject')));
  document.querySelector('#toggle-feedback')?.addEventListener('click', () => {
    document.querySelector('#feedback-layer')?.classList.toggle('active');
    document.querySelector('#feedback-form').hidden = false;
  });
  document.querySelector('#feedback-layer')?.addEventListener('click', event => {
    const layer = event.currentTarget;
    const rect = layer.getBoundingClientRect();
    feedbackPoint = { x: Math.round(event.clientX - rect.left), y: Math.round(event.clientY - rect.top), width: Math.round(rect.width), height: Math.round(rect.height) };
    layer.innerHTML = `<span class="feedback-pin" style="left:${feedbackPoint.x}px;top:${feedbackPoint.y}px"></span>`;
    document.querySelector('#feedback-form').hidden = false;
  });
  document.querySelector('#feedback-form')?.addEventListener('submit', submitFeedback);
  document.querySelector('#file-form')?.addEventListener('submit', submitFile);
  document.querySelector('#message-form')?.addEventListener('submit', submitMessage);
}

async function resolveApproval(id, action) {
  const note = action === 'approve' ? 'Approved in client portal' : prompt('What should change?') || '';
  await api(`/api/portal/projects/${state.project.id}/approvals/${id}/${action}`, { method: 'POST', body: { note } });
  await loadProject(state.project.id);
}

async function submitFeedback(event) {
  event.preventDefault();
  const preview = state.currentPreview;
  const wrap = document.querySelector('#preview-wrap')?.getBoundingClientRect();
  const point = feedbackPoint || { x: Math.round((wrap?.width || 0) / 2), y: Math.round((wrap?.height || 0) / 2), width: Math.round(wrap?.width || 0), height: Math.round(wrap?.height || 0) };
  await api(`/api/portal/projects/${state.project.id}/feedback`, {
    method: 'POST',
    body: {
      previewVersionId: preview?.id,
      pageUrl: preview?.previewUrl,
      viewport: { width: point.width, height: point.height },
      clickPosition: { x: point.x, y: point.y },
      comment: document.querySelector('#feedback-comment').value,
      type: document.querySelector('#feedback-type').value
    }
  });
  feedbackPoint = null;
  await loadProject(state.project.id);
  location.hash = '#feedback';
}

async function submitFile(event) {
  event.preventDefault();
  const input = document.querySelector('#file-input');
  const file = input.files?.[0];
  if (!file) return;
  const contentBase64 = await fileToBase64(file);
  await api(`/api/portal/projects/${state.project.id}/files/upload`, {
    method: 'POST',
    body: {
      originalFilename: file.name,
      mimeType: file.type || 'application/octet-stream',
      category: document.querySelector('#file-category').value,
      contentBase64
    }
  });
  await loadProject(state.project.id);
  location.hash = '#files';
}

async function submitMessage(event) {
  event.preventDefault();
  await api(`/api/portal/projects/${state.project.id}/messages`, {
    method: 'POST',
    body: {
      subject: document.querySelector('#message-subject').value,
      body: document.querySelector('#message-body').value
    }
  });
  await loadProject(state.project.id);
  location.hash = '#messages';
}

async function api(url, options = {}) {
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.error || `Request failed: ${response.status}`);
  return json;
}

function projectIdFromPath() {
  const match = location.pathname.match(/\/portal\/projects\/([^/]+)/);
  return match?.[1];
}

function updateActiveNav() {
  const active = (location.hash || '#overview').slice(1);
  navLinks.forEach(link => link.classList.toggle('active', link.dataset.sectionLink === active));
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : '';
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}
