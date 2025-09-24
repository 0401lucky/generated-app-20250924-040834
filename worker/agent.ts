import { Agent } from 'agents';
import type { Env } from './core-utils';
import type { ChatState } from './types';
import { ChatHandler } from './chat';
import { API_RESPONSES } from './config';
import { createMessage, createStreamResponse, createEncoder } from './utils';
export class ChatAgent extends Agent<Env, ChatState> {
  private chatHandler?: ChatHandler;
  initialState: ChatState = {
    messages: [],
    sessionId: crypto.randomUUID(),
    isProcessing: false,
    model: 'gpt-4o',
  };
  private initializeChatHandler(): void {
    this.chatHandler = new ChatHandler(
      this.env.CF_AI_BASE_URL,
      this.env.CF_AI_API_KEY,
      this.state.model,
      {
        apiKey: this.state.apiKey,
        baseUrl: this.state.baseUrl,
      }
    );
  }
  async onStart(): Promise<void> {
    this.initializeChatHandler();
    console.log(`ChatAgent ${this.name} initialized with session ${this.state.sessionId}`);
  }
  async onRequest(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const method = request.method;
      if (method === 'POST' && url.pathname === '/configure') {
        return this.handleConfigure(await request.json());
      }
      if (method === 'GET' && url.pathname === '/messages') {
        return this.handleGetMessages();
      }
      if (method === 'POST' && url.pathname === '/chat') {
        return this.handleChatMessage(await request.json());
      }
      if (method === 'DELETE' && url.pathname === '/clear') {
        return this.handleClearMessages();
      }
      if (method === 'GET' && url.pathname === '/models') {
        return this.handleListModels();
      }
      return Response.json({ success: false, error: API_RESPONSES.NOT_FOUND }, { status: 404 });
    } catch (error) {
      console.error('Request handling error:', error);
      return Response.json({ success: false, error: API_RESPONSES.INTERNAL_ERROR }, { status: 500 });
    }
  }
  private async handleConfigure(body: { apiKey: string; provider: string; baseUrl?: string }): Promise<Response> {
    const { apiKey, provider, baseUrl } = body;
    if (!apiKey || !provider) {
      return Response.json({ success: false, error: 'apiKey and provider are required' }, { status: 400 });
    }
    await this.setState({ ...this.state, apiKey, apiProvider: provider, baseUrl });
    this.initializeChatHandler(); // Re-initialize with new settings
    return Response.json({ success: true });
  }
  private handleGetMessages(): Response {
    return Response.json({ success: true, data: this.state });
  }
  private async handleListModels(): Promise<Response> {
    try {
      if (!this.chatHandler) {
        this.initializeChatHandler();
      }
      const models = await this.chatHandler!.listModels();
      return Response.json({ success: true, data: models });
    } catch (error) {
      console.error('Failed to list models:', error);
      const errorMessage = error instanceof Error ? error.message : 'Could not fetch models.';
      return Response.json({ success: false, error: errorMessage }, { status: 500 });
    }
  }
  private async handleChatMessage(body: { message: string; model?: string; stream?: boolean }): Promise<Response> {
    const { message, model, stream } = body;
    if (!message?.trim()) {
      return Response.json({ success: false, error: API_RESPONSES.MISSING_MESSAGE }, { status: 400 });
    }
    if (model && model !== this.state.model) {
      await this.setState({ ...this.state, model });
      this.chatHandler?.updateModel(model);
    }
    const userMessage = createMessage('user', message.trim());
    await this.setState({
      ...this.state,
      messages: [...this.state.messages, userMessage],
      isProcessing: true,
    });
    try {
      if (!this.chatHandler) {
        this.initializeChatHandler();
      }
      if (stream) {
        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();
        const encoder = createEncoder();
        (async () => {
          try {
            await this.setState({ ...this.state, streamingMessage: '' });
            const response = await this.chatHandler!.processMessage(
              message,
              this.state.messages,
              (chunk: string) => {
                this.setState({ ...this.state, streamingMessage: (this.state.streamingMessage || '') + chunk });
                writer.write(encoder.encode(chunk)).catch(e => console.error("Write error", e));
              }
            );
            const assistantMessage = createMessage('assistant', response.content, response.toolCalls);
            await this.setState({
              ...this.state,
              messages: [...this.state.messages, assistantMessage],
              isProcessing: false,
              streamingMessage: undefined,
            });
          } catch (error) {
            console.error('Streaming error:', error);
            const errorMessage = error instanceof Error ? `Sorry, an error occurred: ${error.message}` : 'Sorry, I encountered an error.';
            writer.write(encoder.encode(errorMessage)).catch(e => console.error("Write error", e));
            const errorMsg = createMessage('assistant', errorMessage);
            await this.setState({
              ...this.state,
              messages: [...this.state.messages, errorMsg],
              isProcessing: false,
              streamingMessage: undefined,
            });
          } finally {
            writer.close().catch(e => console.error("Close error", e));
          }
        })();
        return createStreamResponse(readable);
      } else {
        const response = await this.chatHandler!.processMessage(message, this.state.messages);
        const assistantMessage = createMessage('assistant', response.content, response.toolCalls);
        await this.setState({
          ...this.state,
          messages: [...this.state.messages, assistantMessage],
          isProcessing: false,
        });
        return Response.json({ success: true, data: this.state });
      }
    } catch (error) {
      console.error('Chat processing error:', error);
      await this.setState({ ...this.state, isProcessing: false });
      const errorMessage = error instanceof Error ? error.message : API_RESPONSES.PROCESSING_ERROR;
      return Response.json({ success: false, error: errorMessage }, { status: 500 });
    }
  }
  private async handleClearMessages(): Promise<Response> {
    await this.setState({ ...this.state, messages: [] });
    return Response.json({ success: true, data: this.state });
  }
}