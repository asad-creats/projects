import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const theme = {
  bg: '#0f172a',
  sidebar: 'rgba(15, 23, 42, 0.9)',
  accent: '#38bdf8',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  text: '#f8fafc',
  textSecondary: '#94a3b8',
  glass: 'rgba(255, 255, 255, 0.05)',
  glassHover: 'rgba(255, 255, 255, 0.08)',
  border: 'rgba(255, 255, 255, 0.1)',
  gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
};

/* ---------------- AI LOADER ---------------- */

const AiLoader = () => (
  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
    <span style={{ fontSize: '0.75rem', color: theme.accent }}>Thinking</span>
    {[1, 2, 3].map(i => (
      <span
        key={i}
        style={{
          width: '6px',
          height: '6px',
          background: theme.accent,
          borderRadius: '50%',
          animation: 'aiPulse 1.2s infinite',
          animationDelay: `${i * 0.15}s`,
        }}
      />
    ))}
  </div>
);

// Insert CSS animations
if (typeof document !== 'undefined') {
  const sheet = document.styleSheets[0];
  if (sheet) {
    sheet.insertRule(`
      @keyframes aiPulse {
        0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
        40% { opacity: 1; transform: scale(1.2); }
      }
    `, sheet.cssRules.length);

    sheet.insertRule(`
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `, sheet.cssRules.length);

    sheet.insertRule(`
      @keyframes slideIn {
        from { transform: translateX(-10px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `, sheet.cssRules.length);
  }
}

/* ---------------- COMPONENT ---------------- */

function Todo() {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);

  // AI state
  const [aiLoadingId, setAiLoadingId] = useState(null);
  const [tempSuggestions, setTempSuggestions] = useState({});
  const [hoveredTodoId, setHoveredTodoId] = useState(null);

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editCategory, setEditCategory] = useState('');

  useEffect(() => { 
    fetchTodos(); 
  }, []);

  async function fetchTodos() {
    setLoading(true);
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching todos:', error);
    }
    
    setTodos(data || []);
    setLoading(false);
  }

  const addTodo = async () => {
    if (!input.trim()) return;
    
    const finalDate = date || new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('todos')
      .insert([{
        text: input,
        date: finalDate,
        category: category || 'General',
        completed: false,
        notes: ''
      }])
      .select();

    if (error) {
      console.error('Error adding todo:', error);
      return;
    }

    setTodos([data[0], ...todos]);
    setInput('');
    setDate('');
    setCategory('');
    setActiveTab('all');
  };

  const toggleTodo = async (id, currentStatus) => {
    await supabase
      .from('todos')
      .update({ completed: !currentStatus })
      .eq('id', id);
    
    setTodos(todos.map(t => 
      t.id === id ? { ...t, completed: !t.completed } : t
    ));
  };

  const startEdit = (todo) => {
    setEditingId(todo.id);
    setEditText(todo.text);
    setEditDate(todo.date);
    setEditCategory(todo.category);
  };

  const saveEdit = async (id) => {
    if (!editText.trim()) return;
    
    await supabase
      .from('todos')
      .update({ 
        text: editText,
        date: editDate,
        category: editCategory
      })
      .eq('id', id);
    
    setTodos(todos.map(t => 
      t.id === id ? { 
        ...t, 
        text: editText,
        date: editDate,
        category: editCategory
      } : t
    ));
    
    setEditingId(null);
    setEditText('');
    setEditDate('');
    setEditCategory('');
  };

  const deleteTodo = async (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      await supabase
        .from('todos')
        .delete()
        .eq('id', id);
      
      setTodos(todos.filter(t => t.id !== id));
    }
  };

  const saveNote = async (id, noteText) => {
    await supabase
      .from('todos')
      .update({ notes: noteText })
      .eq('id', id);
    
    setTodos(todos.map(t => 
      t.id === id ? { ...t, notes: noteText } : t
    ));
    
    const copy = { ...tempSuggestions };
    delete copy[id];
    setTempSuggestions(copy);
  };

  const getAiSuggestion = async (todo) => {
    setAiLoadingId(todo.id);
    try {
      const res = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.2',
          prompt: `Task: "${todo.text}". Give 3 practical tips to complete this task efficiently. Use bullet points.`,
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
        [todo.id]: "• Break task into smaller steps\n• Set a deadline\n• Eliminate distractions"
      }));
    } finally {
      setAiLoadingId(null);
    }
  };

  // Calculate task counts
  const getTaskCounts = () => {
    const today = new Date().toISOString().split('T')[0];
    
    return {
      all: todos.length,
      today: todos.filter(t => t.date === today && !t.completed).length,
      completed: todos.filter(t => t.completed).length,
      pending: todos.filter(t => !t.completed).length,
      overdue: todos.filter(t => t.date < today && !t.completed).length,
    };
  };

  const taskCounts = getTaskCounts();
  const today = new Date().toISOString().split('T')[0];

  const filteredTasks = () => {
    if (activeTab === 'today') {
      return todos.filter(t => t.date === today && !t.completed);
    }
    if (activeTab === 'completed') {
      return todos.filter(t => t.completed);
    }
    if (activeTab === 'pending') {
      return todos.filter(t => !t.completed);
    }
    return todos;
  };

  const getTabIcon = (tab) => {
    switch(tab) {
      case 'all': return '📋';
      case 'today': return '📅';
      case 'completed': return '✅';
      case 'pending': return '⏳';
      default: return '📁';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      background: theme.bg, 
      color: theme.text,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* SIDEBAR */}
      <aside style={{ 
        width: '280px', 
        background: theme.sidebar,
        padding: '2rem 1.5rem',
        borderRight: `1px solid ${theme.border}`,
        backdropFilter: 'blur(10px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem'
      }}>
        <div>
          <h2 style={{ 
            color: theme.accent, 
            marginBottom: '0.5rem',
            fontSize: '1.5rem',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{ 
              background: theme.gradient, 
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              TASKMASTER
            </span>
            <span style={{ 
              fontSize: '0.75rem', 
              background: theme.accent, 
              color: theme.bg,
              padding: '2px 8px',
              borderRadius: '12px',
              fontWeight: '600'
            }}>
              AI
            </span>
          </h2>
          <p style={{ 
            color: theme.textSecondary, 
            fontSize: '0.875rem',
            marginBottom: '2rem'
          }}>
            Manage your tasks with AI assistance
          </p>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[
            { id: 'all', label: 'All Tasks', count: taskCounts.all },
            { id: 'today', label: "Today's Tasks", count: taskCounts.today },
            { id: 'pending', label: 'Pending', count: taskCounts.pending },
            { id: 'completed', label: 'Completed', count: taskCounts.completed },
          ].map(({ id, label, count }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                ...navStyle,
                background: activeTab === id ? theme.glassHover : 'transparent',
                borderLeft: activeTab === id ? `3px solid ${theme.accent}` : '3px solid transparent',
                color: activeTab === id ? theme.accent : theme.textSecondary,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.875rem 1rem',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.1rem' }}>{getTabIcon(id)}</span>
                {label}
              </span>
              <span style={{
                background: activeTab === id ? theme.accent : theme.glass,
                color: activeTab === id ? theme.bg : theme.textSecondary,
                fontSize: '0.75rem',
                padding: '2px 8px',
                borderRadius: '12px',
                fontWeight: '600',
                minWidth: '24px',
                textAlign: 'center'
              }}>
                {count}
              </span>
            </button>
          ))}
        </nav>

        <div style={{ marginTop: 'auto' }}>
          <button 
            onClick={() => setActiveTab('add')}
            style={{
              width: '100%',
              padding: '12px',
              background: theme.gradient,
              border: 'none',
              borderRadius: '10px',
              color: 'white',
              fontWeight: '600',
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
          >
            <span style={{ fontSize: '1.1rem' }}>+</span>
            Create New Task
          </button>
          
          {taskCounts.overdue > 0 && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '10px',
              padding: '0.75rem',
              marginTop: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ color: theme.danger }}>⚠️</span>
              <div>
                <div style={{ fontSize: '0.75rem', color: theme.danger, fontWeight: '600' }}>
                  {taskCounts.overdue} overdue task{taskCounts.overdone !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ 
        flex: 1, 
        padding: '3rem', 
        overflowY: 'auto',
        maxWidth: '1000px',
        margin: '0 auto'
      }}>
        <header style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '2.5rem',
          animation: 'fadeIn 0.5s ease'
        }}>
          <div>
            <h1 style={{ 
              fontSize: '2rem', 
              fontWeight: '700',
              marginBottom: '0.5rem',
              background: theme.gradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'inline-block'
            }}>
              {activeTab === 'all' ? 'All Tasks' :
               activeTab === 'today' ? "Today's Tasks" :
               activeTab === 'pending' ? 'Pending Tasks' :
               activeTab === 'completed' ? 'Completed Tasks' :
               'Create New Task'}
            </h1>
            <p style={{ 
              color: theme.textSecondary,
              fontSize: '0.875rem'
            }}>
              {activeTab === 'add' 
                ? 'Add a new task to your list'
                : `${filteredTasks().length} task${filteredTasks().length !== 1 ? 's' : ''}`}
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              padding: '0.5rem 1rem',
              background: theme.glass,
              borderRadius: '8px',
              fontSize: '0.875rem',
              color: theme.textSecondary
            }}>
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
            <Link 
              to="/" 
              style={{ 
                padding: '0.5rem 1rem',
                background: theme.glass,
                borderRadius: '8px',
                color: theme.accent,
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: '500',
                border: `1px solid ${theme.border}`,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = theme.glassHover}
              onMouseLeave={(e) => e.target.style.background = theme.glass}
            >
              Logout
            </Link>
          </div>
        </header>

        <div style={{ animation: 'slideIn 0.3s ease' }}>
          {activeTab === 'add' ? (
            <div style={{
              background: theme.glass,
              padding: '2.5rem',
              borderRadius: '20px',
              border: `1px solid ${theme.border}`,
              backdropFilter: 'blur(10px)',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              <h3 style={{ 
                marginBottom: '1.5rem', 
                color: theme.accent,
                fontSize: '1.25rem'
              }}>
                Create New Task
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input 
                  placeholder="What needs to be done?" 
                  value={input} 
                  onChange={e => setInput(e.target.value)}
                  style={inputStyle}
                  onKeyPress={(e) => e.key === 'Enter' && addTodo()}
                />
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>Due Date</label>
                    <input 
                      type="date" 
                      value={date} 
                      onChange={e => setDate(e.target.value)}
                      style={inputStyle}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Category</label>
                    <input 
                      placeholder="Work, Personal, etc." 
                      value={category} 
                      onChange={e => setCategory(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                </div>
                
                <button 
                  onClick={addTodo}
                  disabled={!input.trim()}
                  style={{
                    ...saveButtonStyle,
                    opacity: !input.trim() ? 0.5 : 1,
                    cursor: !input.trim() ? 'not-allowed' : 'pointer'
                  }}
                >
                  + Add Task
                </button>
              </div>
            </div>
          ) : loading ? (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              padding: '4rem',
              color: theme.textSecondary
            }}>
              Loading tasks...
            </div>
          ) : filteredTasks().length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '4rem',
              color: theme.textSecondary
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
              <h3 style={{ marginBottom: '0.5rem' }}>No tasks found</h3>
              <p>Get started by creating your first task!</p>
              <button 
                onClick={() => setActiveTab('add')}
                style={{
                  marginTop: '1rem',
                  padding: '0.75rem 1.5rem',
                  background: theme.gradient,
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Create Task
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredTasks().map(todo => (
                <div
                  key={todo.id}
                  style={{ animation: 'fadeIn 0.3s ease' }}
                  onMouseEnter={() => setHoveredTodoId(todo.id)}
                  onMouseLeave={() => setHoveredTodoId(null)}
                >
                  {/* EDIT MODE */}
                  {editingId === todo.id ? (
                    <div style={{
                      background: 'rgba(56, 189, 248, 0.1)',
                      border: `1px solid ${theme.accent}`,
                      padding: '1.5rem',
                      borderRadius: '12px',
                      marginBottom: '1rem'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <input 
                          value={editText}
                          onChange={e => setEditText(e.target.value)}
                          style={inputStyle}
                          placeholder="Edit task..."
                          onKeyPress={(e) => e.key === 'Enter' && saveEdit(todo.id)}
                        />
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <div>
                            <label style={labelStyle}>Due Date</label>
                            <input 
                              type="date" 
                              value={editDate} 
                              onChange={e => setEditDate(e.target.value)}
                              style={inputStyle}
                            />
                          </div>
                          <div>
                            <label style={labelStyle}>Category</label>
                            <input 
                              value={editCategory}
                              onChange={e => setEditCategory(e.target.value)}
                              style={inputStyle}
                              placeholder="Category"
                            />
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button 
                            onClick={() => saveEdit(todo.id)}
                            disabled={!editText.trim()}
                            style={{
                              padding: '0.5rem 1rem',
                              background: theme.success,
                              border: 'none',
                              borderRadius: '8px',
                              color: 'white',
                              fontSize: '0.75rem',
                              fontWeight: '500',
                              cursor: editText.trim() ? 'pointer' : 'not-allowed',
                              opacity: editText.trim() ? 1 : 0.5
                            }}
                          >
                            Save Changes
                          </button>
                          <button 
                            onClick={() => setEditingId(null)}
                            style={{
                              padding: '0.5rem 1rem',
                              background: 'transparent',
                              border: `1px solid ${theme.textSecondary}`,
                              borderRadius: '8px',
                              color: theme.textSecondary,
                              fontSize: '0.75rem',
                              fontWeight: '500',
                              cursor: 'pointer'
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* TASK CARD (VIEW MODE) */
                    <div style={{
                      ...taskCardStyle,
                      borderLeft: todo.completed ? `4px solid ${theme.success}` : 
                                   todo.date < today ? `4px solid ${theme.danger}` : 
                                   `4px solid ${theme.accent}`
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: '1rem',
                        flex: 1 
                      }}>
                        <button
                          onClick={() => toggleTodo(todo.id, todo.completed)}
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            border: `2px solid ${todo.completed ? theme.success : theme.textSecondary}`,
                            background: todo.completed ? theme.success : 'transparent',
                            cursor: 'pointer',
                            flexShrink: 0,
                            marginTop: '2px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {todo.completed && (
                            <span style={{ color: 'white', fontSize: '12px' }}>✓</span>
                          )}
                        </button>
                        
                        <div style={{ flex: 1 }}>
                          <div style={{ 
                            textDecoration: todo.completed ? 'line-through' : 'none',
                            color: todo.completed ? theme.textSecondary : theme.text,
                            fontSize: '1rem',
                            marginBottom: '0.25rem'
                          }}>
                            {todo.text}
                          </div>
                          
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '1rem',
                            fontSize: '0.75rem',
                            color: theme.textSecondary
                          }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}>
                              📅 {formatDate(todo.date)}
                              {todo.date < today && !todo.completed && (
                                <span style={{ 
                                  color: theme.danger,
                                  marginLeft: '0.25rem',
                                  fontSize: '0.7rem'
                                }}>
                                  (Overdue)
                                </span>
                              )}
                            </span>
                            
                            <span style={{
                              background: theme.glass,
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '0.7rem'
                            }}>
                              {todo.category}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* ACTION BUTTONS */}
                      <div style={{ 
                        display: 'flex', 
                        gap: '0.5rem',
                        alignItems: 'center'
                      }}>
                        <button 
                          onClick={() => getAiSuggestion(todo)}
                          disabled={aiLoadingId === todo.id}
                          style={{
                            ...aiButtonStyle,
                            opacity: aiLoadingId === todo.id ? 0.7 : 1,
                            cursor: aiLoadingId === todo.id ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {aiLoadingId === todo.id ? <AiLoader /> : '✨ AI Tips'}
                        </button>
                        
                        <button 
                          onClick={() => startEdit(todo)}
                          style={{
                            padding: '0.5rem',
                            background: 'transparent',
                            border: `1px solid ${theme.warning}`,
                            color: theme.warning,
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px'
                          }}
                          title="Edit task"
                          onMouseEnter={(e) => e.target.style.background = 'rgba(245, 158, 11, 0.1)'}
                          onMouseLeave={(e) => e.target.style.background = 'transparent'}
                        >
                          ✏️
                        </button>
                        
                        <button 
                          onClick={() => deleteTodo(todo.id)}
                          style={{
                            padding: '0.5rem',
                            background: 'transparent',
                            border: `1px solid ${theme.danger}`,
                            color: theme.danger,
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px'
                          }}
                          title="Delete task"
                          onMouseEnter={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.1)'}
                          onMouseLeave={(e) => e.target.style.background = 'transparent'}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TEMP AI SUGGESTIONS */}
                  {tempSuggestions[todo.id] && (
                    <div style={tempBoxStyle}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        marginBottom: '0.75rem' 
                      }}>
                        <div style={{ 
                          fontSize: '0.75rem', 
                          color: theme.accent, 
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <span>🤖</span>
                          AI SUGGESTIONS
                        </div>
                        <div style={{ fontSize: '0.7rem', color: theme.textSecondary }}>
                          Click save to add to notes
                        </div>
                      </div>
                      
                      <div style={{
                        background: 'rgba(56, 189, 248, 0.05)',
                        padding: '1rem',
                        borderRadius: '8px',
                        marginBottom: '1rem'
                      }}>
                        <ul style={{ 
                          margin: 0, 
                          paddingLeft: '1.2rem', 
                          fontSize: '0.85rem',
                          lineHeight: '1.6'
                        }}>
                          {tempSuggestions[todo.id]
                            .split('\n')
                            .filter(Boolean)
                            .map((line, i) => (
                              <li key={i} style={{ marginBottom: '0.5rem' }}>
                                {line.replace(/^[-•*]\s*/, '')}
                              </li>
                            ))}
                        </ul>
                      </div>
                      
                      <div style={{ 
                        display: 'flex', 
                        gap: '0.5rem',
                        justifyContent: 'flex-end'
                      }}>
                        <button 
                          onClick={() => saveNote(todo.id, tempSuggestions[todo.id])}
                          style={confirmBtn}
                        >
                          💾 Save to Notes
                        </button>
                        <button 
                          onClick={() => {
                            const updated = { ...tempSuggestions };
                            delete updated[todo.id];
                            setTempSuggestions(updated);
                          }}
                          style={cancelBtn}
                        >
                          Discard
                        </button>
                      </div>
                    </div>
                  )}

                  {/* SAVED NOTES (HOVER TO VIEW) */}
                  {todo.notes && hoveredTodoId === todo.id && !tempSuggestions[todo.id] && (
                    <div style={noteBoxStyle}>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: theme.success, 
                        fontWeight: '600',
                        marginBottom: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <span>📝</span>
                        SAVED NOTES
                      </div>
                      <ul style={{ 
                        margin: 0, 
                        paddingLeft: '1.2rem', 
                        fontSize: '0.85rem',
                        lineHeight: '1.6',
                        color: theme.textSecondary
                      }}>
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

/* ---------------- UPDATED STYLES ---------------- */

const navStyle = {
  border: 'none',
  textAlign: 'left',
  fontSize: '0.875rem',
  cursor: 'pointer',
  borderRadius: '8px',
  transition: 'all 0.2s ease',
  fontFamily: 'inherit'
};

const taskCardStyle = {
  background: theme.glass,
  padding: '1.25rem',
  borderRadius: '12px',
  border: `1px solid ${theme.border}`,
  backdropFilter: 'blur(10px)',
  transition: 'all 0.2s ease',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '1rem'
};

const inputStyle = {
  width: '100%',
  padding: '0.875rem 1rem',
  background: 'rgba(30, 41, 59, 0.5)',
  border: `1px solid ${theme.border}`,
  borderRadius: '10px',
  color: theme.text,
  fontSize: '0.875rem',
  transition: 'all 0.2s ease',
  fontFamily: 'inherit'
};

const labelStyle = {
  display: 'block',
  marginBottom: '0.5rem',
  fontSize: '0.75rem',
  color: theme.textSecondary,
  fontWeight: '500'
};

const saveButtonStyle = {
  width: '100%',
  padding: '0.875rem',
  background: theme.gradient,
  border: 'none',
  borderRadius: '10px',
  color: 'white',
  fontWeight: '600',
  fontSize: '0.875rem',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  fontFamily: 'inherit'
};

const aiButtonStyle = {
  background: 'rgba(56, 189, 248, 0.1)',
  color: theme.accent,
  border: `1px solid ${theme.accent}`,
  padding: '0.5rem 1rem',
  borderRadius: '8px',
  fontSize: '0.75rem',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  whiteSpace: 'nowrap',
  fontFamily: 'inherit'
};

const tempBoxStyle = {
  background: 'rgba(56, 189, 248, 0.05)',
  border: `1px solid rgba(56, 189, 248, 0.3)`,
  padding: '1.25rem',
  borderRadius: '12px',
  marginTop: '0.5rem',
  marginLeft: '2.5rem',
  animation: 'fadeIn 0.3s ease'
};

const noteBoxStyle = {
  background: 'rgba(16, 185, 129, 0.05)',
  border: `1px solid rgba(16, 185, 129, 0.3)`,
  padding: '1.25rem',
  borderRadius: '12px',
  marginTop: '0.5rem',
  marginLeft: '2.5rem',
  animation: 'fadeIn 0.2s ease'
};

const confirmBtn = {
  background: theme.success,
  border: 'none',
  color: 'white',
  padding: '0.5rem 1rem',
  borderRadius: '8px',
  fontSize: '0.75rem',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  gap: '0.25rem',
  fontFamily: 'inherit'
};

const cancelBtn = {
  background: 'transparent',
  border: `1px solid ${theme.textSecondary}`,
  color: theme.textSecondary,
  padding: '0.5rem 1rem',
  borderRadius: '8px',
  fontSize: '0.75rem',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  fontFamily: 'inherit'
};

// Add hover effects
Object.assign(inputStyle, {
  ':hover': { borderColor: theme.accent },
  ':focus': { 
    outline: 'none', 
    borderColor: theme.accent,
    boxShadow: `0 0 0 2px ${theme.accent}20`
  }
});

Object.assign(taskCardStyle, {
  ':hover': { 
    background: theme.glassHover,
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
  }
});

Object.assign(aiButtonStyle, {
  ':hover': { 
    background: 'rgba(56, 189, 248, 0.2)',
    transform: 'translateY(-1px)'
  }
});

Object.assign(confirmBtn, {
  ':hover': { 
    background: '#0da271',
    transform: 'translateY(-1px)'
  }
});

Object.assign(cancelBtn, {
  ':hover': { 
    background: theme.glass,
    transform: 'translateY(-1px)'
  }
});

export default Todo;