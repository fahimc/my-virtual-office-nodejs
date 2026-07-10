export class QaWorkflow {
  summarizeQaResult(input: { passed: boolean; issues: string[] }) {
    return input.passed ? 'QA passed' : `QA failed: ${input.issues.join('; ')}`;
  }
}
