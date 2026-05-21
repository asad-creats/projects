import { useState, useRef, useEffect } from 'react';
import { TaskAgent } from '../services/taskAgent';

export const useAgent = (todos, setTodos, addTodo, toggleTodo, deleteTodo, selectedModel, ollamaConnected) => {
  const [agentInput, setAgentInput] = useState('');
  const [agentMessages, setAgentMessages] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(null);
  const [taskSuggestions, setTaskSuggestions] = useState({});
  const [selectedProvider, setSelectedProvider] = useState('ollama'); // Default to ollama

  const agentRef = useRef(null);

  // Keep latest callbacks in refs so we don't have to recreate the agent on every render
  const callbacksRef = useRef({ setTodos, addTodo, toggleTodo, deleteTodo });
  useEffect(() => {
    callbacksRef.current = { setTodos, addTodo, toggleTodo, deleteTodo };
  }, [setTodos, addTodo, toggleTodo, deleteTodo]);

  // (Re)initialize agent only when provider/model/connection state changes
  useEffect(() => {
    // Determine the actual provider to use
    let effectiveProvider = selectedProvider;
    if (selectedProvider === 'gemini' && !process.env.REACT_APP_GEMINI_API_KEY) {
      effectiveProvider = ollamaConnected ? 'ollama' : 'gemini';
    } else if (selectedProvider === 'ollama' && !ollamaConnected) {
      effectiveProvider = 'gemini';
    }

    const config = {
      apiKey: process.env.REACT_APP_GEMINI_API_KEY,
      provider: effectiveProvider,
      model: effectiveProvider === 'ollama' ? selectedModel : 'gemini-1.5-pro'
    };

    const cb = callbacksRef.current;
    agentRef.current = new TaskAgent(
      todos,
      cb.setTodos,
      cb.addTodo,
      cb.toggleTodo,
      cb.deleteTodo,
      config
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModel, ollamaConnected, selectedProvider]);

  // Update agent's todos reference when todos change (no agent re-creation)
  useEffect(() => {
    if (agentRef.current) {
      agentRef.current.todos = todos;
    }
  }, [todos]);

  const handleAgentMessage = async (message) => {
    if (!message.trim() || aiLoading) return;
    if (!agentRef.current) {
      setAgentMessages(prev => [...prev, {
        role: 'assistant',
        content: 'AI assistant is not ready yet. Please wait a moment and try again.',
        timestamp: new Date().toISOString()
      }]);
      return;
    }

    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    setAgentMessages(prev => [...prev, userMessage]);
    setAgentInput('');
    setAiLoading(true);

    try {
      const history = agentMessages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const result = await agentRef.current.processQuery(message, history);

      const agentMessage = {
        role: 'assistant',
        content: result.response,
        action: result.action,
        toolResult: result.toolResult,
        timestamp: new Date().toISOString()
      };

      setAgentMessages(prev => [...prev, agentMessage]);
    } catch (error) {
      const errorMessage = {
        role: 'assistant',
        content: `Error: ${error.message}`,
        timestamp: new Date().toISOString()
      };
      setAgentMessages(prev => [...prev, errorMessage]);
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
        setTaskSuggestions(prev => ({
          ...prev,
          [taskId]: result.suggestions
        }));
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
    selectedProvider,
    setSelectedProvider
  };
};
