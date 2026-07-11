import type { AgencyStoreData } from '../memory/memoryStore.js';
import type { Project } from '../schemas/project.schema.js';
import type { ClientPortalProjectSummary, CustomerTimelineItem, CustomerTimelineStage } from '../schemas/clientPortal.schema.js';

export function buildCustomerTimeline(project: Project, hasDesign: boolean, hasPreview: boolean, pendingApproval: boolean): CustomerTimelineItem[] {
  const current = currentStage(project, hasDesign, hasPreview, pendingApproval);
  const labels: CustomerTimelineStage[] = ['Brief received', 'Design direction', 'Website build', 'Internal review', 'Preview ready', 'Changes', 'Final approval', 'Launch'];
  const currentIndex = labels.indexOf(current);
  return labels.map((label, index) => ({
    label,
    status: index < currentIndex ? 'complete' : index === currentIndex ? 'current' : 'upcoming',
    description: descriptionFor(label)
  }));
}

export function buildProjectSummary(data: AgencyStoreData, project: Project): ClientPortalProjectSummary {
  const hasDesign = data.design.selectedDirections.some(item => item.projectId === project.id);
  const hasPreview = Boolean(project.previewUrl || data.previewVersions.some(item => item.projectId === project.id));
  const pendingApproval = data.clientApprovals.some(item => item.projectId === project.id && item.status === 'pending') || data.approvals.some(item => item.projectId === project.id && item.status === 'pending');
  const current = currentStage(project, hasDesign, hasPreview, pendingApproval);
  return {
    projectId: project.id,
    customerId: project.customerId,
    title: project.title,
    currentStage: current,
    nextAction: pendingApproval ? 'Review pending approval' : hasPreview ? 'Review preview or leave feedback' : 'No customer action needed right now',
    previewStatus: hasPreview ? 'Preview available' : 'Not ready yet',
    designStatus: hasDesign ? 'Design direction available' : 'Design in progress',
    approvalStatus: pendingApproval ? 'Action needed' : 'No pending approvals',
    updatedAt: project.updatedAt
  };
}

function currentStage(project: Project, hasDesign: boolean, hasPreview: boolean, pendingApproval: boolean): CustomerTimelineStage {
  if (project.liveUrl || project.status === 'completed') return 'Launch';
  if (pendingApproval && hasPreview) return 'Final approval';
  if (hasPreview) return 'Preview ready';
  if (['build', 'qa', 'copy'].includes(project.status)) return 'Website build';
  if (hasDesign) return 'Design direction';
  return 'Brief received';
}

function descriptionFor(label: CustomerTimelineStage): string {
  switch (label) {
    case 'Brief received': return 'The agency has your brief and project context.';
    case 'Design direction': return 'Visual direction, colours, typography, and layout approach.';
    case 'Website build': return 'The approved direction is being turned into the website.';
    case 'Internal review': return 'QA and design checks before the preview is shared.';
    case 'Preview ready': return 'A customer preview is ready for review.';
    case 'Changes': return 'Requested changes are converted into internal tasks.';
    case 'Final approval': return 'Final preview or launch approval is needed.';
    case 'Launch': return 'The approved website is published live.';
  }
}
