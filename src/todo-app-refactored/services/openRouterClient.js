/**
 * OpenRouterClient - bring-your-own-key client for OpenRouter.
 * OpenRouter is OpenAI-compatible and aggregates many models, including a
 * rotating set of FREE ones (ids ending in ":free"). The user's key is stored
 * only in their browser. Same chat(messages, model) contract as the others.
 */
export class OpenRouterClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
  }

  async chat(messages, model = 'meta-llama/llama-3.3-70b-instruct:free') {
    if (!this.apiKey) throw new Error('OpenRouter API key is not configured');

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
        // Optional attribution headers recommended by OpenRouter.
        'HTTP-Referer': window.location.origin,
        'X-Title': 'AI Task Manager',
      },
      body: JSON.stringify({
        model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`OpenRouter API error: ${err?.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data?.choices?.[0]?.message?.content || '';
  }

  /**
   * Fetch the list of currently-free models from OpenRouter's public catalog.
   * No API key required. Returns an array of model id strings.
   */
  static async listFreeModels() {
    const res = await fetch('https://openrouter.ai/api/v1/models');
    if (!res.ok) throw new Error('Failed to load OpenRouter models');
    const { data } = await res.json();
    return (data || [])
      .filter((m) => {
        const p = m.pricing || {};
        return Number(p.prompt) === 0 && Number(p.completion) === 0;
      })
      .map((m) => m.id)
      .sort();
  }
}
