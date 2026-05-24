import { useState, useCallback } from 'react';

const STORAGE_KEY = 'ai_byo_config';

export const DEFAULT_MODELS = {
  gemini: 'gemini-2.5-flash',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-haiku-latest',
  ollama: 'llama3.2',
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
