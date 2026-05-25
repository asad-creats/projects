/**
 * GeminiClient - Google Gemini AI client
 * Fixed system_instruction payload structure
 */
export class GeminiClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
  }

  async chat(messages, model = 'gemini-2.5-flash') {
    try {
      if (!this.apiKey) {
        throw new Error('Gemini API key is not configured');
      }

      // Convert messages to Gemini format
      const contents = messages
        .filter(msg => msg.role !== 'system')
        .map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        }));

      // Get system prompt if present
      const systemPrompt = messages.find(msg => msg.role === 'system')?.content || '';

      const response = await fetch(
        `${this.baseUrl}/${model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            // FIX 1: Field name is 'system_instruction', not 'system'
            // FIX 2: 'parts' must be an ARRAY, not an object
            system_instruction: systemPrompt 
              ? { parts: [{ text: systemPrompt }] } 
              : undefined,
            contents,
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 2048,
            },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        const msg = error.error?.message || response.statusText;
        // 503 = overloaded, 429 = rate/quota. These are transient on the free tier.
        if (response.status === 503 || /overloaded|high usage/i.test(msg)) {
          throw new Error('Gemini is overloaded right now (free-tier traffic). Try again, or pick a lighter model like gemini-2.0-flash in AI Settings.');
        }
        if (response.status === 429) {
          throw new Error('Gemini rate limit / quota reached for this key. Wait a bit, or switch model in AI Settings.');
        }
        throw new Error(`Gemini API error: ${msg}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return content;
    } catch (error) {
      console.error('Gemini chat error:', error);
      throw error;
    }
  }
}