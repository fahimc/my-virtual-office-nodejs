import type { SelfHostedConfig } from './selfHostedConfig.js';

export class PenpotAdapter {
  constructor(private readonly config: SelfHostedConfig) {}

  status() {
    return { enabled: Boolean(this.config.penpotUrl), provider: 'penpot', note: 'Penpot is optional; the internal Design Studio remains the default design review surface.' };
  }
}
