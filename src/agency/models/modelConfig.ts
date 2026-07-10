export type ModelTaskType =
  | 'intake'
  | 'brief_structuring'
  | 'planning'
  | 'design'
  | 'copywriting'
  | 'coding'
  | 'qa'
  | 'summarisation'
  | 'client_message'
  | 'deployment_reasoning';

export interface ModelRoute {
  provider: 'ollama' | 'openai' | 'gemini' | 'claude' | 'llama_cpp' | 'stub';
  model: string;
  baseUrl?: string;
}

export interface ModelConfig {
  defaultRoute: ModelRoute;
  routes: Record<ModelTaskType, ModelRoute>;
}

const ollamaModel = process.env.OLLAMA_MODEL || 'gemma4:e4b';
const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';

export const defaultModelConfig: ModelConfig = {
  defaultRoute: { provider: 'ollama', model: ollamaModel, baseUrl: ollamaBaseUrl },
  routes: {
    intake: { provider: 'ollama', model: ollamaModel, baseUrl: ollamaBaseUrl },
    brief_structuring: { provider: 'ollama', model: ollamaModel, baseUrl: ollamaBaseUrl },
    planning: { provider: 'ollama', model: ollamaModel, baseUrl: ollamaBaseUrl },
    design: { provider: 'ollama', model: ollamaModel, baseUrl: ollamaBaseUrl },
    copywriting: { provider: 'ollama', model: ollamaModel, baseUrl: ollamaBaseUrl },
    coding: { provider: 'ollama', model: ollamaModel, baseUrl: ollamaBaseUrl },
    qa: { provider: 'ollama', model: ollamaModel, baseUrl: ollamaBaseUrl },
    summarisation: { provider: 'ollama', model: ollamaModel, baseUrl: ollamaBaseUrl },
    client_message: { provider: 'ollama', model: ollamaModel, baseUrl: ollamaBaseUrl },
    deployment_reasoning: { provider: 'ollama', model: ollamaModel, baseUrl: ollamaBaseUrl }
  }
};
