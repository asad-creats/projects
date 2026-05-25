import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { styles } from './styles/styles';
import { theme } from './styles/theme';
import { getTodayString } from './utils/dateUtils';
import { useTodos } from './hooks/useTodos';
import { useOllama } from './hooks/useOllama';
import { useAgent } from './hooks/useAgent';
import { useAuth } from './hooks/useAuth';
import { useAiConfig } from './hooks/useAiConfig';
import { Login } from './components/Login';
import { TaskStats } from './components/TaskStats';
import { AddTaskForm } from './components/AddTaskForm';
import { FilterBar } from './components/FilterBar';
import { CategoryBar } from './components/CategoryBar';
import { TaskList } from './components/TaskList';
import { AgentChat } from './components/AgentChat';
import { AiSettings } from './components/AiSettings';
import { OnboardingTour } from './components/OnboardingTour';

const TOUR_KEY = 'ai_task_tour_v1';

// Auth gate: show the login screen until the user is signed in, then mount the
// app fresh (so useTodos fetches the now-authenticated user's tasks).
function Todo() {
  const auth = useAuth();

  if (!auth.authReady) {
    return (
      <div style={styles.container}>
        <div style={styles.loader}>Loading…</div>
      </div>
    );
  }

  if (auth.isConfigured && !auth.user) {
    return <Login auth={auth} />;
  }

  return <TodoApp auth={auth} />;
}

function TodoApp({ auth }) {
  // State management
  const [filter, setFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskDate, setNewTaskDate] = useState(getTodayString());
  const [newTaskCategory, setNewTaskCategory] = useState('General');
  const [taskLimitHit, setTaskLimitHit] = useState(false);
  const [showAiSettings, setShowAiSettings] = useState(false);
  const [showTour, setShowTour] = useState(false);

  // Tour anchors
  const addTaskRef = useRef(null);
  const agentRef = useRef(null);
  const settingsBtnRef = useRef(null);

  // AI provider/model config (persisted in localStorage)
  const { config: aiConfig, update: updateAiConfig } = useAiConfig();

  // Responsive: stack panels into one column on narrow screens
  const [isNarrow, setIsNarrow] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 900 : false
  );
  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth < 900);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  
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
  
  const { selectedModel, ollamaConnected } = useOllama();

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
    handleGetSuggestions,
    freeUsage,
  } = useAgent(todos, setTodos, addTodo, toggleTodo, deleteTodo, aiConfig, selectedModel, ollamaConnected);

  // First-visit guided tour: show once per browser, after the app has loaded.
  useEffect(() => {
    if (loading) return;
    try {
      if (!localStorage.getItem(TOUR_KEY)) setShowTour(true);
    } catch {
      /* localStorage unavailable — skip the tour silently */
    }
  }, [loading]);

  const finishTour = () => {
    setShowTour(false);
    try {
      localStorage.setItem(TOUR_KEY, 'done');
    } catch {
      /* ignore */
    }
  };

  const tourSteps = [
    {
      ref: addTaskRef,
      title: '📝 Add your tasks',
      body: 'Type a task, pick a date and category, and hit add. Everything here is private to your account.',
    },
    {
      ref: agentRef,
      title: '🤖 Your AI assistant',
      body: 'Ask in plain English — “add a task to call the bank tomorrow”, “what’s overdue?”, “suggest priorities”. It can create and organize tasks for you.',
    },
    {
      ref: settingsBtnRef,
      title: '🔑 Free tier & your own key',
      body: 'You get 4 free AI messages a day. Need more, or a different model? Open AI Settings (⚙️) to plug in your own API key — that’s unlimited and stays in your browser.',
    },
  ];

  // Handle manual task creation
  const handleManualAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    try {
      const newTask = await addTodo(newTaskText, newTaskDate, newTaskCategory);
      setTaskLimitHit(false);

      // Show suggestions option for the newly created task if AI is available
      if (newTask && aiReady) {
        setShowSuggestions(newTask.id);
      }

      setNewTaskText('');
      setNewTaskDate(getTodayString());
      setNewTaskCategory('General');
    } catch (error) {
      if (error.code === 'TASK_LIMIT') {
        setTaskLimitHit(true);
      } else {
        console.error('Error adding task:', error);
      }
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

  // AI availability based on the selected mode/provider.
  const providerLabels = { gemini: 'Gemini', openai: 'OpenAI', anthropic: 'Claude', openrouter: 'OpenRouter', ollama: 'Ollama' };
  const aiReady =
    aiConfig.mode === 'free'
      ? auth.isConfigured
      : aiConfig.provider === 'ollama'
        ? ollamaConnected
        : !!aiConfig.apiKey;

  const aiSubtitle =
    aiConfig.mode === 'free'
      ? `Free tier${freeUsage ? ` · ${Math.max(0, (freeUsage.limit ?? 4) - (freeUsage.used ?? 0))}/${freeUsage.limit ?? 4} left today` : ''} ${aiReady ? '🟢' : '🔴'}`
      : `${providerLabels[aiConfig.provider]} · ${aiConfig.model || 'default model'} ${aiReady ? '🟢' : '🔴'}`;

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
          <p style={styles.subtitle}>{aiSubtitle}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {auth.user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: theme.textMuted, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {auth.displayName}
              </span>
              <button onClick={auth.signOut} style={styles.backButton}>
                Sign out
              </button>
            </div>
          )}
          <button onClick={() => setShowTour(true)} style={styles.backButton} title="Replay the tour">
            ? Tour
          </button>
          <Link to="/" style={styles.backButton}>
            ← Home
          </Link>
        </div>
      </div>

      {taskLimitHit && (
        <div style={styles.warningBanner}>
          <strong>⚠️ Task limit reached</strong>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
            The free plan is limited to 100 tasks. Delete a few to add more.
          </p>
        </div>
      )}

      {!aiReady && (
        <div style={styles.warningBanner}>
          <strong>⚠️ AI assistant not ready</strong>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
            {aiConfig.mode === 'free'
              ? 'The free tier needs Supabase configured. '
              : aiConfig.provider === 'ollama'
                ? 'Start Ollama on localhost:11434. '
                : 'Add your API key in '}
            <button
              onClick={() => setShowAiSettings(true)}
              style={{ background: 'none', border: 'none', color: theme.accent, cursor: 'pointer', padding: 0, font: 'inherit', textDecoration: 'underline' }}
            >
              AI Settings
            </button>.
          </p>
        </div>
      )}

      <div style={{ ...styles.mainGrid, gridTemplateColumns: isNarrow ? '1fr' : '1fr 1fr' }}>
        {/* Left Panel - Tasks */}
        <div style={styles.leftPanel}>
          <TaskStats stats={stats} loading={loading} />
          
          <div ref={addTaskRef}>
            <AddTaskForm
              newTaskText={newTaskText}
              setNewTaskText={setNewTaskText}
              newTaskDate={newTaskDate}
              setNewTaskDate={setNewTaskDate}
              newTaskCategory={newTaskCategory}
              setNewTaskCategory={setNewTaskCategory}
              onSubmit={handleManualAddTask}
            />
          </div>

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
            ollamaConnected={aiReady}
            loading={loading}
          />
        </div>

        {/* Right Panel - AI Agent */}
        <AgentChat
          messages={agentMessages}
          aiLoading={aiLoading}
          input={agentInput}
          setInput={setAgentInput}
          onSendMessage={handleAgentMessage}
          aiConfig={aiConfig}
          onOpenSettings={() => setShowAiSettings(true)}
          freeUsage={freeUsage}
          ollamaConnected={ollamaConnected}
          quickActions={quickActions}
          isNarrow={isNarrow}
          rootRef={agentRef}
          settingsBtnRef={settingsBtnRef}
        />
      </div>

      {showAiSettings && (
        <AiSettings
          config={aiConfig}
          update={updateAiConfig}
          onClose={() => setShowAiSettings(false)}
        />
      )}

      {showTour && <OnboardingTour steps={tourSteps} onDone={finishTour} />}
    </div>
  );
}

export default Todo;