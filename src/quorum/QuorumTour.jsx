import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

// In-app spotlight tour (coachmarks) for Quorum, one per role. Each step can
// switch the active tab, then spotlights a [data-tour="…"] element; the dimmed
// overlay and card glide between steps. Adapted from TC Command Center's tour.
//
// Step: { id, title, body, view?, selector?, placement? }  placement: 'right' | 'bottom' | 'top' | 'left'

export const TOUR_STEPS = {
  hr: [
    { id: "welcome", view: "hr", title: "Welcome to Quorum 👋", body: "A quick look at how you'll run the team's day. Skip anytime — replay it from the ? button." },
    { id: "stats", view: "hr", selector: '[data-tour="stats"]', placement: "bottom", title: "Today at a glance", body: "Team capacity, hours still free to assign, who's working right now, and who's overloaded — all computed from committed task hours." },
    { id: "team", view: "hr", selector: '[data-tour="team"]', placement: "top", title: "Everyone's day", body: "Each card shows a person's committed hours against their 8h capacity. Open one to assign a sealed task or push a custom one." },
    { id: "propose", view: "hr", selector: '[data-tour="propose"]', placement: "bottom", title: "Propose new tasks", body: "New tasks don't get hours from you alone — they go to the team, and a majority vote seals the estimate." },
    { id: "ledger", view: "ledger", selector: '[data-tour="tab-ledger"]', placement: "bottom", title: "The ledger", body: "Every sealed estimate is a block chained to the last one, with who voted for it. Nothing changes silently." },
    { id: "people", view: "people", selector: '[data-tour="tab-people"]', placement: "bottom", title: "Your people", body: "Add teammates here. Each gets a username and password — no email needed." },
    { id: "done", view: "hr", title: "You're set 🎉", body: "That's it. Try proposing a task, then switch to an employee (top banner, in the demo) to vote on it." },
  ],
  emp: [
    { id: "welcome", view: "emp", title: "Welcome to Quorum 👋", body: "Here's how your day works. Skip anytime — replay it from the ? button." },
    { id: "status", view: "emp", selector: '[data-tour="my-status"]', placement: "right", title: "Your day", body: "Your tasks for today with live timers. Start, pause, complete — or flag a task late with a reason." },
    { id: "log", view: "emp", selector: '[data-tour="log-own"]', placement: "top", title: "Log your own work", body: "Doing something that isn't assigned? Log it here. It counts toward your day without needing a vote." },
    { id: "queue", view: "emp", selector: '[data-tour="queue"]', placement: "left", title: "Vote on estimates", body: "New tasks and time changes land here. Agree when the hours look right — a majority seals them." },
    { id: "ledger", view: "ledger", selector: '[data-tour="tab-ledger"]', placement: "bottom", title: "The ledger", body: "See every sealed decision and who agreed to it." },
    { id: "done", view: "emp", title: "You're set 🎉", body: "Start a task to see the timer run, or vote on something in the queue." },
  ],
};

const CARD_W = 320;
const PAD = 6;
const MARGIN = 12;
const KEY = "quorum_tour_seen_v1";

export function tourSeen(role) {
  try { return !!JSON.parse(localStorage.getItem(KEY) || "{}")[role]; } catch { return true; }
}
export function markTourSeen(role) {
  try {
    const m = JSON.parse(localStorage.getItem(KEY) || "{}");
    m[role] = Date.now();
    localStorage.setItem(KEY, JSON.stringify(m));
  } catch { /* ignore */ }
}

function measure(selector) {
  if (!selector) return null;
  const el = document.querySelector(selector);
  if (!el) return null;
  const r0 = el.getBoundingClientRect();
  if (r0.top < 70 || r0.bottom > window.innerHeight) el.scrollIntoView({ block: "center" });
  const r = el.getBoundingClientRect();
  if (!r.width && !r.height) return null;
  // Tall targets (a whole grid) get clipped to the viewport so the card still fits.
  const top = Math.max(r.top, 8);
  const bottom = Math.min(r.bottom, window.innerHeight - 8);
  return { top, left: r.left, width: r.width, height: bottom - top, right: r.right, bottom };
}

function cardPosition(rect, placement, cardH) {
  const vw = window.innerWidth, vh = window.innerHeight;
  const w = Math.min(CARD_W, vw - MARGIN * 2);
  const clampLeft = (l) => Math.max(MARGIN, Math.min(l, vw - w - MARGIN));
  const clampTop = (t) => Math.max(MARGIN, Math.min(t, vh - cardH - MARGIN));
  if (!rect) return { top: Math.max(MARGIN, (vh - cardH) / 2), left: (vw - w) / 2, w };
  // Phones: always dock the card below or above the target.
  if (vw < 640) placement = rect.bottom + cardH + 20 < vh ? "bottom" : "top";
  switch (placement) {
    case "bottom": return { top: clampTop(rect.bottom + 14), left: clampLeft(rect.left), w };
    case "top": return { top: clampTop(rect.top - 14 - cardH), left: clampLeft(rect.left), w };
    case "left": {
      const l = rect.left - w - 14;
      return { top: clampTop(rect.top), left: l < MARGIN ? clampLeft(rect.right + 14) : l, w };
    }
    default: {
      const l = rect.right + 14;
      return { top: clampTop(rect.top), left: l + w > vw - MARGIN ? clampLeft(rect.left - w - 14) : l, w };
    }
  }
}

export function QuorumTour({ role, onNavigate, onFinish }) {
  const steps = TOUR_STEPS[role];
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState(null);
  const [cardH, setCardH] = useState(190);
  const cardRef = useRef(null);
  const step = steps[index];
  const isLast = index === steps.length - 1;

  // Measure the card so top-anchored and centred placement land exactly.
  useLayoutEffect(() => {
    const h = cardRef.current?.offsetHeight;
    if (h && Math.abs(h - cardH) > 1) setCardH(h);
  }, [cardH, index]);

  useEffect(() => {
    if (step.view) onNavigate(step.view);
    // Retry until the target mounts after a tab switch. Timers, not rAF, so it
    // still resolves in a background tab.
    let timer, tries = 0;
    const tick = () => {
      const r = measure(step.selector);
      if (step.selector && !r && tries++ < 40) { timer = setTimeout(tick, 25); return; }
      setRect(r);
    };
    timer = setTimeout(tick, 16);
    return () => clearTimeout(timer);
  }, [step, onNavigate]);

  useEffect(() => {
    const re = () => setRect(measure(step.selector));
    window.addEventListener("resize", re);
    return () => window.removeEventListener("resize", re);
  }, [step]);

  const next = useCallback(() => (isLast ? onFinish() : setIndex((i) => i + 1)), [isLast, onFinish]);
  const back = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onFinish();
      else if (e.key === "ArrowRight" || e.key === "Enter") next();
      else if (e.key === "ArrowLeft") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, back, onFinish]);

  const pos = cardPosition(rect, step.placement, cardH);
  const ease = "cubic-bezier(0.22, 1, 0.36, 1)";
  const spot = rect
    ? { top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 }
    : { top: window.innerHeight / 2, left: window.innerWidth / 2, width: 0, height: 0 };

  return (
    <div className="q-tour" role="dialog" aria-modal="true" aria-label="Quorum tour">
      <div className="q-tour-block" />
      <div
        className="q-tour-spot"
        style={{
          ...spot,
          borderColor: rect ? "var(--accent)" : "transparent",
          transition: `top .34s ${ease}, left .34s ${ease}, width .34s ${ease}, height .34s ${ease}, border-color .2s`,
        }}
      />
      <div ref={cardRef} className="q-tour-card" style={{ top: pos.top, left: pos.left, width: pos.w, transition: `top .34s ${ease}, left .34s ${ease}` }}>
        <div key={step.id} className="q-tour-content">
          <div className="q-tour-head">
            <span>Step {index + 1} of {steps.length}</span>
            <button type="button" onClick={onFinish}>Skip</button>
          </div>
          <div className="q-tour-title">{step.title}</div>
          <div className="q-tour-body">{step.body}</div>
        </div>
        <div className="q-tour-foot">
          <div className="q-tour-dots">
            {steps.map((s, i) => <span key={s.id} className={i === index ? "on" : ""} />)}
          </div>
          {index > 0 && <button type="button" className="q-tour-back" onClick={back}>Back</button>}
          <button type="button" className="btn sm" onClick={next}>{isLast ? "Done" : "Next"}</button>
        </div>
      </div>
    </div>
  );
}
