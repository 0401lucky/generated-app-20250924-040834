import OpenAI from 'openai';
import type { Message, ToolCall } from './types';
import { getToolDefinitions, executeTool } from './tools';
import { ChatCompletionMessageFunctionToolCall, ChatCompletionMessageToolCall } from 'openai/resources/index.mjs';
export interface ChatHandlerConfig {
  apiKey?: string;
  baseUrl?: string;
}
export class ChatHandler {
  private client: OpenAI;
  private model: string;
  constructor(defaultBaseUrl: string, defaultApiKey: string, model: string, config?: ChatHandlerConfig) {
    const baseUrl = config?.baseUrl || defaultBaseUrl;
    const apiKey = config?.apiKey || defaultApiKey;
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
      throw new Error("API key is missing or invalid. Please provide a valid API key in the settings or environment variables.");
    }
    this.client = new OpenAI({
      baseURL: baseUrl,
      apiKey: apiKey,
    });
    this.model = model;
  }
  async listModels(): Promise<{ id: string; name: string }[]> {
    try {
      const models = await this.client.models.list();
      // Filter and format the models. This can be customized.
      // For now, we return all models provided by the API.
      return models.data.map(model => ({
        id: model.id,
        name: model.id, // Often the name is the same as the ID.
      })).sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error("Failed to fetch models from provider:", error);
      throw new Error("Could not fetch models. Please check your API key and Base URL.");
    }
  }
  async processMessage(
    message: string,
    conversationHistory: Message[],
    onChunk?: (chunk: string) => void
  ): Promise<{
    content: string;
    toolCalls?: ToolCall[];
  }> {
    const messages = this.buildConversationMessages(message, conversationHistory);
    const toolDefinitions = await getToolDefinitions();
    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages,
      tools: toolDefinitions.length > 0 ? toolDefinitions : undefined,
      tool_choice: toolDefinitions.length > 0 ? 'auto' : undefined,
      stream: true,
    });
    return this.handleStreamResponse(stream, onChunk);
  }
  private async handleStreamResponse(
    stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>,
    onChunk?: (chunk: string) => void
  ) {
    let fullContent = '';
    const accumulatedToolCalls: ChatCompletionMessageFunctionToolCall[] = [];
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (delta?.content) {
        fullContent += delta.content;
        onChunk?.(delta.content);
      }
      if (delta?.tool_calls) {
        for (const deltaToolCall of delta.tool_calls) {
          if (deltaToolCall.index === undefined) continue;
          if (!accumulatedToolCalls[deltaToolCall.index]) {
            accumulatedToolCalls[deltaToolCall.index] = { id: '', type: 'function', function: { name: '', arguments: '' } };
          }
          const toolCall = accumulatedToolCalls[deltaToolCall.index];
          if (deltaToolCall.id) toolCall.id = deltaToolCall.id;
          if (deltaToolCall.function?.name) toolCall.function.name += deltaToolCall.function.name;
          if (deltaToolCall.function?.arguments) toolCall.function.arguments += deltaToolCall.function.arguments;
        }
      }
    }
    if (accumulatedToolCalls.length > 0 && accumulatedToolCalls.every(tc => tc.id && tc.function.name)) {
      const executedTools = await this.executeToolCalls(accumulatedToolCalls);
      const finalResponseContent = await this.generateToolResponse(fullContent, accumulatedToolCalls, executedTools);
      if (finalResponseContent) {
        onChunk?.(finalResponseContent);
        fullContent += finalResponseContent;
      }
      return { content: fullContent, toolCalls: executedTools };
    }
    return { content: fullContent };
  }
  private async executeToolCalls(openAiToolCalls: ChatCompletionMessageFunctionToolCall[]): Promise<ToolCall[]> {
    return Promise.all(
      openAiToolCalls.map(async (tc) => {
        try {
          const args = tc.function.arguments ? JSON.parse(tc.function.arguments) : {};
          const result = await executeTool(tc.function.name, args);
          return { id: tc.id, name: tc.function.name, arguments: args, result };
        } catch (error) {
          console.error(`Tool execution failed for ${tc.function.name}:`, error);
          const result = { error: `Failed to execute ${tc.function.name}: ${error instanceof Error ? error.message : 'Unknown error'}` };
          return { id: tc.id, name: tc.function.name, arguments: {}, result };
        }
      })
    );
  }
  private async generateToolResponse(
    originalContent: string,
    openAiToolCalls: ChatCompletionMessageToolCall[],
    toolResults: ToolCall[]
  ): Promise<string> {
    const followUpCompletion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'assistant', content: originalContent, tool_calls: openAiToolCalls },
        ...toolResults.map((result) => ({
          role: 'tool' as const,
          content: JSON.stringify(result.result),
          tool_call_id: result.id,
        })),
      ],
    });
    return followUpCompletion.choices[0]?.message?.content || '';
  }
  private buildConversationMessages(userMessage: string, history: Message[]) {
    return [
      { role: 'system' as const, content: 'You are a helpful AI assistant.' },
      ...history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: userMessage },
    ];
  }
  updateModel(newModel: string): void {
    this.model = newModel;
  }
}