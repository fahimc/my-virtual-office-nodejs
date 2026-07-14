import serverless from 'serverless-http';
import { connectLambda } from '@netlify/blobs';

let cachedHandler;

export async function handler(event, context) {
  connectLambda(event);
  if (!cachedHandler) {
    const mod = await import('../../server.js');
    await mod.initializeRuntime();
    cachedHandler = serverless(mod.app);
  }

  const rewritten = {
    ...event,
    path: event.path.replace(/^\/\.netlify\/functions\/api/, '')
  };

  return cachedHandler(rewritten, context);
}
