import type { SecretsProvider } from './secretsProvider.js';

export class EnvSecretsProvider implements SecretsProvider {
  async getSecret(name: string): Promise<string | undefined> {
    return process.env[name];
  }
}
