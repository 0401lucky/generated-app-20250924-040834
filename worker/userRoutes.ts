import { Hono } from "hono";
import { getAgentByName } from 'agents';
import { ChatAgent } from './agent';
import { API_RESPONSES } from './config';
import { Env, getAppController, registerSession, unregisterSession } from "./core-utils";
export function coreRoutes(app: Hono<{ Bindings: Env }>) {
    // This catch-all route ensures all requests for a specific session are forwarded to the correct ChatAgent instance.
    app.all('/api/chat/:sessionId/*', async (c) => {
        try {
            const sessionId = c.req.param('sessionId');
            if (!sessionId) {
                return c.json({ success: false, error: 'Session ID is required' }, { status: 400 });
            }
            const agent = await getAgentByName<Env, ChatAgent>(c.env.CHAT_AGENT, sessionId);
            // Reconstruct the request URL to match the agent's internal routing.
            // e.g., /api/chat/123/messages -> /messages
            const url = new URL(c.req.url);
            const pathSegments = url.pathname.split('/');
            const agentPath = '/' + pathSegments.slice(4).join('/');
            const agentUrl = new URL(agentPath, url.origin);
            // Forward the request to the agent.
            return agent.fetch(new Request(agentUrl.toString(), c.req.raw));
        } catch (error) {
            console.error(`Agent routing error:`, error);
            return c.json({ success: false, error: API_RESPONSES.AGENT_ROUTING_FAILED }, { status: 500 });
        }
    });
}
export function userRoutes(app: Hono<{ Bindings: Env }>) {
    // Routes for managing the list of sessions, handled by the AppController.
    app.get('/api/sessions', async (c) => {
        try {
            const controller = getAppController(c.env);
            const sessions = await controller.listSessions();
            return c.json({ success: true, data: sessions });
        } catch (error) {
            console.error('Failed to list sessions:', error);
            return c.json({ success: false, error: 'Failed to retrieve sessions' }, { status: 500 });
        }
    });
    app.post('/api/sessions', async (c) => {
        try {
            const body = await c.req.json().catch(() => ({}));
            const { title, sessionId: providedSessionId, firstMessage } = body;
            const sessionId = providedSessionId || crypto.randomUUID();
            let sessionTitle = title;
            if (!sessionTitle) {
                if (firstMessage && firstMessage.trim()) {
                    const cleanMessage = firstMessage.trim().replace(/\s+/g, ' ');
                    sessionTitle = cleanMessage.length > 40 ? cleanMessage.slice(0, 37) + '...' : cleanMessage;
                } else {
                    const now = new Date();
                    sessionTitle = `New Chat - ${now.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
                }
            }
            await registerSession(c.env, sessionId, sessionTitle);
            return c.json({ success: true, data: { sessionId, title: sessionTitle } });
        } catch (error) {
            console.error('Failed to create session:', error);
            return c.json({ success: false, error: 'Failed to create session' }, { status: 500 });
        }
    });
    app.delete('/api/sessions/:sessionId', async (c) => {
        try {
            const sessionId = c.req.param('sessionId');
            const deleted = await unregisterSession(c.env, sessionId);
            if (!deleted) {
                return c.json({ success: false, error: 'Session not found' }, { status: 404 });
            }
            return c.json({ success: true });
        } catch (error) {
            console.error('Failed to delete session:', error);
            return c.json({ success: false, error: 'Failed to delete session' }, { status: 500 });
        }
    });
}