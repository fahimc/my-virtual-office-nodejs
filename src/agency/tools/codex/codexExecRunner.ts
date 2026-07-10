import { spawn } from 'node:child_process';
import type { CodexResult, CodexTask } from './codexTaskAdapter.js';
import { defaultCodexConfig } from './codexConfig.js';

export class CodexExecRunner {
  async run(task: CodexTask): Promise<CodexResult> {
    if (process.env.CODEX_ENABLE_EXEC !== '1') {
      return {
        status: 'needs_review',
        summary: `Codex exec is disabled. Prepared coding task "${task.taskTitle}" on branch ${task.branchName}.`,
        changedFiles: [],
        commandsRun: [],
        testsRun: [],
        buildResult: 'not_run',
        diffSummary: 'No changes were executed in stub mode.',
        needsHumanReview: true
      };
    }
    return this.runCodexExec(task);
  }

  private runCodexExec(task: CodexTask): Promise<CodexResult> {
    return new Promise(resolve => {
      const args = ['exec', task.taskPrompt];
      const child = spawn(defaultCodexConfig.executable, args, {
        cwd: task.repoPath,
        shell: false,
        windowsHide: true
      });
      const output: string[] = [];
      const timer = setTimeout(() => {
        child.kill();
        resolve({
          status: 'failed',
          summary: 'Codex task timed out.',
          changedFiles: [],
          commandsRun: [`${defaultCodexConfig.executable} ${args.join(' ')}`],
          testsRun: [],
          buildResult: 'timeout',
          diffSummary: '',
          needsHumanReview: true,
          error: 'timeout'
        });
      }, task.maxRuntimeMs);
      child.stdout.on('data', chunk => output.push(String(chunk)));
      child.stderr.on('data', chunk => output.push(String(chunk)));
      child.on('close', code => {
        clearTimeout(timer);
        resolve({
          status: code === 0 ? 'needs_review' : 'failed',
          summary: output.join('').slice(-1000) || `Codex exited with ${code}`,
          changedFiles: [],
          commandsRun: [`${defaultCodexConfig.executable} ${args.join(' ')}`],
          testsRun: [],
          buildResult: code === 0 ? 'completed' : 'failed',
          diffSummary: '',
          needsHumanReview: true,
          error: code === 0 ? undefined : `Codex exited with ${code}`
        });
      });
    });
  }
}
