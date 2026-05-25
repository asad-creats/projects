import React, { useState, useLayoutEffect, useCallback, useEffect } from 'react';
import { theme } from '../styles/theme';

/**
 * OnboardingTour - a lightweight, dependency-free guided walkthrough.
 *
 * Renders a dimmed full-screen overlay with a "spotlight" cutout around one
 * target element at a time, plus a tooltip card (title + body + Back/Next/Skip).
 * Steps are anchored to live DOM nodes via refs, so the highlight follows the
 * real UI. Shown once per browser (the parent persists completion).
 *
 * Props:
 *   steps: Array<{ ref: RefObject<HTMLElement>, title: string, body: string }>
 *   onDone: () => void   // called on finish OR skip
 */
const PAD = 8; // spotlight padding around the target
const CARD_W = 320;

export const OnboardingTour = ({ steps, onDone }) => {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState(null);

  const step = steps[index];

  const recalc = useCallback(() => {
    const el = step?.ref?.current;
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [step]);

  // Bring the target into view, then measure it.
  useLayoutEffect(() => {
    const el = step?.ref?.current;
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    // Measure after the scroll settles.
    const t = setTimeout(recalc, 220);
    return () => clearTimeout(t);
  }, [step, recalc]);

  useEffect(() => {
    window.addEventListener('resize', recalc);
    window.addEventListener('scroll', recalc, true);
    return () => {
      window.removeEventListener('resize', recalc);
      window.removeEventListener('scroll', recalc, true);
    };
  }, [recalc]);

  if (!step) return null;

  const isLast = index === steps.length - 1;
  const isFirst = index === 0;

  const next = () => (isLast ? onDone() : setIndex((i) => i + 1));
  const back = () => setIndex((i) => Math.max(0, i - 1));

  // Spotlight rectangle (falls back to screen center if no target).
  const spot = rect
    ? {
        top: rect.top - PAD,
        left: rect.left - PAD,
        width: rect.width + PAD * 2,
        height: rect.height + PAD * 2,
      }
    : null;

  // Position the card below the target if there's room, else above; if no
  // target, center it.
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
  let cardStyle;
  if (spot) {
    const below = spot.top + spot.height + 12;
    const placeBelow = below + 160 < vh;
    let left = spot.left + spot.width / 2 - CARD_W / 2;
    left = Math.max(12, Math.min(left, vw - CARD_W - 12));
    cardStyle = placeBelow
      ? { top: below, left }
      : { bottom: vh - spot.top + 12, left };
  } else {
    cardStyle = { top: vh / 2 - 80, left: vw / 2 - CARD_W / 2 };
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
      {/* Click-blocker so the page can't be interacted with mid-tour. */}
      <div style={{ position: 'absolute', inset: 0, background: spot ? 'transparent' : 'rgba(2,6,23,0.75)' }} />

      {/* Spotlight: a transparent box with a huge shadow that dims everything else. */}
      {spot && (
        <div
          style={{
            position: 'absolute',
            top: spot.top,
            left: spot.left,
            width: spot.width,
            height: spot.height,
            borderRadius: 12,
            boxShadow: '0 0 0 9999px rgba(2,6,23,0.75)',
            border: `2px solid ${theme.accent}`,
            pointerEvents: 'none',
            transition: 'all 0.2s ease',
          }}
        />
      )}

      {/* Tooltip card */}
      <div
        style={{
          position: 'absolute',
          width: CARD_W,
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: 12,
          padding: '1rem 1.1rem',
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
          color: theme.text,
          ...cardStyle,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
          <div style={{ fontSize: '0.72rem', color: theme.textMuted, letterSpacing: '0.04em' }}>
            STEP {index + 1} OF {steps.length}
          </div>
          <button
            onClick={onDone}
            style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', fontSize: '0.78rem' }}
          >
            Skip
          </button>
        </div>

        <div style={{ fontSize: '1.02rem', fontWeight: 700, marginBottom: '0.4rem' }}>{step.title}</div>
        <div style={{ fontSize: '0.86rem', lineHeight: 1.5, color: theme.textMuted }}>{step.body}</div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
          {/* Progress dots */}
          <div style={{ display: 'flex', gap: 6 }}>
            {steps.map((_, i) => (
              <span
                key={i}
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: i === index ? theme.accent : theme.border,
                }}
              />
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {!isFirst && (
              <button
                onClick={back}
                style={{
                  background: 'transparent',
                  border: `1px solid ${theme.border}`,
                  color: theme.text,
                  borderRadius: 8,
                  padding: '0.4rem 0.8rem',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                }}
              >
                Back
              </button>
            )}
            <button
              onClick={next}
              style={{
                background: theme.accent,
                border: 'none',
                color: '#04121f',
                fontWeight: 700,
                borderRadius: 8,
                padding: '0.4rem 0.95rem',
                cursor: 'pointer',
                fontSize: '0.82rem',
              }}
            >
              {isLast ? 'Got it' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
