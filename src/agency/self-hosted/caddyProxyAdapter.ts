import type { SelfHostedConfig } from './selfHostedConfig.js';

export class CaddyProxyAdapter {
  constructor(private readonly config: SelfHostedConfig) {}

  status() {
    return { enabled: Boolean(this.config.caddyAdminUrl), provider: 'caddy', note: 'Caddy reverse proxy publishing can be enabled with CADDY_ADMIN_URL.' };
  }
}
