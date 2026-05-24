import { useState, useRef, useEffect, useCallback } from 'react';
import { TaskAgent } from '../services/taskAgent';
import { ProxyClient } from '../services/proxyClient';
import { GeminiClient } from '../services/geminiClient';
import { OpenAIClient } from '../services/openaiClient';
import { AnthropicClient } from '../services/anthropicClient';
import { OpenRouterClient } from '../services/openRouterClient';
import { OllamaClient } from '../services/ollamaClient';
import { DEFAULT_MODELS } from './useAiConfig';
import { supabase } from '../../supabaseClient';

// Build the right AI client + model from the user's config.
function buildClient(aiConfig, ollamaSelectedModel) {
  if (aiConfig.mode === 'free') {
    return { client: new ProxyClient(), model: DEFAULT_MODELS.gemini, provider: 'free' };
  }
  switch (aiConfig.provider) {
    case 'openai':
      return { client: new OpenAIClient(aiConfig.apiKey), model: aiConfig.model || DEFAULT_MODELS.openai, provider: 'openai' };
    case 'anthropic':
      return { client: new AnthropicClient(aiConfig.apiKey), model: aiConfig.model || DEFAULT_MODELS.anthropic, provider: 'anthropic' };
    case 'openrouter':
      return { client: new OpenRouterClient(aiConfig.apiKey), model: aiConfig.model || DEFAULT_MODELS.openrouter, provider: 'openrouter' };
    case 'ollama':
      return { client: new OllamaClient(), model: aiConfig.model || ollamaSelectedModel || DEFAULT_MODELS.ollama, provider: 'ollama' };
    case 'gemini':
    default:
      return { client: new GeminiClient(aiConfig.apiKey), model: aiConfig.model || DEFAULT_MODELS.gemini, provider: 'gemini' };
  }
}

export const useAgent = (todos, setTodos, addTodo, toggleTodo, deleteTodo, aiConfig, ollamaSelectedModel, ollamaConnected) => {
  const [agentInput, setAgentInput] = useState('');
  const [agentMessages, setAgentMessages] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(null);
  const [taskSuggestions, setTaskSuggestions] = useState({});
  const [freeUsage, setFreeUsage] = useState(null); // { used, limit }

  const agentRef = useRef(null);
  const clientRef = useRef(null);

  // Keep latest callbacks in a ref so we don't recreate the agent on every render.
  const callbacksRef = useRef({ setTodos, addTodo, toggleTodo, deleteTodo });
  useEffect(() => {
    callbacksRef.current = { setTodos, addTodo, toggleTodo, deleteTodo };
  }, [setTodos, addTodo, toggleTodo, deleteTodo]);

  // (Re)build the agent when the AI config (mode/provider/model/key) changes.
  useEffect(() => {
    const { client, model, provider } = buildClient(aiConfig, ollamaSelectedModel);
    clientRef.current = client;
    const cb = callbacksRef.current;
    agentRef.current = new TaskAgent(
      todos,
      cb.setTodos,
      cb.addTodo,
      cb.toggleTodo,
      cb.deleteTodo,
      { aiClient: client, model, provider }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiConfig.mode, aiConfig.provider, aiConfig.model, aiConfig.apiKey, ollamaSelectedModel]);

  // Keep the agent's task list reference fresh (no agent re-creation).
  useEffect(() => {
    if (agentRef.current) agentRef.current.todos = todos;
  }, [todos]);

  // Fetch today's free-tier usage so the indicator is accurate before sending.
  const refreshUsage = useCallback(async () => {
    if (aiConfig.mode !== 'free' || !supabase) return;
    try {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from('ai_usage')
        .select('message_count')
        .eq('usage_date', today)
        .maybeSingle();
      setFreeUsage({ used: data?.message_count ?? 0, limit: 4 });
    } catch (_) {
      /* ignore */
    }
  }, [aiConfig.mode]);

  useEffect(() => {
    refreshUsage();
  }, [refreshUsage]);

  const handleAgentMessage = async (message) => {
    if (!message.trim() || aiLoading) return;
    if (!agentRef.current) {
      setAgentMessages((prev) => [...prev, {
        role: 'assistant',
        content: 'AI assistant is not ready yet. Please wait a moment and try again.',
        timestamp: new Date().toISOString(),
      }]);
      return;
    }

    const userMessage = { role: 'user', content: message, timestamp: new Date().toISOString() };
    setAgentMessages((prev) => [...prev, userMessage]);
    setAgentInput('');
    setAiLoading(true);

    try {
      const history = agentMessages.slice(-10).map((m) => ({ role: m.role, content: m.content }));
      const result = await agentRef.current.processQuery(message, history);

      setAgentMessages((prev) => [...prev, {
        role: 'assistant',
        content: result.response,
        action: result.action,
        toolResult: result.toolResult,
        timestamp: new Date().toISOString(),
      }]);

      // Update usage from the proxy's last response (free tier).
      if (aiConfig.mode === 'free' && clientRef.current?.lastUsage) {
        setFreeUsage(clientRef.current.lastUsage);
      }
    } catch (error) {
      const capped = error.code === 'DAILY_LIMIT';
      if (capped && error.usage) setFreeUsage(error.usage);
      setAgentMessages((prev) => [...prev, {
        role: 'assistant',
        content: capped
          ? "You've used your 4 free messages for today. Add your own API key in AI Settings to keep going (unlimited), or come back tomorrow."
          : `Error: ${error.message}`,
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleGetSuggestions = async (taskId, taskText) => {
    if (!agentRef.current) return;
    setLoadingSuggestions(taskId);
    try {
      const result = await agentRef.current.getTaskSuggestions(taskText, taskId);
      if (result.success) {
        setTaskSuggestions((prev) => ({ ...prev, [taskId]: result.suggestions }));
      }
      if (aiConfig.mode === 'free' && clientRef.current?.lastUsage) {
        setFreeUsage(clientRef.current.lastUsage);
      }
    } catch (error) {
      console.error('Error getting suggestions:', error);
    } finally {
      setLoadingSuggestions(null);
    }
  };

  return {
    agentInput,
    setAgentInput,
    agentMessages,
    aiLoading,
    handleAgentMessage,
    showSuggestions,
    setShowSuggestions,
    loadingSuggestions,
    taskSuggestions,
    handleGetSuggestions,
    freeUsage,
  };
};
