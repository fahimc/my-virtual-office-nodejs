export interface CodexConfig {
  executable: string;
  defaultRuntimeMs: number;
  allowedCommands: string[];
  disallowedCommands: string[];
}

export const defaultCodexConfig: CodexConfig = {
  executable: process.env.CODEX_EXECUTABLE || 'codex',
  defaultRuntimeMs: Number(process.env.CODEX_MAX_RUNTIME_MS || 120000),
  allowedCommands: ['npm install', 'npm run build', 'npm run check', 'npm test', 'git diff', 'git status'],
  disallowedCommands: ['git push origin main', 'git reset --hard', 'rm -rf', 'Remove-Item -Recurse', 'netlify deploy --prod']
};
