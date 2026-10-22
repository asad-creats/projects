import React from 'react';
import { ProductIntro } from '../../components/ProductIntro';

// Tally's first-visit intro. Each Visual is a small animated mock built from
// ProductIntro's pi-* building blocks; --d staggers the beats within a scene.

const ACCENT = '#F0B43C';
const d = (s) => ({ '--d': `${s}s` });

const Mark = () => (
  <svg viewBox="0 0 40 40" aria-hidden="true">
    <defs>
      <linearGradient id="tally-intro-g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#f5d142" /><stop offset="1" stopColor="#e0922f" />
      </linearGradient>
    </defs>
    <rect x="1" y="1" width="38" height="38" rx="11" fill="url(#tally-intro-g)" />
    <path d="M11 20.5l5.5 5.5L29 13" fill="none" stroke="#1a1712" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Check = ({ at }) => (
  <span className="pi-check" style={d(at)}><svg viewBox="0 0 12 12"><path d="M2 6.5l2.5 2.5L10 3" /></svg></span>
);
const Box = () => <span className="pi-check" style={{ animation: 'none' }} />;
const Tag = ({ children, color }) => (
  <span className="pi-pill" style={{ color, background: `color-mix(in srgb, ${color} 16%, transparent)` }}>{children}</span>
);

function Organized() {
  const groups = [
    ['Overdue', '#F06A6A', [['Renew car insurance', 'Finance', null]]],
    ['Today', ACCENT, [['Review budget for Q4', 'Finance', 1.6], ['Send project update to the client', 'Work', 2.2]]],
    ['Upcoming', '#7AA7FF', [['Prepare slides for Monday stand-up', 'Work', null]]],
  ];
  let k = 0;
  return (
    <div className="pi-mock">
      <div className="pi-mock-h"><span className="pi-dots"><i /><i /><i /></span>Tally · Wednesday</div>
      {groups.map(([g, color, items]) => (
        <div key={g}>
          <div className="pi-muted pi-in" style={{ margin: '12px 0 2px', color, fontWeight: 700, letterSpacing: '.08em', fontSize: 11, ...d(0.1 + k * 0.12) }}>{g.toUpperCase()}</div>
          {items.map(([t, tag, doneAt]) => {
            k += 1;
            return (
              <div className="pi-row pi-in" key={t} style={d(0.15 + k * 0.12)}>
                {doneAt ? <Check at={doneAt} /> : <Box />}
                <span style={{ flex: 1, minWidth: 0 }}><span className={doneAt ? 'pi-strike' : ''} style={doneAt ? d(doneAt + 0.2) : undefined}>{t}</span></span>
                <Tag color={tag === 'Work' ? '#7AA7FF' : '#3FBE88'}>{tag}</Tag>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function Assistant() {
  return (
    <div className="pi-mock">
      <div className="pi-mock-h"><span className="pi-dots"><i /><i /><i /></span>Tally AI</div>
      <div className="pi-in" style={{ display: 'flex', justifyContent: 'flex-end', ...d(0.1) }}>
        <div style={{ background: ACCENT, color: '#1a1712', padding: '10px 14px', borderRadius: '14px 14px 4px 14px', fontSize: 14, fontWeight: 550, maxWidth: '85%' }}>
          <span className="pi-type" style={{ ...d(0.25), animationDuration: '1.4s' }}>add a task to call the bank tomorrow</span>
        </div>
      </div>
      <div className="pi-in" style={{ display: 'flex', gap: 8, marginTop: 12, ...d(1.9) }}>
        <span className="pi-avatar" style={{ background: 'rgba(255,255,255,.12)' }}>✦</span>
        <div style={{ background: 'rgba(255,255,255,.06)', padding: '10px 14px', borderRadius: '14px 14px 14px 4px', fontSize: 14 }}>
          ✅ Created task: “call the bank” — due tomorrow, in Finance.
        </div>
      </div>
      <div className="pi-muted pi-in" style={{ margin: '18px 0 0', ...d(2.5) }}>Added to your list</div>
      <div className="pi-row pi-slide" style={{ borderColor: `color-mix(in srgb, ${ACCENT} 50%, transparent)`, ...d(2.7) }}>
        <Box />
        <span style={{ flex: 1 }}>call the bank</span>
        <Tag color="#3FBE88">Finance</Tag>
        <span className="pi-muted">Tomorrow</span>
      </div>
    </div>
  );
}

function Suggestions() {
  const steps = [
    'Write down the one outcome “done” means.',
    'Block 45 minutes and gather the numbers first.',
    'Draft the summary, then send it for review.',
  ];
  return (
    <div className="pi-mock">
      <div className="pi-mock-h"><span className="pi-dots"><i /><i /><i /></span>AI suggestions</div>
      <div className="pi-row pi-in" style={d(0.1)}>
        <Box /><span style={{ flex: 1 }}>Review budget for Q4</span>
        <span className="pi-pill pi-glowpulse" style={{ color: ACCENT, background: `color-mix(in srgb, ${ACCENT} 16%, transparent)`, ...d(0.4) }}>✦ Suggest</span>
      </div>
      <div className="pi-in" style={{ marginTop: 12, padding: 14, borderRadius: 12, background: `color-mix(in srgb, ${ACCENT} 8%, transparent)`, border: `1px solid color-mix(in srgb, ${ACCENT} 25%, transparent)`, ...d(0.9) }}>
        <div style={{ fontSize: 13.5, marginBottom: 8 }}>Here's a simple way to tackle it:</div>
        {steps.map((s, k) => (
          <div className="pi-in" key={s} style={{ display: 'flex', gap: 8, fontSize: 13.5, marginTop: 6, color: 'rgba(238,240,246,.85)', ...d(1.3 + k * 0.45) }}>
            <span style={{ color: ACCENT }}>•</span>{s}
          </div>
        ))}
      </div>
    </div>
  );
}

function Progress() {
  const stats = [['Today', '3', 60, ACCENT], ['Completed', '12', 80, '#3FBE88'], ['Overdue', '1', 15, '#F06A6A']];
  return (
    <div className="pi-mock">
      <div className="pi-mock-h"><span className="pi-dots"><i /><i /><i /></span>This week</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {stats.map(([label, n, w, c], k) => (
          <div className="pi-row pi-pop" key={label} style={{ display: 'block', marginTop: 0, ...d(0.15 + k * 0.15) }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: c }}>{n}</div>
            <div className="pi-muted" style={{ marginBottom: 8 }}>{label}</div>
            <div className="pi-track"><span className="pi-fill" style={{ '--w': `${w}%`, background: c, ...d(0.6 + k * 0.15) }} /></div>
          </div>
        ))}
      </div>
      <div className="pi-row pi-in" style={{ justifyContent: 'space-between', ...d(1.2) }}>
        <span>Today's progress</span><strong style={{ color: ACCENT }}>67% done</strong>
      </div>
      <div className="pi-track" style={{ marginTop: 10, height: 10 }}>
        <span className="pi-fill" style={{ '--w': '67%', background: `linear-gradient(90deg, #f5d142, ${ACCENT})`, ...d(1.4) }} />
      </div>
    </div>
  );
}

const SCENES = [
  {
    id: 'organized',
    kicker: 'Tally · smart to-dos',
    title: 'Your day, sorted for you.',
    body: 'Tasks group themselves into overdue, today and upcoming, so the next thing to do is always at the top. Check things off and watch the day clear.',
    Visual: Organized,
  },
  {
    id: 'assistant',
    kicker: 'Built-in AI',
    title: 'Just ask — it does the busywork.',
    body: 'Tell the assistant what you need in plain English. It adds, completes and finds tasks for you, right in your list.',
    Visual: Assistant,
  },
  {
    id: 'suggestions',
    kicker: 'Get unstuck',
    title: 'Turn a vague task into a plan.',
    body: 'One click breaks any task into concrete next steps, with tips to get it done.',
    Visual: Suggestions,
  },
  {
    id: 'progress',
    kicker: 'Ready when you are',
    title: 'Know exactly where you stand.',
    body: "See today's progress, what's done and what's slipping. Try it with sample tasks — no sign-up — or sign in to your own list.",
    Visual: Progress,
  },
];

export const TALLY_INTRO_KEY = 'tally_intro_seen_v1';

export function TallyIntro({ onDemo, onClose }) {
  return (
    <ProductIntro
      brand={{ name: 'Tally', mark: <Mark /> }}
      accent={ACCENT}
      scenes={SCENES}
      onDemo={onDemo}
      onClose={onClose}
      demoLabel="Try the demo"
      closeLabel="Sign in"
    />
  );
}
