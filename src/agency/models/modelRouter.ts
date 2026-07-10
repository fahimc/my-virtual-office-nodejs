import type { ModelConfig, ModelTaskType } from './modelConfig.js';
import { defaultModelConfig } from './modelConfig.js';

export interface GenerateTextInput {
  taskType: ModelTaskType;
  system?: string;
  prompt: string;
}

export interface GenerateStructuredInput<T> extends GenerateTextInput {
  fallback: T;
  parse?: (text: string) => T;
}

export class ModelRouter {
  constructor(private readonly config: ModelConfig = defaultModelConfig) {}

  async generateText(input: GenerateTextInput): Promise<string> {
    const route = this.config.routes[input.taskType] || this.config.defaultRoute;
    if (route.provider !== 'ollama') return this.stubText(input);
    try {
      const response = await fetch(`${route.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: route.model,
          prompt: [input.system, input.prompt].filter(Boolean).join('\n\n'),
          stream: false,
          options: { temperature: 0.45, top_p: 0.9, num_predict: Number(process.env.OLLAMA_NUM_PREDICT || 220) }
        }),
        signal: AbortSignal.timeout(Number(process.env.OLLAMA_TIMEOUT_MS || 5000))
      });
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json() as { response?: string };
      return data.response?.trim() || this.stubText(input);
    } catch {
      return this.stubText(input);
    }
  }

  async generateStructuredObject<T>(input: GenerateStructuredInput<T>): Promise<T> {
    const text = await this.generateText(input);
    if (input.parse) {
      try {
        return input.parse(text);
      } catch {
        return input.fallback;
      }
    }
    try {
      return JSON.parse(text) as T;
    } catch {
      return input.fallback;
    }
  }

  async *streamText(input: GenerateTextInput): AsyncGenerator<string> {
    yield await this.generateText(input);
  }

  async runToolLoop(input: GenerateTextInput): Promise<string> {
    return this.generateText(input);
  }

  private stubText(input: GenerateTextInput): string {
    return `Drafted ${input.taskType.replaceAll('_', ' ')} output based on: ${input.prompt.slice(0, 220)}`;
  }
}
