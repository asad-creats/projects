/**
 * OllamaClient - Local AI client for Ollama integration
 */
export class OllamaClient {
  constructor() {
    this.baseUrl = 'http://localhost:11434';
  }

  async listModels() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.models || [];
    } catch (error) {
      console.error('Ollama list models error:', error);
      return [];
    }
  }

  async chat(messages, model = 'llama3.2') {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.message?.content || '';
    } catch (error) {
      console.error('Ollama chat error:', error);
      throw new Error(`Failed to connect to Ollama. Make sure it's running on ${this.baseUrl}`);
    }
  }
}
