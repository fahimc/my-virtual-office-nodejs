import type { DesignWorkflow } from './designWorkflow.js';

export class PostBuildDesignQaWorkflow {
  constructor(private readonly designWorkflow: DesignWorkflow) {}

  review(projectId: string, previewUrl?: string) {
    return this.designWorkflow.postBuildReview(projectId, previewUrl);
  }
}
