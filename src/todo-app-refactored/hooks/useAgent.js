import { useState, useRef, useEffect } from 'react';
import { TaskAgent } from '../services/taskAgent';

export const useAgent = (todos, setTodos, addTodo, toggleTodo, deleteTodo, selectedModel, ollamaConnected) => {
  const [agentInput, setAgentInput] = useState('');
  const [agentMessages, setAgentMessages] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(null);
  const [taskSuggestions, setTaskSuggestions] = useState({});
  
  const agentRef = useRef(null);

  // Initialize agent with current model
  useEffect(() => {
    const config = {
      apiKey: import.meta.env.VITE_GEMINI_API_KEY,
      provider: ollamaConnected ? 'ollama' : 'gemini',
      model: ollamaConnected ? selectedModel : 'gemini-1.5-pro'
    };

    agentRef.current = new TaskAgent(
      todos, 
      setTodos, 
      addTodo, 
      toggleTodo, 
      deleteTodo,
      config
    );
  }, [selectedModel, ollamaConnected]);
  
  // Update agent's todos reference when todos change
  useEffect(() => {
    if (agentRef.current) {
      agentRef.current.todos = todos;
    }
  }, [todos]);

  const handleAgentMessage = async (message) => {
    if (!message.trim()) return;

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
    handleGetSuggestions
  };
};
