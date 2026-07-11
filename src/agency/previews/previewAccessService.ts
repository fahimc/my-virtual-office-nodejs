import { createHash, randomBytes } from 'node:crypto';

export class PreviewAccessService {
  createToken(projectId: string, versionNumber: number): string {
    return createHash('sha256')
      .update(`${projectId}:${versionNumber}:${randomBytes(12).toString('hex')}`)
      .digest('hex')
      .slice(0, 32);
  }

  isTokenValid(expected?: string, provided?: string): boolean {
    return Boolean(expected && provided && expected === provided);
  }
}
