import { useEffect, useRef, useState } from "react";
import { fnv, elapsedMs, budgetH, todayLocal, busyRowOf } from "./quorumLogic";

// In-browser sandbox with the same shape as useQuorum(), so the real UI runs
// unchanged against sample data. Nothing touches Supabase; a refresh resets it.

const MIN = 60000;
const isoAgo = (ms) => new Date(Date.now() - ms).toISOString();
const daysAgo = (n) => todayLocal(new Date(Date.now() - n * 86400000));
let seq = 0;
const uid = (p) => `${p}-${Date.now().toString(36)}-${(seq++).toString(36)}`;

function chain(blocks) {
  // Hash the sample blocks the same way sealProposal does, so the ledger verifies.
  let prev = "genesis00000000";
  return blocks.map((b, i) => {
    if (i === 0) return b;
    const hash = fnv(b.title + "|" + b.hours + "|" + prev + "|" + b.voters.join(","));
    const out = { ...b, prev_hash: prev, hash };
    prev = hash;
    return out;
  });
}

function seed() {
  const today = todayLocal();
  const employees = [
    { id: "hr-sara", username: "sara", name: "Sara Ahmed", role: "HR", capacity_h: 8, color: "#7A5AD6", is_hr: true },
    { id: "emp-bilal", username: "bilal", name: "Bilal Khan", role: "Designer", capacity_h: 8, color: "#3B45D6", is_hr: false },
    { id: "emp-maya", username: "maya", name: "Maya Chen", role: "Frontend dev", capacity_h: 8, color: "#1F9D6B", is_hr: false },
    { id: "emp-omar", username: "omar", name: "Omar Farooq", role: "Backend dev", capacity_h: 8, color: "#E0912F", is_hr: false },
    { id: "emp-lina", username: "lina", name: "Lina Park", role: "QA", capacity_h: 8, color: "#C0468A", is_hr: false },
  ];
  const tasks = [
    { id: "t-review", title: "Code review", hours: 1 },
    { id: "t-bugfix", title: "Bug fix (standard)", hours: 2 },
    { id: "t-mockup", title: "Screen mockup", hours: 3 },
    { id: "t-api", title: "API endpoint", hours: 4 },
    { id: "t-regress", title: "Regression pass", hours: 2 },
    { id: "t-standup", title: "Client call", hours: 1 },
  ];
  const a = (o) => ({ elapsed_ms: 0, started_at: null, actual_h: null, reason: "", is_busy: false, work_date: today, title: null, hours: null, task_id: null, origin: "assigned", ...o });
  const assignments = [
    a({ id: "a1", employee_id: "emp-bilal", task_id: "t-mockup", state: "active", elapsed_ms: 50 * MIN, started_at: isoAgo(22 * MIN) }),
    a({ id: "a2", employee_id: "emp-bilal", task_id: "t-review", state: "done", elapsed_ms: 55 * MIN, actual_h: 0.9 }),
    a({ id: "a3", employee_id: "emp-bilal", origin: "custom", title: "Brand refresh assets", hours: 3, state: "todo" }),
    a({ id: "a4", employee_id: "emp-maya", task_id: "t-bugfix", state: "late", elapsed_ms: 170 * MIN, actual_h: 2.8, reason: "Repro needed a prod data snapshot" }),
    a({ id: "a5", employee_id: "emp-maya", task_id: "t-review", state: "paused", elapsed_ms: 20 * MIN }),
    a({ id: "a6", employee_id: "emp-omar", task_id: "t-api", state: "active", elapsed_ms: 0, started_at: isoAgo(75 * MIN) }),
    a({ id: "a7", employee_id: "emp-omar", task_id: "t-api", state: "todo" }),
    a({ id: "a8", employee_id: "emp-omar", task_id: "t-bugfix", state: "todo" }),
    a({ id: "a9", employee_id: "emp-lina", origin: "self", title: "Vendor onboarding call", hours: 0, is_busy: true, state: "active", started_at: isoAgo(18 * MIN) }),
    a({ id: "a10", employee_id: "emp-lina", task_id: "t-regress", state: "done", elapsed_ms: 105 * MIN, actual_h: 1.8 }),
  ];
  const busyHistory = [
    a({ id: "bh1", employee_id: "emp-maya", origin: "self", title: "Interview panel", hours: 1, actual_h: 1, is_busy: true, state: "done", work_date: daysAgo(1) }),
    a({ id: "bh2", employee_id: "emp-omar", origin: "self", title: "Incident on-call", hours: 1.5, actual_h: 1.5, is_busy: true, state: "done", work_date: daysAgo(2) }),
    a({ id: "bh3", employee_id: "emp-lina", origin: "self", title: "Training", hours: 0.75, actual_h: 0.75, is_busy: true, state: "done", work_date: daysAgo(3) }),
  ];
  const proposals = [
    { id: "p1", type: "new", title: "Accessibility audit", hours: 3, old_hours: null, task_id: null, proposer: "HR", created_at: isoAgo(3 * 60 * MIN) },
    { id: "p2", type: "retime", title: "Code review", hours: 1.5, old_hours: 1, task_id: "t-review", proposer: "Maya", created_at: isoAgo(90 * MIN) },
  ];
  const votes = [
    { proposal_id: "p1", employee_id: "emp-bilal" },
    { proposal_id: "p2", employee_id: "emp-maya" },
    { proposal_id: "p2", employee_id: "emp-omar" },
  ];
  const ledger = chain([
    { idx: 0, kind: "genesis", title: "Genesis — ledger opened", hours: 0, note: "", voters: [], prev_hash: "0000000000000000", hash: "genesis00000000", sealed_at: isoAgo(9 * 86400000) },
    { idx: 1, kind: "new", title: "Screen mockup", hours: 3, note: "", voters: ["emp-bilal", "emp-maya", "emp-lina"], sealed_at: isoAgo(8 * 86400000) },
    { idx: 2, kind: "new", title: "API endpoint", hours: 4, note: "", voters: ["emp-omar", "emp-maya", "emp-bilal"], sealed_at: isoAgo(6 * 86400000) },
    { idx: 3, kind: "retime", title: "Regression pass — retimed", hours: 2, note: "3h → 2h", voters: ["emp-lina", "emp-omar", "emp-maya"], sealed_at: isoAgo(2 * 86400000) },
  ]);
  const busy = [
    { employee_id: "emp-lina", on_status: true, note: "Vendor onboarding call", updated_at: isoAgo(18 * MIN) },
  ];
  return {
    company: { id: "demo", name: "Northwind Studio (demo)" },
    employees, tasks, assignments, proposals, votes, ledger, busy, busyHistory,
  };
}

export function useQuorumDemo({ onExit }) {
  const [data, setData] = useState(seed);
  const [meId, setMeId] = useState("hr-sara");
  const [now, setNow] = useState(Date.now());
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const me = data.employees.find((e) => e.id === meId) || data.employees[0];

  // ---- helpers (mirroring useQuorum) ----
  const tasksById = () => Object.fromEntries(data.tasks.map((t) => [t.id, t]));
  const nonHrCount = () => data.employees.filter((e) => !e.is_hr).length;
  const quorumNeeded = () => Math.floor(Math.max(1, nonHrCount()) / 2) + 1;

  const patch = (fn) => setData((d) => ({ ...d, ...fn(d) }));
  const updateRow = (id, changes) =>
    patch((d) => ({ assignments: d.assignments.map((a) => (a.id === id ? { ...a, ...changes } : a)) }));
  const newRow = (o) => ({
    id: uid("a"), elapsed_ms: 0, started_at: null, actual_h: null, reason: "", is_busy: false,
    work_date: todayLocal(), title: null, hours: null, task_id: null, origin: "assigned", state: "todo",
    created_at: new Date().toISOString(), ...o,
  });
  const pauseActiveOf = (d, eid) => d.assignments.map((a) =>
    a.employee_id === eid && a.state === "active"
      ? { ...a, elapsed_ms: elapsedMs(a, Date.now()), started_at: null, state: "paused" } : a);

  // ===================== AUTH (demo) =====================
  const signOut = () => onExit();
  const signIn = async () => {};
  const registerCompany = async () => {};
  const addEmployee = async (payload) => {
    const username = String(payload.username || "").trim().toLowerCase();
    if (!/^[a-z0-9_.-]{3,32}$/.test(username)) throw new Error("Username must be 3–32 chars: letters, numbers, . _ -");
    if (dataRef.current.employees.some((e) => e.username === username)) throw new Error("That username is already taken.");
    patch((d) => ({ employees: [...d.employees, {
      id: uid("emp"), username, name: payload.name || username, role: payload.role || "",
      capacity_h: payload.capacity_h || 8, color: payload.color || "#3B45D6", is_hr: !!payload.is_hr,
    }] }));
    return { ok: true };
  };

  // ===================== TASK LIFECYCLE =====================
  const assignTask = async (eid, taskId) => patch((d) => ({ assignments: [...d.assignments, newRow({ employee_id: eid, task_id: taskId })] }));
  const addCustomTask = async (eid, title, hours) => patch((d) => ({ assignments: [...d.assignments, newRow({ employee_id: eid, origin: "custom", title, hours })] }));
  const addSelfTask = async (title, hours) => patch((d) => ({ assignments: [...d.assignments, newRow({ employee_id: me.id, origin: "self", title, hours })] }));
  const removeAssignment = async (id) => patch((d) => ({ assignments: d.assignments.filter((a) => a.id !== id) }));

  const startTask = async (row) => patch((d) => ({
    assignments: pauseActiveOf(d, row.employee_id).map((a) =>
      a.id === row.id ? { ...a, state: "active", started_at: new Date().toISOString() } : a),
  }));
  const pauseTask = async (row) => updateRow(row.id, { elapsed_ms: elapsedMs(row, Date.now()), started_at: null, state: "paused" });
  const completeTask = async (row, late, reason) => {
    const ms = elapsedMs(row, Date.now());
    const budget = budgetH(row, tasksById());
    const actual = ms > 0 ? Math.max(0.1, Math.round((ms / 3600000) * 10) / 10) : budget;
    updateRow(row.id, { elapsed_ms: ms, started_at: null, actual_h: actual, state: late ? "late" : "done", reason: late ? reason : "" });
  };

  // ===================== BUSY =====================
  const setBusy = async (note) => {
    const label = (note || "").trim() || "Busy";
    patch((d) => ({
      assignments: [...pauseActiveOf(d, me.id), newRow({
        employee_id: me.id, origin: "self", title: label, hours: 0, is_busy: true,
        state: "active", started_at: new Date().toISOString(),
      })],
      busy: [...d.busy.filter((b) => b.employee_id !== me.id),
        { employee_id: me.id, on_status: true, note: label, updated_at: new Date().toISOString() }],
    }));
  };
  const clearBusy = async () => {
    const row = busyRowOf(dataRef.current.assignments, me.id);
    patch((d) => {
      let assignments = d.assignments;
      let busyHistory = d.busyHistory;
      if (row) {
        const ms = elapsedMs(row, Date.now());
        const h = Math.round((ms / 3600000) * 100) / 100;
        const closed = { ...row, elapsed_ms: ms, started_at: null, state: "done", hours: h, actual_h: h };
        assignments = d.assignments.map((a) => (a.id === row.id ? closed : a));
        busyHistory = [closed, ...d.busyHistory];
      }
      return {
        assignments, busyHistory,
        busy: d.busy.map((b) => (b.employee_id === me.id ? { ...b, on_status: false, note: "" } : b)),
      };
    });
  };

  // ===================== CONSENSUS =====================
  const addNewProposal = async (title, hours) => patch((d) => ({
    proposals: [...d.proposals, { id: uid("p"), type: "new", title, hours, old_hours: null, task_id: null, proposer: "HR", created_at: new Date().toISOString() }],
  }));
  const addRetimeProposal = async (task, newHours) => {
    const id = uid("p");
    patch((d) => ({
      proposals: [...d.proposals, { id, type: "retime", task_id: task.id, title: task.title, hours: newHours, old_hours: task.hours, proposer: me.name.split(" ")[0], created_at: new Date().toISOString() }],
      votes: [...d.votes, { proposal_id: id, employee_id: me.id }],
    }));
  };
  const toggleVote = async (proposalId) => patch((d) => {
    const mine = d.votes.some((v) => v.proposal_id === proposalId && v.employee_id === me.id);
    return {
      votes: mine
        ? d.votes.filter((v) => !(v.proposal_id === proposalId && v.employee_id === me.id))
        : [...d.votes, { proposal_id: proposalId, employee_id: me.id }],
    };
  });
  const sealProposal = async (p) => patch((d) => {
    const voters = d.votes.filter((v) => v.proposal_id === p.id).map((v) => v.employee_id);
    const last = d.ledger[d.ledger.length - 1] || { idx: -1, hash: "0000000000000000" };
    let title, note = "", tasks = d.tasks;
    if (p.type === "retime") {
      note = `${p.old_hours}h → ${p.hours}h`;
      title = `${p.title} — retimed`;
      tasks = d.tasks.map((t) => (t.id === p.task_id ? { ...t, hours: p.hours } : t));
    } else {
      title = p.title;
      tasks = [...d.tasks, { id: uid("t"), title: p.title, hours: p.hours }];
    }
    const hash = fnv(title + "|" + p.hours + "|" + last.hash + "|" + voters.join(","));
    return {
      tasks,
      ledger: [...d.ledger, { idx: last.idx + 1, kind: p.type, title, hours: p.hours, note, voters, prev_hash: last.hash, hash, sealed_at: new Date().toISOString() }],
      proposals: d.proposals.filter((x) => x.id !== p.id),
      votes: d.votes.filter((v) => v.proposal_id !== p.id),
    };
  });

  return {
    demo: true, configured: true, loading: false, session: { demo: true }, me, data, now,
    tasksById, quorumNeeded,
    viewAs: setMeId,
    actions: {
      signIn, signOut, addEmployee, registerCompany,
      assignTask, addCustomTask, addSelfTask, removeAssignment,
      startTask, pauseTask, completeTask,
      setBusy, clearBusy,
      addNewProposal, addRetimeProposal, toggleVote, sealProposal,
    },
  };
}
