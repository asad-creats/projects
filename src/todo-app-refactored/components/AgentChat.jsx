import React, { useRef, useEffect } from 'react';
import { styles } from '../styles/styles';

export const AgentChat = ({
  messages,
  aiLoading,
  input,
  setInput,
  onSendMessage,
  ollamaConnected,
  ollamaModels,
  selectedModel,
  setSelectedModel,
  quickActions
}) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
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
        {messages.length === 0 && (
          <div style={styles.emptyState}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>💬</div>
            <div style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              Start a conversation
            </div>
            <div style={{ color: '#64748b', fontSize: '0.875rem' }}>
              Ask me to manage tasks, analyze productivity, or suggest priorities
            </div>
          </div>
        )}
        
        {messages.map((msg, idx) => (
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
            {msg.toolResult && msg.toolResult.length > 0 && (
              <div style={styles.toolResults}>
                {msg.toolResult.map((result, i) => (
                  <div key={i} style={styles.toolResultItem}>
                    {result.success ? '✅' : '❌'} {result.message || result.error}
                  </div>
                ))}
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

      {messages.length === 0 && (
        <div style={styles.quickActions}>
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => onSendMessage(action)}
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
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && onSendMessage(input)}
          placeholder={ollamaConnected ? "Ask me anything..." : "Waiting for Ollama connection..."}
          style={styles.agentInputField}
          disabled={!ollamaConnected || aiLoading}
        />
        <button
          onClick={() => onSendMessage(input)}
          style={styles.agentSendBtn}
          disabled={!ollamaConnected || aiLoading || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
};
