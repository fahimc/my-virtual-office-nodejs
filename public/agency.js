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
    codexPanel: document.getElementById('codexPanel'),
    githubPanel: document.getElementById('githubPanel'),
    emailPanel: document.getElementById('emailPanel'),
    auditPanel: document.getElementById('auditPanel'),
    resumeOverlay: document.getElementById('resumeOverlay'),
    resumeIssue: document.getElementById('resumeIssue'),
    resumeWorkflow: document.getElementById('resumeWorkflow')
  };

  const state = {
    mode: 'new',
    email: '',
    customerId: '',
    projectId: '',
    workflowRunId: '',
    pollTimer: null
  };

  async function api(path, options = {}) {
    const response = await fetch(`/api/agency${path}`, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Request failed: ${response.status}`);
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
      const result = await api('/brief/submit', {
        method: 'POST',
        body: {
          customerId: state.customerId,
          workflowRunId: state.workflowRunId,
          originalBrief: els.brief.value.trim()
        }
      });
      state.workflowRunId = result.workflowRunId;
      els.structuredEditor.value = JSON.stringify(result.structuredBrief, null, 2);
      els.structuredPanel.classList.remove('hidden');
      setReception('Brief Approval', 'Briefing Agent', 'Review, edit if needed, then approve the structured brief. The agency will work in the background after approval.');
    } catch (error) {
      setReception('Brief issue', 'Briefing Agent', error.message);
      els.briefForm.classList.remove('hidden');
    }
  });

  els.approveBrief.addEventListener('click', async () => {
    hideInputs();
    setReception('Agency Working', 'Project Team', 'Brief approved. Agents are now working through planning, design, copy, build, QA, and preview.');
    try {
      const structuredBrief = JSON.parse(els.structuredEditor.value);
      const result = await api('/brief/approve', { method: 'POST', body: { workflowRunId: state.workflowRunId, structuredBrief } });
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
      const result = await api(`/workflow/${state.workflowRunId}/status`);
      renderOfficeState(result.officeState);
      if (result.workflow.status === 'completed') clearInterval(state.pollTimer);
    } catch (error) {
      els.projectStatus.textContent = error.message;
    }
  }

  function renderOfficeState(officeState) {
    if (!officeState) return;
    const project = officeState.project;
    if (project) {
      state.projectId = project.id;
      state.workflowRunId = project.currentWorkflowRunId || state.workflowRunId;
      els.projectStatus.textContent = `${project.status.replaceAll('_', ' ')} - ${project.title}`;
    }
    renderTimeline(officeState.timeline || []);
    renderAgents(officeState.agents || []);
    renderActivity(officeState.activity || []);
    renderArtifacts(officeState.artifacts || []);
    renderApproval(officeState.approvals || []);
    renderCompany(officeState);
    renderResume(officeState);
  }

  function renderTimeline(timeline) {
    els.timeline.innerHTML = timeline.map(item => `<li class="${item.status === 'completed' ? 'done' : item.status === 'active' ? 'active' : ''}">${item.step}</li>`).join('');
  }

  function renderAgents(agents) {
    els.agents.innerHTML = agents.map(agent => `
      <div>
        <b>${agent.name || agent.agentId}</b>
        <span>${agent.role || agent.status}: ${agent.summary || ''}</span>
      </div>
    `).join('');
  }

  function renderActivity(activity) {
    els.activity.innerHTML = activity.slice(-8).reverse().map(item => `
      <li>
        <b>${item.title}</b>
        <span>${item.agentId} - ${item.status}</span>
      </li>
    `).join('');
  }

  function renderArtifacts(artifacts) {
    els.artifacts.innerHTML = artifacts.slice(-6).reverse().map(item => `
      <div>
        <b>${item.title}</b>
        <span>${item.type}${item.url ? ` - <a href="${item.url}" target="_blank" rel="noreferrer">Preview</a>` : ''}</span>
      </div>
    `).join('');
  }

  function renderApproval(approvals) {
    const pending = approvals.find(item => item.status === 'pending');
    els.approval.classList.toggle('hidden', !pending);
    if (!pending) {
      els.approval.innerHTML = '';
      return;
    }
    if (pending.type === 'deployment') {
      els.approval.innerHTML = `
        <h4>${pending.title}</h4>
        <p>${pending.description}</p>
        <button id="approveDeployment" type="button"><i data-lucide="rocket"></i><span>Approve live deployment</span></button>
      `;
      document.getElementById('approveDeployment').addEventListener('click', approveDeployment);
    } else if (pending.type === 'design_options') {
      const options = pending.payload && Array.isArray(pending.payload.designOptions) ? pending.payload.designOptions : [];
      els.approval.innerHTML = `
        <h4>${pending.title}</h4>
        <p>${pending.description}</p>
        <div class="design-option-list">
          ${options.map((option, index) => `
            <label class="design-option-card">
              <input type="radio" name="designOption" value="${index}" ${index === 0 ? 'checked' : ''}>
              <b>${option.name}</b>
              <span>${option.summary}</span>
              <small>${option.bestFor || ''}</small>
            </label>
          `).join('')}
        </div>
        <textarea id="changeFeedback" placeholder="What should change about these directions?"></textarea>
        <div class="agency-actions">
          <button id="approveDesignOptions" type="button"><i data-lucide="check"></i><span>Approve direction</span></button>
          <button id="requestChanges" type="button"><i data-lucide="message-square"></i><span>Request changes</span></button>
        </div>
      `;
      document.getElementById('approveDesignOptions').addEventListener('click', () => approveDesignOptions(pending));
      document.getElementById('requestChanges').addEventListener('click', () => requestChanges(pending.id));
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
    const company = officeState.company || {};
    renderCodex(company.codexTasks || []);
    renderGitHub(company.githubPullRequests || []);
    renderEmail(company.emailDrafts || []);
    renderAudit(officeState.activity || []);
  }

  function renderTaskBoard(columns) {
    els.taskBoard.innerHTML = columns.filter(column => column.tasks.length || ['ready', 'in_progress', 'review', 'done', 'failed'].includes(column.status)).map(column => `
      <section class="task-column">
        <h5>${column.status.replaceAll('_', ' ')}</h5>
        ${column.tasks.slice(0, 4).map(task => `
          <div class="task-card" title="${task.description || ''}">
            <b>${task.title}</b>
            <small>${task.type} - ${task.assignedAgentId || 'unassigned'} ${task.approvalRequired ? '<span class="approval-badge">approval</span>' : ''}</small>
          </div>
        `).join('')}
      </section>
    `).join('');
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

  async function approveDesignOptions(approval) {
    const checked = document.querySelector('input[name="designOption"]:checked');
    const options = approval.payload && Array.isArray(approval.payload.designOptions) ? approval.payload.designOptions : [];
    const selectedDesignOption = options[Number(checked ? checked.value : 0)] || options[0];
    setReception('Design Approved', 'Design Agent', 'Design direction approved. The agency is now moving into copy, build, QA, and preview.');
    const result = await api(`/approval/${approval.id}/approve`, { method: 'POST', body: { selectedDesignOption } });
    renderOfficeState(result.officeState);
    if (state.workflowRunId) startPolling();
  }

  async function requestChanges(id) {
    const feedback = document.getElementById('changeFeedback').value.trim();
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
