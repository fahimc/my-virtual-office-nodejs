import type { ToolDefinition } from '../toolTypes.js';

export function designTool<TInput, TOutput>(
  name: string,
  description: string,
  execute: (input: TInput) => Promise<TOutput> | TOutput
): ToolDefinition<TInput, TOutput> {
  return {
    name,
    description,
    inputSchema: 'typed design input',
    outputSchema: 'typed design output',
    permissionLevel: 'write',
    approvalRequired: false,
    async execute(input) {
      return execute(input);
    }
  };
}
