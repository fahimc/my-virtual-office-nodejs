import type { TaskBoardService } from '../tools/taskboard/taskBoardService.js';
import type { VisualFeedback, VisualFeedbackType } from '../schemas/visualFeedback.schema.js';
import { FeedbackStore } from './feedbackStore.js';
import { FeedbackTaskConverter } from './feedbackTaskConverter.js';

export class VisualFeedbackTool {
  private readonly converter: FeedbackTaskConverter;

  constructor(
    private readonly feedbackStore: FeedbackStore,
    taskBoard: TaskBoardService
  ) {
    this.converter = new FeedbackTaskConverter(taskBoard);
  }

  async createAndConvert(input: {
    projectId: string;
    previewVersionId: string;
    customerId: string;
    pageUrl: string;
    viewport: { width: number; height: number };
    clickPosition: { x: number; y: number };
    domSelector?: string;
    screenshotUrl?: string;
    comment: string;
    type: VisualFeedbackType;
  }): Promise<VisualFeedback> {
    const feedback = await this.feedbackStore.create(input);
    const task = await this.converter.convert(feedback);
    return this.feedbackStore.update(feedback.id, {
      status: 'converted_to_task',
      linkedTaskId: task.id,
      assignedAgentId: task.assignedAgentId
    });
  }
}
