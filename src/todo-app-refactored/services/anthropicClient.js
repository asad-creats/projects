/**
 * AnthropicClient - bring-your-own-key client for the Anthropic Messages API.
 * The key is the user's own (stored only in their browser) and used directly
 * from the browser. Same chat(messages, model) contract as the other clients.
 *
 * Note: Anthropic requires the anthropic-dangerous-direct-browser-access header
 * for direct browser calls; users opt into this by choosing BYO + Anthropic.
 */
export class AnthropicClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.anthropic.com/v1/messages';
  }

  async chat(messages, model = 'claude-3-5-haiku-latest') {
    if (!this.apiKey) throw new Error('Anthropic API key is not configured');

    // Anthropic takes the system prompt as a top-level field.
    const system = messages.find((m) => m.role === 'system')?.content || '';
    const turns = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }));

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        system: system || undefined,
        messages: turns,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`Anthropic API error: ${err?.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data?.content?.[0]?.text || '';
  }
}
