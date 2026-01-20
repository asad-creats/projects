/**
 * GeminiClient - Google Gemini AI client
 * Fixed system_instruction payload structure
 */
export class GeminiClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
  }

  async chat(messages, model = 'gemini-1.5-pro') {
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
              maxOutputTokens: 1024,
            },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
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