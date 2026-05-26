import React from 'react';

// Inline SVG icon set ported from the Tally design.
const base = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round' };

export const Icon = {
  sparkle: (p) => <svg viewBox="0 0 24 24" strokeWidth="1.8" {...base} {...p}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"/><path d="M19 17l.6 1.8L21 19.4l-1.4.6L19 21.6l-.6-1.6L17 19.4l1.4-.6L19 17z"/></svg>,
  check: (p) => <svg viewBox="0 0 16 16" strokeWidth="2.2" {...base} {...p}><path d="M3 8.2l3.2 3.2L13 5"/></svg>,
  plus: (p) => <svg viewBox="0 0 24 24" strokeWidth="2" {...base} {...p}><path d="M12 5v14M5 12h14"/></svg>,
  send: (p) => <svg viewBox="0 0 24 24" strokeWidth="2" {...base} {...p}><path d="M5 12h14M13 6l6 6-6 6"/></svg>,
  calendar: (p) => <svg viewBox="0 0 24 24" strokeWidth="1.6" {...base} {...p}><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/></svg>,
  folder: (p) => <svg viewBox="0 0 24 24" strokeWidth="1.6" {...base} {...p}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/></svg>,
  search: (p) => <svg viewBox="0 0 24 24" strokeWidth="1.8" {...base} {...p}><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4-4"/></svg>,
  filter: (p) => <svg viewBox="0 0 24 24" strokeWidth="1.8" {...base} {...p}><path d="M4 6h16l-6 8v6l-4-2v-4L4 6z"/></svg>,
  more: (p) => <svg viewBox="0 0 24 24" strokeWidth="2" {...base} {...p}><circle cx="6" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="18" cy="12" r="1.2"/></svg>,
  trash: (p) => <svg viewBox="0 0 24 24" strokeWidth="1.7" {...base} {...p}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>,
  zap: (p) => <svg viewBox="0 0 24 24" strokeWidth="1.7" {...base} {...p}><path d="M13 3L4 14h7l-1 7 9-11h-7l1-7z"/></svg>,
  brain: (p) => <svg viewBox="0 0 24 24" strokeWidth="1.6" {...base} {...p}><path d="M9 4.5a3 3 0 0 0-3 3v.2a2.5 2.5 0 0 0-1.5 4.3A2.5 2.5 0 0 0 6 16v.3a3 3 0 0 0 6 0V4.5a3 3 0 0 0-3 0z"/><path d="M15 4.5a3 3 0 0 1 3 3v.2a2.5 2.5 0 0 1 1.5 4.3A2.5 2.5 0 0 1 18 16v.3a3 3 0 0 1-6 0"/></svg>,
  clock: (p) => <svg viewBox="0 0 24 24" strokeWidth="1.6" {...base} {...p}><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>,
  settings: (p) => <svg viewBox="0 0 24 24" strokeWidth="1.6" {...base} {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 13.5a7.7 7.7 0 0 0 0-3l2-1.6-2-3.4-2.4.8a8 8 0 0 0-2.6-1.5L14 2h-4l-.4 2.8a8 8 0 0 0-2.6 1.5l-2.4-.8-2 3.4 2 1.6a7.7 7.7 0 0 0 0 3l-2 1.6 2 3.4 2.4-.8a8 8 0 0 0 2.6 1.5L10 22h4l.4-2.8a8 8 0 0 0 2.6-1.5l2.4.8 2-3.4-2-1.6z"/></svg>,
  history: (p) => <svg viewBox="0 0 24 24" strokeWidth="1.6" {...base} {...p}><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/></svg>,
  close: (p) => <svg viewBox="0 0 24 24" strokeWidth="1.8" {...base} {...p}><path d="M6 6l12 12M18 6L6 18"/></svg>,
  help: (p) => <svg viewBox="0 0 24 24" strokeWidth="1.7" {...base} {...p}><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 4.5 1.5c0 1.5-2 2-2 3.5M12 17h.01"/></svg>,
  home: (p) => <svg viewBox="0 0 24 24" strokeWidth="1.7" {...base} {...p}><path d="M4 10.5L12 4l8 6.5M6 9.5V20h12V9.5"/></svg>,
  logout: (p) => <svg viewBox="0 0 24 24" strokeWidth="1.7" {...base} {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>,
};
