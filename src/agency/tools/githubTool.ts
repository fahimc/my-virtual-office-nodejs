import type { ToolDefinition } from './toolRegistry.js';

export const githubTool: ToolDefinition<{ message: string }, { committed: boolean; note: string }> = {
  name: 'github.commit',
  description: 'Commit generated project output to GitHub. Stubbed until GitHub credentials are configured.',
  inputSchema: '{ message: string }',
  outputSchema: '{ committed: boolean, note: string }',
  permissionLevel: 'external',
  approvalRequired: false,
  async execute(input) {
    return { committed: false, note: `GitHub commit stub: ${input.message}` };
  }
};
