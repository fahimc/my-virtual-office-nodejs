import type { ProjectStatus } from '../schemas/project.schema.js';

export type WorkflowPhase =
  | 'intake'
  | 'brief'
  | 'planning'
  | 'design_discovery'
  | 'design_approval'
  | 'design_production'
  | 'copy'
  | 'build'
  | 'qa'
  | 'preview'
  | 'preview_approval'
  | 'deployment'
  | 'completed'
  | 'failed';

export interface WorkflowTraceEntry {
  step: string;
  status: string;
  at: string;
}

const phaseOrder: WorkflowPhase[] = [
  'intake',
  'brief',
  'planning',
  'design_discovery',
  'design_approval',
  'design_production',
  'copy',
  'build',
  'qa',
  'preview',
  'preview_approval',
  'deployment',
  'completed'
];

export function workflowPhaseForStep(step?: string): WorkflowPhase {
  const value = String(step || '').toLowerCase();
  if (value === 'failed') return 'failed';
  if (value.includes('deployment_completed') || value === 'completed') return 'completed';
  if (value.includes('deployment')) return 'deployment';
  if (value === 'preview_approval' || value === 'approval_approved') return 'preview_approval';
  if (value === 'preview') return 'preview';
  if (/^qa_attempt_\d+$/.test(value) || value.startsWith('qa_')) return 'qa';
  if (/^build_attempt_\d+$/.test(value) || value.startsWith('build_')) return 'build';
  if (value === 'copy') return 'copy';
  if (
    value === 'design_options_approved' ||
    value === 'design_production' ||
    value === 'design_handoff_ready' ||
    ['direction_selected', 'sitemap', 'wireframes', 'tokens', 'component_spec', 'prototype', 'mobile_rules', 'imagery_generation', 'design_qa', 'brand_guidelines', 'handoff'].includes(value)
  ) return 'design_production';
  if (value === 'design_options_approval' || value === 'design_approval') return 'design_approval';
  if (value.startsWith('design_') || value === 'brand_audit' || value === 'competitor_research' || value === 'creative_directions') return 'design_discovery';
  if (value === 'planning' || value === 'created') return 'planning';
  if (value.startsWith('brief')) return 'brief';
  return 'intake';
}

export function workflowPhaseRank(phase: WorkflowPhase): number {
  if (phase === 'failed') return -1;
  return phaseOrder.indexOf(phase);
}

export function stepIsBefore(currentStep: string | undefined, targetStep: string): boolean {
  return workflowPhaseRank(workflowPhaseForStep(currentStep)) < workflowPhaseRank(workflowPhaseForStep(targetStep));
}

export function projectStatusRank(status?: ProjectStatus): number {
  const ranks: Partial<Record<ProjectStatus, number>> = {
    intake: 0,
    briefing: 1,
    planning: 2,
    design: 3,
    copy: 6,
    build: 7,
    qa: 8,
    preview: 9,
    deployment_pending: 11,
    completed: 12
  };
  return status ? ranks[status] ?? -1 : -1;
}

export function appendWorkflowTrace(
  state: Record<string, unknown>,
  entry: WorkflowTraceEntry,
  limit = 24
): WorkflowTraceEntry[] {
  const existing = Array.isArray(state.debugTrace)
    ? state.debugTrace.filter(isWorkflowTraceEntry)
    : [];
  const last = existing.at(-1);
  if (last?.step === entry.step && last.status === entry.status) return existing.slice(-limit);
  return [...existing, entry].slice(-limit);
}

function isWorkflowTraceEntry(value: unknown): value is WorkflowTraceEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Partial<WorkflowTraceEntry>;
  return typeof entry.step === 'string' && typeof entry.status === 'string' && typeof entry.at === 'string';
}
