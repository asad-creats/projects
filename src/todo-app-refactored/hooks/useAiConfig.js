import { useState, useCallback } from 'react';

const STORAGE_KEY = 'ai_byo_config';

export const DEFAULT_MODELS = {
  gemini: 'gemini-2.0-flash',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-haiku-latest',
  ollama: 'llama3.2',
  openrouter: 'meta-llama/llama-3.3-70b-instruct:free',
};

// Curated model choices shown in the AI Settings dropdown per provider.
// (OpenRouter is fetched live from its public API — see AiSettings.)
export const MODEL_OPTIONS = {
  gemini: [
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.5-pro',
  ],
  openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'gpt-4.1'],
  anthropic: [
    'claude-3-5-haiku-latest',
    'claude-3-5-sonnet-latest',
    'claude-3-7-sonnet-latest',
  ],
  ollama: ['llama3.2', 'llama3.1', 'qwen2.5', 'mistral', 'phi3'],
  openrouter: [], // populated dynamically
};

const DEFAULT_CONFIG = {
  mode: 'free', // 'free' | 'byo'
  provider: 'gemini', // used when mode === 'byo'
  model: '',
  apiKey: '',
};

/**
 * useAiConfig - persists the user's AI preference in localStorage only.
 * Their API key never leaves the browser.
 */
export const useAiConfig = () => {
  const [config, setConfig] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return { ...DEFAULT_CONFIG, ...stored };
    } catch (_) {
      return DEFAULT_CONFIG;
    }
  });

  const update = useCallback((patch) => {
    setConfig((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (_) {
        /* ignore quota errors */
      }
      return next;
    });
  }, []);

  return { config, update };
};
