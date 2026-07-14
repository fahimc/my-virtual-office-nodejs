import type { SecretsProvider } from './secretsProvider.js';

export class EnvSecretsProvider implements SecretsProvider {
  async getSecret(name: string): Promise<string | undefined> {
    const value = process.env[name] ?? process.env[`\uFEFF${name}`];
    return value?.trim() || undefined;
  }
}
