// Tally design helpers: category colors + relative due-date formatting.

const CAT_COLORS = {
  General: 'oklch(70% 0.12 240)',
  Work: 'oklch(72% 0.16 55)',
  Personal: 'oklch(70% 0.14 320)',
  Shopping: 'oklch(78% 0.16 145)',
  Health: 'oklch(68% 0.18 25)',
  Learning: 'oklch(72% 0.14 270)',
};
const PALETTE = Object.values(CAT_COLORS);

export const categoryColor = (name) => {
  if (CAT_COLORS[name]) return CAT_COLORS[name];
  const s = String(name || '');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
};

const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };

// Returns { label, state } where state is 'overdue' | 'today' | 'normal'.
export const relativeDue = (dateString, completed = false) => {
  const today = startOfDay(new Date());
  const d = startOfDay(new Date(dateString + 'T00:00:00'));
  const diff = Math.round((d - today) / 86400000);

  let label;
  let state = 'normal';
  if (diff === 0) { label = 'Today'; state = 'today'; }
  else if (diff === 1) { label = 'Tomorrow'; }
  else if (diff < 0) { label = `${Math.abs(diff)}d overdue`; state = completed ? 'normal' : 'overdue'; }
  else if (diff < 7) { label = d.toLocaleDateString('en-US', { weekday: 'long' }); }
  else { label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }

  return { label, state };
};
