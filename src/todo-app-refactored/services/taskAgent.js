import { OllamaClient } from './ollamaClient';
import { GeminiClient } from './geminiClient';
import { getTodayString, isOverdue, formatDate } from '../utils/dateUtils';

/**
 * TaskAgent - AI-powered task management assistant
 * Supports both Ollama (local) and Gemini (cloud) providers
 */
export class TaskAgent {
  constructor(todos, setTodos, addTodo, toggleTodo, deleteTodo, config = {}) {
    this.todos = todos;
    this.setTodos = setTodos;
    this.addTodo = addTodo;
    this.toggleTodo = toggleTodo;
    this.deleteTodo = deleteTodo;
    
    // Choose which AI to use
    // provider: 'ollama' (local, free, needs Ollama installed)
    //          'gemini' (cloud, free, needs API key)
    this.provider = config.provider || 'ollama';
    this.model = config.model || (this.provider === 'ollama' ? 'llama3.2' : 'gemini-1.5-pro');
    
    // Initialize the right AI client
    if (this.provider === 'ollama') {
      this.aiClient = new OllamaClient();
      console.log('🏠 Using Ollama (Local AI)');
    } else {
      this.aiClient = new GeminiClient(config.apiKey);
      console.log('🌟 Using Gemini (Free Cloud AI)');
    }

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
      },
      {
        name: 'get_task_suggestions',
        description: 'Get AI suggestions on how to accomplish a specific task, break it down into steps, or provide helpful tips',
        parameters: {
          type: 'object',
          properties: {
            taskText: { type: 'string', description: 'The task to get suggestions for' },
            taskId: { type: 'number', description: 'The task ID if available' }
          },
          required: ['taskText']
        }
      }
    ];
  }

  // Get current AI provider and model info
  getProvider() {
    return {
      provider: this.provider,
      model: this.model,
      displayName: this.provider === 'gemini' ? '🌟 Gemini (Cloud)' : '🏠 Ollama (Local)'
    };
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
      case 'get_task_suggestions':
        return this.getTaskSuggestions(args.taskText, args.taskId);
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
    return { success: true, message: `Completed task: "${task.text}"` };
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
    return { success: true, message: `Deleted task: "${task.text}"` };
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

  async getTaskSuggestions(taskText, taskId) {
    try {
      const prompt = `Provide helpful, actionable suggestions for this task: "${taskText}"

Please provide:
1. A brief breakdown of how to approach this task
2. 2-3 specific action steps
3. Any helpful tips or resources

Keep it concise and practical. Format as a short paragraph followed by bullet points.`;

      const suggestions = await this.aiClient.chat([
        { role: 'user', content: prompt }
      ], this.model);

      return {
        success: true,
        taskText,
        taskId,
        suggestions: suggestions.trim()
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to generate suggestions: ${error.message}`
      };
    }
  }

  // Process user query with AI - works with both Ollama and Gemini!
  async processQuery(userMessage, conversationHistory = []) {
    try {
      const taskContext = this.listTasks('all');
      const providerInfo = this.getProvider();

      // CRITICAL: Tell the model it MUST use tools, not explain them
      const systemPrompt = `You are a task management AI assistant. You MUST use the available tools to actually perform actions.

Current tasks: ${taskContext.count} total
Today's date: ${getTodayString()}

IMPORTANT RULES:
1. When user asks you to DO something (add tasks, show tasks, etc), you MUST respond with ONLY a JSON tool call
2. DO NOT explain what you will do - JUST DO IT by returning the JSON
3. When responding with JSON, use this EXACT format with NO extra text:

For single action:
{"action":"tool_name","parameters":{...}}

For multiple tasks (like "add 2 tasks"):
[{"action":"create_task","parameters":{"text":"task 1","date":"2026-01-19"}},{"action":"create_task","parameters":{"text":"task 2","date":"2026-01-19"}}]

EXAMPLES:
User: "add a task to buy milk"
You: {"action":"create_task","parameters":{"text":"buy milk","date":"${getTodayString()}","category":"Shopping"}}

User: "show my tasks"
You: {"action":"list_tasks","parameters":{"filter":"all"}}

User: "suggest priorities"
You: {"action":"suggest_priorities","parameters":{}}

User: "add tasks to learn python and practice coding"
You: [{"action":"create_task","parameters":{"text":"learn python","date":"${getTodayString()}"}},{"action":"create_task","parameters":{"text":"practice coding","date":"${getTodayString()}"}}]

User: "complete buy milk"
You: {"action":"complete_task","parameters":{"taskText":"buy milk"}}

User: "delete the grocery task"
You: {"action":"delete_task","parameters":{"taskText":"grocery"}}

User: "how productive have I been this week?"
You: {"action":"analyze_productivity","parameters":{"period":"week"}}

User: "help me with learning python"
You: {"action":"get_task_suggestions","parameters":{"taskText":"learning python"}}

ONLY respond in plain English if the user is making casual conversation (like "hello" or "how are you").`;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: userMessage }
      ];

      const response = await this.aiClient.chat(messages, this.model);

      // Try to extract JSON from response
      let parsed = null;
      try {
        // Remove any markdown code blocks
        let cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        // Try to find JSON object or array
        const jsonMatch = cleanResponse.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[1]);
        }
      } catch (e) {
        console.log('Could not parse JSON, treating as conversational response');
      }

      // If no JSON found, treat as conversational
      if (!parsed) {
        return {
          response: response,
          action: 'none',
          actions: [],
          toolResult: null,
          fullResponse: response,
          provider: providerInfo
        };
      }

      // Execute the tool(s)
      let toolResults = [];
      let actions = [];

      if (Array.isArray(parsed)) {
        // Multiple actions
        for (const item of parsed) {
          if (item.action && item.action !== 'none') {
            actions.push(item.action);
            try {
              const result = await this.executeTool(item.action, item.parameters || {});
              toolResults.push(result);
              await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
              toolResults.push({ success: false, error: error.message });
            }
          }
        }

        // Generate friendly summary
        const successCount = toolResults.filter(r => r.success).length;
        const totalCount = parsed.length;
        let summaryResponse = '';

        if (successCount === totalCount) {
          summaryResponse = `✅ Done! Successfully completed all ${totalCount} action${totalCount > 1 ? 's' : ''}.`;
        } else if (successCount === 0) {
          summaryResponse = `❌ Sorry, I couldn't complete those actions.`;
        } else {
          summaryResponse = `⚠️ Completed ${successCount} of ${totalCount} actions.`;
        }

        // Add details
        const details = toolResults
          .filter(r => r.success)
          .map(r => r.message || formatToolResult(r))
          .join('\n');

        if (details) {
          summaryResponse += '\n\n' + details;
        }

        return {
          response: summaryResponse,
          action: 'batch',
          actions: actions,
          toolResult: toolResults,
          fullResponse: response,
          provider: providerInfo
        };
      } else {
        // Single action
        let toolResult = null;

        if (parsed.action && parsed.action !== 'none') {
          try {
            toolResult = await this.executeTool(parsed.action, parsed.parameters || {});
            actions.push(parsed.action);

            // Generate friendly response
            const friendlyResponse = formatToolResult(toolResult);

            return {
              response: friendlyResponse,
              action: parsed.action,
              actions: actions,
              toolResult: [toolResult],
              fullResponse: response,
              provider: providerInfo
            };
          } catch (error) {
            toolResult = { success: false, error: error.message };
            return {
              response: `Sorry, I encountered an error: ${error.message}`,
              action: parsed.action,
              actions: actions,
              toolResult: [toolResult],
              fullResponse: response,
              provider: providerInfo
            };
          }
        }
      }

      // Fallback
      return {
        response: response,
        action: 'none',
        actions: [],
        toolResult: null,
        fullResponse: response,
        provider: providerInfo
      };

    } catch (error) {
      console.error('Error processing query:', error);
      
      let errorMsg = `Sorry, I encountered an error: ${error.message}.`;
      if (this.provider === 'ollama') {
        errorMsg += ' Make sure Ollama is running on localhost:11434.';
      } else if (this.provider === 'gemini') {
        errorMsg += ' Check your Gemini API key.';
      }
      
      const providerInfo = this.getProvider();
      return {
        response: errorMsg,
        error: error.message,
        provider: providerInfo
      };
    }
  }
}

// Helper function to format tool results nicely
function formatToolResult(result) {
  if (!result) return '';

  if (result.message) {
    return result.message;
  }

  if (result.stats) {
    let msg = `📊 Productivity Summary:\n\n`;
    msg += `• Total: ${result.stats.total}\n`;
    msg += `• Completed: ${result.stats.completed}\n`;
    msg += `• Pending: ${result.stats.pending}\n`;
    msg += `• Overdue: ${result.stats.overdue}\n`;
    msg += `• Completion Rate: ${result.stats.completionRate}\n`;

    if (result.insights && result.insights.length > 0) {
      msg += `\n${result.insights.join('\n')}`;
    }
    return msg;
  }

  if (result.priorities) {
    let msg = `🎯 Priority Recommendations:\n\n`;
    if (result.priorities.length === 0) {
      msg += `You have no pending tasks! 🎉`;
    } else {
      result.priorities.forEach(p => {
        msg += `**${p.priority} PRIORITY** (${p.reason}):\n`;
        p.tasks.forEach(t => {
          msg += `  • ${t.text} (${t.date})\n`;
        });
        msg += '\n';
      });
    }
    return msg;
  }

  if (result.tasks) {
    let msg = `📝 Task List (${result.count} total):\n\n`;
    if (result.count === 0) {
      msg += `No tasks found. Add your first task to get started!`;
    } else {
      result.tasks.forEach(t => {
        const status = t.completed ? '✅' : '⬜';
        const overdue = t.isOverdue ? ' ⚠️ OVERDUE' : '';
        msg += `${status} ${t.text}\n   ${t.category} • ${t.date}${overdue}\n\n`;
      });
    }
    return msg;
  }

  if (result.suggestions) {
    return result.suggestions;
  }

  return JSON.stringify(result, null, 2);
}