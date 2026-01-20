import React from 'react';
import { styles } from '../styles/styles';
import { TaskItem } from './TaskItem';

export const TaskList = ({ 
  todos, 
  onToggle, 
  onDelete,
  onSuggestionsClick,
  showSuggestions,
  loadingSuggestions,
  taskSuggestions,
  onCloseSuggestions,
  onRegenerateSuggestions,
  ollamaConnected
}) => {
  if (todos.length === 0) {
    return (
      <div style={styles.taskList}>
        <div style={styles.emptyState}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
          <div style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            No tasks yet
          </div>
          <div style={{ color: '#64748b' }}>
            Ask the AI assistant to add your first task!
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.taskList}>
      {todos.map(todo => (
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
    </div>
  );
};
