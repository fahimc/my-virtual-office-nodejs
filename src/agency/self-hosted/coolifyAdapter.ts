import type { SelfHostedConfig } from './selfHostedConfig.js';

export class CoolifyAdapter {
  constructor(private readonly config: SelfHostedConfig) {}

  status() {
    return { enabled: Boolean(this.config.coolifyUrl), provider: 'coolify', note: 'Coolify preview/deployment adapter boundary is ready for credentials.' };
  }
}
