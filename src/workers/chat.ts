// // src/workers/chat.ts
// import { ChatState } from "../durableObjects/ChatState";

// // Define the expected JSON body structure
// interface ChatRequestBody {
//   userId?: string;
//   message?: string;
// }

// // Minimal Cloudflare Worker entrypoint — routes chat messages to the Durable Object
// export default {
//   async fetch(request: Request, env: Record<string, any>): Promise<Response> {
//     // Handle CORS preflight
//     if (request.method === "OPTIONS") {
//       return new Response(null, { status: 204 });
//     }

//     try {
//       const url = new URL(request.url);

//       // Health check route
//       if (url.pathname === "/health") {
//         return new Response("ok", {
//           status: 200,
//           headers: { "Content-Type": "text/plain" },
//         });
//       }

//       // Chat message handler
//       if (url.pathname === "/api/chat" && request.method === "POST") {
//         let body: ChatRequestBody = {};

//         // Safely parse JSON body
//         try {
//           body = (await request.json()) as ChatRequestBody;
//         } catch {
//           return new Response(
//             JSON.stringify({ error: "Invalid JSON request body" }),
//             { status: 400, headers: { "Content-Type": "application/json" } }
//           );
//         }

//         const userId = body.userId?.trim() || "anon";
//         const message = body.message?.trim() || "";

//         if (!message) {
//           return new Response(
//             JSON.stringify({ error: "Message cannot be empty" }),
//             { status: 400, headers: { "Content-Type": "application/json" } }
//           );
//         }

//         // Route message to the Durable Object instance (per-user state)
//         const id = env.CHAT_STATE_DO.idFromName(userId);
//         const obj = env.CHAT_STATE_DO.get(id);

//         const resp = await obj.fetch("https://do.local/update", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ userId, message }),
//         });

//         // Safely parse the Durable Object’s response
//         let data: any;
//         try {
//           data = await resp.json();
//         } catch {
//           data = { error: "Durable Object returned invalid JSON" };
//         }

//         return new Response(JSON.stringify(data), {
//           status: 200,
//           headers: { "Content-Type": "application/json" },
//         });
//       }

//       // Default route (GET /)
//       return new Response(" Cloudflare AI Chat Worker running.", {
//         status: 200,
//         headers: { "Content-Type": "text/plain" },
//       });
//     } catch (err) {
//       return new Response(JSON.stringify({ error: String(err) }), {
//         status: 500,
//         headers: { "Content-Type": "application/json" },
//       });
//     }
//   },
// };

// // Export ChatState for Wrangler to bind the Durable Object
// export { ChatState } from "../durableObjects/ChatState";





import { ChatState } from "../durableObjects/ChatState";

// Define the expected JSON body structure
interface ChatRequestBody {
  userId?: string;
  message?: string;
}

// Minimal Cloudflare Worker entrypoint — routes chat messages to the Durable Object
export default {
  async fetch(request: Request, env: Record<string, any>): Promise<Response> {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204 });
    }

    try {
      const url = new URL(request.url);

      // Health check route
      if (url.pathname === "/health") {
        return new Response("ok", {
          status: 200,
          headers: { "Content-Type": "text/plain" },
        });
      }

      // Chat message handler (API endpoint)
      if (url.pathname === "/api/chat" && request.method === "POST") {
        let body: ChatRequestBody = {};

        // Safely parse JSON body
        try {
          body = (await request.json()) as ChatRequestBody;
        } catch {
          return new Response(
            JSON.stringify({ error: "Invalid JSON request body" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        const userId = body.userId?.trim() || "anon";
        const message = body.message?.trim() || "";

        if (!message) {
          return new Response(
            JSON.stringify({ error: "Message cannot be empty" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        // Route message to the Durable Object instance (per-user state)
        const id = env.CHAT_STATE_DO.idFromName(userId);
        const obj = env.CHAT_STATE_DO.get(id);

        const resp = await obj.fetch("https://do.local/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, message }),
        });

        // Safely parse the Durable Object’s response
        let data: any;
        try {
          data = await resp.json();
        } catch {
          data = { error: "Durable Object returned invalid JSON" };
        }

        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Serve the chat UI for root path
      if (url.pathname === "/" && request.method === "GET") {
        const html = `
        <!doctype html>
        <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <title>Cloudflare AI Chat</title>
          <style>
            body { font-family: system-ui, -apple-system, Roboto, "Segoe UI", Arial; margin: 0; padding: 24px; background: #f7f7fb; }
            .chat { max-width: 720px; margin: auto; background: white; padding: 16px; border-radius: 8px; box-shadow: 0 6px 20px rgba(0,0,0,0.06); }
            .messages { height: 320px; overflow:auto; border: 1px solid #eee; padding: 8px; border-radius: 6px; background: #fff; }
            .row { display:flex; gap:8px; margin-top:8px; }
            .input { flex:1; padding:8px; font-size:14px; }
            button { padding:8px 12px; }
            .msg { margin:6px 0; }
            .user { text-align: right; color: #1a1a1a; }
            .assistant { text-align: left; color: #0b5cff; }
          </style>
        </head>
        <body>
          <div class="chat">
            <h2>Cloudflare AI Chat</h2>
            <div id="messages" class="messages"></div>
            <div class="row">
              <input id="input" class="input" placeholder="Type your message..." />
              <button id="send">Send</button>
            </div>
          </div>
          <script>
            const API = '/api/chat';
            const messagesEl = document.getElementById('messages');
            const inputEl = document.getElementById('input');
            const sendBtn = document.getElementById('send');
            const userId = 'user_' + Math.floor(Math.random()*10000);

            function append(role, text) {
              const d = document.createElement('div');
              d.className = 'msg ' + (role === 'user' ? 'user' : 'assistant');
              d.textContent = (role === 'user' ? 'You: ' : 'Bot: ') + text;
              messagesEl.appendChild(d);
              messagesEl.scrollTop = messagesEl.scrollHeight;
            }

            sendBtn.addEventListener('click', async () => {
              const message = inputEl.value.trim();
              if (!message) return;
              append('user', message);
              inputEl.value = '';
              const res = await fetch(API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, message })
              }).then(r => r.json()).catch(e => ({ error: String(e) }));
              if (res.reply) append('assistant', res.reply);
              else if (res.error) append('assistant', 'Error: ' + res.error);
              else append('assistant', JSON.stringify(res));
            });
          </script>
        </body>
        </html>
        `;
        return new Response(html, {
          status: 200,
          headers: { "Content-Type": "text/html" },
        });
      }

      // Default fallback route
      return new Response("Cloudflare AI Chat Worker running.", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: String(err) }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};

// Export ChatState for Wrangler to bind the Durable Object
export { ChatState } from "../durableObjects/ChatState";
