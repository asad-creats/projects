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
    this.maxRetries = 3;
  }

  async chat(messages, model = 'meta-llama/llama-3.3-70b-instruct:free') {
    if (!this.apiKey) throw new Error('OpenRouter API key is not configured. Add your key in AI Settings.');

    let lastError = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      if (attempt > 0) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
        await new Promise((r) => setTimeout(r, delay));
      }

      let response;
      try {
        response = await fetch(this.baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
            'HTTP-Referer': window.location.origin,
            'X-Title': 'AI Task Manager',
          },
          body: JSON.stringify({
            model,
            messages: messages.map((m) => ({ role: m.role, content: m.content })),
            temperature: 0.7,
            max_tokens: 2048,
          }),
        });
      } catch (networkErr) {
        lastError = new Error('Network error — check your internet connection and try again.');
        lastError.code = 'NETWORK_ERROR';
        continue;
      }

      if (response.ok) {
        const data = await response.json();
        return data?.choices?.[0]?.message?.content || '';
      }

      const err = await response.json().catch(() => ({}));
      const status = response.status;
      const serverMsg = err?.error?.message || response.statusText;

      if (status === 401 || status === 403) {
        const e = new Error('Your OpenRouter API key is invalid or expired. Check your key in AI Settings.');
        e.code = 'AUTH_ERROR';
        throw e;
      }

      if (status === 402) {
        const e = new Error('Your OpenRouter account has no credits left. Add credits at openrouter.ai or switch to a free model.');
        e.code = 'PAYMENT_ERROR';
        throw e;
      }

      if (status === 429) {
        lastError = new Error('Rate limited by OpenRouter — too many requests. Retrying...');
        lastError.code = 'RATE_LIMITED';
        continue;
      }

      if (status === 400) {
        const modelGone = /model/i.test(serverMsg) || /not found/i.test(serverMsg) || /not available/i.test(serverMsg);
        const msg = modelGone
          ? `The model "${model}" is not available right now. Try a different model in AI Settings.`
          : `Bad request: ${serverMsg}`;
        const e = new Error(msg);
        e.code = 'BAD_REQUEST';
        throw e;
      }

      if (status >= 500) {
        lastError = new Error('OpenRouter servers are temporarily down. Retrying...');
        lastError.code = 'SERVER_ERROR';
        continue;
      }

      const e = new Error(`OpenRouter error (${status}): ${serverMsg}`);
      e.code = 'UNKNOWN';
      throw e;
    }

    if (lastError?.code === 'RATE_LIMITED') {
      lastError = new Error('OpenRouter is rate-limiting your requests. Wait a minute and try again, or switch to a different model.');
    } else if (lastError?.code === 'SERVER_ERROR') {
      lastError = new Error('OpenRouter servers are down right now. Please try again in a few minutes.');
    } else if (lastError?.code === 'NETWORK_ERROR') {
      lastError = new Error('Could not reach OpenRouter. Check your internet connection and try again.');
    }
    throw lastError;
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
