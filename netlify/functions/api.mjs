import serverless from 'serverless-http';
import { app, initializeRuntime } from '../../server.js';

const expressHandler = serverless(app);

export const handler = async (event, context) => {
  await initializeRuntime();
  const rewritten = {
    ...event,
    path: event.path.replace(/^\/\.netlify\/functions\/api/, '')
  };
  return expressHandler(rewritten, context);
};
