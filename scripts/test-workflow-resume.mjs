import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { EventBus } from '../dist/agency/events/eventBus.js';
import { MemoryStore } from '../dist/agency/memory/memoryStore.js';
import { ResumeService } from '../dist/agency/runtime/resumeService.js';
import { WorkflowRuntime } from '../dist/agency/runtime/workflowRuntime.js';

const tempDir = await mkdtemp(path.join(os.tmpdir(), 'agency-resume-test-'));
try {
  const store = new MemoryStore(path.join(tempDir, 'store.json'));
  const runtime = new WorkflowRuntime(store, new EventBus());
  const resumeService = new ResumeService(runtime);
  const run = await runtime.create('websiteBuildWorkflow', { projectId: 'project-resume-test' }, 'project-resume-test');
  await runtime.patch(run.id, {
    status: 'running',
    currentStep: 'brand_guidelines',
    state: {
      lastCheckpoint: 'brand_guidelines',
      executionLeaseOwner: 'stale-worker',
      executionLeaseUntil: new Date(Date.now() + 60_000).toISOString()
    }
  });
  await runtime.patch(run.id, {
    status: 'failed',
    currentStep: 'failed',
    error: 'Simulated serverless write failure'
  });
  await resumeService.resume(run.id);
  const resumed = await runtime.get(run.id);
  assert.equal(resumed?.status, 'running');
  assert.equal(resumed?.currentStep, 'brand_guidelines');
  assert.equal(resumed?.state.lastResumeCheckpoint, 'brand_guidelines');
  assert.equal(resumed?.state.lastResumeFromStep, 'failed');
  assert.equal(resumed?.state.resumeCount, 1);
  assert.equal(resumed?.state.executionLeaseOwner, undefined);
  assert.equal(resumed?.error, undefined);
  console.log('Workflow resume checkpoint regression: passed');
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
