import type { ApprovalRequest } from '../schemas/approval.schema.js';
import type { Artifact } from '../schemas/artifact.schema.js';
import type { Project } from '../schemas/project.schema.js';
import type { WorkflowRun } from '../schemas/workflow.schema.js';
import { workflowPhaseForStep, workflowPhaseRank, type WorkflowPhase } from '../runtime/workflowStage.js';

export const timelineSteps = [
  'Intake',
  'Brief',
  'Planning',
  'Design Discovery',
  'Design Options',
  'Design Production',
  'Copy',
  'Build',
  'QA',
  'Preview',
  'Approval',
  'Deployment'
] as const;

export interface ProjectTimelineContext {
  workflow?: WorkflowRun;
  approvals?: ApprovalRequest[];
  hasSelectedDirection?: boolean;
  hasDesignHandoff?: boolean;
}

export function buildProjectTimeline(project?: Project, artifacts: Artifact[] = [], context: ProjectTimelineContext = {}) {
  return timelineSteps.map(step => ({
    step,
    status: inferStepStatus(step, project, artifacts, context)
  }));
}

function inferStepStatus(
  step: typeof timelineSteps[number],
  project: Project | undefined,
  artifacts: Artifact[],
  context: ProjectTimelineContext
) {
  if (!project) return 'pending';
  const artifactTypes = new Set(artifacts.map(item => item.type));
  const phase = phaseFromContext(project, context.workflow);
  const phaseRank = workflowPhaseRank(phase);
  const passed = (target: WorkflowPhase) => phaseRank > workflowPhaseRank(target);
  const active = (target: WorkflowPhase) => phase === target;
  const designApproved = Boolean(
    context.hasSelectedDirection ||
    context.hasDesignHandoff ||
    context.workflow?.state?.designOptionsApproved ||
    context.approvals?.some(item => item.type === 'design_options' && item.status === 'approved')
  );
  const designOptionsCreated = artifactTypes.has('design_options');
  const previewApproval = context.approvals?.some(item => item.type === 'preview' && item.status === 'pending');

  if (step === 'Intake') return 'completed';
  if (step === 'Brief') return project.structuredBrief ? 'completed' : 'active';
  if (step === 'Planning') return artifactTypes.has('plan') || passed('planning') ? 'completed' : active('planning') ? 'active' : 'pending';
  if (step === 'Design Discovery') return designOptionsCreated || passed('design_discovery') ? 'completed' : active('design_discovery') ? 'active' : 'pending';
  if (step === 'Design Options') return designApproved || passed('design_approval') ? 'completed' : designOptionsCreated || active('design_approval') ? 'active' : 'pending';
  if (step === 'Design Production') return context.hasDesignHandoff || passed('design_production') ? 'completed' : designApproved || active('design_production') ? 'active' : 'pending';
  if (step === 'Copy') return artifactTypes.has('copy') || passed('copy') ? 'completed' : active('copy') ? 'active' : 'pending';
  if (step === 'Build') return artifactTypes.has('code') || passed('build') ? 'completed' : active('build') ? 'active' : 'pending';
  if (step === 'QA') return artifactTypes.has('qa_report') && (passed('qa') || project.previewUrl) ? 'completed' : active('qa') ? 'active' : artifactTypes.has('qa_report') ? 'completed' : 'pending';
  if (step === 'Preview') return project.previewUrl || passed('preview') ? 'completed' : active('preview') ? 'active' : 'pending';
  if (step === 'Approval') return project.status === 'deployment_pending' || project.status === 'completed' ? 'completed' : previewApproval || active('preview_approval') || project.status === 'awaiting_approval' && Boolean(project.previewUrl) ? 'active' : 'pending';
  if (step === 'Deployment') return project.liveUrl ? 'completed' : active('deployment') || project.status === 'deployment_pending' ? 'active' : 'pending';
  return 'pending';
}

function phaseFromContext(project: Project, workflow?: WorkflowRun): WorkflowPhase {
  if (workflow) return workflowPhaseForStep(workflow.currentStep);
  if (project.liveUrl || project.status === 'completed') return 'completed';
  if (project.status === 'deployment_pending') return 'deployment';
  if (project.previewUrl && project.status === 'awaiting_approval') return 'preview_approval';
  if (project.status === 'preview') return 'preview';
  if (project.status === 'qa') return 'qa';
  if (project.status === 'build') return 'build';
  if (project.status === 'copy') return 'copy';
  if (project.status === 'design') return 'design_discovery';
  return 'planning';
}
