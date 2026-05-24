import { supabase } from '../../supabaseClient';

/**
 * ProxyClient - free tier. Routes chat through the `ai-chat` Supabase Edge
 * Function, which enforces the daily cap and holds the shared Gemini key
 * server-side. Same chat(messages, model) contract as the other clients.
 */
export class ProxyClient {
  constructor() {
    this.lastUsage = null; // { used, limit }
  }

  async chat(messages, model = 'gemini-2.5-flash') {
    if (!supabase) throw new Error('Supabase not configured');

    const { data, error } = await supabase.functions.invoke('ai-chat', {
      body: { messages, model },
    });

    if (error) {
      // Non-2xx responses arrive as FunctionsHttpError with the body on context.
      let parsed = null;
      try {
        parsed = error.context && (await error.context.json());
      } catch (_) {
        /* ignore */
      }
      if (parsed?.error === 'daily_limit_reached') {
        throw this._limitError(parsed);
      }
      throw new Error(parsed?.error || error.message || 'AI request failed');
    }

    if (data?.error === 'daily_limit_reached') {
      throw this._limitError(data);
    }

    this.lastUsage = data?.usage || null;
    return data?.content ?? '';
  }

  _limitError(payload) {
    const e = new Error('DAILY_LIMIT');
    e.code = 'DAILY_LIMIT';
    e.usage = { used: payload.used, limit: payload.limit };
    return e;
  }
}
