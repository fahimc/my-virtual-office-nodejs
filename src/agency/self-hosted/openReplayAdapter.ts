import type { SelfHostedConfig } from './selfHostedConfig.js';

export class OpenReplayAdapter {
  constructor(private readonly config: SelfHostedConfig) {}

  status() {
    return { enabled: Boolean(this.config.openReplayUrl), provider: 'openreplay', note: 'OpenReplay is optional for later customer-session replay.' };
  }
}
