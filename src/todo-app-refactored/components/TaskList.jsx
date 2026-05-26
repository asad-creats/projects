import React from 'react';
import { TaskItem } from './TaskItem';

export const TaskList = ({
  sections,
  total = 0,
  onToggle,
  onDelete,
  onSuggestionsClick,
  showSuggestions,
  loadingSuggestions,
  taskSuggestions = {},
  onCloseSuggestions,
  onRegenerateSuggestions,
  ollamaConnected,
}) => {
  if (!sections.length) {
    return (
      <div className="tasks">
        <div className="empty">
          <div className="big">{total === 0 ? 'No tasks yet.' : 'All clear.'}</div>
          <div>
            {total === 0
              ? 'Add your first task above, or ask the AI assistant to create one.'
              : 'Nothing matches this view. Try a different filter.'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tasks">
      {sections.map((sec) => (
        <React.Fragment key={sec.id}>
          <div className="sect-h">
            {sec.label} <span className="tnum" style={{ color: 'var(--ink-4)' }}>{sec.items.length}</span>
            <span className="line" />
          </div>
          {sec.items.map((todo) => (
            <TaskItem
              key={todo.id}
              todo={todo}
              onToggle={onToggle}
              onDelete={onDelete}
              onSuggestionsClick={onSuggestionsClick}
              showSuggestions={showSuggestions}
              loadingSuggestions={loadingSuggestions}
              suggestions={taskSuggestions[todo.id]}
              onCloseSuggestions={onCloseSuggestions}
              onRegenerateSuggestions={onRegenerateSuggestions}
              ollamaConnected={ollamaConnected}
            />
          ))}
        </React.Fragment>
      ))}
    </div>
  );
};
