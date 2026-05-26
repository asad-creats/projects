import { useState, useEffect } from 'react';
import { OllamaClient } from '../services/ollamaClient';

// Ollama runs on the user's own machine (localhost:11434). A deployed HTTPS
// site can't reach loopback — the browser blocks it — so only probe Ollama in
// local development. This avoids the CORS/"Failed to fetch" console spam in prod.
const isLocalhost =
  typeof window !== 'undefined' &&
  /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname);

export const useOllama = () => {
  const [ollamaModels, setOllamaModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('llama3.2');
  const [ollamaConnected, setOllamaConnected] = useState(false);

  useEffect(() => {
    if (!isLocalhost) {
      setOllamaConnected(false);
      return;
    }

    const checkOllama = async () => {
      const client = new OllamaClient();
      const models = await client.listModels(); // returns [] on failure (no throw)
      setOllamaModels(models);
      setOllamaConnected(models.length > 0);

      // Set first available model if current selection isn't available
      if (models.length > 0 && !models.find((m) => m.name === selectedModel)) {
        setSelectedModel(models[0].name);
      }
    };

    checkOllama();
    const interval = setInterval(checkOllama, 30000);
    return () => clearInterval(interval);
  }, [selectedModel]);

  return {
    ollamaModels,
    selectedModel,
    setSelectedModel,
    ollamaConnected,
  };
};
