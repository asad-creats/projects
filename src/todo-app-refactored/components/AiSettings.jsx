import React, { useState, useEffect } from 'react';
import { theme } from '../styles/theme';
import { DEFAULT_MODELS, MODEL_OPTIONS } from '../hooks/useAiConfig';
import { OpenRouterClient } from '../services/openRouterClient';

const PROVIDERS = [
  { id: 'gemini', label: 'Google Gemini', needsKey: true, keyUrl: 'https://aistudio.google.com/app/apikey' },
  { id: 'openrouter', label: 'OpenRouter (free models)', needsKey: true, keyUrl: 'https://openrouter.ai/keys' },
  { id: 'openai', label: 'OpenAI', needsKey: true, keyUrl: 'https://platform.openai.com/api-keys' },
  { id: 'anthropic', label: 'Anthropic (Claude)', needsKey: true, keyUrl: 'https://console.anthropic.com/settings/keys' },
  { id: 'ollama', label: 'Ollama (local)', needsKey: false, keyUrl: null },
];

const CUSTOM = '__custom__';

export const AiSettings = ({ config, update, onClose }) => {
  const [draft, setDraft] = useState(config);
  const [orModels, setOrModels] = useState([]);
  const [orLoading, setOrLoading] = useState(false);
  const [orError, setOrError] = useState('');

  const activeProvider = PROVIDERS.find((p) => p.id === draft.provider) || PROVIDERS[0];

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));

  // Curated list for the chosen provider; OpenRouter is fetched live.
  const baseModels = draft.provider === 'openrouter' ? orModels : (MODEL_OPTIONS[draft.provider] || []);
  const currentModel = draft.model || DEFAULT_MODELS[draft.provider] || '';
  const isCustom = currentModel && baseModels.length > 0 && !baseModels.includes(currentModel);

  // Fetch OpenRouter's currently-free models when that provider is selected.
  useEffect(() => {
    if (draft.provider !== 'openrouter') return;
    let cancelled = false;
    setOrLoading(true);
    setOrError('');
    OpenRouterClient.listFreeModels()
      .then((models) => { if (!cancelled) setOrModels(models); })
      .catch(() => { if (!cancelled) setOrError('Could not load free models — you can still type a model id.'); })
      .finally(() => { if (!cancelled) setOrLoading(false); });
    return () => { cancelled = true; };
  }, [draft.provider]);

  const save = () => {
    update(draft);
    onClose();
  };

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <div style={s.header}>
          <h2 style={s.title}>AI Settings</h2>
          <button style={s.close} onClick={onClose}>✕</button>
        </div>

        {/* Mode toggle */}
        <div style={s.modeRow}>
          <button
            style={{ ...s.modeBtn, ...(draft.mode === 'free' ? s.modeBtnActive : {}) }}
            onClick={() => set({ mode: 'free' })}
          >
            Free
            <span style={s.modeSub}>4 messages / day</span>
          </button>
          <button
            style={{ ...s.modeBtn, ...(draft.mode === 'byo' ? s.modeBtnActive : {}) }}
            onClick={() => set({ mode: 'byo' })}
          >
            Bring your own key
            <span style={s.modeSub}>unlimited</span>
          </button>
        </div>

        {draft.mode === 'free' && (
          <p style={s.note}>
            Uses a shared model with a daily cap. No setup needed. For unlimited
            use, switch to your own key.
          </p>
        )}

        {draft.mode === 'byo' && (
          <div style={s.byoBox}>
            <label style={s.label}>Provider</label>
            <select
              style={s.select}
              value={draft.provider}
              onChange={(e) => set({ provider: e.target.value, model: '' })}
            >
              {PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>

            {activeProvider.needsKey && (
              <>
                <label style={s.label}>API key</label>
                <input
                  type="password"
                  style={s.input}
                  placeholder="Paste your API key"
                  value={draft.apiKey}
                  onChange={(e) => set({ apiKey: e.target.value })}
                  autoComplete="off"
                />
                <a href={activeProvider.keyUrl} target="_blank" rel="noopener noreferrer" style={s.keyLink}>
                  Get a {activeProvider.label} key →
                </a>
              </>
            )}

            <label style={s.label}>
              Model
              {draft.provider === 'openrouter' && orLoading && (
                <span style={s.loadingHint}> · loading free models…</span>
              )}
              {draft.provider === 'openrouter' && !orLoading && orModels.length > 0 && (
                <span style={s.loadingHint}> · {orModels.length} free models</span>
              )}
            </label>

            {/* Dropdown of known models + a "Custom…" escape hatch */}
            <select
              style={s.select}
              value={isCustom ? CUSTOM : currentModel}
              onChange={(e) => set({ model: e.target.value === CUSTOM ? (currentModel || ' ') : e.target.value })}
            >
              {baseModels.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
              {baseModels.length === 0 && <option value="">(type a model id below)</option>}
              <option value={CUSTOM}>Custom…</option>
            </select>

            {(isCustom || baseModels.length === 0) && (
              <input
                type="text"
                style={s.input}
                placeholder={DEFAULT_MODELS[draft.provider] || 'model id'}
                value={draft.model}
                onChange={(e) => set({ model: e.target.value })}
              />
            )}

            {orError && draft.provider === 'openrouter' && (
              <div style={s.warn}>{orError}</div>
            )}

            {draft.provider === 'openrouter' && (
              <p style={s.tip}>
                Free models (ending in <code>:free</code>) are rate-limited and
                rotate over time. If one is busy, pick another.
              </p>
            )}

            <div style={s.security}>
              🔒 Your key is stored only in this browser and sent directly to the
              provider from your device — never to our servers.
            </div>
          </div>
        )}

        <button style={s.saveBtn} onClick={save}>Save</button>
      </div>
    </div>
  );
};

const s = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: '1rem',
  },
  modal: {
    width: '100%', maxWidth: '440px', maxHeight: '90vh', overflowY: 'auto',
    background: theme.surface, border: `1px solid ${theme.border}`,
    borderRadius: '16px', padding: '1.5rem', boxShadow: '0 12px 48px rgba(0,0,0,0.5)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' },
  title: { margin: 0, fontSize: '1.1rem', color: theme.text },
  close: { background: 'none', border: 'none', color: theme.textMuted, fontSize: '1.1rem', cursor: 'pointer' },
  modeRow: { display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' },
  modeBtn: {
    flex: 1, padding: '0.9rem', background: theme.bg, border: `1px solid ${theme.border}`,
    borderRadius: '12px', color: theme.text, cursor: 'pointer', fontSize: '0.85rem',
    fontWeight: 600, display: 'flex', flexDirection: 'column', gap: '0.25rem', fontFamily: 'inherit',
  },
  modeBtnActive: { borderColor: theme.accent, background: theme.glass, color: theme.accent },
  modeSub: { fontSize: '0.7rem', fontWeight: 400, color: theme.textMuted },
  note: { fontSize: '0.8rem', color: theme.textMuted, lineHeight: 1.5, margin: '0.5rem 0 0' },
  byoBox: { display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' },
  label: { fontSize: '0.75rem', color: theme.textSecondary, marginTop: '0.5rem', fontWeight: 600 },
  loadingHint: { fontWeight: 400, color: theme.textMuted },
  select: {
    padding: '0.6rem', background: theme.bg, border: `1px solid ${theme.border}`,
    borderRadius: '8px', color: theme.text, fontSize: '0.85rem', fontFamily: 'inherit',
  },
  input: {
    padding: '0.6rem 0.75rem', background: theme.bg, border: `1px solid ${theme.border}`,
    borderRadius: '8px', color: theme.text, fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none',
  },
  keyLink: { fontSize: '0.75rem', color: theme.accent, textDecoration: 'none', marginTop: '0.1rem' },
  tip: { fontSize: '0.72rem', color: theme.textMuted, lineHeight: 1.5, margin: '0.25rem 0 0' },
  warn: {
    fontSize: '0.72rem', color: theme.warning, background: 'rgba(245,158,11,0.1)',
    border: '1px solid rgba(245,158,11,0.3)', borderRadius: '8px', padding: '0.5rem',
  },
  security: {
    fontSize: '0.72rem', color: theme.textMuted, lineHeight: 1.5, marginTop: '0.75rem',
    background: theme.glass, border: `1px solid ${theme.glassBorder}`, borderRadius: '8px', padding: '0.6rem',
  },
  saveBtn: {
    width: '100%', marginTop: '1.25rem', padding: '0.8rem', background: theme.gradient,
    border: 'none', borderRadius: '10px', color: 'white', fontSize: '0.9rem', fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit',
  },
};
