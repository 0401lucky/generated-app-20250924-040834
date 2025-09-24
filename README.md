# NexusChat: Your Personal AI Chat Interface

NexusChat is a visually stunning, minimalist AI chat web application that serves as a centralized hub for interacting with various large language models. It empowers users by allowing them to connect to multiple AI API providers (like OpenAI, Google, Anthropic via Cloudflare's AI Gateway, or any custom endpoint) by simply providing their own API key and base URL. The application features a clean, intuitive two-column layout with a persistent session history sidebar and a focused chat view. The entire experience is designed to be seamless, performant, and aesthetically pleasing, running on Cloudflare's edge network for global low-latency access.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/0401lucky/generated-app-20250924-040705)

## ✨ Key Features

*   **Bring Your Own API Key (BYOAK):** Securely use your own API keys from various providers.
*   **Multi-Provider Support:** Connect to OpenAI, Google, Anthropic, or any custom API endpoint compatible with the OpenAI SDK.
*   **Sleek & Responsive UI:** A clean, minimalist two-column layout that looks great on any device.
*   **Persistent Chat Sessions:** Your conversation history is automatically saved and can be revisited anytime.
*   **Real-time Streaming:** Watch AI responses generate token-by-token for a dynamic experience.
*   **Model Selection:** Easily switch between different language models offered by your chosen provider.
*   **Edge-Powered:** Deployed on Cloudflare's global network for ultra-low latency.
*   **Secure by Design:** API keys are stored securely on the server-side using Cloudflare Durable Objects, never on the client.

## 🛠️ Technology Stack

*   **Frontend:** React, Vite, TypeScript, Tailwind CSS
*   **UI Components:** shadcn/ui, Radix UI, Lucide Icons
*   **State Management:** Zustand
*   **Animation:** Framer Motion
*   **Backend:** Cloudflare Workers, Hono
*   **State Persistence:** Cloudflare Agents (Durable Objects)

## 🚀 Getting Started

Follow these instructions to get a local copy up and running for development and testing purposes.

### Prerequisites

*   [Node.js](https://nodejs.org/) (v18 or later)
*   [Bun](https://bun.sh/) package manager
*   A [Cloudflare account](https://dash.cloudflare.com/sign-up)

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/nexus-chat.git
    cd nexus-chat
    ```

2.  **Install dependencies:**
    ```sh
    bun install
    ```

### Configuration

1.  **Log in to Wrangler:**
    This will allow you to interact with your Cloudflare account from the command line.
    ```sh
    bunx wrangler login
    ```

2.  **Create a local configuration file:**
    Create a file named `.dev.vars` in the root of the project. This file is used for local development and is not committed to git.

3.  **Add environment variables:**
    Open the `.dev.vars` file and add your Cloudflare AI Gateway credentials. You can also use credentials from other providers like OpenAI.
    ```ini
    # .dev.vars

    # Example using Cloudflare AI Gateway
    CF_AI_BASE_URL="https://gateway.ai.cloudflare.com/v1/YOUR_ACCOUNT_ID/YOUR_GATEWAY_ID/openai"
    CF_AI_API_KEY="YOUR_CLOUDFLARE_API_KEY"
    ```

### Running Locally

Start the development server, which runs both the Vite frontend and the Wrangler backend concurrently.

```sh
bun run dev
```

The application will be available at `http://localhost:3000`.

## 🔧 Usage

1.  Open the application in your browser.
2.  Click the **Settings** icon in the header.
3.  In the dialog, select your AI Provider (e.g., "Custom").
4.  Enter your **API Key** and the **Base URL** for the AI service.
5.  Click **Save**.
6.  Select a model from the dropdown in the main chat view.
7.  Start your conversation! Your chat session will automatically be saved in the sidebar.

## 🏗️ Project Structure

The project is organized into two main parts: the frontend application and the backend worker.

*   `src/`: Contains the React frontend application built with Vite.
    *   `pages/`: Main application pages (e.g., `HomePage.tsx`).
    *   `components/`: Reusable React components, including the core UI (`SessionSidebar.tsx`, `ChatView.tsx`) and shadcn/ui components.
    *   `hooks/`: Custom React hooks, including the Zustand store (`useChatStore.ts`).
    *   `lib/`: Client-side utility functions and services (`chat.ts`).
*   `worker/`: Contains the Cloudflare Worker backend code.
    *   `index.ts`: The entry point for the worker.
    *   `userRoutes.ts`: Defines the API routes using Hono.
    *   `agent.ts`: The core `ChatAgent` Durable Object class that manages chat state and logic.
    *   `chat.ts`: The `ChatHandler` class responsible for interacting with external AI APIs.
    *   `types.ts`: Shared TypeScript types between the frontend and backend.

## ☁️ Deployment

This application is designed for seamless deployment to Cloudflare's global network.

1.  **Build the application:**
    This command bundles the frontend and prepares the worker for deployment.
    ```sh
    bun run build
    ```

2.  **Deploy to Cloudflare:**
    This command deploys your application using Wrangler. It will upload the static assets and the worker code.
    ```sh
    bun run deploy
    ```
    Wrangler will provide you with the URL of your deployed application.

Alternatively, you can deploy directly from your GitHub repository with a single click.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/0401lucky/generated-app-20250924-040705)

## 🔒 Environment Variables

To run and deploy the application, you need to configure the following environment variables in your Cloudflare dashboard (for production) or your `.dev.vars` file (for local development).

*   `CF_AI_BASE_URL`: The base URL for the AI provider's API. This is used as a fallback if the user does not provide their own.
*   `CF_AI_API_KEY`: The API key corresponding to the base URL. This is also a fallback and should be kept secret.

These variables are used by the `ChatHandler` on the backend to make requests to the AI service.

## 🤝 Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.