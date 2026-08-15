import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuorum } from "./useQuorum";
import "./quorum.css";
import {
  CAP, COLORS, initials, fmtH, fmtClock, taskMeta, isDone, elapsedMs,
  rowsOf, activeOf, scheduledLoad, remainingLoad, doneBudget, doneCount, workedH,
  overrunH, status, pendClass, STATE_PILL,
} from "./quorumLogic";

/* ============================ root ============================ */
export default function Quorum() {
  const q = useQuorum();
  const [theme, setTheme] = useState(null); // null = follow OS
  const [toast, setToast] = useState("");
  const navigate = useNavigate();
  const showToast = (m) => { setToast(m); window.clearTimeout(showToast._t); showToast._t = window.setTimeout(() => setToast(""), 2600); };

  let body;
  if (!q.configured) body = <ConfigNeeded />;
  else if (q.loading) body = <div className="loading-screen">Connecting to your workspace…</div>;
  else if (!q.session || !q.me) body = <Login q={q} showToast={showToast} />;
  else body = <Shell q={q} showToast={showToast} theme={theme} setTheme={setTheme} onExit={() => navigate("/")} />;

  return (
    <div className="quorum-app" data-theme={theme || undefined}>
      {body}
      <div className={"toast" + (toast ? " on" : "")} dangerouslySetInnerHTML={{ __html: toast }} />
    </div>
  );
}

function ConfigNeeded() {
  return (
    <div className="login-wrap"><div className="login-card">
      <div className="glyph">⛓</div>
      <h1>Quorum isn't configured yet</h1>
      <p className="login-sub">Set <code>REACT_APP_QUORUM_SUPABASE_URL</code> and <code>REACT_APP_QUORUM_SUPABASE_ANON_KEY</code> in your environment, then reload.</p>
    </div></div>
  );
}

/* ============================ login ============================ */
function Login({ q, showToast }) {
  const [mode, setMode] = useState("signin"); // 'signin' | 'setup'
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      if (mode === "signin") {
        await q.actions.signIn(username, password);
      } else {
        const r = await q.actions.addEmployee({ username, password, name: name || username, role: "HR", is_hr: true });
        if (!r.bootstrap) throw new Error("An admin already exists — ask them to add you.");
        await q.actions.signIn(username, password);
      }
    } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <div className="glyph">⛓</div>
        <h1>{mode === "signin" ? "Quorum" : "Set up your first HR account"}</h1>
        <p className="login-sub">{mode === "signin" ? "Sign in to your workspace" : "This becomes the admin who can add everyone else"}</p>
        {err && <div className="login-err">{err}</div>}
        {mode === "setup" && (
          <div className="login-field"><label>Your name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Asad Subhani" /></div>
        )}
        <div className="login-field"><label>Username</label>
          <input type="text" autoComplete="username" value={username} onChange={(e) => setU(e.target.value)} placeholder="username" /></div>
        <div className="login-field"><label>Password</label>
          <input type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={(e) => setP(e.target.value)} placeholder="••••••••" /></div>
        <button className="btn wide" type="submit" disabled={busy} style={{ marginTop: 6 }}>
          {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create HR account"}
        </button>
        <div className="login-note">
          {mode === "signin"
            ? <button type="button" className="linklike" onClick={() => { setMode("setup"); setErr(""); }}>First run? Set up the first HR account</button>
            : <button type="button" className="linklike" onClick={() => { setMode("signin"); setErr(""); }}>← Back to sign in</button>}
        </div>
      </form>
    </div>
  );
}

/* ============================ shell ============================ */
function Shell({ q, showToast, theme, setTheme, onExit }) {
  const isHr = q.me.is_hr;
  const [view, setView] = useState(isHr ? "hr" : "emp");
  const tabs = isHr
    ? [["hr", "▦ Dashboard"], ["ledger", "⛓ Ledger"], ["people", "◑ People"]]
    : [["emp", "◔ My day"], ["ledger", "⛓ Ledger"]];

  const toggleTheme = () => {
    const isDark = theme ? theme === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <>
      <div className="bar">
        <div className="brand">
          <div className="glyph">⛓</div>
          <div><h1>Quorum</h1><p>{q.me.name} · {isHr ? "HR" : q.me.role || "Employee"}</p></div>
        </div>
        <div className="tabs" role="tablist">
          {tabs.map(([k, label]) => (
            <button key={k} className="tab" role="tab" aria-selected={view === k} onClick={() => setView(k)}>{label}</button>
          ))}
        </div>
        <button className="icon-btn" title="Toggle theme" onClick={toggleTheme}>◐</button>
        <button className="icon-btn" title="Sign out" onClick={() => q.actions.signOut()}>⏻</button>
      </div>
      <main>
        {view === "hr" && isHr && <HRDashboard q={q} showToast={showToast} />}
        {view === "emp" && <EmployeeView q={q} showToast={showToast} />}
        {view === "ledger" && <Ledger q={q} showToast={showToast} canVote={!isHr} />}
        {view === "people" && isHr && <People q={q} showToast={showToast} />}
      </main>
    </>
  );
}

/* ============================ HR dashboard ============================ */
const FILTER_DEFS = [
  ["all", "All", () => true],
  ["working", "Working now", (a, tb, e, ass) => !!activeOf(ass, e.id)],
  ["room", "Has room", (a, tb, e, ass) => scheduledLoad(ass, e.id, tb) < CAP],
  ["over", "Overloaded", (a, tb, e, ass) => scheduledLoad(ass, e.id, tb) > CAP],
];

function HRDashboard({ q, showToast }) {
  const { data, now } = q;
  const tb = useMemo(() => q.tasksById(), [data.tasks]); // eslint-disable-line
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState(null); // employee id for drawer
  const [pTitle, setPTitle] = useState("");
  const [pHours, setPHours] = useState("");

  // HR assigns work rather than receiving it, so they're not part of the
  // assignable roster: no card (and hence no assign drawer), and their hours
  // don't count toward team capacity. Matches nonHrCount() in useQuorum.js,
  // which already excludes HR from the consensus majority.
  const employees = data.employees.filter((e) => !e.is_hr);
  const busyOf = (eid) => data.busy.find((b) => b.employee_id === eid && b.on_status);
  const totalCap = employees.length * CAP;
  let freeTeam = 0, over = 0, working = 0;
  employees.forEach((e) => {
    const c = scheduledLoad(data.assignments, e.id, tb);
    freeTeam += Math.max(0, CAP - c); if (c > CAP) over++; if (activeOf(data.assignments, e.id)) working++;
  });

  const pred = (FILTER_DEFS.find((f) => f[0] === filter) || FILTER_DEFS[0])[2];
  const shown = employees.filter((e) => pred(null, tb, e, data.assignments));

  const propose = async () => {
    const h = parseFloat(pHours);
    if (!pTitle.trim()) return showToast("Give the task a name first.");
    if (!h || h <= 0) return showToast("Set a valid hour cost.");
    await q.actions.addNewProposal(pTitle.trim(), Math.min(8, h));
    setPTitle(""); setPHours(""); showToast(`New-task proposal opened — <b>${esc(pTitle)}</b>`);
  };

  return (
    <section className="view on">
      <div className="head">
        <p className="eyebrow">Today · Manager view</p>
        <h2>Team availability</h2>
        <p>Availability is computed from committed task hours against each person's daily capacity — no one sets their own status. Open a card to review the day and assign work.</p>
      </div>

      <div className="hr-propose">
        <div className="hp-icon">＋</div>
        <div className="hp-text"><b>Propose a new task</b><span>Only HR can add tasks. It goes to team consensus before anyone can be assigned.</span></div>
        <div className="hp-form">
          <input type="text" value={pTitle} onChange={(e) => setPTitle(e.target.value)} placeholder="Task name" maxLength={46} />
          <input type="number" value={pHours} onChange={(e) => setPHours(e.target.value)} placeholder="hrs" min="0.5" max="8" step="0.5" />
          <button className="btn" onClick={propose}>Open for consensus</button>
        </div>
      </div>

      <div className="stats">
        <Stat k="Team capacity" v={<>{totalCap}<small>h</small></>} />
        <Stat k="Free to assign" v={<>{fmtNum(freeTeam)}<small>h</small></>} color="var(--good)" />
        <Stat k="Working now" v={working} color={working ? "var(--accent)" : "var(--ink)"} />
        <Stat k="Overloaded" v={over} color={over ? "var(--over)" : "var(--ink)"} />
      </div>

      <div className="filterbar">
        {FILTER_DEFS.map(([key, label, fn]) => (
          <button key={key} className="fbtn" aria-pressed={filter === key} onClick={() => setFilter(key)}>
            {label} <span className="fcount">{employees.filter((e) => fn(null, tb, e, data.assignments)).length}</span>
          </button>
        ))}
      </div>

      <div className="grid">
        {shown.length === 0 && (
          <div className="empty" style={{ gridColumn: "1/-1" }}>
            {employees.length === 0
              ? "No employees yet — add people in the People tab. HR accounts don't appear here."
              : "No one matches this filter right now."}
          </div>
        )}
        {shown.map((e) => <EmpCard key={e.id} e={e} data={data} tb={tb} now={now} busy={busyOf(e.id)} onOpen={() => setOpen(e.id)} />)}
      </div>

      {open && <Drawer q={q} eid={open} tb={tb} showToast={showToast} onClose={() => setOpen(null)} />}
    </section>
  );
}

function Stat({ k, v, color }) {
  return <div className="stat"><div className="k">{k}</div><div className="v" style={color ? { color } : undefined}>{v}</div></div>;
}

function EmpCard({ e, data, tb, now, busy, onOpen }) {
  const committed = scheduledLoad(data.assignments, e.id, tb), st = status(committed);
  const doneB = doneBudget(data.assignments, e.id, tb), pending = committed - doneB;
  const denom = Math.max(CAP, committed);
  const free = Math.max(0, CAP - committed);
  const rows = rowsOf(data.assignments, e.id), total = rows.length, done = doneCount(data.assignments, e.id);
  const act = activeOf(data.assignments, e.id);
  const ring = busy ? "var(--over)" : st.cls === "over" ? "var(--over)" : st.cls === "busy" ? "var(--busy)" : (st.cls === "free" && committed > 0 ? "var(--good)" : "var(--line)");
  return (
    <button className="card" onClick={onOpen}>
      <div className="who">
        <div className="avatar" style={{ background: e.color, boxShadow: `0 0 0 3px color-mix(in srgb, ${ring} 30%, transparent)` }}>{initials(e.name)}</div>
        <div><div className="name">{e.name}</div><div className="role">{e.role || "—"}</div></div>
      </div>
      <div className="load">
        <div className="load-top">
          <span className="hrs"><b>{fmtH(committed)}</b> <span style={{ color: "var(--faint)" }}>/ {CAP}h committed</span></span>
          <span className={"pill " + st.cls}>{st.label}</span>
        </div>
        <div className="cap-bar">
          <div className="seg done" style={{ width: (doneB / denom * 100) + "%" }} />
          <div className={"seg pending " + pendClass(st)} style={{ width: (pending / denom * 100) + "%" }} />
        </div>
        <div className="cap-note" dangerouslySetInnerHTML={{ __html: (committed > CAP ? "⚠ +" + fmtH(committed - CAP) + " over capacity" : `<b style="color:var(--good)">${fmtH(free)}</b> free to assign`) + ` · ${done}/${total} done` }} />
      </div>
      {busy && <div className="busy-chip" title="Self-reported">🔴 Busy — {busy.note || "no note"}</div>}
      {act
        ? <div className="hr-work"><span className="work-dot" /><span className="mono">{fmtClock(elapsedMs(act, now))}</span><span className="hw-name">· {taskMeta(act, tb).title}</span></div>
        : (done === total && total > 0
          ? <div className="done-flag">✓ all tasks complete</div>
          : <div className="mini-tasks"><span className="chip-count">{total - done}</span> {total - done === 1 ? "task" : "tasks"} left{done ? <> · <span style={{ color: "var(--good)" }}>{done} done</span></> : null}</div>)}
    </button>
  );
}

/* ============================ drawer (HR) ============================ */
function Drawer({ q, eid, tb, showToast, onClose }) {
  const { data, now } = q;
  const e = data.employees.find((x) => x.id === eid);
  const [sel, setSel] = useState("");
  const [pushTitle, setPushTitle] = useState("");
  const [pushAmt, setPushAmt] = useState("");
  const [pushUnit, setPushUnit] = useState("min");
  useEffect(() => { const onKey = (ev) => ev.key === "Escape" && onClose(); document.addEventListener("keydown", onKey); return () => document.removeEventListener("keydown", onKey); }, [onClose]);
  if (!e) return null;

  const rows = rowsOf(data.assignments, e.id);
  const committed = scheduledLoad(data.assignments, e.id, tb), st = status(committed);
  const doneB = doneBudget(data.assignments, e.id, tb), pending = committed - doneB, free = Math.max(0, CAP - committed);
  const denom = Math.max(CAP, committed);
  const busy = data.busy.find((b) => b.employee_id === e.id && b.on_status);
  const assignedIds = rows.map((a) => a.task_id).filter(Boolean);
  const avail = data.tasks.filter((t) => !assignedIds.includes(t.id));

  const doAssign = async () => { if (!sel) return; await q.actions.assignTask(e.id, sel); showToast(`Assigned to ${e.name.split(" ")[0]}`); };
  const doPush = async () => {
    const amt = parseFloat(pushAmt);
    if (!pushTitle.trim()) return showToast("Name the custom task first.");
    if (!amt || amt <= 0) return showToast("Set how long it should take.");
    const hours = pushUnit === "hr" ? amt : amt / 60;
    await q.actions.addCustomTask(e.id, pushTitle.trim(), hours);
    setPushTitle(""); setPushAmt(""); showToast(`Pushed to ${e.name.split(" ")[0]}`);
  };

  return (
    <>
      <div className="scrim on" onClick={onClose} />
      <aside className="drawer on">
        <header>
          <div className="avatar" style={{ background: e.color }}>{initials(e.name)}</div>
          <div><div className="name-lg">{e.name}</div><div className="role-lg">{e.role || "—"}</div></div>
          <button className="icon-btn x" onClick={onClose}>✕</button>
        </header>
        <div className="body">
          <div>
            <div className="section-label"><span>Day committed</span><span>{fmtH(committed)} / {CAP}h</span></div>
            <div className="cap-bar" style={{ height: 11 }}>
              <div className="seg done" style={{ width: (doneB / denom * 100) + "%" }} />
              <div className={"seg pending " + pendClass(st)} style={{ width: (pending / denom * 100) + "%" }} />
            </div>
            <div className="cap-legend">
              <i><span className="sw d" />{fmtH(doneB)} done</i>
              <i><span className="sw p" />{fmtH(pending)} pending</i>
              <i><span className="sw f" />{fmtH(free)} free</i>
            </div>
            <div className="cap-note" style={{ marginTop: 9 }} dangerouslySetInnerHTML={{ __html: (committed > CAP ? "⚠ " + fmtH(committed - CAP) + " over capacity" : `<b style="color:var(--good)">${fmtH(free)}</b> free to assign`) + ` · ${fmtH(workedH(data.assignments, e.id, tb, now))} actually logged` }} />
            {busy && <div className="drawer-busy">🔴 Self-reported busy — {busy.note || "no note"}</div>}
          </div>

          <div>
            <div className="section-label"><span>Tasks today</span><span>{rows.length}</span></div>
            {rows.length ? rows.map((a) => <DrawerTaskRow key={a.id} a={a} tb={tb} now={now} onRemove={() => q.actions.removeAssignment(a.id)} />)
              : <div className="empty">No tasks today — fully available.</div>}
          </div>

          <div className="assign-box">
            <div className="section-label" style={{ color: "var(--accent)" }}><span>Assign a sealed task</span></div>
            {avail.length ? (<>
              <select value={sel} onChange={(ev) => setSel(ev.target.value)}>
                <option value="">Choose a task…</option>
                {avail.map((t) => <option key={t.id} value={t.id}>{t.title} · {fmtH(t.hours)}</option>)}
              </select>
              <button className="btn wide" style={{ marginTop: 10 }} onClick={doAssign}>＋ Assign to {e.name.split(" ")[0]}</button>
              {committed >= CAP && <div className="warn-note">Already at/over capacity for the rest of today.</div>}
            </>) : <div className="empty" style={{ border: 0, padding: 6 }}>Every sealed task is already on their plate.</div>}
          </div>

          <div className="assign-box push">
            <div className="section-label" style={{ color: "var(--accent)" }}><span>Push a custom task</span></div>
            <input type="text" value={pushTitle} onChange={(e2) => setPushTitle(e2.target.value)} placeholder="Custom task name" maxLength={46} />
            <div className="mf-row" style={{ marginTop: 8 }}>
              <input type="number" value={pushAmt} onChange={(e2) => setPushAmt(e2.target.value)} placeholder="30" min="1" step="1" />
              <select value={pushUnit} onChange={(e2) => setPushUnit(e2.target.value)}><option value="min">min</option><option value="hr">hours</option></select>
              <button className="btn" onClick={doPush}>Push to {e.name.split(" ")[0]}</button>
            </div>
            <span className="mf-hint">A one-off task assigned straight to this person — no consensus needed.</span>
          </div>
        </div>
      </aside>
    </>
  );
}

function DrawerTaskRow({ a, tb, now, onRemove }) {
  const t = taskMeta(a, tb), [cls, lbl] = STATE_PILL[a.state];
  const ov = overrunH(a, tb);
  const icon = t.sealed ? <span className="t-verified" title="Consensus-sealed" style={{ color: "var(--good)" }}>⛓</span>
    : t.origin === "custom" ? <span className="t-verified" title="Custom task from HR" style={{ color: "var(--accent)" }}>↧</span>
      : <span className="t-verified" title="Self-logged" style={{ color: "var(--busy)" }}>✎</span>;
  return (
    <div className={"task-card" + (t.sealed ? "" : " self")}>
      <div className="tc-top">
        {icon}<span className="tc-name">{t.title}</span><span className="tc-hrs">{fmtH(t.hours)}</span>
        {!isDone(a) && <button className="rm" onClick={onRemove}>✕</button>}
      </div>
      <div className="tc-meta">
        <span className={"st " + cls}>{lbl}</span>{" "}
        {a.state === "active" ? <span className="actual">{fmtClock(elapsedMs(a, now))} spent</span>
          : a.state === "paused" ? <span className="actual">{fmtClock(elapsedMs(a, now))} spent · paused</span>
            : a.actual_h != null ? <><span className={"actual " + (ov ? "over" : "")}>{fmtH(a.actual_h)} spent</span>{ov ? <> <span className="late-badge">+{fmtH(ov)} late</span></> : null}</> : null}
        {!t.sealed && (t.origin === "custom" ? <span className="self-tag hr">from HR</span> : <span className="self-tag">self-logged</span>)}
      </div>
      {a.reason && <div className="reason"><b>Reason</b><br />{a.reason}</div>}
    </div>
  );
}

/* ============================ employee view ============================ */
function EmployeeView({ q, showToast }) {
  const { data, now } = q;
  const tb = useMemo(() => q.tasksById(), [data.tasks]); // eslint-disable-line
  const e = q.me;
  const [lateFor, setLateFor] = useState(null);
  const [lateReason, setLateReason] = useState("");
  const [retimeFor, setRetimeFor] = useState(null);
  const [retimeVal, setRetimeVal] = useState("");
  const [busyOpen, setBusyOpen] = useState(false);
  const [busyNote, setBusyNote] = useState("");
  const [logTitle, setLogTitle] = useState("");
  const [logAmt, setLogAmt] = useState("");
  const [logUnit, setLogUnit] = useState("min");

  const rows = rowsOf(data.assignments, e.id), act = activeOf(data.assignments, e.id);
  const sched = scheduledLoad(data.assignments, e.id, tb), remain = remainingLoad(data.assignments, e.id, tb), worked = workedH(data.assignments, e.id, tb, now);
  const st = status(sched);
  const compPct = sched ? Math.round(doneBudget(data.assignments, e.id, tb) / sched * 100) : 0;
  const allDone = sched > 0 && remain === 0;
  const accent = st.cls === "over" ? "var(--over)" : st.cls === "busy" ? "var(--busy)" : "var(--good)";
  const bigColor = allDone ? "var(--good)" : accent;
  const bigLabel = allDone ? "Day complete" : sched === 0 ? "No tasks yet" : st.label;
  const busy = data.busy.find((b) => b.employee_id === e.id && b.on_status);

  const submitLate = async (a) => { if (!lateReason.trim()) return showToast("Add a short reason so HR has context."); await q.actions.completeTask(a, true, lateReason.trim()); setLateFor(null); setLateReason(""); };
  const submitRetime = async (t) => { const h = parseFloat(retimeVal); if (!h || h <= 0) return showToast("Enter a valid number of hours."); if (h === t.hours) return showToast("That's the same as the current time."); await q.actions.addRetimeProposal({ id: t.taskId, title: t.title, hours: t.hours }, Math.min(8, h)); setRetimeFor(null); showToast(`Time change proposed — <b>${esc(t.title)}</b>`); };
  const addLog = async () => { const amt = parseFloat(logAmt); if (!logTitle.trim()) return showToast("Name your task first."); if (!amt || amt <= 0) return showToast("Add how long it'll take."); await q.actions.addSelfTask(logTitle.trim(), logUnit === "hr" ? amt : amt / 60); setLogTitle(""); setLogAmt(""); showToast(`Logged <b>${esc(logTitle)}</b>`); };

  return (
    <section className="view on">
      <div className="head">
        <p className="eyebrow">Your day</p>
        <h2>Hi, {e.name.split(" ")[0]}</h2>
        <p>Your assigned tasks, your own logged work, and your live status — all saved to your workspace.</p>
      </div>

      <div className="two-col">
        <div className="panel">
          <h3>{e.name}</h3>
          <p className="sub">{e.role || "Employee"} · capacity {CAP}h/day</p>

          {busy ? (
            <div className="busy-banner on"><span className="busy-dot" />
              <div className="bb-text"><b>You've marked yourself busy</b><span>{busy.note || "No note given"}</span></div>
              <button className="abtn" onClick={() => q.actions.clearBusy()}>I'm available</button>
            </div>
          ) : busyOpen ? (
            <div className="busy-banner form">
              <input type="text" value={busyNote} onChange={(ev) => setBusyNote(ev.target.value)} placeholder="Busy with what? e.g. client call, deep focus" maxLength={60} />
              <div className="lf-row"><button className="abtn go" onClick={async () => { await q.actions.setBusy(busyNote.trim()); setBusyOpen(false); setBusyNote(""); }}>Set busy</button><button className="abtn" onClick={() => setBusyOpen(false)}>Cancel</button></div>
            </div>
          ) : (
            <div className="busy-banner"><span className="busy-dot off" />
              <div className="bb-text"><b>Available</b><span>Working through assigned &amp; your own tasks</span></div>
              <button className="abtn" onClick={() => setBusyOpen(true)}>Mark myself busy…</button>
            </div>
          )}

          <div className="big-load">
            <div className="pct" style={{ color: bigColor }}>{compPct}%</div>
            <div className="lbl">of today's work done · <span style={{ color: bigColor }}>{bigLabel}</span></div>
          </div>
          <div className="track" style={{ height: 10, margin: "6px 0 4px" }}><div className="fill" style={{ width: compPct + "%", background: allDone ? "var(--good)" : "var(--accent)" }} /></div>
          <div className="mini-stats">
            <div><span className="ms-v">{fmtH(worked)}</span><span className="ms-k">logged today</span></div>
            <div><span className="ms-v">{doneCount(data.assignments, e.id)}/{rows.length}</span><span className="ms-k">tasks done</span></div>
            <div><span className="ms-v">{fmtH(remain)}</span><span className="ms-k">left to do</span></div>
          </div>

          {act ? <NowCard a={act} tb={tb} now={now} /> : <div className="now-card idle">Not working on anything right now — hit <b>Start</b> on a task below to run the clock.</div>}

          <div className="section-label" style={{ marginTop: 18 }}><span>Your tasks today</span><span>{doneCount(data.assignments, e.id)}/{rows.length} done</span></div>
          {rows.length ? rows.map((a) => (
            <EmpTaskRow key={a.id} a={a} tb={tb} now={now} q={q}
              lateOpen={lateFor === a.id} onLate={() => { setLateFor(a.id); setRetimeFor(null); }} onLateCancel={() => setLateFor(null)}
              lateReason={lateReason} setLateReason={setLateReason} onLateSubmit={() => submitLate(a)}
              retimeOpen={retimeFor === a.id} onRetime={(t) => { setRetimeFor(a.id); setRetimeVal(String(t.hours)); setLateFor(null); }} onRetimeCancel={() => setRetimeFor(null)}
              retimeVal={retimeVal} setRetimeVal={setRetimeVal} onRetimeSubmit={submitRetime}
              retimePending={data.proposals.some((p) => p.type === "retime" && p.task_id === a.task_id)}
              onRemoveSelf={() => q.actions.removeAssignment(a.id)} />
          )) : <div className="empty">Nothing on your plate yet — log a task below or wait for an assignment.</div>}

          <div className="log-form">
            <span className="mf-label">＋ Log your own task</span>
            <div className="log-row">
              <input type="text" value={logTitle} onChange={(e2) => setLogTitle(e2.target.value)} placeholder="What are you working on?" maxLength={46} />
              <input type="number" value={logAmt} onChange={(e2) => setLogAmt(e2.target.value)} placeholder="30" min="1" step="1" />
              <select value={logUnit} onChange={(e2) => setLogUnit(e2.target.value)}><option value="min">min</option><option value="hr">hours</option></select>
              <button className="abtn go" onClick={addLog}>Add</button>
            </div>
            <span className="mf-hint">Your own tasks don't need consensus — they just track your time and count toward your day.</span>
          </div>
          <div className="locked-note">⚿ Assigned-task hours are fixed by consensus. You can log your own tasks and flag yourself busy — the availability figure still adds it all up.</div>
        </div>

        <div className="panel">
          <h3>Consensus queue</h3>
          <p className="sub">New tasks (from HR) and time changes (from employees) need a majority to agree before they're sealed.</p>
          <ConsensusList q={q} votable />
        </div>
      </div>
    </section>
  );
}

function NowCard({ a, tb, now }) {
  const t = taskMeta(a, tb), budMs = t.hours * 3600000, el = elapsedMs(a, now);
  const over = el > budMs, ppct = Math.min(100, el / budMs * 100);
  return (
    <div className="now-card">
      <div className="now-head"><span className="work-dot" /> Now working</div>
      <div className="now-title">{t.title}</div>
      <div className="clock-row"><span className={"clock-big " + (over ? "over" : "")}>{fmtClock(el)}</span><span className="clock-budget">budget {fmtH(t.hours)}</span></div>
      <div className="now-track"><div className={"now-fill " + (over ? "over" : "")} style={{ width: ppct + "%" }} /></div>
    </div>
  );
}

function EmpTaskRow(props) {
  const { a, tb, now, q, lateOpen, onLate, onLateCancel, lateReason, setLateReason, onLateSubmit,
    retimeOpen, onRetime, onRetimeCancel, retimeVal, setRetimeVal, onRetimeSubmit, retimePending, onRemoveSelf } = props;
  const t = taskMeta(a, tb), [cls, lbl] = STATE_PILL[a.state], ov = overrunH(a, tb);
  const icon = t.sealed ? <span className="t-verified" style={{ color: "var(--good)" }} title="Consensus-sealed task">⛓</span>
    : t.origin === "custom" ? <span className="t-verified" style={{ color: "var(--accent)" }} title="Custom task pushed by HR">↧</span>
      : <span className="t-verified" style={{ color: "var(--busy)" }} title="Self-logged task">✎</span>;
  return (
    <div className={"task-card" + (t.sealed ? "" : " self")}>
      <div className="tc-top">
        {icon}<span className="tc-name">{t.title}</span><span className="tc-hrs">{fmtH(t.hours)}</span>
        {t.origin === "self" && <button className="rm" onClick={onRemoveSelf}>✕</button>}
        {!isDone(a) && (
          <div className="row-actions">
            {a.state === "active" ? <button className="abtn" onClick={() => q.actions.pauseTask(a)}>⏸ Pause</button>
              : a.state === "paused" ? <button className="abtn go" onClick={() => q.actions.startTask(a)}>▶ Resume</button>
                : <button className="abtn go" onClick={() => q.actions.startTask(a)}>▶ Start</button>}
            <button className="abtn" onClick={() => q.actions.completeTask(a, false)}>✓ Complete</button>
            <button className="abtn danger" onClick={onLate}>⚑ Late</button>
            {t.sealed && <button className="abtn" disabled={retimePending} title={retimePending ? "Time change already in the queue" : ""} onClick={() => onRetime(t)}>⏱ Time</button>}
          </div>
        )}
      </div>
      <div className="tc-meta">
        <span className={"st " + cls}>{lbl}</span>{" "}
        {a.state === "active" ? <><span className="actual">{fmtClock(elapsedMs(a, now))}</span> <span className="actual">spent</span></>
          : a.state === "paused" ? <span className="actual">{fmtClock(elapsedMs(a, now))} spent</span>
            : a.actual_h != null ? <><span className={"actual " + (ov ? "over" : "")}>{fmtH(a.actual_h)} spent</span>{ov ? <> <span className="late-badge">+{fmtH(ov)} over the {fmtH(t.hours)} allotted</span></> : null}</> : null}
        {!t.sealed && (t.origin === "custom" ? <span className="self-tag hr">from HR</span> : <span className="self-tag">self-logged</span>)}
      </div>
      {a.reason && <div className="reason"><b>Your reason</b><br />{a.reason}</div>}
      {retimeOpen && (
        <div className="mini-form">
          <span className="mf-label">Propose a new time for “{t.title}”</span>
          <div className="mf-row"><input type="number" value={retimeVal} onChange={(e) => setRetimeVal(e.target.value)} min="0.5" max="8" step="0.5" /><span className="mf-hint">now {fmtH(t.hours)} · needs team consensus</span></div>
          <div className="lf-row"><button className="abtn go" onClick={() => onRetimeSubmit(t)}>Propose change</button><button className="abtn" onClick={onRetimeCancel}>Cancel</button></div>
        </div>
      )}
      {lateOpen && (
        <div className="late-form">
          <textarea value={lateReason} onChange={(e) => setLateReason(e.target.value)} placeholder="What held this task up? (visible to HR)" />
          <div className="lf-row"><button className="abtn go" onClick={onLateSubmit}>Submit as late</button><button className="abtn" onClick={onLateCancel}>Cancel</button></div>
        </div>
      )}
    </div>
  );
}

/* ============================ consensus + ledger ============================ */
function ConsensusList({ q, votable }) {
  const { data } = q;
  const need = q.quorumNeeded();
  const votesFor = (pid) => data.votes.filter((v) => v.proposal_id === pid);
  const empById = (id) => data.employees.find((e) => e.id === id);
  if (!data.proposals.length) return <div className="empty">Nothing awaiting consensus. HR can propose a new task; employees can propose time changes.</div>;
  return data.proposals.map((p) => {
    const votes = votesFor(p.id), count = votes.length, reached = count >= need;
    const iVoted = q.me && votes.some((v) => v.employee_id === q.me.id);
    const isRetime = p.type === "retime";
    return (
      <div className="prop" key={p.id}>
        <div className="p-top">
          <div>
            <div className="p-title">{p.title}</div>
            <div className="p-meta"><span className={"ptag " + (isRetime ? "retime" : "new")}>{isRetime ? "Time change" : "New task"}</span> proposed by {p.proposer}</div>
          </div>
          {isRetime
            ? <div className="p-hrs"><span className="retime-old">{fmtH(p.old_hours)}</span><span className="retime-arrow">→</span>{fmtH(p.hours)}</div>
            : <div className="p-hrs">{fmtH(p.hours)}</div>}
        </div>
        <div className="votes">
          <div className="quorum-bar"><div className="quorum-fill" style={{ width: Math.min(100, count / need * 100) + "%", background: reached ? "var(--good)" : "var(--accent)" }} /></div>
          <span className="vc">{count}/{need} to seal</span>
        </div>
        {count > 0 && <div className="voter-avs">{votes.map((v) => { const e = empById(v.employee_id); return e ? <span key={v.employee_id} className="va" style={{ background: e.color }} title={e.name}>{initials(e.name)}</span> : null; })}</div>}
        <div className="p-actions">
          {votable && <button className={"btn sm " + (iVoted ? "ghost" : "")} onClick={() => q.actions.toggleVote(p.id)}>{iVoted ? "✓ You agreed" : "Agree on " + fmtH(p.hours)}</button>}
          {reached ? <button className="btn sm" onClick={() => q.actions.sealProposal(p)}>⛓ Seal to ledger</button> : <span className="vc" style={{ alignSelf: "center" }}>needs {need - count} more</span>}
        </div>
      </div>
    );
  });
}

function Ledger({ q, canVote }) {
  const { data } = q;
  const blocks = [...data.ledger].reverse();
  return (
    <section className="view on">
      <div className="head">
        <p className="eyebrow">Immutable record</p>
        <h2>The task ledger</h2>
        <p>Every agreed task is a sealed block: its hour cost, who voted for it, and a hash chaining it to the block before.</p>
      </div>
      <div className="ledger-wrap">
        <div className="propose-card">
          <h3>Awaiting consensus</h3>
          <p className="sub">Proposals seal into the chain once a majority agree. New tasks come from HR; time changes from employees.</p>
          <ConsensusList q={q} votable={canVote} />
        </div>
        <div className="chain">
          {blocks.map((b, i) => {
            const isGen = b.kind === "genesis" || b.idx === 0;
            return (
              <React.Fragment key={b.idx}>
                <div className={"block" + (isGen ? " genesis" : "")}>
                  <div className="b-head">
                    <div className="b-index">{b.idx}</div>
                    <div><div className="b-title">{b.title} {b.kind === "retime" && <span className="ptag retime">retime</span>}</div><div className="b-sub">sealed {fmtTime(b.sealed_at)}</div></div>
                    {!isGen && <div className="b-hrs">{b.kind === "retime" ? (b.note || fmtH(b.hours)) : fmtH(b.hours)}</div>}
                  </div>
                  <div className="hashes">
                    <div><span className="hk">hash</span><span className="hv">{b.hash}</span></div>
                    <div><span className="hk">prev</span><span className="hv prev">{b.prev_hash}</span></div>
                  </div>
                  {Array.isArray(b.voters) && b.voters.length > 0 && (
                    <div className="b-votes">agreed by <span className="voter-avs" style={{ display: "inline-flex", marginLeft: 4 }}>{b.voters.map((id) => { const e = data.employees.find((x) => x.id === id); return e ? <span key={id} className="va" style={{ background: e.color }}>{initials(e.name)}</span> : null; })}</span></div>
                  )}
                </div>
                {i < blocks.length - 1 && <div className="link" />}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ============================ people (HR) ============================ */
function People({ q, showToast }) {
  const { data } = q;
  const [form, setForm] = useState({ name: "", username: "", password: "", role: "", capacity_h: 8, color: COLORS[0], is_hr: false });
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      await q.actions.addEmployee({ ...form, capacity_h: Number(form.capacity_h) || 8 });
      showToast(`Added <b>${esc(form.name || form.username)}</b>`);
      setForm({ name: "", username: "", password: "", role: "", capacity_h: 8, color: COLORS[0], is_hr: false });
    } catch (e2) { showToast(e2.message); } finally { setBusy(false); }
  };

  return (
    <section className="view on">
      <div className="head">
        <p className="eyebrow">Admin</p>
        <h2>People</h2>
        <p>Add employees and set their password. They sign in with the username you choose — no email needed.</p>
      </div>
      <div className="people-grid">
        <form className="people-form" onSubmit={submit}>
          <h3>Add an employee</h3>
          <p className="sub">You set the credentials; share them with the person.</p>
          <div className="login-field"><label>Full name</label><input type="text" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Priya Nair" required /></div>
          <div className="login-field"><label>Role</label><input type="text" value={form.role} onChange={(e) => set("role", e.target.value)} placeholder="e.g. QA Analyst" /></div>
          <div className="login-field"><label>Username</label><input type="text" value={form.username} onChange={(e) => set("username", e.target.value)} placeholder="priya" required /></div>
          <div className="login-field"><label>Temporary password</label><input type="text" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="min 6 characters" required /></div>
          <div className="login-field"><label>Daily capacity (hours)</label><input type="number" value={form.capacity_h} onChange={(e) => set("capacity_h", e.target.value)} min="1" max="24" step="0.5" /></div>
          <div className="login-field"><label>Card colour</label>
            <div className="swatch-row">{COLORS.map((c) => <button type="button" key={c} className="swatch" style={{ background: c }} aria-pressed={form.color === c} onClick={() => set("color", c)} />)}</div>
          </div>
          <label className="checkbox-row"><input type="checkbox" checked={form.is_hr} onChange={(e) => set("is_hr", e.target.checked)} /> Grant HR (admin) access</label>
          <button className="btn wide" type="submit" disabled={busy}>{busy ? "Adding…" : "Add employee"}</button>
        </form>

        <div>
          <div className="section-label"><span>Roster</span><span>{data.employees.length}</span></div>
          <div className="roster">
            {data.employees.map((e) => (
              <div className="roster-row" key={e.id}>
                <div className="avatar" style={{ background: e.color, width: 38, height: 38 }}>{initials(e.name)}</div>
                <div><div className="name">{e.name}</div><div className="role">{e.role || "—"} · <span className="uname">@{e.username}</span></div></div>
                {e.is_hr && <span className="hr-badge">HR</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================ util ============================ */
function fmtNum(n) { return n % 1 ? n.toFixed(1) : String(n); }
function fmtTime(ts) { try { return new Date(ts).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); } catch { return ts; } }
function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
