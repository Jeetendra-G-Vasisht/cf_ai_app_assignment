// Example Cloudflare Agent (TypeScript)
// This is a scaffold showing @callable usage and sample LLM call.
import { Agent, unstable_callable as callable } from 'agents';

export class ChatAgent extends Agent {
  onStart() {
    // schedule or initialization
    this.setState({ conversations: {} });
  }

  @callable()
  async handleUserMessage(payload: { userId: string; message: string }) {
    const { userId, message } = payload;
    // Basic flow: append to DO state, call model, return response
    // Durable Object / Vectorize usage is performed by Workers entrypoint in this repo.
    const prompt = `User (${userId}) says: ${message}\nAssistant:`;
    const modelRef = this.env.LLAMA_MODEL_REF || '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
    // NOTE: this.env.AI.run is a placeholder to demonstrate Workers AI call shape.
    const { response } = await this.env.AI.run(modelRef, {
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt }
      ],
    });
    return { reply: response || 'Sorry, no response.' };
  }
}
