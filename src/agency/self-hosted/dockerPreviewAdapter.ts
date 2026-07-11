export class DockerPreviewAdapter {
  status() {
    return { enabled: false, provider: 'docker', note: 'Docker isolated previews are stubbed; local previews are used in development.' };
  }
}
