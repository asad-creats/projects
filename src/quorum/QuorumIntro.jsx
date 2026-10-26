import React from "react";
import { ProductIntro } from "../components/ProductIntro";

// Quorum's first-visit intro. Each Visual is a small animated mock built from
// ProductIntro's pi-* building blocks; --d staggers the beats within a scene.

const ACCENT = "#7B84FF";
const d = (s) => ({ "--d": `${s}s` });

const Mark = () => (
  <span style={{ width: 28, height: 28, borderRadius: 8, display: "grid", placeItems: "center", background: "linear-gradient(135deg,#3B45D6,#7B84FF)", fontSize: 15 }}>⛓</span>
);

const TEAM = [
  { n: "Bilal Khan", i: "BK", c: "#3B45D6", load: 7, label: "Full", tone: ["#F0A748", "rgba(240,167,72,.15)"] },
  { n: "Maya Chen", i: "MC", c: "#1F9D6B", load: 3, label: "Has room", tone: ["#3FBE88", "rgba(63,190,136,.15)"] },
  { n: "Omar Farooq", i: "OF", c: "#E0912F", load: 10, label: "Overloaded", tone: ["#F06A6A", "rgba(240,106,106,.15)"] },
  { n: "Lina Park", i: "LP", c: "#C0468A", load: 5, label: "Has room", tone: ["#3FBE88", "rgba(63,190,136,.15)"] },
];

// Opening scene: the whole idea in three plain steps.
function HowItWorks() {
  const steps = [
    ["📝", "A manager adds a task", "“Accessibility audit”"],
    ["🤝", "The team agrees how long it takes", "3 of 4 people say 3 hours"],
    ["✅", "Someone with free time does it", "Maya has room today, so she takes it"],
  ];
  return (
    <div className="pi-mock">
      <div className="pi-mock-h"><span className="pi-dots"><i /><i /><i /></span>How Quorum works</div>
      {steps.map(([icon, title, sub], k) => (
        <React.Fragment key={title}>
          {k > 0 && <div className="pi-in" style={{ width: 2, height: 16, background: ACCENT, opacity: 0.6, margin: "0 0 0 27px", ...d(0.45 + k * 0.9) }} />}
          <div className="pi-row pi-slide" style={{ marginTop: k ? 0 : 8, ...d(0.2 + k * 0.9) }}>
            <span className="pi-avatar" style={{ background: "rgba(123,132,255,.18)", fontSize: 17 }}>{icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div><strong>{title}</strong></div>
              <div className="pi-muted">{sub}</div>
            </div>
            <span className="pi-pill pi-pop" style={{ color: ACCENT, background: "rgba(123,132,255,.15)", ...d(0.6 + k * 0.9) }}>Step {k + 1}</span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

function Availability() {
  return (
    <div className="pi-mock">
      <div className="pi-mock-h"><span className="pi-dots"><i /><i /><i /></span>Team availability · today</div>
      {TEAM.map((t, k) => (
        <div className="pi-row pi-in" style={d(0.15 + k * 0.15)} key={t.n}>
          <span className="pi-avatar" style={{ background: t.c }}>{t.i}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span>{t.n}</span><span className="pi-muted">{t.load}h / 8h</span>
            </div>
            <div className="pi-track">
              <span className="pi-fill" style={{ "--w": `${Math.min(100, (t.load / 8) * 100)}%`, background: t.tone[0], ...d(0.5 + k * 0.15) }} />
            </div>
          </div>
          <span className="pi-pill pi-pop" style={{ color: t.tone[0], background: t.tone[1], ...d(1.3 + k * 0.15) }}>{t.label}</span>
        </div>
      ))}
    </div>
  );
}

function Consensus() {
  const voters = [["BK", "#3B45D6"], ["MC", "#1F9D6B"], ["LP", "#C0468A"]];
  return (
    <div className="pi-mock" style={{ position: "relative" }}>
      <div className="pi-mock-h"><span className="pi-dots"><i /><i /><i /></span>Consensus queue</div>
      <div className="pi-row pi-in" style={{ display: "block", ...d(0.1) }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <strong style={{ fontSize: 16 }}>Accessibility audit</strong>
          <span style={{ color: ACCENT, fontWeight: 700 }}>3h</span>
        </div>
        <div className="pi-muted" style={{ margin: "4px 0 14px" }}>New task · proposed by HR · needs 3 of 4 to agree</div>
        <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
          {voters.map((_, k) => (
            <div className="pi-track" key={k}><span className="pi-fill" style={{ background: ACCENT, ...d(0.9 + k * 0.7) }} /></div>
          ))}
          <div className="pi-track" />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {voters.map(([i, c], k) => (
            <span className="pi-avatar pi-pop" key={i} style={{ background: c, ...d(0.8 + k * 0.7) }}>{i}</span>
          ))}
          <span className="pi-muted pi-in" style={{ marginLeft: 6, ...d(2.6) }}>agreed on 3h</span>
        </div>
      </div>
      <div className="pi-pop" style={{ position: "absolute", right: 22, bottom: -14, transform: "rotate(-6deg)", ...d(3.1) }}>
        <span className="pi-pill pi-glowpulse" style={{ background: ACCENT, color: "#fff", fontSize: 13, padding: "8px 14px", ...d(3.4) }}>⛓ Sealed to ledger</span>
      </div>
    </div>
  );
}

function Ledger() {
  const blocks = [
    ["#3", "Regression pass — retimed", "3h → 2h", "b6946ef6…"],
    ["#4", "Accessibility audit", "3h", "86f293fd…"],
    ["#5", "API endpoint — retimed", "4h → 5h", "1c07a9e2…"],
  ];
  return (
    <div className="pi-mock">
      <div className="pi-mock-h"><span className="pi-dots"><i /><i /><i /></span>The task ledger</div>
      {blocks.map(([n, t, h, hash], k) => (
        <React.Fragment key={n}>
          {k > 0 && <div className="pi-in" style={{ width: 2, height: 14, background: ACCENT, opacity: 0.6, margin: "0 0 0 26px", ...d(0.35 + k * 0.6) }} />}
          <div className="pi-row pi-slide" style={{ marginTop: k ? 0 : 8, ...d(0.2 + k * 0.6) }}>
            <span className="pi-avatar" style={{ background: ACCENT, borderRadius: 7 }}>{n}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div>{t}</div>
              <div className="pi-muted" style={{ fontFamily: "ui-monospace, monospace" }}>hash <span className="pi-type" style={d(0.5 + k * 0.6)}>{hash}</span></div>
            </div>
            <span style={{ color: ACCENT, fontWeight: 700, fontSize: 13 }}>{h}</span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

function MyDay() {
  const rows = [["Code review", "1h", true], ["Bug fix (standard)", "2h", true], ["API endpoint", "4h", false]];
  return (
    <div className="pi-mock">
      <div className="pi-mock-h"><span className="pi-dots"><i /><i /><i /></span>My day · Omar</div>
      <div className="pi-row pi-in" style={{ justifyContent: "space-between", ...d(0.1) }}>
        <div><div className="pi-muted">Now working</div><strong>API endpoint</strong></div>
        <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 20, color: ACCENT }} className="pi-blink">1:15:24</span>
      </div>
      {rows.map(([t, h, done], k) => (
        <div className="pi-row pi-in" key={t} style={d(0.3 + k * 0.2)}>
          {done
            ? <span className="pi-check" style={d(1.1 + k * 0.5)}><svg viewBox="0 0 12 12"><path d="M2 6.5l2.5 2.5L10 3" /></svg></span>
            : <span className="pi-glowpulse" style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${ACCENT}`, flexShrink: 0 }} />}
          <span style={{ flex: 1 }}><span className={done ? "pi-strike" : ""} style={done ? d(1.3 + k * 0.5) : undefined}>{t}</span></span>
          <span className="pi-muted">{h}</span>
        </div>
      ))}
    </div>
  );
}

const SCENES = [
  {
    id: "what",
    kicker: "What is Quorum?",
    title: "A fair way for teams to share out work.",
    body: "Quorum is a task planner for teams. Instead of a boss guessing how long each job takes, the team agrees on it together, and work goes to whoever has free time.",
    Visual: HowItWorks,
  },
  {
    id: "consensus",
    kicker: "Step 1 · Agree on the time",
    title: "The team decides how long a task takes.",
    body: "When a task is added, everyone suggests how many hours it needs. Once most of the team agrees, that number is locked in.",
    Visual: Consensus,
  },
  {
    id: "availability",
    kicker: "Step 2 · Share the load",
    title: "See who has room, at a glance.",
    body: "Quorum adds up the hours each person has taken on today, so you can see who is free and who is overloaded before anyone burns out.",
    Visual: Availability,
  },
  {
    id: "ledger",
    kicker: "Step 3 · Keep a record",
    title: "Every agreement is saved for good.",
    body: "Each locked-in estimate goes into a permanent log that can't be quietly edited later, so anyone can check how a decision was made.",
    Visual: Ledger,
  },
  {
    id: "myday",
    kicker: "Ready when you are",
    title: "Then just get to work.",
    body: "Start a timer, pause it, and mark tasks done. Try it now with a sample team (no sign-up needed), or sign in to your own workspace.",
    Visual: MyDay,
  },
];

// v2: the intro was rewritten with a plain-language opening, so show it again.
export const QUORUM_INTRO_KEY = "quorum_intro_seen_v2";

export function QuorumIntro({ onDemo, onClose }) {
  return (
    <ProductIntro
      brand={{ name: "Quorum", mark: <Mark /> }}
      accent={ACCENT}
      scenes={SCENES}
      onDemo={onDemo}
      onClose={onClose}
      demoLabel="Try the demo"
      closeLabel="Sign in"
    />
  );
}
