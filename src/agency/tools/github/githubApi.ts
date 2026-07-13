export interface GitHubRepoRef {
  owner: string;
  repo: string;
}

export function githubConfigured(): boolean {
  return Boolean(process.env.GITHUB_TOKEN);
}

export function parseRepo(repo: string): GitHubRepoRef | undefined {
  const cleaned = repo.replace(/^https:\/\/github\.com\//, '').replace(/\.git$/, '');
  const [owner, name] = cleaned.split('/');
  return owner && name ? { owner, repo: name } : undefined;
}

export async function githubCreateBranch(repo: string, branchName: string, baseBranch = 'main'): Promise<{ url?: string; sha?: string }> {
  const parsed = parseRepo(repo);
  if (!parsed || !githubConfigured()) return {};
  const base = await githubRequest<{ object: { sha: string } }>(`/repos/${parsed.owner}/${parsed.repo}/git/ref/heads/${encodeURIComponent(baseBranch)}`);
  const created = await githubRequest<{ ref: string; object: { sha: string }; url: string }>(`/repos/${parsed.owner}/${parsed.repo}/git/refs`, {
    method: 'POST',
    body: { ref: `refs/heads/${branchName}`, sha: base.object.sha }
  });
  return { url: created.url, sha: created.object.sha };
}

export async function githubCreatePullRequest(input: { repo: string; title: string; body: string; branchName: string; baseBranch?: string; draft?: boolean }): Promise<{ url?: string; number?: number }> {
  const parsed = parseRepo(input.repo);
  if (!parsed || !githubConfigured()) return {};
  const pr = await githubRequest<{ html_url: string; number: number }>(`/repos/${parsed.owner}/${parsed.repo}/pulls`, {
    method: 'POST',
    body: {
      title: input.title,
      body: input.body,
      head: input.branchName,
      base: input.baseBranch || 'main',
      draft: input.draft ?? true
    }
  });
  return { url: pr.html_url, number: pr.number };
}

export async function githubCreateIssue(input: { repo: string; title: string; body: string }): Promise<{ issueUrl?: string; number?: number }> {
  const parsed = parseRepo(input.repo);
  if (!parsed || !githubConfigured()) return {};
  const issue = await githubRequest<{ html_url: string; number: number }>(`/repos/${parsed.owner}/${parsed.repo}/issues`, {
    method: 'POST',
    body: { title: input.title, body: input.body }
  });
  return { issueUrl: issue.html_url, number: issue.number };
}

export async function githubRequest<T>(path: string, input: { method?: string; body?: unknown } = {}): Promise<T> {
  if (!process.env.GITHUB_TOKEN) throw new Error('GITHUB_TOKEN is not configured');
  const response = await fetch(`https://api.github.com${path}`, {
    method: input.method || 'GET',
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      'content-type': 'application/json',
      'x-github-api-version': '2022-11-28',
      'user-agent': 'ai-agency-company-os'
    },
    body: input.body ? JSON.stringify(input.body) : undefined
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`GitHub API ${response.status}: ${text.slice(0, 500)}`);
  return text ? JSON.parse(text) as T : {} as T;
}
