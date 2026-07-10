export class DesignApprovalWorkflow {
  summarizeDecision(input: { selectedDirectionId: string; feedback?: string }) {
    return {
      approved: Boolean(input.selectedDirectionId),
      summary: input.feedback || `Creative direction ${input.selectedDirectionId} approved.`
    };
  }
}
