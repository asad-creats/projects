import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  agentBg: 'rgba(139, 92, 246, 0.08)',
  agentBorder: 'rgba(139, 92, 246, 0.2)',
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
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }
};

const getTodayString = () => new Date().toISOString().split('T')[0];

const isOverdue = (dateString, completed) => {
  if (completed) return false;
  return dateString < getTodayString();
};

/* ==================== OLLAMA INTEGRATION ==================== */

// Ollama API client
class OllamaClient {
  constructor(baseUrl = 'http://localhost:11434') {
    this.baseUrl = baseUrl;
  }

  async chat(messages, model = 'llama3.2', options = {}) {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          stream: false,
          ...options
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.message.content;
    } catch (error) {
      console.error('Ollama chat error:', error);
      throw error;
    }
  }

  async listModels() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }
      const data = await response.json();
      return data.models || [];
    } catch (error) {
      console.error('Error listing models:', error);
      return [];
    }
  }
}

/* ==================== AGENT SYSTEM WITH OLLAMA ==================== */

class TaskAgent {
  constructor(todos, setTodos, addTodo, toggleTodo, deleteTodo, ollamaModel = 'llama3.2') {
    this.todos = todos;
    this.setTodos = setTodos;
    this.addTodo = addTodo;
    this.toggleTodo = toggleTodo;
    this.deleteTodo = deleteTodo;
    this.ollama = new OllamaClient();
    this.model = ollamaModel;
    
    // Define available tools the agent can use
    this.tools = [
      {
        name: 'list_tasks',
        description: 'List all tasks with optional filters (completed, pending, overdue, today)',
        parameters: {
          type: 'object',
          properties: {
            filter: {
              type: 'string',
              enum: ['all', 'completed', 'pending', 'overdue', 'today'],
              description: 'Filter to apply to tasks'
            }
          }
        }
      },
      {
        name: 'create_task',
        description: 'Create a new task with text, date, and category',
        parameters: {
          type: 'object',
          properties: {
            text: { type: 'string', description: 'Task description' },
            date: { type: 'string', description: 'Due date in YYYY-MM-DD format' },
            category: { type: 'string', description: 'Task category' }
          },
          required: ['text']
        }
      },
      {
        name: 'complete_task',
        description: 'Mark a task as completed by its ID or description',
        parameters: {
          type: 'object',
          properties: {
            taskId: { type: 'number', description: 'Task ID' },
            taskText: { type: 'string', description: 'Task description to match' }
          }
        }
      },
      {
        name: 'delete_task',
        description: 'Delete a task by its ID or description',
        parameters: {
          type: 'object',
          properties: {
            taskId: { type: 'number', description: 'Task ID' },
            taskText: { type: 'string', description: 'Task description to match' }
          }
        }
      },
      {
        name: 'analyze_productivity',
        description: 'Analyze task completion patterns and provide insights',
        parameters: {
          type: 'object',
          properties: {
            period: { 
              type: 'string', 
              enum: ['today', 'week', 'all'],
              description: 'Time period to analyze' 
            }
          }
        }
      },
      {
        name: 'suggest_priorities',
        description: 'Suggest which tasks should be prioritized based on due dates and completion status',
        parameters: {
          type: 'object',
          properties: {}
        }
      }
    ];
  }

  // Tool implementations
  async executeTool(toolName, args) {
    switch(toolName) {
      case 'list_tasks':
        return this.listTasks(args.filter || 'all');
      
      case 'create_task':
        return this.createTask(args.text, args.date, args.category);
      
      case 'complete_task':
        return this.completeTask(args.taskId, args.taskText);
      
      case 'delete_task':
        return this.deleteTask(args.taskId, args.taskText);
      
      case 'analyze_productivity':
        return this.analyzeProductivity(args.period || 'all');
      
      case 'suggest_priorities':
        return this.suggestPriorities();
      
      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  }

  listTasks(filter) {
    const today = getTodayString();
    let filtered = [...this.todos];

    switch(filter) {
      case 'completed':
        filtered = this.todos.filter(t => t.completed);
        break;
      case 'pending':
        filtered = this.todos.filter(t => !t.completed);
        break;
      case 'overdue':
        filtered = this.todos.filter(t => isOverdue(t.date, t.completed));
        break;
      case 'today':
        filtered = this.todos.filter(t => t.date === today && !t.completed);
        break;
    }

    return {
      success: true,
      count: filtered.length,
      tasks: filtered.map(t => ({
        id: t.id,
        text: t.text,
        date: t.date,
        category: t.category,
        completed: t.completed,
        isOverdue: isOverdue(t.date, t.completed)
      }))
    };
  }

  async createTask(text, date, category) {
    const finalDate = date || getTodayString();
    const finalCategory = category || 'General';
    
    try {
      await this.addTodo(text, finalDate, finalCategory);
      return {
        success: true,
        message: `Created task: "${text}" due ${formatDate(finalDate)} in ${finalCategory}`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async completeTask(taskId, taskText) {
    let task = null;
    
    if (taskId) {
      task = this.todos.find(t => t.id === taskId);
    } else if (taskText) {
      task = this.todos.find(t => 
        t.text.toLowerCase().includes(taskText.toLowerCase())
      );
    }

    if (!task) {
      return { success: false, error: 'Task not found' };
    }

    if (task.completed) {
      return { success: false, error: 'Task already completed' };
    }

    await this.toggleTodo(task.id, task.completed);
    return {
      success: true,
      message: `Completed task: "${task.text}"`
    };
  }

  async deleteTask(taskId, taskText) {
    let task = null;
    
    if (taskId) {
      task = this.todos.find(t => t.id === taskId);
    } else if (taskText) {
      task = this.todos.find(t => 
        t.text.toLowerCase().includes(taskText.toLowerCase())
      );
    }

    if (!task) {
      return { success: false, error: 'Task not found' };
    }

    await this.deleteTodo(task.id);
    return {
      success: true,
      message: `Deleted task: "${task.text}"`
    };
  }

  analyzeProductivity(period) {
    const today = getTodayString();
    let filtered = this.todos;

    if (period === 'today') {
      filtered = this.todos.filter(t => t.date === today);
    } else if (period === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().split('T')[0];
      filtered = this.todos.filter(t => t.date >= weekAgoStr);
    }

    const total = filtered.length;
    const completed = filtered.filter(t => t.completed).length;
    const pending = total - completed;
    const overdue = filtered.filter(t => isOverdue(t.date, t.completed)).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const categories = {};
    filtered.forEach(t => {
      if (!categories[t.category]) {
        categories[t.category] = { total: 0, completed: 0 };
      }
      categories[t.category].total++;
      if (t.completed) categories[t.category].completed++;
    });

    return {
      success: true,
      period,
      stats: {
        total,
        completed,
        pending,
        overdue,
        completionRate: `${completionRate}%`
      },
      categories,
      insights: this.generateInsights(total, completed, overdue, completionRate)
    };
  }

  generateInsights(total, completed, overdue, rate) {
    const insights = [];
    
    if (rate >= 80) {
      insights.push('🎉 Excellent productivity! You\'re crushing your tasks.');
    } else if (rate >= 60) {
      insights.push('👍 Good progress! Keep up the momentum.');
    } else if (rate >= 40) {
      insights.push('📈 Room for improvement. Focus on completing pending tasks.');
    } else if (total > 0) {
      insights.push('⚠️ Low completion rate. Consider breaking tasks into smaller pieces.');
    }

    if (overdue > 0) {
      insights.push(`⏰ You have ${overdue} overdue task${overdue > 1 ? 's' : ''}. Prioritize these!`);
    }

    if (total === 0) {
      insights.push('📝 No tasks yet. Start by adding your first task!');
    }

    return insights;
  }

  suggestPriorities() {
    const today = getTodayString();
    const pending = this.todos.filter(t => !t.completed);
    const overdue = pending.filter(t => isOverdue(t.date, t.completed));
    const dueToday = pending.filter(t => t.date === today);
    const upcoming = pending.filter(t => t.date > today);

    const priorities = [];

    if (overdue.length > 0) {
      priorities.push({
        priority: 'HIGH',
        reason: 'Overdue tasks',
        tasks: overdue.map(t => ({ id: t.id, text: t.text, date: t.date }))
      });
    }

    if (dueToday.length > 0) {
      priorities.push({
        priority: 'MEDIUM',
        reason: 'Due today',
        tasks: dueToday.map(t => ({ id: t.id, text: t.text, date: t.date }))
      });
    }

    if (upcoming.length > 0) {
      const nextThree = upcoming
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 3);
      
      priorities.push({
        priority: 'LOW',
        reason: 'Upcoming tasks',
        tasks: nextThree.map(t => ({ id: t.id, text: t.text, date: t.date }))
      });
    }

    return {
      success: true,
      priorities,
      summary: `${overdue.length} overdue, ${dueToday.length} due today, ${upcoming.length} upcoming`
    };
  }

  // Process user query with Ollama
  async processQuery(userMessage, conversationHistory = []) {
    try {
      // Build system prompt with current task context
      const taskContext = this.listTasks('all');
      const systemPrompt = `You are a helpful task management assistant. You can help users manage their todos.

Current task summary:
- Total tasks: ${taskContext.count}
- Tasks: ${JSON.stringify(taskContext.tasks, null, 2)}

Available tools:
${JSON.stringify(this.tools, null, 2)}

When the user asks you to perform an action, respond with a JSON object containing:
{
  "action": "tool_name",
  "parameters": { /* tool parameters */ },
  "response": "Your natural language response to the user"
}

If no tool is needed, respond with:
{
  "action": "none",
  "response": "Your natural language response"
}

Keep responses concise and helpful. Today's date is ${getTodayString()}.`;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: userMessage }
      ];

      const response = await this.ollama.chat(messages, this.model);
      
      // Try to parse JSON response
      let parsed;
      try {
        // Extract JSON if it's wrapped in markdown code blocks
        const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                         response.match(/```\n([\s\S]*?)\n```/);
        const jsonStr = jsonMatch ? jsonMatch[1] : response;
        parsed = JSON.parse(jsonStr);
      } catch (e) {
        // If parsing fails, treat as a plain response
        parsed = {
          action: 'none',
          response: response
        };
      }

      // Execute tool if needed
      let toolResult = null;
      if (parsed.action && parsed.action !== 'none') {
        toolResult = await this.executeTool(parsed.action, parsed.parameters || {});
      }

      return {
        response: parsed.response || response,
        action: parsed.action,
        toolResult,
        fullResponse: response
      };
    } catch (error) {
      console.error('Error processing query:', error);
      return {
        response: `Sorry, I encountered an error: ${error.message}. Make sure Ollama is running on localhost:11434.`,
        error: error.message
      };
    }
  }
}

/* ==================== MAIN COMPONENT ==================== */

function Todo() {
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [agentInput, setAgentInput] = useState('');
  const [agentMessages, setAgentMessages] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(null);
  const [ollamaModels, setOllamaModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('llama3.2');
  const [ollamaConnected, setOllamaConnected] = useState(false);
  
  // Manual task creation form
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskDate, setNewTaskDate] = useState(getTodayString());
  const [newTaskCategory, setNewTaskCategory] = useState('General');
  
  const messagesEndRef = useRef(null);
  const agentRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [agentMessages]);

  // Check Ollama connection and fetch models
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

  // Fetch todos from Supabase
  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;
      setTodos(data || []);
    } catch (error) {
      console.error('Error fetching todos:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async (text, date, category) => {
    try {
      const { data, error } = await supabase
        .from('todos')
        .insert([{ text, date, category, completed: false }])
        .select()
        .single();

      if (error) throw error;
      setTodos([...todos, data]);
      return data;
    } catch (error) {
      console.error('Error adding todo:', error);
      throw error;
    }
  };

  const toggleTodo = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('todos')
        .update({ completed: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      setTodos(todos.map(todo => 
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      ));
    } catch (error) {
      console.error('Error toggling todo:', error);
    }
  };

  const deleteTodo = async (id) => {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTodos(todos.filter(todo => todo.id !== id));
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  // Handle manual task creation
  const handleManualAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    try {
      await addTodo(newTaskText, newTaskDate, newTaskCategory);
      setNewTaskText('');
      setNewTaskDate(getTodayString());
      setNewTaskCategory('General');
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  // Initialize agent with current todos
  useEffect(() => {
    agentRef.current = new TaskAgent(
      todos, 
      setTodos, 
      addTodo, 
      toggleTodo, 
      deleteTodo,
      selectedModel
    );
  }, [todos, selectedModel]);

  // Handle agent message
  const handleAgentMessage = async (message) => {
    if (!message.trim() || !ollamaConnected) return;

    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    setAgentMessages(prev => [...prev, userMessage]);
    setAgentInput('');
    setAiLoading(true);

    try {
      // Get conversation history (last 10 messages)
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

  // Quick actions
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

  // Get unique categories
  const categories = useMemo(() => {
    const cats = ['All', ...new Set(todos.map(todo => todo.category))];
    return cats;
  }, [todos]);

  // Stats
  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const pending = total - completed;
    const overdue = todos.filter(t => isOverdue(t.date, t.completed)).length;
    
    return { total, completed, pending, overdue };
  }, [todos]);

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
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{stats.total}</div>
              <div style={styles.statLabel}>Total</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{stats.completed}</div>
              <div style={styles.statLabel}>Completed</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{stats.pending}</div>
              <div style={styles.statLabel}>Pending</div>
            </div>
            <div style={{...styles.statCard, borderColor: stats.overdue > 0 ? theme.danger : theme.border}}>
              <div style={{...styles.statValue, color: stats.overdue > 0 ? theme.danger : theme.text}}>
                {stats.overdue}
              </div>
              <div style={styles.statLabel}>Overdue</div>
            </div>
          </div>

          <form onSubmit={handleManualAddTask} style={styles.addTaskForm}>
            <div style={styles.addTaskHeader}>
              <span style={styles.addTaskTitle}>➕ Add New Task</span>
            </div>
            <div style={styles.addTaskInputs}>
              <input
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder="What needs to be done?"
                style={styles.taskInput}
                required
              />
              <div style={styles.taskMetaInputs}>
                <input
                  type="date"
                  value={newTaskDate}
                  onChange={(e) => setNewTaskDate(e.target.value)}
                  style={styles.dateInput}
                  required
                />
                <select
                  value={newTaskCategory}
                  onChange={(e) => setNewTaskCategory(e.target.value)}
                  style={styles.categoryInput}
                >
                  <option value="General">General</option>
                  <option value="Work">Work</option>
                  <option value="Personal">Personal</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Health">Health</option>
                  <option value="Learning">Learning</option>
                </select>
                <button type="submit" style={styles.addTaskButton}>
                  Add Task
                </button>
              </div>
            </div>
          </form>

          <div style={styles.filterBar}>
            <div style={styles.filterButtons}>
              {['all', 'active', 'completed'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    ...styles.filterButton,
                    ...(filter === f ? styles.filterButtonActive : {})
                  }}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.categoryBar}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  ...styles.categoryButton,
                  ...(selectedCategory === cat ? styles.categoryButtonActive : {})
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div style={styles.taskList}>
            {filteredTodos.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  No tasks yet
                </div>
                <div style={{ color: theme.textMuted }}>
                  Ask the AI assistant to add your first task!
                </div>
              </div>
            ) : (
              filteredTodos.map(todo => (
                <div
                  key={todo.id}
                  style={{
                    ...styles.taskCard,
                    ...(isOverdue(todo.date, todo.completed) ? styles.taskCardOverdue : {})
                  }}
                >
                  <div style={styles.taskContent}>
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => toggleTodo(todo.id, todo.completed)}
                      style={styles.checkbox}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{
                        ...styles.taskText,
                        ...(todo.completed ? styles.taskTextCompleted : {})
                      }}>
                        {todo.text}
                      </div>
                      <div style={styles.taskMeta}>
                        <span style={styles.taskCategory}>{todo.category}</span>
                        <span style={styles.taskDate}>
                          {formatDate(todo.date)}
                          {isOverdue(todo.date, todo.completed) && ' ⚠️'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteTodo(todo.id)}
                      style={styles.deleteButton}
                      title="Delete task"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Panel - AI Agent */}
        <div style={styles.agentContainer}>
          <div style={styles.agentHeader}>
            <div>
              <div style={styles.agentTitle}>🤖 AI Assistant</div>
              <div style={styles.agentSubtitle}>
                Ask me anything about your tasks
              </div>
            </div>
            {ollamaConnected && ollamaModels.length > 1 && (
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                style={styles.modelSelect}
              >
                {ollamaModels.map(model => (
                  <option key={model.name} value={model.name}>
                    {model.name}
                  </option>
                ))}
              </select>
            )}
            <div style={styles.agentBadge}>
              {ollamaConnected ? 'Connected' : 'Disconnected'}
            </div>
          </div>

          <div style={styles.agentMessages}>
            {agentMessages.length === 0 && (
              <div style={styles.emptyState}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>💬</div>
                <div style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  Start a conversation
                </div>
                <div style={{ color: theme.textMuted, fontSize: '0.875rem' }}>
                  Ask me to manage tasks, analyze productivity, or suggest priorities
                </div>
              </div>
            )}
            
            {agentMessages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  ...styles.message,
                  ...(msg.role === 'user' ? styles.userMessage : styles.agentMessage)
                }}
              >
                <div style={styles.messageHeader}>
                  <div style={styles.messageRole}>
                    {msg.role === 'user' ? '👤 You' : '🤖 Assistant'}
                  </div>
                  {msg.action && msg.action !== 'none' && (
                    <div style={styles.toolBadge}>
                      🛠️ {msg.action}
                    </div>
                  )}
                </div>
                <div style={styles.messageContent}>{msg.content}</div>
                {msg.toolResult && (
                  <div style={styles.reasoningBadge}>
                    Result: {JSON.stringify(msg.toolResult, null, 2)}
                  </div>
                )}
              </div>
            ))}
            
            {aiLoading && (
              <div style={styles.message}>
                <div style={styles.aiLoaderContainer}>
                  <div style={styles.aiLoaderText}>Thinking</div>
                  <div style={{...styles.aiLoaderDot, animationDelay: '0s'}} />
                  <div style={{...styles.aiLoaderDot, animationDelay: '0.2s'}} />
                  <div style={{...styles.aiLoaderDot, animationDelay: '0.4s'}} />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {agentMessages.length === 0 && (
            <div style={styles.quickActions}>
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAgentMessage(action)}
                  style={styles.quickActionBtn}
                  disabled={!ollamaConnected}
                >
                  {action}
                </button>
              ))}
            </div>
          )}

          <div style={styles.agentInput}>
            <input
              type="text"
              value={agentInput}
              onChange={(e) => setAgentInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAgentMessage(agentInput)}
              placeholder={ollamaConnected ? "Ask me anything..." : "Waiting for Ollama connection..."}
              style={styles.agentInputField}
              disabled={!ollamaConnected || aiLoading}
            />
            <button
              onClick={() => handleAgentMessage(agentInput)}
              style={styles.agentSendBtn}
              disabled={!ollamaConnected || aiLoading || !agentInput.trim()}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==================== STYLES ==================== */

const styles = {
  container: {
    minHeight: '100vh',
    background: theme.bg,
    padding: '2rem',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },

  header: {
    maxWidth: '1400px',
    margin: '0 auto 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  title: {
    fontSize: '2.5rem',
    fontWeight: '700',
    background: theme.gradient,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: '0.5rem',
  },

  subtitle: {
    color: theme.textMuted,
    fontSize: '0.875rem',
  },

  backButton: {
    padding: '0.75rem 1.5rem',
    background: theme.surface,
    border: `1px solid ${theme.border}`,
    borderRadius: '10px',
    color: theme.text,
    textDecoration: 'none',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },

  warningBanner: {
    maxWidth: '1400px',
    margin: '0 auto 2rem',
    padding: '1rem 1.5rem',
    background: 'rgba(245, 158, 11, 0.1)',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    borderRadius: '12px',
    color: theme.warning,
  },

  mainGrid: {
    maxWidth: '1400px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '2rem',
  },

  leftPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },

  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '1rem',
  },

  statCard: {
    background: theme.surface,
    padding: '1.5rem',
    borderRadius: '12px',
    border: `1px solid ${theme.border}`,
    textAlign: 'center',
  },

  statValue: {
    fontSize: '2rem',
    fontWeight: '700',
    color: theme.text,
    marginBottom: '0.5rem',
  },

  statLabel: {
    fontSize: '0.75rem',
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },

  addTaskForm: {
    background: theme.surface,
    padding: '1.5rem',
    borderRadius: '12px',
    border: `1px solid ${theme.border}`,
  },

  addTaskHeader: {
    marginBottom: '1rem',
  },

  addTaskTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: theme.accent,
  },

  addTaskInputs: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },

  taskInput: {
    padding: '0.75rem 1rem',
    background: theme.bg,
    border: `1px solid ${theme.border}`,
    borderRadius: '8px',
    color: theme.text,
    fontSize: '0.875rem',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.2s ease',
  },

  taskMetaInputs: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr auto',
    gap: '0.75rem',
  },

  dateInput: {
    padding: '0.75rem 1rem',
    background: theme.bg,
    border: `1px solid ${theme.border}`,
    borderRadius: '8px',
    color: theme.text,
    fontSize: '0.875rem',
    fontFamily: 'inherit',
    outline: 'none',
  },

  categoryInput: {
    padding: '0.75rem 1rem',
    background: theme.bg,
    border: `1px solid ${theme.border}`,
    borderRadius: '8px',
    color: theme.text,
    fontSize: '0.875rem',
    fontFamily: 'inherit',
    outline: 'none',
    cursor: 'pointer',
  },

  addTaskButton: {
    padding: '0.75rem 1.5rem',
    background: theme.accent,
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  },

  filterBar: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
  },

  filterButtons: {
    display: 'flex',
    gap: '0.5rem',
  },

  filterButton: {
    padding: '0.5rem 1rem',
    background: 'transparent',
    border: `1px solid ${theme.border}`,
    borderRadius: '8px',
    color: theme.textSecondary,
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
  },

  filterButtonActive: {
    background: theme.glass,
    border: `1px solid ${theme.accent}`,
    color: theme.accent,
  },

  categoryBar: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },

  categoryButton: {
    padding: '0.5rem 1rem',
    background: 'transparent',
    border: `1px solid ${theme.border}`,
    borderRadius: '20px',
    color: theme.textSecondary,
    fontSize: '0.75rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
  },

  categoryButtonActive: {
    background: theme.accent,
    borderColor: theme.accent,
    color: 'white',
  },

  taskList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    maxHeight: 'calc(100vh - 25rem)',
    overflowY: 'auto',
    paddingRight: '0.5rem',
  },

  taskCard: {
    background: theme.surface,
    padding: '1rem',
    borderRadius: '12px',
    border: `1px solid ${theme.border}`,
    transition: 'all 0.2s ease',
  },

  taskCardOverdue: {
    borderColor: theme.danger,
    background: 'rgba(239, 68, 68, 0.05)',
  },

  taskContent: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
  },

  checkbox: {
    width: '20px',
    height: '20px',
    marginTop: '2px',
    cursor: 'pointer',
  },

  taskText: {
    fontSize: '0.95rem',
    color: theme.text,
    marginBottom: '0.5rem',
    lineHeight: '1.5',
  },

  taskTextCompleted: {
    textDecoration: 'line-through',
    color: theme.textMuted,
  },

  taskMeta: {
    display: 'flex',
    gap: '1rem',
    fontSize: '0.75rem',
  },

  taskCategory: {
    color: theme.accent,
    fontWeight: '600',
  },

  taskDate: {
    color: theme.textMuted,
  },

  deleteButton: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1.25rem',
    opacity: 0.6,
    transition: 'opacity 0.2s ease',
  },

  emptyState: {
    textAlign: 'center',
    padding: '3rem 1rem',
    color: theme.textSecondary,
  },

  loader: {
    textAlign: 'center',
    padding: '3rem',
    color: theme.text,
    fontSize: '1.25rem',
  },

  /* Agent Chat */
  agentContainer: {
    background: theme.surface,
    borderRadius: '16px',
    border: `1px solid ${theme.agentBorder}`,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 10rem)',
    boxShadow: '0 4px 24px rgba(139, 92, 246, 0.1)',
  },

  agentHeader: {
    padding: '1.5rem',
    background: theme.agentBg,
    borderBottom: `1px solid ${theme.agentBorder}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
  },

  agentTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#8b5cf6',
    marginBottom: '0.25rem',
  },

  agentSubtitle: {
    fontSize: '0.8rem',
    color: theme.textMuted,
  },

  modelSelect: {
    padding: '0.5rem',
    background: theme.bg,
    border: `1px solid ${theme.border}`,
    borderRadius: '8px',
    color: theme.text,
    fontSize: '0.75rem',
    fontFamily: 'inherit',
  },

  agentBadge: {
    padding: '0.5rem 1rem',
    background: 'rgba(139, 92, 246, 0.15)',
    border: `1px solid ${theme.agentBorder}`,
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#8b5cf6',
  },

  agentMessages: {
    flex: 1,
    overflowY: 'auto',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },

  message: {
    padding: '1rem',
    borderRadius: '12px',
    maxWidth: '85%',
    animation: 'fadeIn 0.3s ease',
  },

  userMessage: {
    background: theme.glass,
    border: `1px solid ${theme.glassBorder}`,
    marginLeft: 'auto',
  },

  agentMessage: {
    background: theme.agentBg,
    border: `1px solid ${theme.agentBorder}`,
    marginRight: 'auto',
  },

  messageHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '0.5rem',
    gap: '1rem',
  },

  messageRole: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: theme.accent,
  },

  toolBadge: {
    fontSize: '0.7rem',
    padding: '3px 8px',
    background: 'rgba(139, 92, 246, 0.2)',
    border: `1px solid ${theme.agentBorder}`,
    borderRadius: '10px',
    color: '#8b5cf6',
    fontWeight: '500',
  },

  messageContent: {
    fontSize: '0.875rem',
    lineHeight: '1.6',
    color: theme.text,
    whiteSpace: 'pre-wrap',
  },

  reasoningBadge: {
    marginTop: '0.5rem',
    fontSize: '0.7rem',
    color: theme.textMuted,
    fontStyle: 'italic',
  },

  quickActions: {
    padding: '1rem 1.5rem',
    borderTop: `1px solid ${theme.border}`,
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },

  quickActionBtn: {
    padding: '0.5rem 1rem',
    background: 'transparent',
    border: `1px solid ${theme.agentBorder}`,
    borderRadius: '20px',
    color: '#8b5cf6',
    fontSize: '0.75rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
  },

  agentInput: {
    padding: '1.5rem',
    borderTop: `1px solid ${theme.border}`,
    display: 'flex',
    gap: '0.75rem',
  },

  agentInputField: {
    flex: 1,
    padding: '0.875rem 1rem',
    background: theme.bg,
    border: `1px solid ${theme.border}`,
    borderRadius: '10px',
    color: theme.text,
    fontSize: '0.875rem',
    fontFamily: 'inherit',
    outline: 'none',
  },

  agentSendBtn: {
    padding: '0.875rem 1.5rem',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
    border: 'none',
    borderRadius: '10px',
    color: 'white',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
  },

  aiLoaderContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },

  aiLoaderText: {
    fontSize: '0.75rem',
    color: theme.textMuted,
  },

  aiLoaderDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: theme.accent,
    animation: 'aiPulse 1.4s ease-in-out infinite',
  },
};

/* Add keyframes for animations */
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes aiPulse {
    0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
    40% { opacity: 1; transform: scale(1.3); }
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;
document.head.appendChild(styleSheet);

export default Todo;