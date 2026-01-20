import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { styles } from './styles/styles';
import { theme } from './styles/theme';
import { getTodayString } from './utils/dateUtils';
import { useTodos } from './hooks/useTodos';
import { useOllama } from './hooks/useOllama';
import { useAgent } from './hooks/useAgent';
import { TaskStats } from './components/TaskStats';
import { AddTaskForm } from './components/AddTaskForm';
import { FilterBar } from './components/FilterBar';
import { CategoryBar } from './components/CategoryBar';
import { TaskList } from './components/TaskList';
import { AgentChat } from './components/AgentChat';

function Todo() {
  // State management
  const [filter, setFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskDate, setNewTaskDate] = useState(getTodayString());
  const [newTaskCategory, setNewTaskCategory] = useState('General');
  
  // Custom hooks
  const { 
    todos, 
    setTodos, 
    loading, 
    addTodo, 
    toggleTodo, 
    deleteTodo, 
    categories, 
    stats 
  } = useTodos();
  
  const { 
    ollamaModels, 
    selectedModel, 
    setSelectedModel, 
    ollamaConnected 
  } = useOllama();
  
  const {
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
  } = useAgent(todos, setTodos, addTodo, toggleTodo, deleteTodo, selectedModel, ollamaConnected);

  // Handle manual task creation
  const handleManualAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    try {
      const newTask = await addTodo(newTaskText, newTaskDate, newTaskCategory);
      
      // Show suggestions option for the newly created task
      if (ollamaConnected && newTask) {
        setShowSuggestions(newTask.id);
      }
      
      setNewTaskText('');
      setNewTaskDate(getTodayString());
      setNewTaskCategory('General');
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  // Handle suggestions click
  const handleSuggestionsClick = (taskId, taskText) => {
    if (taskSuggestions[taskId]) {
      setShowSuggestions(showSuggestions === taskId ? null : taskId);
    } else {
      handleGetSuggestions(taskId, taskText);
      setShowSuggestions(taskId);
    }
  };

  // Quick actions for AI assistant
  const quickActions = [
    'Show my tasks for today',
    'What are my overdue tasks?',
    'Analyze my productivity',
    'Suggest priorities',
    'Add a task to review budget'
  ];

  // Filter todos
  const filteredTodos = useMemo(() => {
    let filtered = todos;

    // Category filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(todo => todo.category === selectedCategory);
    }

    // Status filter
    switch (filter) {
      case 'active':
        return filtered.filter(todo => !todo.completed);
      case 'completed':
        return filtered.filter(todo => todo.completed);
      default:
        return filtered;
    }
  }, [todos, filter, selectedCategory]);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loader}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>✨ AI Task Manager</h1>
          <p style={styles.subtitle}>
            Powered by Ollama {ollamaConnected ? '🟢' : '🔴'} 
            {ollamaConnected && ` - ${selectedModel}`}
          </p>
        </div>
        <Link to="/" style={styles.backButton}>
          ← Back to Home
        </Link>
      </div>

      {!ollamaConnected && (
        <div style={styles.warningBanner}>
          <strong>⚠️ Ollama not connected</strong>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
            Make sure Ollama is running on localhost:11434. 
            <br />
            Install from <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" style={{ color: theme.accent }}>ollama.ai</a>
          </p>
        </div>
      )}

      <div style={styles.mainGrid}>
        {/* Left Panel - Tasks */}
        <div style={styles.leftPanel}>
          <TaskStats stats={stats} />
          
          <AddTaskForm
            newTaskText={newTaskText}
            setNewTaskText={setNewTaskText}
            newTaskDate={newTaskDate}
            setNewTaskDate={setNewTaskDate}
            newTaskCategory={newTaskCategory}
            setNewTaskCategory={setNewTaskCategory}
            onSubmit={handleManualAddTask}
          />

          <FilterBar filter={filter} setFilter={setFilter} />
          
          <CategoryBar 
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
          />

          <TaskList
            todos={filteredTodos}
            onToggle={toggleTodo}
            onDelete={deleteTodo}
            onSuggestionsClick={handleSuggestionsClick}
            showSuggestions={showSuggestions}
            loadingSuggestions={loadingSuggestions}
            taskSuggestions={taskSuggestions}
            onCloseSuggestions={() => setShowSuggestions(null)}
            onRegenerateSuggestions={handleGetSuggestions}
            ollamaConnected={ollamaConnected}
          />
        </div>

        {/* Right Panel - AI Agent */}
        <AgentChat
          messages={agentMessages}
          aiLoading={aiLoading}
          input={agentInput}
          setInput={setAgentInput}
          onSendMessage={handleAgentMessage}
          ollamaConnected={ollamaConnected}
          ollamaModels={ollamaModels}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          quickActions={quickActions}
        />
      </div>
    </div>
  );
}

export default Todo;