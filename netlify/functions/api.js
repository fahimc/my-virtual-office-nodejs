import serverless from 'serverless-http';
import { withLambda } from '@netlify/aws-lambda-compat';

let cachedHandler;

const lambdaHandler = async (event, context) => {
  if (!cachedHandler) {
    const mod = await import('../../server.js');
    await mod.initializeRuntime();
    cachedHandler = serverless(mod.app, {
      binary: ['image/*', 'application/pdf', 'application/octet-stream']
    });
  }

  const rewritten = {
    ...event,
    path: event.path.replace(/^\/\.netlify\/functions\/api/, '')
  };

  return cachedHandler(rewritten, context);
};

export default withLambda(lambdaHandler);
