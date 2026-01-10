import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

/* ==================== THEME ==================== */
const theme = {
  bg: '#0a0a0f',
  surface: '#13131a',
  surfaceHover: '#1a1a24',
  accent: '#6366f1',
  accentHover: '#4f46e5',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  glass: 'rgba(99, 102, 241, 0.05)',
  glassBorder: 'rgba(99, 102, 241, 0.1)',
  border: 'rgba(148, 163, 184, 0.1)',
  gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)',
  gradientHover: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #c026d3 100%)',
};

/* ==================== UTILITY FUNCTIONS ==================== */
const formatDate = (dateString) => {
  const date = new Date(dateString + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);
  
  if (dateOnly.getTime() === today.getTime()) {
    return 'Today';
  } else if (dateOnly.getTime() === tomorrow.getTime()) {
    return 'Tomorrow';
  } else {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  }
};

const getTodayString = () => new Date().toISOString().split('T')[0];

const isOverdue = (dateString, completed) => {
  if (completed) return false;
  return dateString < getTodayString();
};

/* ==================== COMPONENTS ==================== */

const AiLoader = () => (
  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
    <span style={{ fontSize: '0.75rem', color: theme.accent, fontWeight: '500' }}>
      Analyzing
    </span>
    {[0, 1, 2].map(i => (
      <span
        key={i}
        style={{
          width: '5px',
          height: '5px',
          background: theme.accent,
          borderRadius: '50%',
          animation: 'aiPulse 1.4s infinite',
          animationDelay: `${i * 0.2}s`,
        }}
      />
    ))}
  </div>
);

const EmptyState = ({ activeTab, onCreateTask }) => {
  const messages = {
    all: { icon: '📝', title: 'No tasks yet', desc: 'Create your first task to get started' },
    today: { icon: '🌅', title: 'All clear for today', desc: 'No tasks scheduled for today' },
    completed: { icon: '🎯', title: 'No completed tasks', desc: 'Complete some tasks to see them here' },
    pending: { icon: '⏳', title: 'No pending tasks', desc: 'All caught up!' },
  };
  
  const msg = messages[activeTab] || messages.all;
  
  return (
    <div style={styles.emptyState}>
      <div style={{ fontSize: '4rem', marginBottom: '1.5rem', opacity: 0.5 }}>
        {msg.icon}
      </div>
      <h3 style={{ 
        marginBottom: '0.5rem', 
        fontSize: '1.25rem',
        color: theme.text 
      }}>
        {msg.title}
      </h3>
      <p style={{ 
        color: theme.textMuted, 
        marginBottom: '2rem',
        fontSize: '0.875rem'
      }}>
        {msg.desc}
      </p>
      {activeTab !== 'completed' && (
        <button onClick={onCreateTask} style={styles.emptyStateButton}>
          <span style={{ fontSize: '1.2rem' }}>+</span>
          Create Task
        </button>
      )}
    </div>
  );
};

const StatBadge = ({ count, type }) => {
  const getStyle = () => {
    switch(type) {
      case 'overdue':
        return { bg: 'rgba(239, 68, 68, 0.1)', color: theme.danger, border: 'rgba(239, 68, 68, 0.2)' };
      case 'today':
        return { bg: 'rgba(99, 102, 241, 0.1)', color: theme.accent, border: 'rgba(99, 102, 241, 0.2)' };
      default:
        return { bg: theme.glass, color: theme.textSecondary, border: theme.glassBorder };
    }
  };
  
  const style = getStyle();
  
  return (
    <span style={{
      background: style.bg,
      color: style.color,
      border: `1px solid ${style.border}`,
      fontSize: '0.7rem',
      padding: '3px 10px',
      borderRadius: '14px',
      fontWeight: '600',
      minWidth: '28px',
      textAlign: 'center',
      display: 'inline-block'
    }}>
      {count}
    </span>
  );
};

/* ==================== MAIN COMPONENT ==================== */

function Todo() {
  // State
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [aiLoadingId, setAiLoadingId] = useState(null);
  const [tempSuggestions, setTempSuggestions] = useState({});
  const [hoveredTodoId, setHoveredTodoId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editCategory, setEditCategory] = useState('');

  // Fetch todos on mount
  useEffect(() => { 
    fetchTodos(); 
  }, []);

  // Fetch todos from Supabase
  const fetchTodos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTodos(data || []);
    } catch (error) {
      console.error('Error fetching todos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add new todo
  const addTodo = async () => {
    if (!input.trim()) return;
    
    const finalDate = date || getTodayString();
    
    try {
      const { data, error } = await supabase
        .from('todos')
        .insert([{
          text: input.trim(),
          date: finalDate,
          category: category.trim() || 'General',
          completed: false,
          notes: ''
        }])
        .select();

      if (error) throw error;
      
      setTodos([data[0], ...todos]);
      setInput('');
      setDate('');
      setCategory('');
      setActiveTab('all');
    } catch (error) {
      console.error('Error adding todo:', error);
      alert('Failed to add task. Please try again.');
    }
  };

  // Toggle todo completion
  const toggleTodo = useCallback(async (id, currentStatus) => {
    // Optimistic update
    setTodos(prev => prev.map(t => 
      t.id === id ? { ...t, completed: !t.completed } : t
    ));
    
    try {
      const { error } = await supabase
        .from('todos')
        .update({ completed: !currentStatus })
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error toggling todo:', error);
      // Revert on error
      setTodos(prev => prev.map(t => 
        t.id === id ? { ...t, completed: currentStatus } : t
      ));
    }
  }, []);

  // Start editing
  const startEdit = (todo) => {
    setEditingId(todo.id);
    setEditText(todo.text);
    setEditDate(todo.date);
    setEditCategory(todo.category);
  };

  // Save edit
  const saveEdit = async (id) => {
    if (!editText.trim()) return;
    
    try {
      const { error } = await supabase
        .from('todos')
        .update({ 
          text: editText.trim(),
          date: editDate,
          category: editCategory.trim()
        })
        .eq('id', id);
      
      if (error) throw error;
      
      setTodos(todos.map(t => 
        t.id === id ? { 
          ...t, 
          text: editText.trim(),
          date: editDate,
          category: editCategory.trim()
        } : t
      ));
      
      cancelEdit();
    } catch (error) {
      console.error('Error updating todo:', error);
      alert('Failed to update task. Please try again.');
    }
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
    setEditDate('');
    setEditCategory('');
  };

  // Delete todo
  const deleteTodo = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    
    // Optimistic delete
    setTodos(prev => prev.filter(t => t.id !== id));
    
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting todo:', error);
      fetchTodos(); // Refetch on error
    }
  };

  // Get AI suggestions
  const getAiSuggestion = async (todo) => {
    setAiLoadingId(todo.id);
    
    try {
      const res = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.2',
          prompt: `Task: "${todo.text}". Provide 3 actionable, specific tips to complete this efficiently. Format as bullet points.`,
          stream: false,
        })
      });
      
      if (!res.ok) throw new Error('AI service unavailable');
      
      const data = await res.json();
      setTempSuggestions(prev => ({ 
        ...prev, 
        [todo.id]: data.response 
      }));
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      // Fallback suggestions
      setTempSuggestions(prev => ({ 
        ...prev, 
        [todo.id]: "• Break the task into smaller, manageable steps\n• Set a specific deadline and time block\n• Remove distractions and focus on one thing at a time"
      }));
    } finally {
      setAiLoadingId(null);
    }
  };

  // Save AI note
  const saveNote = async (id, noteText) => {
    try {
      const { error } = await supabase
        .from('todos')
        .update({ notes: noteText })
        .eq('id', id);
      
      if (error) throw error;
      
      setTodos(todos.map(t => 
        t.id === id ? { ...t, notes: noteText } : t
      ));
      
      setTempSuggestions(prev => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save notes. Please try again.');
    }
  };

  // Discard AI suggestion
  const discardSuggestion = (id) => {
    setTempSuggestions(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  // Calculate task counts (memoized)
  const taskCounts = useMemo(() => {
    const today = getTodayString();
    
    return {
      all: todos.length,
      today: todos.filter(t => t.date === today && !t.completed).length,
      completed: todos.filter(t => t.completed).length,
      pending: todos.filter(t => !t.completed).length,
      overdue: todos.filter(t => isOverdue(t.date, t.completed)).length,
    };
  }, [todos]);

  // Filter tasks based on active tab (memoized)
  const filteredTasks = useMemo(() => {
    const today = getTodayString();
    
    switch(activeTab) {
      case 'today':
        return todos.filter(t => t.date === today && !t.completed);
      case 'completed':
        return todos.filter(t => t.completed);
      case 'pending':
        return todos.filter(t => !t.completed);
      default:
        return todos;
    }
  }, [todos, activeTab]);

  // Navigation items
  const navItems = [
    { id: 'all', label: 'All Tasks', icon: '📋', count: taskCounts.all },
    { id: 'today', label: "Today", icon: '⭐', count: taskCounts.today },
    { id: 'pending', label: 'Pending', icon: '⏳', count: taskCounts.pending },
    { id: 'completed', label: 'Completed', icon: '✓', count: taskCounts.completed },
  ];

  return (
    <div style={styles.container}>
      <style>{keyframesCSS}</style>
      
      {/* SIDEBAR */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h2 style={styles.logo}>
            <span style={styles.logoGradient}>TASKFLOW</span>
            <span style={styles.logoBadge}>AI</span>
          </h2>
          <p style={styles.logoSubtext}>
            Smart task management
          </p>
        </div>

        <nav style={styles.nav}>
          {navItems.map(({ id, label, icon, count }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                ...styles.navButton,
                ...(activeTab === id ? styles.navButtonActive : {}),
              }}
            >
              <span style={styles.navButtonContent}>
                <span style={styles.navIcon}>{icon}</span>
                <span>{label}</span>
              </span>
              <StatBadge 
                count={count} 
                type={id === 'today' && count > 0 ? 'today' : null}
              />
            </button>
          ))}
        </nav>

        <div style={styles.sidebarFooter}>
          <button 
            onClick={() => setActiveTab('add')}
            style={styles.createButton}
          >
            <span style={{ fontSize: '1.2rem', fontWeight: '300' }}>+</span>
            New Task
          </button>
          
          {taskCounts.overdue > 0 && (
            <div style={styles.overdueAlert}>
              <span style={{ fontSize: '1.2rem' }}>⚠️</span>
              <div style={{ flex: 1 }}>
                <div style={styles.overdueText}>
                  {taskCounts.overdue} overdue task{taskCounts.overdue !== 1 ? 's' : ''}
                </div>
                <div style={styles.overdueSubtext}>
                  Needs attention
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.pageTitle}>
              {activeTab === 'all' ? 'All Tasks' :
               activeTab === 'today' ? "Today's Tasks" :
               activeTab === 'pending' ? 'Pending Tasks' :
               activeTab === 'completed' ? 'Completed Tasks' :
               'Create New Task'}
            </h1>
            <p style={styles.pageSubtitle}>
              {activeTab === 'add' 
                ? 'Add a new task to stay organized'
                : `${filteredTasks.length} task${filteredTasks.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          
          <div style={styles.headerActions}>
            <div style={styles.dateDisplay}>
              <span style={{ fontSize: '1rem', marginRight: '0.5rem' }}>📅</span>
              {new Date().toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
            <Link to="/" style={styles.logoutButton}>
              Logout
            </Link>
          </div>
        </header>

        <div style={styles.content}>
          {activeTab === 'add' ? (
            /* CREATE TASK FORM */
            <div style={styles.createForm}>
              <h3 style={styles.formTitle}>Create New Task</h3>
              
              <div style={styles.formFields}>
                <div style={{ width: '100%' }}>
                  <label style={styles.label}>Task Description</label>
                  <input 
                    placeholder="What needs to be done?" 
                    value={input} 
                    onChange={e => setInput(e.target.value)}
                    style={styles.input}
                    onKeyPress={(e) => e.key === 'Enter' && addTodo()}
                    autoFocus
                  />
                </div>
                
                <div style={styles.formRow}>
                  <div style={{ width: '100%' }}>
                    <label style={styles.label}>Due Date</label>
                    <input 
                      type="date" 
                      value={date} 
                      onChange={e => setDate(e.target.value)}
                      style={styles.input}
                      min={getTodayString()}
                    />
                  </div>
                  <div style={{ width: '100%' }}>
                    <label style={styles.label}>Category</label>
                    <input 
                      placeholder="e.g., Work, Personal" 
                      value={category} 
                      onChange={e => setCategory(e.target.value)}
                      style={styles.input}
                      list="categories"
                    />
                    <datalist id="categories">
                      <option value="Work" />
                      <option value="Personal" />
                      <option value="Health" />
                      <option value="Finance" />
                      <option value="Learning" />
                    </datalist>
                  </div>
                </div>
                
                <button 
                  onClick={addTodo}
                  disabled={!input.trim()}
                  style={{
                    ...styles.submitButton,
                    opacity: !input.trim() ? 0.5 : 1,
                    cursor: !input.trim() ? 'not-allowed' : 'pointer'
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>+</span>
                  Add Task
                </button>
              </div>
            </div>
          ) : loading ? (
            /* LOADING STATE */
            <div style={styles.loadingState}>
              <div style={styles.spinner} />
              <p style={{ marginTop: '1rem', color: theme.textMuted }}>
                Loading tasks...
              </p>
            </div>
          ) : filteredTasks.length === 0 ? (
            /* EMPTY STATE */
            <EmptyState 
              activeTab={activeTab} 
              onCreateTask={() => setActiveTab('add')}
            />
          ) : (
            /* TASKS LIST */
            <div style={styles.tasksList}>
              {filteredTasks.map(todo => (
                <div
                  key={todo.id}
                  style={styles.taskWrapper}
                  onMouseEnter={() => setHoveredTodoId(todo.id)}
                  onMouseLeave={() => setHoveredTodoId(null)}
                >
                  {editingId === todo.id ? (
                    /* EDIT MODE */
                    <div style={styles.editCard}>
                      <div style={styles.formFields}>
                        <div style={{ width: '100%' }}>
                          <input 
                            value={editText}
                            onChange={e => setEditText(e.target.value)}
                            style={styles.input}
                            placeholder="Edit task..."
                            onKeyPress={(e) => e.key === 'Enter' && saveEdit(todo.id)}
                            autoFocus
                          />
                        </div>
                        
                        <div style={styles.formRow}>
                          <div style={{ width: '100%' }}>
                            <label style={styles.label}>Due Date</label>
                            <input 
                              type="date" 
                              value={editDate} 
                              onChange={e => setEditDate(e.target.value)}
                              style={styles.input}
                            />
                          </div>
                          <div style={{ width: '100%' }}>
                            <label style={styles.label}>Category</label>
                            <input 
                              value={editCategory}
                              onChange={e => setEditCategory(e.target.value)}
                              style={styles.input}
                              placeholder="Category"
                            />
                          </div>
                        </div>
                        
                        <div style={styles.editActions}>
                          <button 
                            onClick={() => saveEdit(todo.id)}
                            disabled={!editText.trim()}
                            style={styles.saveButton}
                          >
                            ✓ Save
                          </button>
                          <button 
                            onClick={cancelEdit}
                            style={styles.cancelButton}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* TASK CARD */
                    <div style={{
                      ...styles.taskCard,
                      ...(hoveredTodoId === todo.id ? styles.taskCardHover : {}),
                      borderLeft: todo.completed 
                        ? `4px solid ${theme.success}` 
                        : isOverdue(todo.date, todo.completed)
                        ? `4px solid ${theme.danger}` 
                        : `4px solid ${theme.accent}`
                    }}>
                      <div style={styles.taskContent}>
                        <button
                          onClick={() => toggleTodo(todo.id, todo.completed)}
                          style={{
                            ...styles.checkbox,
                            borderColor: todo.completed ? theme.success : theme.textMuted,
                            background: todo.completed ? theme.success : 'transparent',
                          }}
                        >
                          {todo.completed && (
                            <span style={styles.checkmark}>✓</span>
                          )}
                        </button>
                        
                        <div style={{ flex: 1 }}>
                          <div style={{ 
                            ...styles.taskText,
                            textDecoration: todo.completed ? 'line-through' : 'none',
                            color: todo.completed ? theme.textMuted : theme.text,
                          }}>
                            {todo.text}
                          </div>
                          
                          <div style={styles.taskMeta}>
                            <span style={styles.taskDate}>
                              📅 {formatDate(todo.date)}
                              {isOverdue(todo.date, todo.completed) && (
                                <span style={styles.overdueLabel}>
                                  Overdue
                                </span>
                              )}
                            </span>
                            
                            <span style={styles.taskCategory}>
                              {todo.category}
                            </span>
                            
                            {todo.notes && (
                              <span style={styles.notesIndicator}>
                                📝 Has notes
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* ACTION BUTTONS */}
                      <div style={styles.taskActions}>
                        <button 
                          onClick={() => getAiSuggestion(todo)}
                          disabled={aiLoadingId === todo.id}
                          style={styles.aiButton}
                          title="Get AI suggestions"
                        >
                          {aiLoadingId === todo.id ? <AiLoader /> : '✨ AI'}
                        </button>
                        
                        <button 
                          onClick={() => startEdit(todo)}
                          style={styles.editButton}
                          title="Edit task"
                        >
                          ✏️
                        </button>
                        
                        <button 
                          onClick={() => deleteTodo(todo.id)}
                          style={styles.deleteButton}
                          title="Delete task"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  )}

                  {/* AI SUGGESTIONS */}
                  {tempSuggestions[todo.id] && (
                    <div style={styles.suggestionsBox}>
                      <div style={styles.suggestionsHeader}>
                        <div style={styles.suggestionsTitle}>
                          <span style={{ fontSize: '1rem' }}>🤖</span>
                          AI Suggestions
                        </div>
                        <div style={styles.suggestionsHint}>
                          Review and save to notes
                        </div>
                      </div>
                      
                      <div style={styles.suggestionsContent}>
                        <ul style={styles.suggestionsList}>
                          {tempSuggestions[todo.id]
                            .split('\n')
                            .filter(Boolean)
                            .map((line, i) => (
                              <li key={i}>
                                {line.replace(/^[-•*]\s*/, '')}
                              </li>
                            ))}
                        </ul>
                      </div>
                      
                      <div style={styles.suggestionsActions}>
                        <button 
                          onClick={() => saveNote(todo.id, tempSuggestions[todo.id])}
                          style={styles.saveNoteButton}
                        >
                          💾 Save to Notes
                        </button>
                        <button 
                          onClick={() => discardSuggestion(todo.id)}
                          style={styles.discardButton}
                        >
                          Discard
                        </button>
                      </div>
                    </div>
                  )}

                  {/* SAVED NOTES */}
                  {todo.notes && hoveredTodoId === todo.id && !tempSuggestions[todo.id] && (
                    <div style={styles.notesBox}>
                      <div style={styles.notesTitle}>
                        <span style={{ fontSize: '1rem' }}>📝</span>
                        Saved Notes
                      </div>
                      <ul style={styles.notesList}>
                        {todo.notes.split('\n').filter(Boolean).map((line, i) => (
                          <li key={i}>{line.replace(/^[-•*]\s*/, '')}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/* ==================== STYLES ==================== */

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    background: theme.bg,
    color: theme.text,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "SF Pro Display", Roboto, sans-serif',
  },
  
  /* Sidebar */
  sidebar: {
    width: '280px',
    background: theme.surface,
    padding: '2rem 1.5rem',
    borderRight: `1px solid ${theme.border}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
    position: 'sticky',
    top: 0,
    height: '100vh',
    overflowY: 'auto',
  },
  
  sidebarHeader: {
    paddingBottom: '1rem',
    borderBottom: `1px solid ${theme.border}`,
  },
  
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.5rem',
    fontSize: '1.5rem',
    fontWeight: '700',
    letterSpacing: '-0.02em',
  },
  
  logoGradient: {
    background: theme.gradient,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  
  logoBadge: {
    fontSize: '0.65rem',
    background: theme.gradient,
    color: 'white',
    padding: '3px 8px',
    borderRadius: '6px',
    fontWeight: '700',
    letterSpacing: '0.05em',
  },
  
  logoSubtext: {
    color: theme.textMuted,
    fontSize: '0.8rem',
    fontWeight: '400',
  },
  
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  
  navButton: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.875rem 1rem',
    background: 'transparent',
    border: 'none',
    borderLeft: '3px solid transparent',
    borderRadius: '0 8px 8px 0',
    color: theme.textSecondary,
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'left',
    fontFamily: 'inherit',
  },
  
  navButtonActive: {
    background: theme.glass,
    borderLeftColor: theme.accent,
    color: theme.accent,
  },
  
  navButtonContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  
  navIcon: {
    fontSize: '1.1rem',
    display: 'flex',
    alignItems: 'center',
  },
  
  sidebarFooter: {
    marginTop: 'auto',
    paddingTop: '1rem',
    borderTop: `1px solid ${theme.border}`,
  },
  
  createButton: {
    width: '100%',
    padding: '0.875rem 1rem',
    background: theme.gradient,
    border: 'none',
    borderRadius: '10px',
    color: 'white',
    fontWeight: '600',
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontFamily: 'inherit',
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)',
  },
  
  overdueAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    background: 'rgba(239, 68, 68, 0.1)',
    border: `1px solid rgba(239, 68, 68, 0.2)`,
    borderRadius: '10px',
    padding: '0.875rem',
    marginTop: '1rem',
  },
  
  overdueText: {
    fontSize: '0.8rem',
    color: theme.danger,
    fontWeight: '600',
  },
  
  overdueSubtext: {
    fontSize: '0.7rem',
    color: theme.textMuted,
    marginTop: '2px',
  },
  
  /* Main Content */
  main: {
    flex: 1,
    padding: '3rem',
    overflowY: 'auto',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
  },
  
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2.5rem',
    animation: 'fadeIn 0.5s ease',
  },
  
  pageTitle: {
    fontSize: '2rem',
    fontWeight: '700',
    marginBottom: '0.5rem',
    letterSpacing: '-0.02em',
    background: theme.gradient,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    display: 'inline-block',
  },
  
  pageSubtitle: {
    color: theme.textMuted,
    fontSize: '0.875rem',
    fontWeight: '400',
  },
  
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  
  dateDisplay: {
    padding: '0.5rem 1rem',
    background: theme.glass,
    border: `1px solid ${theme.glassBorder}`,
    borderRadius: '8px',
    fontSize: '0.875rem',
    color: theme.textSecondary,
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
  },
  
  logoutButton: {
    padding: '0.5rem 1rem',
    background: 'transparent',
    border: `1px solid ${theme.border}`,
    borderRadius: '8px',
    color: theme.accent,
    textDecoration: 'none',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    display: 'inline-block',
  },
  
  content: {
    animation: 'slideIn 0.3s ease',
  },
  
  /* Create Form */
  createForm: {
    background: theme.surface,
    padding: '2.5rem',
    borderRadius: '16px',
    border: `1px solid ${theme.border}`,
    maxWidth: '600px',
    margin: '0 auto',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.2)',
  },
  
  formTitle: {
    marginBottom: '2rem',
    color: theme.accent,
    fontSize: '1.25rem',
    fontWeight: '600',
  },
  
  formFields: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
  },
  
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontSize: '0.8rem',
    color: theme.textSecondary,
    fontWeight: '500',
    letterSpacing: '0.01em',
  },
  
  input: {
    width: '100%',
    padding: '0.875rem 1rem',
    background: theme.bg,
    border: `1px solid ${theme.border}`,
    borderRadius: '10px',
    color: theme.text,
    fontSize: '0.875rem',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
  },
  
  submitButton: {
    width: '100%',
    padding: '1rem',
    background: theme.gradient,
    border: 'none',
    borderRadius: '10px',
    color: 'white',
    fontWeight: '600',
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
  },
  
  /* Loading & Empty States */
  loadingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem',
  },
  
  spinner: {
    width: '40px',
    height: '40px',
    border: `3px solid ${theme.border}`,
    borderTop: `3px solid ${theme.accent}`,
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  
  emptyState: {
    textAlign: 'center',
    padding: '4rem 2rem',
  },
  
  emptyStateButton: {
    padding: '0.875rem 1.5rem',
    background: theme.gradient,
    border: 'none',
    borderRadius: '10px',
    color: 'white',
    fontWeight: '600',
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontFamily: 'inherit',
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
  },
  
  /* Tasks List */
  tasksList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  
  taskWrapper: {
    animation: 'fadeIn 0.3s ease',
  },
  
  taskCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
    background: theme.surface,
    padding: '1.25rem',
    borderRadius: '12px',
    border: `1px solid ${theme.border}`,
    transition: 'all 0.2s ease',
  },
  
  taskCardHover: {
    background: theme.surfaceHover,
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
  },
  
  taskContent: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
    flex: 1,
  },
  
  checkbox: {
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    border: '2px solid',
    background: 'transparent',
    cursor: 'pointer',
    flexShrink: 0,
    marginTop: '2px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    padding: 0,
  },
  
  checkmark: {
    color: 'white',
    fontSize: '13px',
    fontWeight: '700',
  },
  
  taskText: {
    fontSize: '1rem',
    marginBottom: '0.5rem',
    lineHeight: '1.5',
    fontWeight: '500',
  },
  
  taskMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    fontSize: '0.75rem',
    color: theme.textMuted,
    flexWrap: 'wrap',
  },
  
  taskDate: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  
  overdueLabel: {
    color: theme.danger,
    marginLeft: '0.5rem',
    fontWeight: '600',
  },
  
  taskCategory: {
    background: theme.glass,
    border: `1px solid ${theme.glassBorder}`,
    padding: '3px 10px',
    borderRadius: '12px',
    fontSize: '0.7rem',
    fontWeight: '500',
  },
  
  notesIndicator: {
    color: theme.success,
    fontWeight: '500',
  },
  
  taskActions: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
  },
  
  aiButton: {
    padding: '0.5rem 1rem',
    background: theme.glass,
    border: `1px solid ${theme.glassBorder}`,
    color: theme.accent,
    borderRadius: '8px',
    fontSize: '0.75rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  
  editButton: {
    padding: '0.5rem',
    background: 'transparent',
    border: `1px solid ${theme.warning}`,
    color: theme.warning,
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
  },
  
  deleteButton: {
    padding: '0.5rem',
    background: 'transparent',
    border: `1px solid ${theme.danger}`,
    color: theme.danger,
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
  },
  
  /* Edit Card */
  editCard: {
    background: 'rgba(99, 102, 241, 0.05)',
    border: `1px solid ${theme.accent}`,
    padding: '1.5rem',
    borderRadius: '12px',
  },
  
  editActions: {
    display: 'flex',
    gap: '0.5rem',
    justifyContent: 'flex-end',
  },
  
  saveButton: {
    padding: '0.625rem 1.25rem',
    background: theme.success,
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    fontSize: '0.8rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
  },
  
  cancelButton: {
    padding: '0.625rem 1.25rem',
    background: 'transparent',
    border: `1px solid ${theme.border}`,
    borderRadius: '8px',
    color: theme.textSecondary,
    fontSize: '0.8rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
  },
  
  /* AI Suggestions Box */
  suggestionsBox: {
    background: 'rgba(99, 102, 241, 0.05)',
    border: `1px solid ${theme.glassBorder}`,
    padding: '1.25rem',
    borderRadius: '12px',
    marginTop: '0.5rem',
    marginLeft: '3rem',
    animation: 'fadeIn 0.3s ease',
  },
  
  suggestionsHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1rem',
  },
  
  suggestionsTitle: {
    fontSize: '0.8rem',
    color: theme.accent,
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  
  suggestionsHint: {
    fontSize: '0.7rem',
    color: theme.textMuted,
  },
  
  suggestionsContent: {
    background: 'rgba(99, 102, 241, 0.03)',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1rem',
  },
  
  suggestionsList: {
    margin: 0,
    paddingLeft: '1.5rem',
    fontSize: '0.875rem',
    lineHeight: '1.7',
    color: theme.textSecondary,
  },
  
  suggestionsActions: {
    display: 'flex',
    gap: '0.5rem',
    justifyContent: 'flex-end',
  },
  
  saveNoteButton: {
    padding: '0.5rem 1rem',
    background: theme.success,
    border: 'none',
    color: 'white',
    borderRadius: '8px',
    fontSize: '0.75rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    fontFamily: 'inherit',
  },
  
  discardButton: {
    padding: '0.5rem 1rem',
    background: 'transparent',
    border: `1px solid ${theme.border}`,
    color: theme.textSecondary,
    borderRadius: '8px',
    fontSize: '0.75rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
  },
  
  /* Saved Notes Box */
  notesBox: {
    background: 'rgba(16, 185, 129, 0.05)',
    border: `1px solid rgba(16, 185, 129, 0.2)`,
    padding: '1.25rem',
    borderRadius: '12px',
    marginTop: '0.5rem',
    marginLeft: '3rem',
    animation: 'fadeIn 0.2s ease',
  },
  
  notesTitle: {
    fontSize: '0.8rem',
    color: theme.success,
    fontWeight: '600',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  
  notesList: {
    margin: 0,
    paddingLeft: '1.5rem',
    fontSize: '0.875rem',
    lineHeight: '1.7',
    color: theme.textMuted,
  },
};

/* ==================== CSS KEYFRAMES ==================== */

const keyframesCSS = `
  @keyframes aiPulse {
    0%, 80%, 100% { 
      opacity: 0.3; 
      transform: scale(0.8); 
    }
    40% { 
      opacity: 1; 
      transform: scale(1.3); 
    }
  }

  @keyframes fadeIn {
    from { 
      opacity: 0; 
      transform: translateY(10px); 
    }
    to { 
      opacity: 1; 
      transform: translateY(0); 
    }
  }

  @keyframes slideIn {
    from { 
      transform: translateX(-10px); 
      opacity: 0; 
    }
    to { 
      transform: translateX(0); 
      opacity: 1; 
    }
  }

  @keyframes spin {
    to { 
      transform: rotate(360deg); 
    }
  }

  button:hover {
    transform: translateY(-1px);
  }

  button:active {
    transform: translateY(0);
  }

  input:focus {
    border-color: ${theme.accent};
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }

  .${styles.createButton.constructor.name}:hover {
    background: ${theme.gradientHover};
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(99, 102, 241, 0.3);
  }

  .${styles.navButton.constructor.name}:hover {
    background: ${theme.glass};
    color: ${theme.accent};
  }
`;

export default Todo;