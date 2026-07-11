import type { TaskBoardService } from '../tools/taskboard/taskBoardService.js';
import type { AnyCompanyTaskType } from '../tools/taskboard/taskBoardTypes.js';
import type { VisualFeedback } from '../schemas/visualFeedback.schema.js';

export class FeedbackTaskConverter {
  constructor(private readonly taskBoard: TaskBoardService) {}

  async convert(feedback: VisualFeedback) {
    const type = taskTypeForFeedback(feedback);
    const assignedAgentId = agentForTask(type);
    return this.taskBoard.createTask({
      projectId: feedback.projectId,
      title: `Customer feedback: ${feedback.type.replaceAll('_', ' ')}`,
      description: feedback.comment,
      type,
      priority: feedback.type === 'bug' || feedback.type === 'mobile_issue' ? 'high' : 'normal',
      assignedAgentId,
      createdByAgentId: 'client-success',
      sourceEventId: feedback.id,
      input: {
        feedbackId: feedback.id,
        previewVersionId: feedback.previewVersionId,
        pageUrl: feedback.pageUrl,
        viewport: feedback.viewport,
        clickPosition: feedback.clickPosition,
        domSelector: feedback.domSelector,
        customerStatus: 'Feedback received'
      }
    });
  }
}

function taskTypeForFeedback(feedback: VisualFeedback): AnyCompanyTaskType {
  switch (feedback.type) {
    case 'design_change':
    case 'layout_issue':
      return 'design_fix';
    case 'copy_change':
      return 'copy_fix';
    case 'bug':
      return 'bug_fix';
    case 'mobile_issue':
      return 'responsive_fix';
    case 'content_missing':
      return 'content_task';
    case 'image_change':
      return 'asset_task';
    default:
      return 'support';
  }
}

function agentForTask(type: AnyCompanyTaskType): string {
  if (type === 'design_fix') return 'design';
  if (type === 'copy_fix' || type === 'content_task') return 'copy';
  if (type === 'asset_task') return 'design';
  if (type === 'bug_fix' || type === 'responsive_fix' || type === 'frontend_fix') return 'builder';
  return 'client-success';
}
