(function () {
  const els = {
    step: document.getElementById('agencyStep'),
    title: document.getElementById('receptionTitle'),
    message: document.getElementById('receptionMessage'),
    actions: document.getElementById('agencyActions'),
    emailForm: document.getElementById('agencyEmailForm'),
    email: document.getElementById('agencyEmail'),
    customerForm: document.getElementById('agencyCustomerForm'),
    customerName: document.getElementById('customerName'),
    businessName: document.getElementById('businessName'),
    customerPhone: document.getElementById('customerPhone'),
    existingWebsite: document.getElementById('existingWebsite'),
    businessType: document.getElementById('businessType'),
    customerNotes: document.getElementById('customerNotes'),
    briefForm: document.getElementById('agencyBriefForm'),
    brief: document.getElementById('agencyBrief'),
    structuredPanel: document.getElementById('structuredBriefPanel'),
    structuredEditor: document.getElementById('structuredBriefEditor'),
    approveBrief: document.getElementById('approveBrief'),
    workspace: document.getElementById('agencyWorkspace'),
    projectStatus: document.getElementById('projectStatus'),
    timeline: document.getElementById('agencyTimeline'),
    agents: document.getElementById('agentPresence'),
    activity: document.getElementById('agentActivity'),
    artifacts: document.getElementById('artifactList'),
    approval: document.getElementById('approvalPanel'),
    taskBoard: document.getElementById('taskBoardPanel'),
    designPhase: document.getElementById('designPhase'),
    designStudioBody: document.getElementById('designStudioBody'),
    developerPhase: document.getElementById('developerPhase'),
    developerStudioBody: document.getElementById('developerStudioBody'),
    codexPanel: document.getElementById('codexPanel'),
    githubPanel: document.getElementById('githubPanel'),
    emailPanel: document.getElementById('emailPanel'),
    auditPanel: document.getElementById('auditPanel'),
    resumeOverlay: document.getElementById('resumeOverlay'),
    resumeIssue: document.getElementById('resumeIssue'),
    resumeWorkflow: document.getElementById('resumeWorkflow'),
    version: document.getElementById('agencyVersion'),
    diagnostics: document.getElementById('workflowDiagnostics'),
    diagnosticsBody: document.getElementById('workflowDiagnosticsBody'),
    workflowHealth: document.getElementById('workflowHealth')
  };

  const state = {
    mode: 'new',
    email: '',
    customer: null,
    customerId: '',
    originalBrief: '',
    project: null,
    projectId: '',
    workflowRunId: '',
    renderedApprovalKey: '',
    structuredBrief: null,
    pollTimer: null,
    lastApiError: '',
    lastDiagnostics: null,
    imageryGenerationQueued: false
  };

  async function api(path, options = {}) {
    const response = await fetch(`/api/agency${path}`, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      state.lastApiError = `${data.error || `Request failed: ${response.status}`} (${response.status} ${path})`;
      throw new Error(data.error || `Request failed: ${response.status}`);
    }
    return data;
  }

  function setReception(step, title, message) {
    els.step.textContent = step;
    els.title.textContent = title;
    els.message.textContent = message;
  }

  function hideInputs() {
    els.emailForm.classList.add('hidden');
    els.customerForm.classList.add('hidden');
    els.briefForm.classList.add('hidden');
    els.structuredPanel.classList.add('hidden');
    els.actions.innerHTML = '';
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[char]);
  }

  function iconButton(label, icon, onClick) {
    const button = document.createElement('button');
    button.type = 'button';
    button.innerHTML = `<i data-lucide="${icon}"></i><span>${label}</span>`;
    button.addEventListener('click', onClick);
    return button;
  }

  function refreshIcons() {
    if (window.lucide) window.lucide.createIcons();
  }

  async function startIntake() {
    try {
      const intake = await api('/intake/start', { method: 'POST' });
      state.workflowRunId = intake.workflowRunId;
      hideInputs();
      setReception('Reception', 'Client Concierge', intake.question);
      els.actions.append(
        iconButton('New customer', 'user-plus', () => chooseCustomerType('new')),
        iconButton('Returning customer', 'history', () => chooseCustomerType('returning'))
      );
      refreshIcons();
    } catch (error) {
      setReception('Offline', 'Agency API unavailable', `${error.message}. Run the Node server with npm start to use autonomous workflows.`);
    }
  }

  function chooseCustomerType(mode) {
    state.mode = mode;
    hideInputs();
    setReception('Email', 'Client Concierge', mode === 'returning'
      ? 'Enter your email so I can look up previous projects.'
      : 'Enter your email first, then I will open the customer details form.');
    els.emailForm.classList.remove('hidden');
    els.email.focus();
  }

  els.emailForm.addEventListener('submit', async event => {
    event.preventDefault();
    state.email = els.email.value.trim();
    if (!state.email) return;
    hideInputs();
    try {
      const lookup = await api('/customer/lookup', { method: 'POST', body: { email: state.email, returning: state.mode === 'returning' } });
      if (state.mode === 'returning' && lookup.customer) {
        state.customer = lookup.customer;
        state.customerId = lookup.customer.id;
        setReception('Returning Customer', 'Client Concierge', `Welcome back. I found ${lookup.projects.length} project record${lookup.projects.length === 1 ? '' : 's'}.`);
        els.actions.append(iconButton('Start new brief', 'file-plus-2', showBriefForm));
        lookup.projects.slice(0, 3).forEach(project => {
          els.actions.append(iconButton(`Open ${project.title}`, 'folder-open', () => openProject(project)));
        });
        refreshIcons();
      } else {
        showCustomerForm(lookup.customer);
      }
    } catch (error) {
      setReception('Lookup issue', 'Client Concierge', error.message);
      els.actions.append(iconButton('Try again', 'refresh-cw', () => chooseCustomerType(state.mode)));
      refreshIcons();
    }
  });

  function showCustomerForm(customer) {
    hideInputs();
    if (customer) {
      state.customer = customer;
      state.customerId = customer.id;
      showBriefForm();
      return;
    }
    setReception('Customer Details', 'Client Concierge', 'Please add the structured customer details here. The agency will use this as customer memory.');
    els.customerName.value = '';
    els.businessName.value = '';
    els.customerPhone.value = '';
    els.existingWebsite.value = '';
    els.businessType.value = '';
    els.customerNotes.value = '';
    els.customerForm.classList.remove('hidden');
  }

  els.customerForm.addEventListener('submit', async event => {
    event.preventDefault();
    hideInputs();
    try {
      const result = await api('/customer/create', {
        method: 'POST',
        body: {
          name: els.customerName.value.trim(),
          email: state.email,
          phone: els.customerPhone.value.trim(),
          businessName: els.businessName.value.trim(),
          businessType: els.businessType.value.trim(),
          existingWebsite: els.existingWebsite.value.trim(),
          notes: els.customerNotes.value.trim()
        }
      });
      state.customer = result.customer;
      state.customerId = result.customer.id;
      showBriefForm();
    } catch (error) {
      setReception('Customer Details', 'Client Concierge', error.message);
      els.customerForm.classList.remove('hidden');
    }
  });

  function showBriefForm() {
    hideInputs();
    setReception('Brief', 'Briefing Agent', 'Send the website brief. The Brief Agent will convert it into a structured project specification for approval.');
    els.briefForm.classList.remove('hidden');
    els.brief.focus();
  }

  els.briefForm.addEventListener('submit', async event => {
    event.preventDefault();
    hideInputs();
    setReception('Structuring Brief', 'Briefing Agent', 'The agency is turning the brief into a structured specification.');
    try {
      state.originalBrief = els.brief.value.trim();
      const result = await api('/brief/submit', {
        method: 'POST',
        body: {
          customerId: state.customerId,
          customer: state.customer,
          workflowRunId: state.workflowRunId,
          originalBrief: state.originalBrief
        }
      });
      state.workflowRunId = result.workflowRunId;
      state.structuredBrief = result.structuredBrief;
      renderStructuredBrief(result.structuredBrief);
      els.structuredPanel.classList.remove('hidden');
      setReception('Brief Approval', 'Briefing Agent', 'Review the project summary, adjust anything that is wrong, then approve it. The agency will work in the background after approval.');
    } catch (error) {
      setReception('Brief issue', 'Briefing Agent', error.message);
      els.briefForm.classList.remove('hidden');
    }
  });

  function renderStructuredBrief(brief) {
    const value = (key, fallback = '') => escapeHtml(brief?.[key] || fallback);
    els.structuredEditor.innerHTML = `
      <div class="brief-review-grid">
        <label class="brief-review-field wide">
          <span>Business summary</span>
          <textarea data-brief-field="businessSummary">${value('businessSummary')}</textarea>
        </label>
        <label class="brief-review-field wide">
          <span>Target audience</span>
          <textarea data-brief-field="targetAudience">${value('targetAudience')}</textarea>
        </label>
        ${briefListField('Pages needed', 'pagesNeeded', brief)}
        ${briefListField('Features needed', 'featuresNeeded', brief)}
        ${briefListField('Style preferences', 'stylePreferences', brief)}
        ${briefListField('Content needed', 'contentRequirements', brief)}
        ${briefListField('Assets needed', 'assetsRequired', brief)}
        ${briefListField('Technical requirements', 'technicalRequirements', brief)}
        ${briefListField('Assumptions', 'assumptions', brief)}
        ${briefListField('Open questions', 'missingInformation', brief)}
        <label class="brief-review-field">
          <span>Estimated complexity</span>
          <select data-brief-field="estimatedComplexity">
            ${['small', 'medium', 'large'].map(option => `<option value="${option}" ${brief?.estimatedComplexity === option ? 'selected' : ''}>${option}</option>`).join('')}
          </select>
        </label>
      </div>
    `;
  }

  function briefListField(label, key, brief) {
    const items = Array.isArray(brief?.[key]) ? brief[key] : [];
    return `
      <label class="brief-review-field">
        <span>${escapeHtml(label)}</span>
        <textarea data-brief-field="${key}" data-brief-list="true">${escapeHtml(items.join('\n'))}</textarea>
      </label>
    `;
  }

  function structuredBriefFromForm() {
    const base = state.structuredBrief || {};
    const read = key => els.structuredEditor.querySelector(`[data-brief-field="${key}"]`)?.value.trim() || '';
    const readList = key => splitBriefList(read(key));
    return {
      businessSummary: read('businessSummary'),
      targetAudience: read('targetAudience'),
      pagesNeeded: readList('pagesNeeded'),
      featuresNeeded: readList('featuresNeeded'),
      stylePreferences: readList('stylePreferences'),
      contentRequirements: readList('contentRequirements'),
      assetsRequired: readList('assetsRequired'),
      technicalRequirements: readList('technicalRequirements'),
      assumptions: readList('assumptions'),
      missingInformation: readList('missingInformation'),
      estimatedComplexity: ['small', 'medium', 'large'].includes(read('estimatedComplexity')) ? read('estimatedComplexity') : base.estimatedComplexity || 'medium'
    };
  }

  function splitBriefList(value) {
    return String(value || '')
      .split(/\n|,/)
      .map(item => item.trim())
      .filter(Boolean);
  }

  els.approveBrief.addEventListener('click', async () => {
    hideInputs();
    setReception('Agency Working', 'Project Team', 'Brief approved. Agents are now working through planning, design, copy, build, QA, and preview.');
    try {
      const structuredBrief = structuredBriefFromForm();
      const result = await api('/brief/approve', {
        method: 'POST',
        body: {
          workflowRunId: state.workflowRunId,
          customerId: state.customerId,
          customer: state.customer,
          originalBrief: state.originalBrief || els.brief.value.trim(),
          structuredBrief
        }
      });
      state.projectId = result.project.id;
      state.workflowRunId = result.workflowRunId;
      renderOfficeState(result.officeState);
      startPolling();
    } catch (error) {
      setReception('Brief Approval', 'Briefing Agent', error.message);
      els.structuredPanel.classList.remove('hidden');
    }
  });

  function openProject(project) {
    state.projectId = project.id;
    state.workflowRunId = project.currentWorkflowRunId || '';
    hideInputs();
    setReception('Project', 'Client Concierge', 'Project record opened. You can review current status and continue from available approval points.');
    api(`/project/${project.id}`).then(result => {
      renderOfficeState(result.officeState);
      if (state.workflowRunId) startPolling();
    }).catch(error => setReception('Project issue', 'Client Concierge', error.message));
  }

  function startPolling() {
    if (state.pollTimer) clearInterval(state.pollTimer);
    state.pollTimer = setInterval(pollWorkflow, 1800);
    pollWorkflow();
  }

  async function pollWorkflow() {
    if (!state.workflowRunId) return;
    try {
      const result = await api(`/workflow/${state.workflowRunId}/status?projectId=${encodeURIComponent(state.projectId || '')}`);
      state.workflowRunId = result.canonicalWorkflowRunId || result.workflow?.id || state.workflowRunId;
      renderOfficeState(result.officeState);
      if (result.workflow.status === 'completed') clearInterval(state.pollTimer);
    } catch (error) {
      if (state.projectId) {
        try {
          const result = await api(`/project/${state.projectId}`);
          state.workflowRunId = result.canonicalWorkflowRunId || result.workflow?.id || state.workflowRunId;
          renderOfficeState(result.officeState);
          return;
        } catch {
          // Fall through to visible status below.
        }
      }
      els.projectStatus.textContent = error.message;
    }
  }

  function renderOfficeState(officeState) {
    if (!officeState) return;
    const project = officeState.project;
    const diagnostics = officeState.diagnostics || {};
    if (officeState.workflow?.id) state.workflowRunId = officeState.workflow.id;
    if (project) {
      state.project = project;
      state.projectId = project.id;
      state.workflowRunId = project.currentWorkflowRunId || state.workflowRunId;
      const phase = String(diagnostics.phase || project.status).replaceAll('_', ' ');
      els.projectStatus.textContent = `${phase} - ${project.title}`;
    }
    renderTimeline(officeState.timeline || []);
    renderAgents(officeState.agents || []);
    renderActivity(officeState.activity || []);
    renderArtifacts(officeState.artifacts || []);
    renderApproval(officeState.approvals || [], project);
    renderCompany(officeState);
    renderResume(officeState);
    renderDiagnostics(diagnostics);
  }

  function renderDiagnostics(diagnostics) {
    if (!els.diagnosticsBody) return;
    state.lastDiagnostics = diagnostics;
    const app = diagnostics.app || {};
    const warnings = Array.isArray(diagnostics.warnings) ? diagnostics.warnings : [];
    if (els.version) els.version.textContent = `v${app.version || 'unknown'} - ${app.commit || 'local'}`;
    if (els.workflowHealth) {
      els.workflowHealth.textContent = diagnostics.integrity === 'warning' ? `${warnings.length} warning${warnings.length === 1 ? '' : 's'}` : 'healthy';
      els.workflowHealth.className = diagnostics.integrity === 'warning' ? 'warning' : 'healthy';
    }
    const values = [
      ['Version', `${app.version || 'unknown'} / ${app.commit || 'local'}`],
      ['Deploy', `${app.context || 'unknown'} / ${app.deployId || 'local'}`],
      ['Storage', app.storage || 'unknown'],
      ['Test mode', diagnostics.testMode ? 'yes' : 'no'],
      ['OpenAI images configured', diagnostics.openAiImagesConfigured ? 'yes' : 'no'],
      ['Image provider', diagnostics.imageProvider || 'not started'],
      ['Image counts', `${diagnostics.openAiImageCount || 0} OpenAI / ${diagnostics.mockImageCount || 0} fallback / ${diagnostics.plannedImageCount || 0} running / ${diagnostics.stalePlannedImageCount || 0} stale / ${diagnostics.failedImageCount || 0} failed`],
      ['Last image error', diagnostics.lastImageError || 'none'],
      ['Project', diagnostics.projectId || 'none'],
      ['Project status', diagnostics.projectStatus || 'none'],
      ['Workflow', diagnostics.workflowRunId || 'missing'],
      ['Workflow status', diagnostics.workflowStatus || 'missing'],
      ['Phase', diagnostics.phase || 'missing'],
      ['Current step', diagnostics.currentStep || 'missing'],
      ['Checkpoint', diagnostics.lastCheckpoint || 'missing'],
      ['Lease owner', diagnostics.executionLeaseOwner || 'none'],
      ['Lease until', diagnostics.executionLeaseUntil || 'none'],
      ['Worker dispatch', diagnostics.lastDispatchMode || 'none'],
      ['Dispatch target', diagnostics.lastDispatchEndpoint || diagnostics.lastDispatchJobId || 'none'],
      ['Dispatch response', diagnostics.lastDispatchStatus ?? 'n/a'],
      ['Dispatch requested', diagnostics.lastDispatchRequestedAt || 'none'],
      ['Dispatch accepted', diagnostics.lastDispatchAcceptedAt || 'none'],
      ['Dispatch error', diagnostics.lastDispatchError || 'none'],
      ['Resume count', diagnostics.resumeCount ?? 0],
      ['Resumed from', diagnostics.lastResumeFromStep || 'none'],
      ['Resume checkpoint', diagnostics.lastResumeCheckpoint || 'none'],
      ['Resume requested', diagnostics.resumeRequestedAt || 'none'],
      ['Updated', diagnostics.workflowUpdatedAt || diagnostics.projectUpdatedAt || 'unknown'],
      ['Design approved', diagnostics.designApproved ? 'yes' : 'no'],
      ['Handoff ready', diagnostics.designHandoffReady ? 'yes' : 'no'],
      ['Pending approvals', (diagnostics.pendingApprovals || []).join(', ') || 'none'],
      ['Artifacts', diagnostics.artifactCount ?? 0],
      ['Raw artifact records', diagnostics.rawArtifactCount ?? diagnostics.artifactCount ?? 0],
      ['Last browser/API error', state.lastApiError || 'none']
    ];
    const trace = Array.isArray(diagnostics.debugTrace) ? diagnostics.debugTrace : [];
    const approvalRecords = Array.isArray(diagnostics.approvalRecords) ? diagnostics.approvalRecords : [];
    els.diagnosticsBody.innerHTML = `
      <dl>${values.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}</dl>
      <div class="workflow-debug-trace"><b>Recent stage transitions</b>${trace.length ? trace.map(item => `<p>${escapeHtml(item.at || '')} - ${escapeHtml(item.step || 'unknown')} (${escapeHtml(item.status || 'unknown')})</p>`).join('') : '<p>No transitions recorded.</p>'}</div>
      <div class="workflow-debug-trace"><b>Approval records</b>${approvalRecords.length ? approvalRecords.map(item => `<p>${escapeHtml(item.type || 'unknown')} - ${escapeHtml(item.status || 'unknown')} - ${escapeHtml(item.id || '')}</p>`).join('') : '<p>No approval records.</p>'}</div>
      ${warnings.length ? `<div class="workflow-warning-list">${warnings.map(item => `<p>${escapeHtml(item)}</p>`).join('')}</div>` : '<p class="workflow-diagnostics-ok">No workflow integrity issues detected.</p>'}
    `;
  }

  function renderTimeline(timeline) {
    timeline = Array.isArray(timeline) ? timeline : [];
    els.timeline.innerHTML = timeline.map(item => `<li class="${item.status === 'completed' ? 'done' : item.status === 'active' ? 'active' : ''}">${item.step}</li>`).join('');
  }

  function renderAgents(agents) {
    agents = Array.isArray(agents) ? agents : [];
    els.agents.innerHTML = agents.map(agent => `
      <div>
        <b>${agent.name || agent.role || agent.agentId || agent.id || 'Agent'}</b>
        <span>${agent.role || agent.status}: ${agent.summary || ''}</span>
      </div>
    `).join('');
  }

  function renderActivity(activity) {
    activity = Array.isArray(activity) ? activity : [];
    els.activity.innerHTML = activity.slice(-8).reverse().map(item => `
      <li>
        <b>${item.title}</b>
        <span>${item.agentId} - ${item.status}</span>
      </li>
    `).join('');
  }

  function renderArtifacts(artifacts) {
    artifacts = Array.isArray(artifacts) ? artifacts : [];
    if (!artifacts.length) {
      els.artifacts.innerHTML = '';
      return;
    }
    const recent = artifacts.slice(-12).reverse();
    els.artifacts.innerHTML = `
      <details class="resources-panel">
        <summary>
          <span><b>Resources</b><small>${artifacts.length} key resources</small></span>
          <i data-lucide="chevron-down"></i>
        </summary>
        <div class="resources-list">
          ${recent.map(item => `
            <a class="resource-link" href="${item.url || `/api/agency/artifact/${item.id}`}" target="_blank" rel="noreferrer">
              <b>${item.title}</b>
              <span>${item.type}</span>
            </a>
          `).join('')}
        </div>
      </details>
    `;
    refreshIcons();
  }

  function renderApproval(approvals, project) {
    approvals = Array.isArray(approvals) ? approvals : [];
    const pending = approvals.find(item => item.status === 'pending' && item.type !== 'design_options');
    const previewUrl = project && project.previewUrl ? project.previewUrl : '';
    els.approval.classList.toggle('hidden', !pending && !previewUrl);
    if (!pending) {
      state.renderedApprovalKey = '';
      els.approval.innerHTML = previewUrl ? `
        <h4>Latest preview</h4>
        <p>The newest preview is available while the agency continues the workflow.</p>
        <p><a href="${previewUrl}" target="_blank" rel="noreferrer">${previewUrl}</a></p>
        <div class="agency-actions">
          <a class="button-link" href="${previewUrl}" target="_blank" rel="noreferrer"><i data-lucide="external-link"></i><span>Open preview</span></a>
        </div>
      ` : '';
      if (previewUrl) refreshIcons();
      return;
    }
    const approvalKey = `${pending.id}:${pending.type}:${pending.status}`;
    if (state.renderedApprovalKey === approvalKey && els.approval.children.length) return;
    state.renderedApprovalKey = approvalKey;
    if (pending.type === 'deployment') {
      els.approval.innerHTML = `
        <h4>${pending.title}</h4>
        <p>${pending.description}</p>
        <button id="approveDeployment" type="button"><i data-lucide="rocket"></i><span>Approve live deployment</span></button>
      `;
      document.getElementById('approveDeployment').addEventListener('click', approveDeployment);
    } else {
      const previewUrl = pending.payload && pending.payload.previewUrl ? pending.payload.previewUrl : '#';
      els.approval.innerHTML = `
        <h4>${pending.title}</h4>
        <p>${pending.description}</p>
        <p><a href="${previewUrl}" target="_blank" rel="noreferrer">${previewUrl}</a></p>
        <textarea id="changeFeedback" placeholder="Requested changes"></textarea>
        <div class="agency-actions">
          <button id="approvePreview" type="button"><i data-lucide="check"></i><span>Approve</span></button>
          <button id="requestChanges" type="button"><i data-lucide="message-square"></i><span>Request changes</span></button>
          <button id="pauseWorkflow" type="button"><i data-lucide="pause"></i><span>Pause</span></button>
        </div>
      `;
      document.getElementById('approvePreview').addEventListener('click', () => approvePreview(pending.id));
      document.getElementById('requestChanges').addEventListener('click', () => requestChanges(pending.id));
      document.getElementById('pauseWorkflow').addEventListener('click', () => setReception('Paused', 'Client Concierge', 'The project is paused in the browser. Backend workflow state is unchanged.'));
    }
    refreshIcons();
  }

  function renderCompany(officeState) {
    renderTaskBoard(officeState.taskBoard || []);
    renderDesignStudio(officeState.designStudio || {});
    renderDeveloperStudio(officeState.developerStudio || {});
    const company = officeState.company || {};
    renderCodex(company.codexTasks || []);
    renderGitHub(company.githubPullRequests || []);
    renderEmail(company.emailDrafts || []);
    renderAudit(officeState.activity || []);
  }

  function renderTaskBoard(columns) {
    columns = Array.isArray(columns) ? columns : [];
    els.taskBoard.innerHTML = columns.filter(column => {
      const tasks = Array.isArray(column.tasks) ? column.tasks : [];
      return tasks.length || ['ready', 'in_progress', 'review', 'done', 'failed'].includes(column.status);
    }).map(column => {
      const tasks = Array.isArray(column.tasks) ? column.tasks : [];
      return `
      <section class="task-column">
        <h5>${column.status.replaceAll('_', ' ')}</h5>
        ${tasks.slice(0, 4).map(task => `
          <div class="task-card" title="${task.description || ''}">
            <b>${task.title}</b>
            <small>${task.type} - ${task.assignedAgentId || 'unassigned'} ${task.approvalRequired ? '<span class="approval-badge">approval</span>' : ''}</small>
          </div>
        `).join('')}
      </section>
    `;
    }).join('');
  }

  function renderDesignStudio(design) {
    els.designPhase.textContent = (design.phase || 'not_started').replaceAll('_', ' ');
    const selected = design.selectedDirection;
    const direction = (design.creativeDirections || []).find(item => selected && item.id === selected.selectedDirectionId) || (design.creativeDirections || [])[0];
    const designDirections = design.creativeDirections || [];
    const pendingDesignApproval = (design.approvals || [])[0] || null;
    const designNeedsCompletion = Boolean(selected && !design.handoff);
    const designArtifacts = design.artifacts || [];
    const generatedImages = design.generatedImages || [];
    const imageryPlan = design.imageryPlan;
    const imageCost = design.finance?.estimatedCostUsd || 0;
    const openAiImages = generatedImages.filter(image => image.provider === 'openai' && image.status === 'generated');
    const mockImages = generatedImages.filter(image => image.provider === 'local_mock' || image.status === 'mocked');
    const failedImages = generatedImages.filter(image => image.status === 'failed');
    const staleImages = generatedImages.filter(image => image.status === 'planned' && (!image.generationLeaseUntil || Date.parse(image.generationLeaseUntil) <= Date.now()));
    const generatingImages = generatedImages.filter(image => image.status === 'planned' && !staleImages.includes(image));
    if (openAiImages.length && !mockImages.length && !failedImages.length && !generatingImages.length) state.imageryGenerationQueued = false;
    const imagerySummary = generatingImages.length || state.imageryGenerationQueued
      ? `OpenAI generation is running. ${openAiImages.length} of ${generatedImages.length || 5} images are ready.`
        : staleImages.length
          ? `${staleImages.length} image generation request${staleImages.length === 1 ? '' : 's'} lost the background worker and can be resumed safely.`
        : openAiImages.length
        ? `${openAiImages.length} OpenAI image${openAiImages.length === 1 ? '' : 's'} generated. Estimated generation spend: $${Number(imageCost).toFixed(4)}.`
        : mockImages.length
          ? `${mockImages.length} local fallback image${mockImages.length === 1 ? '' : 's'} are in use. Generate the real project imagery with OpenAI.`
          : failedImages.length
            ? `${failedImages.length} image generation request${failedImages.length === 1 ? '' : 's'} failed. Retry with OpenAI.`
            : 'Imagery generation has not run yet';
    const tokenColors = design.tokens && design.tokens.colours ? Object.values(design.tokens.colours).slice(0, 8) : [];
    const existingDesignFeedback = document.getElementById('designStudioFeedback')?.value || '';
    els.designStudioBody.innerHTML = `
      ${!pendingDesignApproval && design.phase === 'creative_direction_approval' && designDirections.length ? `
        <div class="design-review-preparing">
          <b>Preparing design review</b>
          <span>The creative directions are saved. Approval controls will appear when the review checkpoint is ready.</span>
        </div>
      ` : ''}
      ${pendingDesignApproval && designDirections.length ? `
        <section class="design-review-panel">
          <div class="agency-panel-heading">
            <h4>Creative Directions To Review</h4>
            <span>${designDirections.length} options</span>
          </div>
          <div class="creative-direction-review-list">
            ${designDirections.map((option, index) => `
              <article class="creative-direction-review-card">
                <div class="creative-direction-card-header">
                  <div class="creative-direction-title">
                    <b>${option.name}</b>
                    <span>${option.targetEmotion || 'Direction'}</span>
                  </div>
                  <button type="button" class="approve-direction-option" data-index="${index}"><i data-lucide="check"></i><span>Approve</span></button>
                </div>
                <div class="concept-preview-frame">
                  <iframe title="${option.name} visual concept" src="/design-concepts/${state.projectId}/${option.id}/" loading="lazy"></iframe>
                </div>
                <p>${option.summary}</p>
                <div class="design-token-row">${(option.palette || []).map(color => `<i class="design-swatch" title="${color.name}: ${color.hex}" style="background:${color.hex}"></i>`).join('')}</div>
                <details class="direction-details">
                  <summary>Review design rationale and risks</summary>
                  <dl>
                    <dt>Typography</dt><dd>${option.typography ? `${option.typography.heading} / ${option.typography.body}` : 'Defined in direction'}</dd>
                    <dt>Layout</dt><dd>${option.layoutStyle || ''}</dd>
                    <dt>Imagery</dt><dd>${option.imageryStyle || ''}</dd>
                    <dt>Best for</dt><dd>${option.bestFor || ''}</dd>
                    <dt>Risks</dt><dd>${(option.risks || []).join(', ') || 'None flagged'}</dd>
                    <dt>Rationale</dt><dd>${option.rationale || ''}</dd>
                  </dl>
                </details>
                <div class="creative-direction-actions">
                  <a href="/design-concepts/${state.projectId}/${option.id}/" target="_blank" rel="noreferrer">Open full design</a>
                </div>
              </article>
            `).join('')}
          </div>
          <textarea id="designStudioFeedback" placeholder="Request changes to the design directions"></textarea>
          <div class="agency-actions">
            <button id="requestDesignStudioChanges" type="button"><i data-lucide="message-square"></i><span>Request design changes</span></button>
          </div>
        </section>
      ` : ''}
      ${!pendingDesignApproval && designNeedsCompletion && designDirections.length ? `
        <section class="design-review-panel">
          <div class="agency-panel-heading">
            <h4>Selected Direction</h4>
            <span>resume or change</span>
          </div>
          <p class="design-help-text">The approval was recorded, but production design artifacts are not complete yet. Continue with the selected direction or choose another direction before handoff.</p>
          <div class="creative-direction-review-list compact">
            ${designDirections.map((option, index) => `
              <article class="creative-direction-review-card ${selected && selected.selectedDirectionId === option.id ? 'selected' : ''}">
                <div class="creative-direction-card-header">
                  <div class="creative-direction-title">
                    <b>${option.name}</b>
                    <span>${option.summary}</span>
                  </div>
                  <button type="button" class="select-direction-option" data-index="${index}">
                    <i data-lucide="${selected && selected.selectedDirectionId === option.id ? 'play' : 'check'}"></i>
                    <span>${selected && selected.selectedDirectionId === option.id ? 'Continue' : 'Use this'}</span>
                  </button>
                </div>
                <div class="design-token-row">${(option.palette || []).map(color => `<i class="design-swatch" title="${color.name}: ${color.hex}" style="background:${color.hex}"></i>`).join('')}</div>
                <a href="/design-concepts/${state.projectId}/${option.id}/" target="_blank" rel="noreferrer">Open full design</a>
              </article>
            `).join('')}
          </div>
        </section>
      ` : ''}
      <div class="design-studio-grid">
        <div class="design-studio-card">
          <b>Creative Direction</b>
          <span>${direction ? `${direction.name}: ${direction.summary}` : 'Awaiting design discovery'}</span>
          <div class="design-token-row">${direction ? direction.palette.map(color => `<i class="design-swatch" title="${color.name}" style="background:${color.hex}"></i>`).join('') : ''}</div>
        </div>
        <div class="design-studio-card">
          <b>Sitemap</b>
          <span>${design.sitemap ? design.sitemap.pages.map(page => page.title).join(', ') : 'Not created yet'}</span>
        </div>
        <div class="design-studio-card">
          <b>Wireframes</b>
          <span>${design.wireframes ? design.wireframes.mobileLayout : 'Not created yet'}</span>
        </div>
        <div class="design-studio-card">
          <b>Design Tokens</b>
          <span>${design.tokens ? 'Theme ready for Builder Agent' : 'Not created yet'}</span>
          <div class="design-token-row">${tokenColors.map(color => `<i class="design-swatch" style="background:${color}"></i>`).join('')}</div>
        </div>
        <div class="design-studio-card">
          <b>Prototype</b>
          <span>${design.prototypePreview?.previewUrl ? `<a href="${design.prototypePreview.previewUrl}" target="_blank" rel="noreferrer">Open prototype</a>` : 'Prototype pending'}</span>
        </div>
        <div class="design-studio-card design-studio-card-wide">
          <b>Generated Imagery</b>
          <span>${imagerySummary}</span>
          ${generatedImages.length ? `
            <div class="generated-image-strip">
              ${generatedImages.slice(0, 5).map(image => `
                <a href="${image.url || '#'}" target="_blank" rel="noreferrer" title="${escapeHtml(image.prompt)}">
                  <img src="${image.url || ''}" alt="${escapeHtml(image.title)}">
                  <small>${escapeHtml(image.title)}<br>${escapeHtml(image.tier)} - ${escapeHtml(image.provider)}</small>
                </a>
              `).join('')}
            </div>
          ` : ''}
          ${(mockImages.length || failedImages.length || staleImages.length) ? `
            <div class="agency-actions">
              <button id="regenerateOpenAiImagery" type="button" ${state.imageryGenerationQueued || generatingImages.length ? 'disabled' : ''}>
                <i data-lucide="${state.imageryGenerationQueued || generatingImages.length ? 'loader-2' : 'image-plus'}"></i>
                <span>${state.imageryGenerationQueued || generatingImages.length ? 'Generating with OpenAI' : 'Generate with OpenAI'}</span>
              </button>
            </div>
          ` : ''}
        </div>
        <div class="design-studio-card">
          <b>Design QA</b>
          <span>${design.qaReport ? (design.qaReport.passed ? 'Passed' : 'Needs fixes') : 'Not reviewed yet'}</span>
        </div>
        <div class="design-studio-card">
          <b>Builder Handoff</b>
          <span>${design.handoff ? design.handoff.handoffSummary : 'Not handed off yet'}</span>
        </div>
        <div class="design-studio-card">
          <b>Finance</b>
          <span>${design.finance ? `Estimated build spend tracked: $${Number(design.finance.estimatedCostUsd || 0).toFixed(4)}. Image entries: ${(design.finance.imageGenerationEntries || []).length}.` : 'No cost entries yet'}</span>
        </div>
        <div class="design-studio-card design-studio-card-wide">
          <details class="resources-panel compact">
            <summary>
              <span><b>Design Resources</b><small>${design.artifactCount || 0} key resources</small></span>
              <i data-lucide="chevron-down"></i>
            </summary>
            <div class="resources-list">
              ${designArtifacts.slice(-14).reverse().map(artifact => `
                <a class="resource-link" href="${artifact.url || `/api/agency/artifact/${artifact.id}`}" target="_blank" rel="noreferrer">
                  <b>${artifact.title}</b>
                  <span>${artifact.type}</span>
                </a>
              `).join('')}
            </div>
          </details>
        </div>
      </div>
    `;
    const restoredDesignFeedback = document.getElementById('designStudioFeedback');
    if (restoredDesignFeedback && existingDesignFeedback) restoredDesignFeedback.value = existingDesignFeedback;
    if (pendingDesignApproval) {
      els.designStudioBody.querySelectorAll('.approve-direction-option').forEach(button => {
        button.addEventListener('click', async () => {
          const option = (design.creativeDirections || [])[Number(button.dataset.index || 0)];
          markDirectionButtonWorking(button, 'Starting');
          try {
            await approveDesignOptions(pendingDesignApproval, option);
          } catch (error) {
            state.lastApiError = error.message;
            setReception('Design Approval Issue', 'Design Agent', `${error.message}. The selected option remains available; retry or inspect Workflow diagnostics.`);
            button.disabled = false;
            button.classList.remove('is-working');
            button.innerHTML = '<i data-lucide="check"></i><span>Approve</span>';
            renderDiagnostics(state.lastDiagnostics || {});
            refreshIcons();
          }
        });
      });
      const requestButton = document.getElementById('requestDesignStudioChanges');
      if (requestButton) requestButton.addEventListener('click', () => requestChanges(pendingDesignApproval.id, document.getElementById('designStudioFeedback')?.value || ''));
    }
    els.designStudioBody.querySelectorAll('.select-direction-option').forEach(button => {
      button.addEventListener('click', async () => {
        const option = (design.creativeDirections || [])[Number(button.dataset.index || 0)];
        markDirectionButtonWorking(button, 'Starting');
        try {
          await selectDesignDirection(option);
        } catch (error) {
          state.lastApiError = error.message;
          setReception('Design Recovery Issue', 'Design Agent', `${error.message}. The direction remains selected and can be retried.`);
          button.disabled = false;
          button.classList.remove('is-working');
          button.innerHTML = '<i data-lucide="play"></i><span>Continue</span>';
          renderDiagnostics(state.lastDiagnostics || {});
          refreshIcons();
        }
      });
    });
    const regenerateImageryButton = document.getElementById('regenerateOpenAiImagery');
    if (regenerateImageryButton) {
      regenerateImageryButton.addEventListener('click', async () => {
        state.imageryGenerationQueued = true;
        markDirectionButtonWorking(regenerateImageryButton, 'Queued');
        setReception('Generating Imagery', 'Design Agent', 'OpenAI is creating project-specific website imagery in the background.');
        try {
          const result = await api(`/design/${state.projectId}/imagery`, {
            method: 'POST',
            body: { provider: 'openai', mode: 'standard', count: 5, force: true }
          });
          renderOfficeState(result.officeState);
          startPolling();
        } catch (error) {
          state.imageryGenerationQueued = false;
          state.lastApiError = error.message;
          setReception('Imagery Issue', 'Design Agent', `${error.message}. Check Workflow diagnostics and retry.`);
          regenerateImageryButton.disabled = false;
          regenerateImageryButton.classList.remove('is-working');
          regenerateImageryButton.innerHTML = '<i data-lucide="image-plus"></i><span>Generate with OpenAI</span>';
          renderDiagnostics(state.lastDiagnostics || {});
          refreshIcons();
        }
      });
    }
    refreshIcons();
  }

  function renderDeveloperStudio(developer) {
    if (!els.developerStudioBody) return;
    els.developerPhase.textContent = (developer.phase || 'not_started').replaceAll('_', ' ');
    const plan = developer.plan;
    if (!plan) {
      els.developerStudioBody.innerHTML = '<div class="developer-empty">Waiting for approved design handoff before component and template planning.</div>';
      return;
    }
    els.developerStudioBody.innerHTML = `
      <div class="developer-studio-grid">
        <div class="developer-studio-card">
          <b>UI System</b>
          <span>${plan.designSystemDetected} - ${plan.stylingSystemDetected}</span>
          <small>${plan.componentLibraryDetected.join(', ')}</small>
        </div>
        <div class="developer-studio-card">
          <b>Template</b>
          <span>${plan.templateSelected}</span>
          <small>${plan.templateReason}</small>
        </div>
        <div class="developer-studio-card">
          <b>Reusable Components</b>
          <span>${plan.reusableComponentsFound.join(', ') || 'No client-site components found yet'}</span>
          <small>Create: ${plan.componentsToCreate.join(', ')}</small>
        </div>
        <div class="developer-studio-card">
          <b>Sections</b>
          <span>${plan.sectionsToCreate.join(', ')}</span>
        </div>
        <div class="developer-studio-card">
          <b>Design Tokens</b>
          <span>${plan.designTokensToApply.slice(0, 10).join(', ')}</span>
        </div>
        <div class="developer-studio-card">
          <b>Validation</b>
          <span>${plan.validationCommands.join(', ')}</span>
          <small>${developer.completedTaskCount || 0}/${developer.taskCount || 0} developer tasks complete</small>
        </div>
      </div>
    `;
  }

  function renderCodex(tasks) {
    els.codexPanel.innerHTML = tasks.slice(-3).reverse().map(task => `
      <div class="company-list-item">
        <b>${task.taskTitle}</b><br>
        <span>${task.status} - ${task.branchName}</span>
      </div>
    `).join('') || '<div class="company-list-item">No Codex runs yet</div>';
  }

  function renderGitHub(pullRequests) {
    els.githubPanel.innerHTML = pullRequests.slice(-3).reverse().map(pr => `
      <div class="company-list-item">
        <b>${pr.title}</b><br>
        <span>${pr.status} - <a href="${pr.url}" target="_blank" rel="noreferrer">PR</a></span>
      </div>
    `).join('') || '<div class="company-list-item">No pull requests yet</div>';
  }

  function renderEmail(drafts) {
    els.emailPanel.innerHTML = drafts.slice(-3).reverse().map(draft => `
      <div class="company-list-item">
        <b>${draft.subject}</b><br>
        <span>${draft.status} - ${draft.to.join(', ')}</span>
      </div>
    `).join('') || '<div class="company-list-item">No email drafts yet</div>';
  }

  function renderAudit(activity) {
    els.auditPanel.innerHTML = activity.slice(-4).reverse().map(item => `
      <div class="company-list-item">
        <b>${item.agentId}</b><br>
        <span>${item.title}</span>
      </div>
    `).join('') || '<div class="company-list-item">No audit activity yet</div>';
  }

  async function approvePreview(id) {
    setReception('Preview Approved', 'Delivery Agent', 'Preview approved. Deployment approval is separate and will be requested next.');
    const result = await api(`/approval/${id}/approve`, { method: 'POST' });
    renderOfficeState(result.officeState);
  }

  async function approveDesignOptions(approval, explicitSelection) {
    const checked = document.querySelector('input[name="designOption"]:checked');
    const options = approval.payload && Array.isArray(approval.payload.designOptions) ? approval.payload.designOptions : [];
    const selectedDesignOption = explicitSelection || options[Number(checked ? checked.value : 0)] || options[0];
    setReception('Design Approved', 'Design Agent', 'Design direction approved. The agency is now moving into copy, build, QA, and preview.');
    const result = await api(`/approval/${approval.id}/approve`, {
      method: 'POST',
      body: {
        selectedDesignOption,
        approval,
        projectId: state.projectId,
        project: state.project,
        workflowRunId: state.workflowRunId
      }
    });
    state.workflowRunId = result.workflowRunId || state.workflowRunId;
    renderOfficeState(result.officeState);
    if (state.workflowRunId) startPolling();
  }

  async function selectDesignDirection(direction) {
    if (!direction || !state.projectId) return;
    setReception('Design Production', 'Design Agent', `Continuing design production with ${direction.name}.`);
    const result = await api(`/design/${state.projectId}/select-direction`, {
      method: 'POST',
      body: { directionId: direction.id }
    });
    renderOfficeState(result.officeState);
    startPolling();
  }

  function markDirectionButtonWorking(button, label) {
    button.disabled = true;
    button.classList.add('is-working');
    button.innerHTML = `<i data-lucide="loader-2"></i><span>${label}</span>`;
    refreshIcons();
  }

  async function requestChanges(id, feedbackOverride) {
    const feedback = String(feedbackOverride || document.getElementById('changeFeedback')?.value || '').trim();
    if (!feedback) return;
    setReception('Changes Requested', 'Client Success Agent', 'Feedback received. The agency is converting it into tasks and resuming the build workflow.');
    const result = await api(`/approval/${id}/request-changes`, { method: 'POST', body: { feedback } });
    state.workflowRunId = result.workflowRunId;
    renderOfficeState(result.officeState);
    startPolling();
  }

  async function approveDeployment() {
    setReception('Deployment', 'Delivery Agent', 'Deployment approval received. The deployment tool will run now.');
    const result = await api('/deployment/approve', { method: 'POST', body: { projectId: state.projectId, target: 'netlify' } });
    renderOfficeState(result.officeState);
  }

  function renderResume(officeState) {
    els.resumeOverlay.classList.toggle('hidden', !officeState.resumeRequired);
    els.resumeIssue.textContent = officeState.workflow && officeState.workflow.error ? officeState.workflow.error : 'Workflow state is recoverable.';
  }

  els.resumeWorkflow.addEventListener('click', async () => {
    const result = await api('/workflow/resume', { method: 'POST', body: { workflowRunId: state.workflowRunId } });
    renderOfficeState(result.officeState);
    startPolling();
  });

  startIntake();
})();
