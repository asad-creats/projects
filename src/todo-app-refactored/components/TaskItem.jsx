import React from 'react';
import { Icon } from './TallyIcons';
import { categoryColor, relativeDue } from '../utils/tally';

export const TaskItem = ({
  todo,
  onToggle,
  onDelete,
  onSuggestionsClick,
  showSuggestions,
  loadingSuggestions,
  suggestions,
  onCloseSuggestions,
  onRegenerateSuggestions,
  ollamaConnected,
}) => {
  const due = relativeDue(todo.date, todo.completed);
  const open = showSuggestions === todo.id;
  const loading = loadingSuggestions === todo.id;

  return (
    <>
      <div className={`task ${todo.completed ? 'done' : ''}`}>
        <button
          className="check"
          onClick={() => onToggle(todo.id, todo.completed)}
          title={todo.completed ? 'Mark active' : 'Mark done'}
        >
          <Icon.check style={{ width: 12, height: 12, color: 'var(--accent-ink)' }} />
        </button>

        <div className="t-body">
          <div className="t-title">{todo.text}</div>
          <div className="t-meta">
            <span className="tag">
              <span className="swatch" style={{ background: categoryColor(todo.category) }} />
              {todo.category}
            </span>
            <span className={`due ${due.state === 'overdue' ? 'overdue' : ''} ${due.state === 'today' ? 'today' : ''}`}>
              <Icon.clock style={{ width: 11, height: 11 }} /> {due.label}
            </span>
          </div>
        </div>

        <div className="t-actions">
          {ollamaConnected && (
            <button title="AI suggestions" onClick={() => onSuggestionsClick(todo.id, todo.text)} disabled={loading}>
              <Icon.zap style={{ width: 14, height: 14 }} />
            </button>
          )}
          <button title="Delete task" onClick={() => onDelete(todo.id)}>
            <Icon.trash style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </div>

      {open && (
        <div className="sugg-panel">
          <div className="sp-head">
            <span className="sp-title">AI suggestions</span>
            <button className="sp-btn" onClick={onCloseSuggestions}>✕</button>
          </div>
          {loading ? (
            <div className="typing" style={{ padding: '4px 0' }}><i /><i /><i /></div>
          ) : suggestions ? (
            <>
              <div className="sp-body">{suggestions}</div>
              <div className="sp-actions">
                <button className="sp-btn" onClick={() => onRegenerateSuggestions(todo.id, todo.text)}>Regenerate</button>
                <button className="sp-btn primary" onClick={onCloseSuggestions}>Got it</button>
              </div>
            </>
          ) : (
            <div className="sp-body">Click the spark to get AI suggestions for this task.</div>
          )}
        </div>
      )}
    </>
  );
};
