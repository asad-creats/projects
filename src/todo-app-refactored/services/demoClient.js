import { getTodayString } from '../utils/dateUtils';

/**
 * DemoAiClient - stands in for a model in the no-login demo. Same
 * chat(messages, model) contract as the other clients, but it pattern-matches
 * the request and returns the JSON tool call a real model would, so TaskAgent
 * still executes real tools against the (in-browser) task list. No network.
 */

const pause = (ms) => new Promise((r) => setTimeout(r, ms));

const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const CATEGORY_HINTS = [
  [/\b(buy|groceries|grocery|shop|order)\b/i, 'Shopping'],
  [/\b(gym|run|workout|doctor|dentist|meditat)/i, 'Health'],
  [/\b(budget|bank|invoice|tax|bill|pay)\b/i, 'Finance'],
  [/\b(email|meeting|report|deck|client|review|call)\b/i, 'Work'],
  [/\b(learn|study|read|course|practice)\b/i, 'Learning'],
];
const guessCategory = (text) => (CATEGORY_HINTS.find(([re]) => re.test(text)) || [null, 'General'])[1];

// "add a task to call the bank tomorrow" -> "call the bank"
function taskTextFrom(msg) {
  return msg
    .replace(/^(please\s+)?(add|create|new|remind me( to)?)\s+(a\s+)?(new\s+)?(task|todo|reminder)?\s*(to|for|:)?\s*/i, '')
    .replace(/\b(for\s+)?(today|tomorrow)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function remainderAfter(msg, verbs) {
  return msg.replace(new RegExp(`^.*?\\b(${verbs})\\b\\s*(the\\s+)?(task\\s+)?`, 'i'), '').replace(/\s+task$/i, '').trim();
}

function route(msg) {
  const m = msg.trim();
  const call = (action, parameters = {}) => JSON.stringify({ action, parameters });

  if (/\b(add|create|remind me|new task)\b/i.test(m)) {
    const parts = taskTextFrom(m).split(/\s+and\s+/i).filter(Boolean);
    const date = /\btomorrow\b/i.test(m) ? tomorrow() : getTodayString();
    if (parts.length > 1) {
      return JSON.stringify(parts.map((text) => ({ action: 'create_task', parameters: { text, date, category: guessCategory(text) } })));
    }
    const text = parts[0] || 'New task';
    return call('create_task', { text, date, category: guessCategory(text) });
  }
  if (/\boverdue|late\b/i.test(m)) return call('list_tasks', { filter: 'overdue' });
  if (/\b(complete|finish|done with|mark)\b/i.test(m)) return call('complete_task', { taskText: remainderAfter(m, 'complete|finish|done with|mark').replace(/\s+(as\s+)?(done|complete)$/i, '') });
  if (/\b(delete|remove)\b/i.test(m)) return call('delete_task', { taskText: remainderAfter(m, 'delete|remove') });
  if (/\bprioriti/i.test(m)) return call('suggest_priorities');
  if (/\b(productiv|analy[sz]e|stats|progress)\b/i.test(m)) return call('analyze_productivity', { period: /\bweek\b/i.test(m) ? 'week' : 'all' });
  if (/\btoday\b/i.test(m)) return call('list_tasks', { filter: 'today' });
  if (/\b(done|completed|finished)\b/i.test(m)) return call('list_tasks', { filter: 'completed' });
  if (/\b(show|list|what|tasks?|todo)\b/i.test(m)) return call('list_tasks', { filter: /\b(pending|left|open)\b/i.test(m) ? 'pending' : 'all' });
  if (/\b(help me|how (do|can|should) i|tips|break.*down)\b/i.test(m)) return call('get_task_suggestions', { taskText: m.replace(/^.*?\b(help me( with)?|how (do|can|should) i)\b\s*/i, '') });

  return "Hi! This is the demo, so I'm a simulated assistant. I can still really manage the sample tasks: try “add a task to call the bank tomorrow”, “what's overdue?”, “complete review budget” or “suggest priorities”. Sign up to chat with the real AI.";
}

function suggestionsFor(task) {
  return `Here's a simple way to tackle “${task}”: decide what “done” looks like first, then work in one focused block.

• Write down the single outcome you need from “${task}”.
• Block 25–45 minutes on your calendar and gather what you need beforehand.
• Do the smallest next step now, then schedule a follow-up if it needs more.

Tip: these suggestions are canned in the demo. Sign up for tailored AI help.`;
}

export class DemoAiClient {
  constructor() {
    this.lastUsage = null;
  }

  async chat(messages) {
    await pause(500 + Math.random() * 400); // feel like a model, not an instant switch
    const last = messages[messages.length - 1]?.content || '';
    const isAgentTurn = messages.some((m) => m.role === 'system');
    if (isAgentTurn) return route(last);
    const match = last.match(/for this task: "([^"]+)"/);
    return suggestionsFor(match ? match[1] : 'this task');
  }
}
