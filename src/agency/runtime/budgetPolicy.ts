export class BudgetPolicy {
  assertWithinBudget(input: { estimatedCostUsd?: number; projectId?: string }): void {
    const max = Number(process.env.AGENCY_MAX_TOOL_COST_USD || 0);
    if (max > 0 && input.estimatedCostUsd && input.estimatedCostUsd > max) {
      throw new Error(`Estimated cost ${input.estimatedCostUsd} exceeds configured budget for ${input.projectId || 'project'}`);
    }
  }
}
