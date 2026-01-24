import { theme } from './theme';

export const styles = {
  container: {
    minHeight: '100vh',
    background: theme.bg,
    padding: '2rem',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },

  header: {
    maxWidth: '1400px',
    margin: '0 auto 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  title: {
    fontSize: '2.5rem',
    fontWeight: '700',
    background: theme.gradient,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: '0.5rem',
  },

  subtitle: {
    color: theme.textMuted,
    fontSize: '0.875rem',
  },

  backButton: {
    padding: '0.75rem 1.5rem',
    background: theme.surface,
    border: `1px solid ${theme.border}`,
    borderRadius: '10px',
    color: theme.text,
    textDecoration: 'none',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },

  warningBanner: {
    maxWidth: '1400px',
    margin: '0 auto 2rem',
    padding: '1rem 1.5rem',
    background: 'rgba(245, 158, 11, 0.1)',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    borderRadius: '12px',
    color: theme.warning,
  },

  mainGrid: {
    maxWidth: '1400px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '2rem',
  },

  leftPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },

  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '1rem',
  },

  statCard: {
    background: theme.surface,
    padding: '1.5rem',
    borderRadius: '12px',
    border: `1px solid ${theme.border}`,
    textAlign: 'center',
  },

  statValue: {
    fontSize: '2rem',
    fontWeight: '700',
    color: theme.text,
    marginBottom: '0.5rem',
  },

  statLabel: {
    fontSize: '0.75rem',
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },

  addTaskForm: {
    background: theme.surface,
    padding: '1.5rem',
    borderRadius: '12px',
    border: `1px solid ${theme.border}`,
  },

  addTaskHeader: {
    marginBottom: '1rem',
  },

  addTaskTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: theme.accent,
  },

  addTaskInputs: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },

  taskInput: {
    padding: '0.75rem 1rem',
    background: theme.bg,
    border: `1px solid ${theme.border}`,
    borderRadius: '8px',
    color: theme.text,
    fontSize: '0.875rem',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.2s ease',
  },

  taskMetaInputs: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr auto',
    gap: '0.75rem',
  },

  dateInput: {
    padding: '0.75rem 1rem',
    background: theme.bg,
    border: `1px solid ${theme.border}`,
    borderRadius: '8px',
    color: theme.text,
    fontSize: '0.875rem',
    fontFamily: 'inherit',
    outline: 'none',
  },

  categoryInput: {
    padding: '0.75rem 1rem',
    background: theme.bg,
    border: `1px solid ${theme.border}`,
    borderRadius: '8px',
    color: theme.text,
    fontSize: '0.875rem',
    fontFamily: 'inherit',
    outline: 'none',
    cursor: 'pointer',
  },

  addTaskButton: {
    padding: '0.75rem 1.5rem',
    background: theme.accent,
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  },

  filterBar: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
  },

  filterButtons: {
    display: 'flex',
    gap: '0.5rem',
  },

  filterButton: {
    padding: '0.5rem 1rem',
    background: 'transparent',
    border: `1px solid ${theme.border}`,
    borderRadius: '8px',
    color: theme.textSecondary,
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
  },

  filterButtonActive: {
    background: theme.glass,
    border: `1px solid ${theme.accent}`,
    color: theme.accent,
  },

  categoryBar: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },

  categoryButton: {
    padding: '0.5rem 1rem',
    background: 'transparent',
    border: `1px solid ${theme.border}`,
    borderRadius: '20px',
    color: theme.textSecondary,
    fontSize: '0.75rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
  },

  categoryButtonActive: {
    background: theme.accent,
    borderColor: theme.accent,
    color: 'white',
  },

  taskList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    maxHeight: 'calc(100vh - 25rem)',
    overflowY: 'auto',
    paddingRight: '0.5rem',
  },

  taskCard: {
    background: theme.surface,
    padding: '1rem',
    borderRadius: '12px',
    border: `1px solid ${theme.border}`,
    transition: 'all 0.2s ease',
  },

  taskCardOverdue: {
    borderColor: theme.danger,
    background: 'rgba(239, 68, 68, 0.05)',
  },

  taskContent: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
  },

  taskActions: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
  },

  suggestionButton: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1.25rem',
    opacity: 0.6,
    transition: 'all 0.2s ease',
    padding: '0.25rem',
  },

  checkbox: {
    width: '20px',
    height: '20px',
    marginTop: '2px',
    cursor: 'pointer',
  },

  taskText: {
    fontSize: '0.95rem',
    color: theme.text,
    marginBottom: '0.5rem',
    lineHeight: '1.5',
  },

  taskTextCompleted: {
    textDecoration: 'line-through',
    color: theme.textMuted,
  },

  taskMeta: {
    display: 'flex',
    gap: '1rem',
    fontSize: '0.75rem',
  },

  taskCategory: {
    color: theme.accent,
    fontWeight: '600',
  },

  taskDate: {
    color: theme.textMuted,
  },

  deleteButton: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1.25rem',
    opacity: 0.6,
    transition: 'opacity 0.2s ease',
  },

  suggestionsPanel: {
    marginTop: '0.5rem',
    background: theme.agentBg,
    border: `1px solid ${theme.agentBorder}`,
    borderRadius: '12px',
    padding: '1rem',
    animation: 'fadeIn 0.3s ease',
  },

  suggestionsPanelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem',
  },

  suggestionsPanelTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#8b5cf6',
  },

  closeSuggestionsBtn: {
    background: 'transparent',
    border: 'none',
    color: theme.textMuted,
    cursor: 'pointer',
    fontSize: '1.25rem',
    padding: '0',
    opacity: 0.6,
    transition: 'opacity 0.2s ease',
  },

  suggestionsContent: {
    fontSize: '0.875rem',
    lineHeight: '1.6',
    color: theme.text,
    whiteSpace: 'pre-wrap',
    marginBottom: '1rem',
  },

  suggestionsLoading: {
    padding: '2rem',
    textAlign: 'center',
  },

  suggestionsActions: {
    display: 'flex',
    gap: '0.5rem',
    justifyContent: 'flex-end',
  },

  saveSuggestionsBtn: {
    padding: '0.5rem 1rem',
    background: theme.accent,
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    fontSize: '0.75rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
  },

  regenerateSuggestionsBtn: {
    padding: '0.5rem 1rem',
    background: 'transparent',
    border: `1px solid ${theme.border}`,
    borderRadius: '8px',
    color: theme.textSecondary,
    fontSize: '0.75rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
  },

  emptyState: {
    textAlign: 'center',
    padding: '3rem 1rem',
    color: theme.textSecondary,
  },

  loader: {
    textAlign: 'center',
    padding: '3rem',
    color: theme.text,
    fontSize: '1.25rem',
  },

  globalLoader: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '4px',
    background: 'linear-gradient(90deg, transparent, #6366f1, transparent)',
    animation: 'globalLoad 1.5s linear infinite',
    zIndex: 9999,
  },

  /* Agent Chat */
  agentContainer: {
    background: theme.surface,
    borderRadius: '16px',
    border: `1px solid ${theme.agentBorder}`,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 10rem)',
    boxShadow: '0 4px 24px rgba(139, 92, 246, 0.1)',
  },

  agentHeader: {
    padding: '1.5rem',
    background: theme.agentBg,
    borderBottom: `1px solid ${theme.agentBorder}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
  },

  agentTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#8b5cf6',
    marginBottom: '0.25rem',
  },

  agentSubtitle: {
    fontSize: '0.8rem',
    color: theme.textMuted,
  },

  modelSelect: {
    padding: '0.5rem',
    background: theme.bg,
    border: `1px solid ${theme.border}`,
    borderRadius: '8px',
    color: theme.text,
    fontSize: '0.75rem',
    fontFamily: 'inherit',
  },

  agentBadge: {
    padding: '0.5rem 1rem',
    background: 'rgba(139, 92, 246, 0.15)',
    border: `1px solid ${theme.agentBorder}`,
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#8b5cf6',
  },

  agentMessages: {
    flex: 1,
    overflowY: 'auto',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },

  message: {
    padding: '1rem',
    borderRadius: '12px',
    maxWidth: '85%',
    animation: 'fadeIn 0.3s ease',
  },

  userMessage: {
    background: theme.glass,
    border: `1px solid ${theme.glassBorder}`,
    marginLeft: 'auto',
  },

  agentMessage: {
    background: theme.agentBg,
    border: `1px solid ${theme.agentBorder}`,
    marginRight: 'auto',
  },

  messageHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '0.5rem',
    gap: '1rem',
  },

  messageRole: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: theme.accent,
  },

  toolBadge: {
    fontSize: '0.7rem',
    padding: '3px 8px',
    background: 'rgba(139, 92, 246, 0.2)',
    border: `1px solid ${theme.agentBorder}`,
    borderRadius: '10px',
    color: '#8b5cf6',
    fontWeight: '500',
  },

  messageContent: {
    fontSize: '0.875rem',
    lineHeight: '1.6',
    color: theme.text,
    whiteSpace: 'pre-wrap',
  },

  toolResults: {
    marginTop: '0.75rem',
    padding: '0.75rem',
    background: 'rgba(139, 92, 246, 0.05)',
    borderRadius: '8px',
    fontSize: '0.75rem',
  },

  toolResultItem: {
    padding: '0.25rem 0',
    color: theme.textSecondary,
  },

  quickActions: {
    padding: '1rem 1.5rem',
    borderTop: `1px solid ${theme.border}`,
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },

  quickActionBtn: {
    padding: '0.5rem 1rem',
    background: 'transparent',
    border: `1px solid ${theme.agentBorder}`,
    borderRadius: '20px',
    color: '#8b5cf6',
    fontSize: '0.75rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
  },

  agentInput: {
    padding: '1.5rem',
    borderTop: `1px solid ${theme.border}`,
    display: 'flex',
    gap: '0.75rem',
  },

  agentInputField: {
    flex: 1,
    padding: '0.875rem 1rem',
    background: theme.bg,
    border: `1px solid ${theme.border}`,
    borderRadius: '10px',
    color: theme.text,
    fontSize: '0.875rem',
    fontFamily: 'inherit',
    outline: 'none',
  },

  agentSendBtn: {
    padding: '0.875rem 1.5rem',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
    border: 'none',
    borderRadius: '10px',
    color: 'white',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
  },

  aiLoaderContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },

  aiLoaderText: {
    fontSize: '0.75rem',
    color: theme.textMuted,
  },

  aiLoaderDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: theme.accent,
    animation: 'aiPulse 1.4s ease-in-out infinite',
  },
};

// Add keyframes for animations
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes aiPulse {
    0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
    40% { opacity: 1; transform: scale(1.3); }
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes globalLoad {
    0% { transform: translateX(-100%); }
    50% { transform: translateX(0%); }
    100% { transform: translateX(100%); }
  }
  @keyframes skeleton-loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;
document.head.appendChild(styleSheet);
