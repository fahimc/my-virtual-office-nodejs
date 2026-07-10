import type { Artifact } from '../schemas/artifact.schema.js';
import type { Project } from '../schemas/project.schema.js';

export const timelineSteps = ['Intake', 'Brief', 'Planning', 'Design', 'Copy', 'Build', 'QA', 'Preview', 'Approval', 'Deployment'];

export function buildProjectTimeline(project?: Project, artifacts: Artifact[] = []) {
  return timelineSteps.map(step => ({
    step,
    status: inferStepStatus(step, project, artifacts)
  }));
}

function inferStepStatus(step: string, project?: Project, artifacts: Artifact[] = []) {
  if (!project) return 'pending';
  const artifactTypes = new Set(artifacts.map(item => item.type));
  if (step === 'Intake') return 'completed';
  if (step === 'Brief') return project.structuredBrief ? 'completed' : 'active';
  if (step === 'Planning') return artifactTypes.has('plan') ? 'completed' : project.status === 'planning' ? 'active' : 'pending';
  if (step === 'Design') return artifactTypes.has('design') ? 'completed' : project.status === 'design' ? 'active' : 'pending';
  if (step === 'Copy') return artifactTypes.has('copy') ? 'completed' : project.status === 'copy' ? 'active' : 'pending';
  if (step === 'Build') return artifactTypes.has('code') ? 'completed' : project.status === 'build' ? 'active' : 'pending';
  if (step === 'QA') return artifactTypes.has('qa_report') ? 'completed' : project.status === 'qa' ? 'active' : 'pending';
  if (step === 'Preview') return project.previewUrl ? 'completed' : project.status === 'preview' ? 'active' : 'pending';
  if (step === 'Approval') return project.status === 'awaiting_approval' ? 'active' : project.status === 'deployment_pending' || project.status === 'completed' ? 'completed' : 'pending';
  if (step === 'Deployment') return project.liveUrl ? 'completed' : project.status === 'deployment_pending' ? 'active' : 'pending';
  return 'pending';
}
