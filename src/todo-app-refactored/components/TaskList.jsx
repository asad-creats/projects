import React from 'react';
import { styles } from '../styles/styles';
import { TaskItem } from './TaskItem';
import { SkeletonLoader } from './SkeletonLoader';

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
  ollamaConnected,
  loading = false
}) => {
  if (loading) {
    return (
      <div style={styles.taskList}>
        {[...Array(5)].map((_, index) => (
          <div key={index} style={styles.taskCard}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <SkeletonLoader type="taskCard" style={{ width: '20px', height: '20px', borderRadius: '4px', marginTop: '2px' }} />
              <div style={{ flex: 1 }}>
                <SkeletonLoader type="taskCard" style={{ height: '16px', width: '70%', marginBottom: '8px' }} />
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem' }}>
                  <SkeletonLoader type="taskCard" style={{ height: '12px', width: '50px' }} />
                  <SkeletonLoader type="taskCard" style={{ height: '12px', width: '60px' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <SkeletonLoader type="taskCard" style={{ width: '24px', height: '24px', borderRadius: '4px' }} />
                <SkeletonLoader type="taskCard" style={{ width: '24px', height: '24px', borderRadius: '4px' }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

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
