import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { MemoryStore } from '../dist/agency/memory/memoryStore.js';
import { buildOfficeState } from '../dist/agency/ui-state/officeState.js';

const tempDir = await mkdtemp(path.join(os.tmpdir(), 'agency-office-state-test-'));
const timestamp = new Date().toISOString();
const brief = {
  businessSummary: 'A current project',
  targetAudience: 'customers',
  pagesNeeded: ['Home'],
  featuresNeeded: [],
  stylePreferences: [],
  contentRequirements: [],
  assetsRequired: [],
  technicalRequirements: [],
  assumptions: [],
  missingInformation: [],
  estimatedComplexity: 'medium'
};

try {
  const store = new MemoryStore(path.join(tempDir, 'store.json'));
  await store.update(data => {
    data.projects.push(
      {
        id: 'project-old', customerId: 'customer-old', status: 'completed', title: 'Old project', originalBrief: 'Old',
        structuredBrief: brief, currentWorkflowRunId: 'workflow-old', previewUrl: '/previews/project-old/', liveUrl: '/live/project-old/', createdAt: timestamp, updatedAt: timestamp
      },
      {
        id: 'project-current', customerId: 'customer-current', status: 'design', title: 'Current project', originalBrief: 'Current',
        structuredBrief: brief, currentWorkflowRunId: 'workflow-current', createdAt: timestamp, updatedAt: timestamp
      }
    );
    data.workflows.push(
      { id: 'workflow-old', projectId: 'project-old', workflowName: 'websiteBuildWorkflow', status: 'completed', currentStep: 'deployment_completed', state: {}, createdAt: timestamp, updatedAt: timestamp },
      { id: 'workflow-current', projectId: 'project-current', workflowName: 'websiteBuildWorkflow', status: 'running', currentStep: 'imagery_generation', state: {}, createdAt: timestamp, updatedAt: timestamp }
    );
    data.tasks.push(
      { id: 'task-old', projectId: 'project-old', agentId: 'delivery', title: 'Preview build', description: 'Old task', status: 'completed', input: {}, createdAt: timestamp, updatedAt: timestamp },
      { id: 'task-current', projectId: 'project-current', agentId: 'design', title: 'Design direction', description: 'Current task', status: 'completed', input: {}, createdAt: timestamp, updatedAt: timestamp }
    );
    data.design.selectedDirections.push({
      projectId: 'project-current', selectedDirectionId: 'direction-current', reasonSelected: 'Approved', rejectedDirectionIds: [], decisionMode: 'approval', approvedByUser: true, createdAt: timestamp
    });
    data.generatedImages.push(
      { id: 'image-1', projectId: 'project-current', title: 'Homepage hero image', intendedUse: 'final_homepage_hero', tier: 'standard', model: 'gpt-image-1-mini', quality: 'medium', prompt: 'hero', size: '1536x1024', status: 'generated', provider: 'openai', estimatedCostUsd: 0.01, notes: [], createdAt: timestamp, updatedAt: timestamp },
      { id: 'image-2', projectId: 'project-current', title: 'Services section image', intendedUse: 'service_illustration', tier: 'standard', model: 'gpt-image-1-mini', quality: 'medium', prompt: 'services', size: '1024x1024', status: 'generated', provider: 'openai', estimatedCostUsd: 0.01, notes: [], createdAt: timestamp, updatedAt: timestamp },
      { id: 'image-3', projectId: 'project-current', title: 'About page image', intendedUse: 'about_page_image', tier: 'standard', model: 'gpt-image-1-mini', quality: 'medium', prompt: 'about', size: '1024x1024', status: 'planned', provider: 'openai', estimatedCostUsd: 0.01, notes: [], generationLeaseUntil: new Date(Date.now() + 60_000).toISOString(), createdAt: timestamp, updatedAt: timestamp }
    );
  });

  const state = await buildOfficeState(store, { getPresence: () => [] }, 'project-current');
  assert.equal(state.activity.some(item => item.title === 'Preview build'), false, 'activity from another project must not leak into the current project');
  assert.equal(state.activity.some(item => item.title === 'Design direction'), true);
  assert.equal(state.activity.at(-1)?.title, 'Generating website imagery (2/5 ready)');
  assert.equal(state.activity.at(-1)?.status, 'in progress');
  assert.equal(state.designStudio.phase, 'generating_imagery');
  assert.equal(state.diagnostics.phase, 'design_production');
  console.log('Project-scoped office activity regression: passed');
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
