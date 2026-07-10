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
export type DesignModelTaskType =
  | 'design_discovery'
  | 'brand_audit'
  | 'competitor_research'
  | 'creative_direction'
  | 'sitemap'
  | 'wireframe'
  | 'design_tokens'
  | 'component_spec'
  | 'prototype_generation'
  | 'design_qa'
  | 'accessibility_review'
  | 'design_handoff'
  | 'visual_qa';

export type AnyModelTaskType = ModelTaskType | DesignModelTaskType;

export interface ModelRoute {
  provider: 'ollama' | 'openai' | 'gemini' | 'claude' | 'llama_cpp' | 'stub';
  model: string;
  baseUrl?: string;
}

export interface ModelConfig {
  defaultRoute: ModelRoute;
  routes: Record<AnyModelTaskType, ModelRoute>;
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
    deployment_reasoning: { provider: 'ollama', model: ollamaModel, baseUrl: ollamaBaseUrl },
    design_discovery: { provider: 'ollama', model: ollamaModel, baseUrl: ollamaBaseUrl },
    brand_audit: { provider: 'ollama', model: ollamaModel, baseUrl: ollamaBaseUrl },
    competitor_research: { provider: 'ollama', model: ollamaModel, baseUrl: ollamaBaseUrl },
    creative_direction: { provider: 'ollama', model: ollamaModel, baseUrl: ollamaBaseUrl },
    sitemap: { provider: 'ollama', model: ollamaModel, baseUrl: ollamaBaseUrl },
    wireframe: { provider: 'ollama', model: ollamaModel, baseUrl: ollamaBaseUrl },
    design_tokens: { provider: 'ollama', model: ollamaModel, baseUrl: ollamaBaseUrl },
    component_spec: { provider: 'ollama', model: ollamaModel, baseUrl: ollamaBaseUrl },
    prototype_generation: { provider: 'ollama', model: ollamaModel, baseUrl: ollamaBaseUrl },
    design_qa: { provider: 'ollama', model: ollamaModel, baseUrl: ollamaBaseUrl },
    accessibility_review: { provider: 'ollama', model: ollamaModel, baseUrl: ollamaBaseUrl },
    design_handoff: { provider: 'ollama', model: ollamaModel, baseUrl: ollamaBaseUrl },
    visual_qa: { provider: 'ollama', model: ollamaModel, baseUrl: ollamaBaseUrl }
  }
};
