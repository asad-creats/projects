import { useState, useEffect } from 'react';
import { OllamaClient } from '../services/ollamaClient';

export const useOllama = () => {
  const [ollamaModels, setOllamaModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('llama3.2');
  const [ollamaConnected, setOllamaConnected] = useState(false);

  useEffect(() => {
    const checkOllama = async () => {
      try {
        const client = new OllamaClient();
        const models = await client.listModels();
        setOllamaModels(models);
        setOllamaConnected(models.length > 0);
        
        // Set first available model if current selection isn't available
        if (models.length > 0 && !models.find(m => m.name === selectedModel)) {
          setSelectedModel(models[0].name);
        }
      } catch (error) {
        console.error('Failed to connect to Ollama:', error);
        setOllamaConnected(false);
      }
    };

    checkOllama();
    // Check every 30 seconds
    const interval = setInterval(checkOllama, 30000);
    return () => clearInterval(interval);
  }, [selectedModel]);

  return {
    ollamaModels,
    selectedModel,
    setSelectedModel,
    ollamaConnected
  };
};
