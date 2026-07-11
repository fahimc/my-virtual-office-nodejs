import type { Project } from '../schemas/project.schema.js';
import type { CustomerUpdateType } from '../schemas/customerUpdate.schema.js';

export interface CustomerUpdateDraft {
  title: string;
  message: string;
  type: CustomerUpdateType;
}

export function customerUpdateForProjectStatus(project: Project): CustomerUpdateDraft {
  if (project.liveUrl) {
    return {
      title: 'Your website is live',
      message: 'Launch is complete. Your live website URL is now available in the portal.',
      type: 'launched'
    };
  }
  if (project.status === 'awaiting_approval' || project.previewUrl) {
    return {
      title: 'Preview ready for review',
      message: 'A preview version is ready. Please review it in the portal and approve it or leave visual feedback.',
      type: 'preview_ready'
    };
  }
  if (project.status === 'design') {
    return {
      title: 'Design direction is being prepared',
      message: 'The design team is turning the approved brief into a clear visual direction for your review.',
      type: 'progress'
    };
  }
  return {
    title: 'Project is moving forward',
    message: 'The agency team is progressing your project and will only ask for input when a decision is needed.',
    type: 'progress'
  };
}

export function formatInternalEvent(eventName: string): CustomerUpdateDraft {
  if (eventName.includes('design') && eventName.includes('published')) {
    return {
      title: 'Design direction ready',
      message: 'Your design direction is ready to review, including colour, typography, layout style, and rationale.',
      type: 'design_ready'
    };
  }
  if (eventName.includes('preview')) {
    return {
      title: 'Preview version ready',
      message: 'A website preview has been prepared and checked before sharing it with you.',
      type: 'preview_ready'
    };
  }
  if (eventName.includes('approval')) {
    return {
      title: 'Approval needed',
      message: 'A decision is needed before the project can move to the next stage.',
      type: 'approval_needed'
    };
  }
  return {
    title: 'Project update',
    message: 'The project has moved forward. The portal has the latest status and next action.',
    type: 'progress'
  };
}
