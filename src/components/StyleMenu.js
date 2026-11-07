import React, { useEffect, useRef, useState } from 'react';
import { FaPalette, FaCheck } from 'react-icons/fa';

// Design styles for the portfolio home page. Each id maps to a
// .home-wrap[data-style="…"] block in pages/HomeStyles.css; "studio" is the
// default look in Home.css. The two colours draw the swatch in the menu.
export const STYLES = [
  { id: 'studio', label: 'Studio', hint: 'Dark or light, gold accent', swatch: ['#0B0B0C', '#E2B64A'] },
  { id: 'glass', label: 'Glass', hint: 'Frosted panels on deep blue', swatch: ['#0E1630', '#6CC4FF'] },
  { id: 'brutal', label: 'Brutalist', hint: 'Thick borders, hard shadows', swatch: ['#F3EFE6', '#FFD23F'] },
  { id: 'soft', label: 'Soft UI', hint: 'Neumorphic, raised and pressed', swatch: ['#E4E8EF', '#5B6CFF'] },
  { id: 'clay', label: 'Clay', hint: 'Puffy, rounded, pastel', swatch: ['#FDE2F3', '#FF5FA8'] },
  { id: 'minimal', label: 'Minimal', hint: 'Black on white, nothing extra', swatch: ['#FAFAF9', '#0A0A0A'] },
  { id: 'bento', label: 'Bento', hint: 'Bold colour blocks', swatch: ['#0E0F12', '#C8F04A'] },
];

export const STYLE_KEY = 'portfolio-style';

export const readStyle = () => {
  try {
    const s = localStorage.getItem(STYLE_KEY);
    return STYLES.some((x) => x.id === s) ? s : 'studio';
  } catch { return 'studio'; }
};

// Palette button + "Design style" menu. T cycles to the next style anywhere on
// the page (except while typing), like the reference site.
export default function StyleMenu({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const choose = (id) => {
    onChange(id);
    try { localStorage.setItem(STYLE_KEY, id); } catch { /* storage blocked: just this visit */ }
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { setOpen(false); return; }
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
      if (typing || e.ctrlKey || e.metaKey || e.altKey || e.key.toLowerCase() !== 't') return;
      const i = STYLES.findIndex((s) => s.id === value);
      choose(STYLES[(i + 1) % STYLES.length].id);
    };
    const onClick = (e) => { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onClick); };
  }); // re-bound each render so T always sees the current style

  return (
    <div className="style-menu" ref={rootRef}>
      <button type="button" className="home-theme" aria-label="Design style" aria-haspopup="menu" aria-expanded={open}
        title="Design style (T)" onClick={() => setOpen((o) => !o)}>
        <FaPalette />
      </button>
      {open && (
        <div className="style-menu-panel" role="menu" aria-label="Design style">
          <div className="style-menu-title">Design style</div>
          {STYLES.map((s) => (
            <button key={s.id} type="button" role="menuitemradio" aria-checked={value === s.id}
              className="style-menu-item" onClick={() => choose(s.id)}>
              <span className="style-swatch" style={{ background: `linear-gradient(135deg, ${s.swatch[0]} 50%, ${s.swatch[1]} 50%)` }} />
              <span className="style-menu-text"><b>{s.label}</b><small>{s.hint}</small></span>
              {value === s.id && <FaCheck className="style-menu-check" />}
            </button>
          ))}
          <div className="style-menu-foot">Press <kbd>T</kbd> to switch style</div>
        </div>
      )}
    </div>
  );
}
