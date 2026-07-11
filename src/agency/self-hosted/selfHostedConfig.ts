export interface SelfHostedConfig {
  coolifyUrl?: string;
  caddyAdminUrl?: string;
  minioEndpoint?: string;
  penpotUrl?: string;
  storybookUrl?: string;
  openReplayUrl?: string;
}

export function selfHostedConfigFromEnv(): SelfHostedConfig {
  return {
    coolifyUrl: process.env.COOLIFY_URL,
    caddyAdminUrl: process.env.CADDY_ADMIN_URL,
    minioEndpoint: process.env.MINIO_ENDPOINT,
    penpotUrl: process.env.PENPOT_URL,
    storybookUrl: process.env.STORYBOOK_URL,
    openReplayUrl: process.env.OPENREPLAY_URL
  };
}
