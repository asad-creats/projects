import React, { useRef, useEffect } from 'react';
import { styles } from '../styles/styles';
import { DEFAULT_MODELS } from '../hooks/useAiConfig';

export const AgentChat = ({
  messages,
  aiLoading,
  input,
  setInput,
  onSendMessage,
  aiConfig,
  onOpenSettings,
  freeUsage,
  ollamaConnected,
  quickActions,
  isNarrow,
  rootRef,
  settingsBtnRef,
}) => {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const FREE_LIMIT = freeUsage?.limit ?? 4;
  const freeUsed = freeUsage?.used ?? 0;
  const freeRemaining = Math.max(0, FREE_LIMIT - freeUsed);
  const freeCapped = aiConfig.mode === 'free' && freeRemaining <= 0;

  // Readiness depends on the selected mode/provider.
  const providerReady =
    aiConfig.mode === 'free'
      ? !freeCapped
      : aiConfig.provider === 'ollama'
        ? ollamaConnected
        : !!aiConfig.apiKey;

  // Status badge text.
  const statusBadge = (() => {
    if (aiConfig.mode === 'free') {
      return freeCapped ? '⚠️ Daily limit reached' : `Free · ${freeRemaining}/${FREE_LIMIT} left`;
    }
    if (aiConfig.provider === 'ollama') {
      return ollamaConnected ? '🏠 Ollama connected' : '🏠 Ollama not running';
    }
    const model = aiConfig.model || DEFAULT_MODELS[aiConfig.provider];
    return aiConfig.apiKey ? `🔑 ${model}` : '⚠️ Add your API key';
  })();

  // Scroll only the chat container — not the whole page.
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages, aiLoading]);

  const placeholder = providerReady
    ? 'Ask me anything…'
    : aiConfig.mode === 'free'
      ? 'Daily free limit reached — add your own key in settings'
      : aiConfig.provider === 'ollama'
        ? 'Start Ollama on localhost:11434…'
        : 'Add your API key in AI Settings…';

  return (
    <div ref={rootRef} style={{ ...styles.agentContainer, height: isNarrow ? '70vh' : styles.agentContainer.height }}>
      <div style={styles.agentHeader}>
        <div>
          <div style={styles.agentTitle}>🤖 AI Assistant</div>
          <div style={styles.agentSubtitle}>Ask me anything about your tasks</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={styles.agentBadge}>{statusBadge}</div>
          <button ref={settingsBtnRef} style={styles.settingsBtn} onClick={onOpenSettings} title="AI settings">⚙️</button>
        </div>
      </div>

      <div style={styles.agentMessages} ref={messagesContainerRef}>
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
            style={{ ...styles.message, ...(msg.role === 'user' ? styles.userMessage : styles.agentMessage) }}
          >
            <div style={styles.messageHeader}>
              <div style={styles.messageRole}>
                {msg.role === 'user' ? '👤 You' : '🤖 Assistant'}
              </div>
              {msg.action && msg.action !== 'none' && (
                <div style={styles.toolBadge}>🛠️ {msg.action}</div>
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
              <div style={{ ...styles.aiLoaderDot, animationDelay: '0s' }} />
              <div style={{ ...styles.aiLoaderDot, animationDelay: '0.2s' }} />
              <div style={{ ...styles.aiLoaderDot, animationDelay: '0.4s' }} />
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
              disabled={!providerReady}
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
          onKeyPress={(e) => e.key === 'Enter' && providerReady && !aiLoading && onSendMessage(input)}
          placeholder={placeholder}
          style={styles.agentInputField}
          disabled={!providerReady || aiLoading}
        />
        <button
          onClick={() => onSendMessage(input)}
          style={styles.agentSendBtn}
          disabled={!providerReady || aiLoading || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
};
