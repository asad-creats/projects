import React from 'react';
import { styles } from '../styles/styles';
import { formatDate, isOverdue } from '../utils/dateUtils';

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
  ollamaConnected
}) => {
  return (
    <div>
      <div
        style={{
          ...styles.taskCard,
          ...(isOverdue(todo.date, todo.completed) ? styles.taskCardOverdue : {})
        }}
      >
        <div style={styles.taskContent}>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => onToggle(todo.id, todo.completed)}
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
          <div style={styles.taskActions}>
            {ollamaConnected && (
              <button
                onClick={() => onSuggestionsClick(todo.id, todo.text)}
                style={styles.suggestionButton}
                title="Get AI suggestions"
                disabled={loadingSuggestions === todo.id}
              >
                {loadingSuggestions === todo.id ? '⏳' : '💡'}
              </button>
            )}
            <button
              onClick={() => onDelete(todo.id)}
              style={styles.deleteButton}
              title="Delete task"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
      
      {/* Suggestions Panel */}
      {showSuggestions === todo.id && (
        <div style={styles.suggestionsPanel}>
          <div style={styles.suggestionsPanelHeader}>
            <span style={styles.suggestionsPanelTitle}>💡 AI Suggestions</span>
            <button
              onClick={onCloseSuggestions}
              style={styles.closeSuggestionsBtn}
            >
              ✕
            </button>
          </div>
          
          {loadingSuggestions === todo.id ? (
            <div style={styles.suggestionsLoading}>
              <div style={styles.aiLoaderContainer}>
                <div style={styles.aiLoaderText}>Generating suggestions</div>
                <div style={{...styles.aiLoaderDot, animationDelay: '0s'}} />
                <div style={{...styles.aiLoaderDot, animationDelay: '0.2s'}} />
                <div style={{...styles.aiLoaderDot, animationDelay: '0.4s'}} />
              </div>
            </div>
          ) : suggestions ? (
            <>
              <div style={styles.suggestionsContent}>
                {suggestions}
              </div>
              <div style={styles.suggestionsActions}>
                <button
                  onClick={onCloseSuggestions}
                  style={styles.saveSuggestionsBtn}
                >
                  ✓ Got it
                </button>
                <button
                  onClick={() => onRegenerateSuggestions(todo.id, todo.text)}
                  style={styles.regenerateSuggestionsBtn}
                >
                  🔄 Regenerate
                </button>
              </div>
            </>
          ) : (
            <div style={styles.suggestionsContent}>
              Click the lightbulb to get AI suggestions for this task!
            </div>
          )}
        </div>
      )}
    </div>
  );
};
