import React, { useRef, useEffect } from 'react';
import { DEFAULT_MODELS } from '../hooks/useAiConfig';
import { Icon } from './TallyIcons';

export const AgentChat = ({
  messages,
  aiLoading,
  input,
  setInput,
  onSendMessage,
  aiConfig,
  onOpenSettings,
  onClose,
  freeUsage,
  ollamaConnected,
  quickActions = [],
  rootRef,
}) => {
  const chatRef = useRef(null);

  const FREE_LIMIT = freeUsage?.limit ?? 4;
  const freeUsed = freeUsage?.used ?? 0;
  const freeRemaining = Math.max(0, FREE_LIMIT - freeUsed);
  const freeCapped = aiConfig.mode === 'free' && freeRemaining <= 0;

  const providerReady =
    aiConfig.mode === 'free'
      ? !freeCapped
      : aiConfig.provider === 'ollama'
        ? ollamaConnected
        : !!aiConfig.apiKey;

  const statusBadge = (() => {
    if (aiConfig.mode === 'free') {
      return freeCapped ? 'Daily limit reached' : `Free · ${freeRemaining}/${FREE_LIMIT} left`;
    }
    if (aiConfig.provider === 'ollama') {
      return ollamaConnected ? 'Ollama connected' : 'Ollama offline';
    }
    const model = aiConfig.model || DEFAULT_MODELS[aiConfig.provider];
    return aiConfig.apiKey ? model : 'Add your API key';
  })();

  useEffect(() => {
    const c = chatRef.current;
    if (c) c.scrollTop = c.scrollHeight;
  }, [messages, aiLoading]);

  const placeholder = providerReady
    ? 'Plan my day, draft an email, add a task…'
    : aiConfig.mode === 'free'
      ? 'Daily free limit reached — add your own key in settings'
      : aiConfig.provider === 'ollama'
        ? 'Start Ollama on localhost:11434…'
        : 'Add your API key in AI Settings…';

  return (
    <aside className="ai-rail" ref={rootRef}>
      <div className="ai-h">
        <div className="ai-title">
          <div className="ai-orb" />
          <div>
            <div><b>Tally AI</b></div>
            <div className="sub">Plans, drafts, and gentle nudges</div>
          </div>
        </div>
        <div className="ai-ctrl">
          <span className="ai-badge" title={statusBadge}>{statusBadge}</span>
          <button title="AI settings" onClick={onOpenSettings}><Icon.settings style={{ width: 14, height: 14 }} /></button>
          {onClose && <button title="Hide panel" onClick={onClose}><Icon.close style={{ width: 14, height: 14 }} /></button>}
        </div>
      </div>

      {messages.length === 0 && quickActions.length > 0 && (
        <div className="ai-suggest">
          <div className="lbl">Try asking</div>
          {quickActions.slice(0, 4).map((action, i) => (
            <button key={i} className="sg" onClick={() => onSendMessage(action)} disabled={!providerReady}>
              <div className="sg-icon">{i % 2 === 0 ? <Icon.zap style={{ width: 12, height: 12 }} /> : <Icon.brain style={{ width: 12, height: 12 }} />}</div>
              <div className="sg-body">{action}</div>
            </button>
          ))}
        </div>
      )}

      <div className="chat" ref={chatRef}>
        {messages.length === 0 && (
          <div className="chat-empty">
            Ask me to manage tasks, analyze productivity, or plan your day.
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`msg ${msg.role === 'user' ? 'user' : 'ai'}`}>
            <div className="av">{msg.role === 'user' ? 'You'.charAt(0) : <Icon.sparkle style={{ width: 13, height: 13 }} />}</div>
            <div className="bubble">
              {msg.content}
              {msg.action && msg.action !== 'none' && (
                <div className="ai-action"><Icon.check style={{ width: 11, height: 11 }} /> {msg.action}</div>
              )}
              {msg.toolResult && msg.toolResult.length > 0 && (
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--ink-3)' }}>
                  {msg.toolResult.map((r, i) => (
                    <div key={i}>{r.success ? '✓' : '✕'} {r.message || r.error}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {aiLoading && (
          <div className="msg ai">
            <div className="av"><Icon.sparkle style={{ width: 13, height: 13 }} /></div>
            <div className="bubble" style={{ padding: 0, border: 0 }}>
              <div className="typing"><i /><i /><i /></div>
            </div>
          </div>
        )}
      </div>

      <div className="composer-ai">
        <div className="ai-input">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && providerReady && !aiLoading) onSendMessage(input); }}
            placeholder={placeholder}
            disabled={!providerReady || aiLoading}
          />
          <button
            className="send"
            onClick={() => onSendMessage(input)}
            disabled={!providerReady || aiLoading || !input.trim()}
            title="Send"
          >
            <Icon.send style={{ width: 14, height: 14 }} />
          </button>
        </div>
        <div className="ai-hint">
          <span>Tally remembers context across the chat</span>
          <button className="linkish" style={{ fontSize: 11 }} onClick={onOpenSettings}>Settings</button>
        </div>
      </div>
    </aside>
  );
};
