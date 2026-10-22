import React, { useCallback, useEffect, useState } from 'react';

/**
 * ProductIntro — a full-screen, story-style animated walkthrough shown before a
 * first-time visitor reaches the app (or its demo).
 *
 * Each scene is copy on the left and a small animated mock of the product on the
 * right. Scenes auto-advance on a progress bar (paused while pressed and held,
 * while the tab is hidden, and entirely under prefers-reduced-motion). The last scene offers
 * the demo or sign-in.
 *
 * Self-contained: styles are injected once and scoped under .pi-root, theming
 * comes from the `accent` prop. No dependencies. (Shared with the TC Command
 * Center repo's src/components/onboarding/ProductIntro.jsx — keep the two
 * copies in sync.)
 *
 * Props:
 *   brand     { name: string, mark: ReactNode }
 *   accent    CSS color for highlights
 *   scenes    [{ id, kicker, title, body, Visual: () => ReactNode }]
 *   onDemo    () => void   — "Try the demo" (omit to hide the button)
 *   onClose   () => void   — skip / sign in / finish
 *   demoLabel, closeLabel  — final-scene button labels
 *   sceneMs   ms per scene (default 6000)
 */
export function ProductIntro({
  brand, accent = '#6366F1', scenes, onDemo, onClose,
  demoLabel = 'Try the demo', closeLabel = 'Sign in', sceneMs = 6000,
}) {
  const [index, setIndex] = useState(0);
  const [holding, setHolding] = useState(false);
  const [hidden, setHidden] = useState(typeof document !== 'undefined' && document.hidden);
  const reduced = usePrefersReducedMotion();

  const isLast = index === scenes.length - 1;
  const scene = scenes[index];
  const paused = holding || hidden || reduced;

  const next = useCallback(() => setIndex((i) => Math.min(i + 1, scenes.length - 1)), [scenes.length]);
  const back = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);

  useEffect(() => {
    const onVis = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') back();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, back, onClose]);

  // Lock page scroll underneath.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  useIntroStyles();
  const Visual = scene.Visual;

  return (
    <div
      className={'pi-root' + (reduced ? ' pi-reduced' : '')}
      style={{ '--pi-accent': accent, '--pi-scene-ms': `${sceneMs}ms` }}
      role="dialog"
      aria-modal="true"
      aria-label={`${brand.name} introduction`}
    >
      <div className="pi-glow" />

      <header className="pi-top">
        <div className="pi-brand">{brand.mark}<span>{brand.name}</span></div>
        <div className="pi-bars" aria-hidden="true">
          {scenes.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className="pi-bar"
              tabIndex={-1}
              onClick={() => setIndex(i)}
            >
              <span
                // Re-key the active bar so its fill animation restarts per scene.
                key={i === index ? `${s.id}-active` : s.id}
                className={
                  'pi-bar-fill' +
                  (i < index ? ' done' : '') +
                  (i === index ? ' active' : '') +
                  (i === index && paused ? ' paused' : '')
                }
                onAnimationEnd={i === index && !isLast ? next : undefined}
              />
            </button>
          ))}
        </div>
        <button type="button" className="pi-skip" onClick={onClose}>Skip intro</button>
      </header>

      <main
        className="pi-stage"
        // Press and hold anywhere on the scene to pause, like a story viewer.
        onPointerDown={() => setHolding(true)}
        onPointerUp={() => setHolding(false)}
        onPointerLeave={() => setHolding(false)}
        onPointerCancel={() => setHolding(false)}
      >
        <section className="pi-copy" key={`copy-${scene.id}`}>
          <div className="pi-kicker">{scene.kicker}</div>
          <h1 className="pi-title">{scene.title}</h1>
          <p className="pi-body">{scene.body}</p>

          {isLast && (
            <div className="pi-ctas">
              {onDemo && <button type="button" className="pi-btn primary" onClick={onDemo}>{demoLabel} →</button>}
              <button type="button" className={'pi-btn' + (onDemo ? '' : ' primary')} onClick={onClose}>{closeLabel}</button>
            </div>
          )}
        </section>

        <section className="pi-visual" key={`vis-${scene.id}`} aria-hidden="true">
          <Visual />
        </section>
      </main>

      <footer className="pi-nav">
        <button type="button" className="pi-navbtn" onClick={back} disabled={index === 0}>← Back</button>
        <span className="pi-count">{index + 1} / {scenes.length}</span>
        {!isLast
          ? <button type="button" className="pi-navbtn strong" onClick={next}>Next →</button>
          : <span className="pi-navbtn ghost" />}
      </footer>
    </div>
  );
}

// First-visit bookkeeping, per product, in this browser.
export const introSeen = (key) => { try { return !!localStorage.getItem(key); } catch { return true; } };
export const markIntroSeen = (key) => { try { localStorage.setItem(key, String(Date.now())); } catch { /* ignore */ } };

function usePrefersReducedMotion() {
  const query = '(prefers-reduced-motion: reduce)';
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia?.(query).matches);
  useEffect(() => {
    const mq = window.matchMedia?.(query);
    if (!mq) return undefined;
    const on = () => setReduced(mq.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);
  return reduced;
}

const STYLE_ID = 'product-intro-styles';
function useIntroStyles() {
  useEffect(() => {
    if (document.getElementById(STYLE_ID)) return;
    const el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = CSS;
    document.head.appendChild(el);
  }, []);
}

// Building blocks for scene visuals live here too (pi-mock, pi-pop, pi-fill…),
// so each product only writes markup. Delays come from the --d custom property.
const CSS = `
.pi-root {
  position: fixed; inset: 0; z-index: 5000; overflow: hidden;
  display: flex; flex-direction: column;
  background: radial-gradient(1200px 700px at 80% -10%, color-mix(in srgb, var(--pi-accent) 22%, transparent), transparent 60%), #0B0D14;
  color: #EEF0F6; font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  animation: pi-fade .35s ease both;
}
.pi-root * { box-sizing: border-box; }
.pi-glow { position: absolute; width: 520px; height: 520px; left: -160px; bottom: -220px; border-radius: 50%;
  background: color-mix(in srgb, var(--pi-accent) 18%, transparent); filter: blur(90px); pointer-events: none; }

.pi-top { position: relative; display: flex; align-items: center; gap: 20px; padding: 18px 28px; }
.pi-brand { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 15px; letter-spacing: -.01em; white-space: nowrap; }
.pi-brand svg, .pi-brand img { width: 28px; height: 28px; }
.pi-bars { flex: 1; display: flex; gap: 6px; max-width: 520px; margin: 0 auto; }
.pi-bar { flex: 1; height: 4px; padding: 0; border: 0; border-radius: 99px; background: rgba(255,255,255,.14); overflow: hidden; cursor: pointer; }
.pi-bar-fill { display: block; height: 100%; width: 0; border-radius: inherit; background: var(--pi-accent); }
.pi-bar-fill.done { width: 100%; }
.pi-bar-fill.active { animation: pi-progress var(--pi-scene-ms) linear forwards; }
.pi-bar-fill.paused { animation-play-state: paused; }
.pi-reduced .pi-bar-fill.active { animation: none; width: 100%; }
.pi-skip { background: none; border: 1px solid rgba(255,255,255,.18); color: rgba(255,255,255,.75); border-radius: 99px;
  padding: 7px 14px; font: inherit; font-size: 12.5px; cursor: pointer; white-space: nowrap; }
.pi-skip:hover { color: #fff; border-color: rgba(255,255,255,.4); }

.pi-stage { position: relative; flex: 1; min-height: 0; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
  align-items: center; gap: 56px; padding: 12px 64px; max-width: 1240px; width: 100%; margin: 0 auto; }
.pi-copy > * { animation: pi-rise .6s cubic-bezier(.22,1,.36,1) both; }
.pi-copy > *:nth-child(2) { animation-delay: .08s; }
.pi-copy > *:nth-child(3) { animation-delay: .16s; }
.pi-copy > *:nth-child(4) { animation-delay: .26s; }
.pi-kicker { font-size: 12px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: var(--pi-accent); margin-bottom: 14px; }
.pi-title { font-size: clamp(28px, 4vw, 46px); line-height: 1.08; letter-spacing: -.03em; font-weight: 800; margin: 0 0 16px; }
.pi-body { font-size: clamp(15px, 1.5vw, 17px); line-height: 1.6; color: rgba(238,240,246,.72); margin: 0; max-width: 460px; }
.pi-ctas { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 28px; }
.pi-btn { font: inherit; font-size: 15px; font-weight: 650; padding: 12px 20px; border-radius: 12px; cursor: pointer;
  background: rgba(255,255,255,.06); color: #EEF0F6; border: 1px solid rgba(255,255,255,.18); transition: transform .15s, filter .15s; }
.pi-btn:hover { transform: translateY(-1px); }
.pi-btn.primary { background: var(--pi-accent); border-color: transparent; color: #fff; box-shadow: 0 10px 30px color-mix(in srgb, var(--pi-accent) 40%, transparent); }
.pi-btn.primary:hover { filter: brightness(1.08); }

.pi-visual { position: relative; animation: pi-zoom .7s cubic-bezier(.22,1,.36,1) both; }

.pi-nav { display: flex; align-items: center; justify-content: space-between; padding: 16px 28px 22px; }
.pi-navbtn { background: none; border: 0; color: rgba(255,255,255,.6); font: inherit; font-size: 13.5px; font-weight: 600; cursor: pointer; padding: 8px 10px; min-width: 70px; }
.pi-navbtn:hover:not(:disabled) { color: #fff; }
.pi-navbtn:disabled { opacity: .3; cursor: default; }
.pi-navbtn.strong { color: #fff; }
.pi-count { font-size: 12px; color: rgba(255,255,255,.45); font-variant-numeric: tabular-nums; }

/* ---------- visual building blocks ---------- */
.pi-mock { background: #151925; border: 1px solid rgba(255,255,255,.08); border-radius: 18px; padding: 18px;
  box-shadow: 0 30px 80px rgba(0,0,0,.45), 0 0 0 1px rgba(255,255,255,.02) inset; }
.pi-mock-h { display: flex; align-items: center; gap: 8px; font-size: 12px; color: rgba(255,255,255,.5); margin-bottom: 14px; }
.pi-dots { display: flex; gap: 5px; margin-right: 6px; } .pi-dots i { width: 9px; height: 9px; border-radius: 50%; background: rgba(255,255,255,.14); }
.pi-row { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px; background: rgba(255,255,255,.035);
  border: 1px solid rgba(255,255,255,.05); font-size: 13.5px; margin-top: 8px; }
.pi-muted { color: rgba(255,255,255,.5); font-size: 12px; }
.pi-pill { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 99px; white-space: nowrap; }
.pi-avatar { width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; font-size: 10.5px; font-weight: 700; color: #fff; flex-shrink: 0; }
.pi-line { height: 8px; border-radius: 99px; background: rgba(255,255,255,.1); }
.pi-track { flex: 1; height: 8px; border-radius: 99px; background: rgba(255,255,255,.08); overflow: hidden; }
.pi-cursor { position: absolute; width: 18px; height: 18px; pointer-events: none; z-index: 3;
  background: no-repeat center/contain url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M4 2l16 9-7 2-3 7z' fill='white' stroke='black' stroke-width='1.2'/></svg>");
  filter: drop-shadow(0 2px 4px rgba(0,0,0,.5)); }

/* timing: set --d (delay) on the element */
.pi-pop   { animation: pi-pop .5s cubic-bezier(.34,1.56,.64,1) both; animation-delay: var(--d, 0s); }
.pi-in    { animation: pi-rise .55s cubic-bezier(.22,1,.36,1) both; animation-delay: var(--d, 0s); }
.pi-slide { animation: pi-slide .6s cubic-bezier(.22,1,.36,1) both; animation-delay: var(--d, 0s); }
.pi-fill  { display: block; height: 100%; width: var(--w, 100%); border-radius: inherit; transform-origin: left;
  animation: pi-grow 1.1s cubic-bezier(.22,1,.36,1) both; animation-delay: var(--d, 0s); }
.pi-type  { display: inline-block; overflow: hidden; white-space: nowrap; vertical-align: bottom;
  animation: pi-type 1s steps(24, end) both; animation-delay: var(--d, 0s); }
.pi-blink { animation: pi-blink 1.2s ease-in-out infinite; animation-delay: var(--d, 0s); }
.pi-glowpulse { animation: pi-glowpulse 2s ease-in-out infinite; animation-delay: var(--d, 0s); }
.pi-strike { position: relative; } .pi-strike::after { content: ""; position: absolute; left: 0; top: 50%; height: 1.5px; width: 100%;
  background: currentColor; transform-origin: left; animation: pi-grow .5s ease both; animation-delay: var(--d, 0s); opacity: .7; }
.pi-check { width: 20px; height: 20px; border-radius: 6px; border: 2px solid rgba(255,255,255,.25); display: grid; place-items: center; flex-shrink: 0;
  animation: pi-checkbg .3s ease both; animation-delay: var(--d, 0s); }
.pi-check svg { width: 12px; height: 12px; stroke: #fff; stroke-width: 3; fill: none; stroke-dasharray: 20; stroke-dashoffset: 20;
  animation: pi-draw .35s ease forwards; animation-delay: calc(var(--d, 0s) + .12s); }

@keyframes pi-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes pi-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@keyframes pi-zoom { from { opacity: 0; transform: translateY(18px) scale(.96); } to { opacity: 1; transform: none; } }
@keyframes pi-pop { from { opacity: 0; transform: scale(.6); } to { opacity: 1; transform: none; } }
@keyframes pi-slide { from { opacity: 0; transform: translateX(-24px); } to { opacity: 1; transform: none; } }
@keyframes pi-grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes pi-type { from { max-width: 0; } to { max-width: 100%; } }
@keyframes pi-blink { 0%, 100% { opacity: 1; } 50% { opacity: .35; } }
@keyframes pi-glowpulse { 0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--pi-accent) 50%, transparent); } 50% { box-shadow: 0 0 0 8px transparent; } }
@keyframes pi-progress { from { width: 0; } to { width: 100%; } }
@keyframes pi-checkbg { to { background: var(--pi-accent); border-color: var(--pi-accent); } }
@keyframes pi-draw { to { stroke-dashoffset: 0; } }

@media (max-width: 860px) {
  .pi-top { padding: 14px 16px; gap: 12px; }
  .pi-brand span { display: none; }
  .pi-stage { grid-template-columns: 1fr; gap: 22px; padding: 8px 20px; align-content: center; overflow-y: auto; }
  .pi-visual { order: -1; max-width: 460px; width: 100%; margin: 0 auto; }
  .pi-mock { padding: 14px; }
  .pi-nav { padding: 10px 16px 16px; }
}
@media (max-height: 640px) and (max-width: 860px) { .pi-visual { display: none; } }

.pi-reduced *, .pi-reduced *::before, .pi-reduced *::after { animation-duration: 1ms !important; animation-delay: 0s !important; }
`;
