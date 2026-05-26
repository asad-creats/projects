import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getTodayString, isOverdue } from './utils/dateUtils';
import { relativeDue } from './utils/tally';
import { useTodos } from './hooks/useTodos';
import { useOllama } from './hooks/useOllama';
import { useAgent } from './hooks/useAgent';
import { useAuth } from './hooks/useAuth';
import { useAiConfig } from './hooks/useAiConfig';
import { Login } from './components/Login';
import { TaskStats } from './components/TaskStats';
import { AddTaskForm } from './components/AddTaskForm';
import { FilterBar } from './components/FilterBar';
import { TaskList } from './components/TaskList';
import { AgentChat } from './components/AgentChat';
import { AiSettings } from './components/AiSettings';
import { OnboardingTour } from './components/OnboardingTour';
import { Icon } from './components/TallyIcons';

const TOUR_KEY = 'ai_task_tour_v1';

const isDueToday = (date) => relativeDue(date).label === 'Today';

// Auth gate: show the login screen until the user is signed in, then mount the
// app fresh (so useTodos fetches the now-authenticated user's tasks).
function Todo() {
  const auth = useAuth();

  if (!auth.authReady) {
    return <div className="tally-loader">Loading…</div>;
  }
  if (auth.isConfigured && !auth.user) {
    return <Login auth={auth} />;
  }
  return <TodoApp auth={auth} />;
}

function TodoApp({ auth }) {
  const [filter, setFilter] = useState('all');
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskDate, setNewTaskDate] = useState(getTodayString());
  const [newTaskCategory, setNewTaskCategory] = useState('General');
  const [taskLimitHit, setTaskLimitHit] = useState(false);
  const [showAiSettings, setShowAiSettings] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [showAI, setShowAI] = useState(true);

  const addTaskRef = useRef(null);
  const agentRef = useRef(null);
  const settingsBtnRef = useRef(null);

  const { config: aiConfig, update: updateAiConfig } = useAiConfig();

  const {
    todos, setTodos, loading,
    addTodo, toggleTodo, deleteTodo,
  } = useTodos();

  const { selectedModel, ollamaConnected } = useOllama();

  const {
    agentInput, setAgentInput, agentMessages, aiLoading, handleAgentMessage,
    showSuggestions, setShowSuggestions, loadingSuggestions, taskSuggestions,
    handleGetSuggestions, freeUsage,
  } = useAgent(todos, setTodos, addTodo, toggleTodo, deleteTodo, aiConfig, selectedModel, ollamaConnected);

  // First-visit guided tour
  useEffect(() => {
    if (loading) return;
    try {
      if (!localStorage.getItem(TOUR_KEY)) setShowTour(true);
    } catch { /* localStorage unavailable */ }
  }, [loading]);

  const finishTour = () => {
    setShowTour(false);
    try { localStorage.setItem(TOUR_KEY, 'done'); } catch { /* ignore */ }
  };

  const tourSteps = [
    { ref: addTaskRef, title: '📝 Add your tasks', body: 'Type a task, pick a date and category, and hit add. Everything here is private to your account.' },
    { ref: agentRef, title: '🤖 Your AI assistant', body: 'Ask in plain English — “add a task to call the bank tomorrow”, “what’s overdue?”, “suggest priorities”. It can create and organize tasks for you.' },
    { ref: settingsBtnRef, title: '🔑 Free tier & your own key', body: 'You get free AI messages a day. Need more, or a different model? Open AI Settings (⚙️) to plug in your own API key — unlimited, stays in your browser.' },
  ];

  const aiReady =
    aiConfig.mode === 'free'
      ? auth.isConfigured
      : aiConfig.provider === 'ollama'
        ? ollamaConnected
        : !!aiConfig.apiKey;

  const handleManualAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    try {
      const newTask = await addTodo(newTaskText, newTaskDate, newTaskCategory);
      setTaskLimitHit(false);
      if (newTask && aiReady) setShowSuggestions(newTask.id);
      setNewTaskText('');
      setNewTaskDate(getTodayString());
      setNewTaskCategory('General');
    } catch (error) {
      if (error.code === 'TASK_LIMIT') setTaskLimitHit(true);
      else console.error('Error adding task:', error);
    }
  };

  const handleSuggestionsClick = (taskId, taskText) => {
    if (taskSuggestions[taskId]) {
      setShowSuggestions(showSuggestions === taskId ? null : taskId);
    } else {
      handleGetSuggestions(taskId, taskText);
      setShowSuggestions(taskId);
    }
  };

  const quickActions = [
    'Show my tasks for today',
    'What are my overdue tasks?',
    'Analyze my productivity',
    'Suggest priorities',
    'Add a task to review budget',
  ];

  // ── Counts for filter tabs ──
  const counts = useMemo(() => ({
    all: todos.length,
    active: todos.filter((t) => !t.completed).length,
    today: todos.filter((t) => !t.completed && isDueToday(t.date)).length,
    overdue: todos.filter((t) => isOverdue(t.date, t.completed)).length,
    done: todos.filter((t) => t.completed).length,
  }), [todos]);

  // ── Visible set by filter ──
  const visible = useMemo(() => todos.filter((t) => {
    if (filter === 'active') return !t.completed;
    if (filter === 'today') return !t.completed && isDueToday(t.date);
    if (filter === 'overdue') return isOverdue(t.date, t.completed);
    if (filter === 'done') return t.completed;
    return true;
  }), [todos, filter]);

  // ── Auto-grouped sections ──
  const sections = useMemo(() => {
    const overdue = visible.filter((t) => isOverdue(t.date, t.completed));
    const today = visible.filter((t) => !t.completed && isDueToday(t.date));
    const upcoming = visible.filter((t) => !t.completed && !isOverdue(t.date, t.completed) && !isDueToday(t.date));
    const done = visible.filter((t) => t.completed);
    return [
      { id: 'overdue', label: 'Overdue', items: overdue },
      { id: 'today', label: 'Today', items: today },
      { id: 'upcoming', label: 'Upcoming', items: upcoming },
      { id: 'done', label: 'Completed', items: done },
    ].filter((s) => s.items.length);
  }, [visible]);

  // ── Stats strip ──
  const todayTotal = todos.filter((t) => isDueToday(t.date)).length;
  const doneToday = todos.filter((t) => isDueToday(t.date) && t.completed).length;
  const completionPct = todayTotal ? Math.round((doneToday / todayTotal) * 100) : 0;

  // ── Greeting ──
  const rawName = (auth.displayName || 'there').split('@')[0].split(' ')[0];
  const name = rawName.charAt(0).toUpperCase() + rawName.slice(1);
  const hour = new Date().getHours();
  const greet = hour < 5 ? 'Still up' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const now = new Date();
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
  const week = Math.ceil(dayOfYear / 7);
  const pctYear = Math.round((dayOfYear / 365) * 100);

  if (loading) {
    return <div className="tally-loader">Loading your tasks…</div>;
  }

  return (
    <div className="app" style={{ gridTemplateColumns: showAI ? '1fr 380px' : '1fr' }}>
      <div>
        {/* Topbar */}
        <div className="topbar">
          <div className="brand">
            <div className="logo">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8.5l3 3L13 4.5" />
              </svg>
            </div>
            <div className="brand-name">Tally</div>
            <nav className="topnav" style={{ marginLeft: 24 }}>
              <button className={`pill ${filter === 'today' ? 'active' : ''}`} onClick={() => setFilter('today')}>Today</button>
              <button className={`pill ${filter === 'active' ? 'active' : ''}`} onClick={() => setFilter('active')}>Upcoming</button>
              <button className={`pill ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
              <button className={`pill ${filter === 'done' ? 'active' : ''}`} onClick={() => setFilter('done')}>Archive</button>
            </nav>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button className="pill" title="Replay tour" onClick={() => setShowTour(true)}><Icon.help style={{ width: 15, height: 15 }} /></button>
            <button ref={settingsBtnRef} className="pill" title="AI settings" onClick={() => setShowAiSettings(true)}><Icon.settings style={{ width: 15, height: 15 }} /></button>
            <Link to="/" className="pill" title="Home"><Icon.home style={{ width: 15, height: 15 }} /></Link>
            <div className="user">
              <span>{name}</span>
              <span className="av">{name.charAt(0)}</span>
            </div>
            <button className="pill" title="Sign out" onClick={auth.signOut}><Icon.logout style={{ width: 15, height: 15 }} /></button>
          </div>
        </div>

        <main className="main">
          <div className="grid-meta">
            <div>
              <h1 className="greeting">
                {greet}, <em>{name}.</em><br />
                You have <span className="accent tnum">{counts.today}</span> {counts.today === 1 ? 'thing' : 'things'} today.
              </h1>
              <div className="date-line">
                <span>{dateStr}</span>
                <span className="dot" />
                <span>Week {week} · {pctYear}% of the year</span>
                {!showAI && (
                  <>
                    <span className="dot" />
                    <button className="linkish" onClick={() => setShowAI(true)}>Open Tally AI →</button>
                  </>
                )}
              </div>
            </div>
          </div>

          {taskLimitHit && (
            <div className="tally-banner">
              <strong>Task limit reached.</strong> The free plan is limited to 100 tasks — delete a few to add more.
            </div>
          )}
          {!aiReady && (
            <div className="tally-banner">
              <strong>AI assistant not ready.</strong>{' '}
              {aiConfig.mode === 'free'
                ? 'The free tier needs Supabase configured. '
                : aiConfig.provider === 'ollama'
                  ? 'Start Ollama on localhost:11434. '
                  : 'Add your API key in '}
              <button className="linkish" onClick={() => setShowAiSettings(true)}>AI Settings</button>.
            </div>
          )}

          <TaskStats
            today={counts.today}
            completed={counts.done}
            inProgress={counts.active - counts.today}
            overdue={counts.overdue}
            completionPct={completionPct}
          />

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

          <FilterBar filter={filter} setFilter={setFilter} counts={counts} />

          <TaskList
            sections={sections}
            total={todos.length}
            onToggle={toggleTodo}
            onDelete={deleteTodo}
            onSuggestionsClick={handleSuggestionsClick}
            showSuggestions={showSuggestions}
            loadingSuggestions={loadingSuggestions}
            taskSuggestions={taskSuggestions}
            onCloseSuggestions={() => setShowSuggestions(null)}
            onRegenerateSuggestions={handleGetSuggestions}
            ollamaConnected={aiReady}
          />
        </main>
      </div>

      {showAI && (
        <AgentChat
          messages={agentMessages}
          aiLoading={aiLoading}
          input={agentInput}
          setInput={setAgentInput}
          onSendMessage={handleAgentMessage}
          aiConfig={aiConfig}
          onOpenSettings={() => setShowAiSettings(true)}
          onClose={() => setShowAI(false)}
          freeUsage={freeUsage}
          ollamaConnected={ollamaConnected}
          quickActions={quickActions}
          rootRef={agentRef}
          settingsBtnRef={settingsBtnRef}
        />
      )}

      {showAiSettings && (
        <AiSettings config={aiConfig} update={updateAiConfig} onClose={() => setShowAiSettings(false)} />
      )}

      {showTour && <OnboardingTour steps={tourSteps} onDone={finishTour} />}
    </div>
  );
}

export default Todo;
