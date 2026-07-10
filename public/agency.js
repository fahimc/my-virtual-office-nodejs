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
    resumeWorkflow: document.getElementById('resumeWorkflow')
  };

  const state = {
    mode: 'new',
    email: '',
    customerId: '',
    projectId: '',
    workflowRunId: '',
    renderedApprovalKey: '',
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
      if (state.projectId) {
        try {
          const result = await api(`/project/${state.projectId}`);
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
    if (!artifacts.length) {
      els.artifacts.innerHTML = '';
      return;
    }
    const recent = artifacts.slice(-12).reverse();
    els.artifacts.innerHTML = `
      <details class="resources-panel">
        <summary>
          <span><b>Resources</b><small>${artifacts.length} saved artifacts</small></span>
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

  function renderApproval(approvals) {
    const pending = approvals.find(item => item.status === 'pending');
    els.approval.classList.toggle('hidden', !pending);
    if (!pending) {
      state.renderedApprovalKey = '';
      els.approval.innerHTML = '';
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
    renderDesignStudio(officeState.designStudio || {});
    renderDeveloperStudio(officeState.developerStudio || {});
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

  function renderDesignStudio(design) {
    els.designPhase.textContent = (design.phase || 'not_started').replaceAll('_', ' ');
    const selected = design.selectedDirection;
    const direction = (design.creativeDirections || []).find(item => selected && item.id === selected.selectedDirectionId) || (design.creativeDirections || [])[0];
    const pendingDesignApproval = (design.approvals || [])[0];
    const designArtifacts = design.artifacts || [];
    const tokenColors = design.tokens && design.tokens.colours ? Object.values(design.tokens.colours).slice(0, 8) : [];
    const existingDesignFeedback = document.getElementById('designStudioFeedback')?.value || '';
    els.designStudioBody.innerHTML = `
      ${pendingDesignApproval && (design.creativeDirections || []).length ? `
        <section class="design-review-panel">
          <div class="agency-panel-heading">
            <h4>Creative Directions To Review</h4>
            <span>${(design.creativeDirections || []).length} options</span>
          </div>
          <div class="creative-direction-review-list">
            ${(design.creativeDirections || []).map((option, index) => `
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
        <div class="design-studio-card">
          <b>Design QA</b>
          <span>${design.qaReport ? (design.qaReport.passed ? 'Passed' : 'Needs fixes') : 'Not reviewed yet'}</span>
        </div>
        <div class="design-studio-card">
          <b>Builder Handoff</b>
          <span>${design.handoff ? design.handoff.handoffSummary : 'Not handed off yet'}</span>
        </div>
        <div class="design-studio-card design-studio-card-wide">
          <details class="resources-panel compact">
            <summary>
              <span><b>Design Resources</b><small>${design.artifactCount || 0} saved artifacts</small></span>
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
        button.addEventListener('click', () => {
          const option = (design.creativeDirections || [])[Number(button.dataset.index || 0)];
          approveDesignOptions(pendingDesignApproval, option);
        });
      });
      const requestButton = document.getElementById('requestDesignStudioChanges');
      if (requestButton) requestButton.addEventListener('click', () => requestChanges(pendingDesignApproval.id, document.getElementById('designStudioFeedback')?.value || ''));
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
    const result = await api(`/approval/${approval.id}/approve`, { method: 'POST', body: { selectedDesignOption } });
    renderOfficeState(result.officeState);
    if (state.workflowRunId) startPolling();
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
