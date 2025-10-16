// src/durableObjects/ChatState.ts
import type { DurableObjectState } from "@cloudflare/workers-types";

export class ChatState {
  state: DurableObjectState;
  env: Record<string, any>;

  constructor(state: DurableObjectState, env: Record<string, any>) {
    this.state = state;
    this.env = env;
  }

  async fetch(req: Request): Promise<Response> {
    try {
      const url = new URL(req.url);

      // ✅ POST /update – handle chat messages
      if (url.pathname.endsWith("/update") && req.method === "POST") {
        let payload: any;
        try {
          payload = await req.json();
        } catch {
          return new Response(
            JSON.stringify({ error: "Invalid JSON body" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        const userId: string = payload?.userId || "anon";
        const message: string = payload?.message || "";

        if (!message.trim()) {
          return new Response(
            JSON.stringify({ error: "Message cannot be empty" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        // Retrieve or initialize conversation
        const conv = ((await this.state.storage.get("conv")) as any[]) || [];

        // Add user message
        conv.push({ role: "user", text: message, ts: Date.now() });

        // ✅ Call Cloudflare Workers AI (Llama 3.3)
        let reply = "Sorry, I couldn’t get a response.";
        try {
          const aiResponse = await this.env.AI.run(this.env.LLAMA_MODEL_REF, {
            messages: [
              { role: "system", content: "You are a helpful assistant." },
              ...conv.map((m) => ({
                role: m.role,
                content: m.text,
              })),
            ],
          });
          reply = aiResponse?.response || `Echo: ${message}`;
        } catch (err) {
          reply = `Echo: ${message}`; // fallback if AI fails
        }

        // Store assistant reply
        conv.push({ role: "assistant", text: reply, ts: Date.now() });
        await this.state.storage.put("conv", conv);

        return new Response(JSON.stringify({ reply }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      // ✅ GET /state – return stored conversation
      if (url.pathname.endsWith("/state") && req.method === "GET") {
        const stored = (await this.state.storage.get("conv")) || [];
        return new Response(JSON.stringify({ ok: true, stored }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      // Default route
      return new Response(
        JSON.stringify({ error: "Invalid route" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    } catch (err: any) {
      return new Response(
        JSON.stringify({ error: String(err) }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }
}
