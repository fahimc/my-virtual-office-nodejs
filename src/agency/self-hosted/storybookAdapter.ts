import type { SelfHostedConfig } from './selfHostedConfig.js';

export class StorybookAdapter {
  constructor(private readonly config: SelfHostedConfig) {}

  status() {
    return { enabled: Boolean(this.config.storybookUrl), provider: 'storybook', note: 'Storybook can be linked for component previews when a project has it.' };
  }
}
