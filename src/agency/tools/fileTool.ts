import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { ToolDefinition } from './toolRegistry.js';

export function createFileTool(workspaceRoot: string): ToolDefinition<{ path: string; content: string }, { path: string; bytes: number }> {
  return {
    name: 'file.write',
    description: 'Create or update project files inside the configured workspace.',
    inputSchema: '{ path: string, content: string }',
    outputSchema: '{ path: string, bytes: number }',
    permissionLevel: 'write',
    approvalRequired: false,
    async execute(input) {
      const target = path.resolve(workspaceRoot, input.path);
      const root = path.resolve(workspaceRoot);
      if (!target.startsWith(root)) throw new Error('Refusing to write outside workspace');
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, input.content);
      return { path: target, bytes: Buffer.byteLength(input.content) };
    }
  };
}
