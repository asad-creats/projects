/**
 * OpenAIClient - bring-your-own-key client for the OpenAI Chat Completions API.
 * The key is the user's own (stored only in their browser) and is used directly
 * from the browser. Same chat(messages, model) contract as the other clients.
 */
export class OpenAIClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.openai.com/v1/chat/completions';
  }

  async chat(messages, model = 'gpt-4o-mini') {
    if (!this.apiKey) throw new Error('OpenAI API key is not configured');

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
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
      throw new Error(`OpenAI API error: ${err?.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data?.choices?.[0]?.message?.content || '';
  }
}
