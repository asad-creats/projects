// Pure helpers for Quorum — no state, operate on plain data passed in.
export const CAP = 8; // daily capacity hours

export const initials = (n) => String(n || "").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
export const fmtH = (h) => (Number.isInteger(h) ? h : (Math.round(h * 10) / 10).toFixed(1)) + "h";
export function fmtClock(ms) {
  const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h + ":" + String(m).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
}

// 16-char FNV-ish hash for ledger blocks (matches the prototype's look)
export function fnv(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  const hex = h.toString(16).padStart(8, "0");
  const h2 = Math.imul(h ^ 0x9e3779b9, 0x85ebca6b) >>> 0;
  return hex + h2.toString(16).padStart(8, "0");
}

// title/hours for an assignment: from the catalog (assigned) or the row (self/custom)
export function taskMeta(a, tasksById) {
  if (a.origin === "self" || a.origin === "custom")
    return { title: a.title, hours: Number(a.hours) || 0, sealed: false, origin: a.origin };
  const t = tasksById[a.task_id] || {};
  return { title: t.title, hours: Number(t.hours) || 0, sealed: true, origin: "assigned" };
}
export const budgetH = (a, tasksById) => taskMeta(a, tasksById).hours;
export const isDone = (a) => a.state === "done" || a.state === "late";

// live elapsed ms — elapsed_ms plus the running segment while active
export function elapsedMs(a, now) {
  const base = Number(a.elapsed_ms) || 0;
  if (a.state === "active" && a.started_at) return base + (now - new Date(a.started_at).getTime());
  return base;
}

export const rowsOf = (assignments, eid) => assignments.filter((a) => a.employee_id === eid);
export const activeOf = (assignments, eid) => rowsOf(assignments, eid).find((a) => a.state === "active");
export const scheduledLoad = (assignments, eid, tasksById) =>
  rowsOf(assignments, eid).reduce((s, a) => s + budgetH(a, tasksById), 0);
export const remainingLoad = (assignments, eid, tasksById) =>
  rowsOf(assignments, eid).reduce((s, a) => s + (isDone(a) ? 0 : budgetH(a, tasksById)), 0);
export const doneBudget = (assignments, eid, tasksById) =>
  rowsOf(assignments, eid).reduce((s, a) => s + (isDone(a) ? budgetH(a, tasksById) : 0), 0);
export const doneCount = (assignments, eid) => rowsOf(assignments, eid).filter(isDone).length;
export function workedH(assignments, eid, tasksById, now) {
  return rowsOf(assignments, eid).reduce((s, a) => {
    if (isDone(a)) return s + (Number(a.actual_h) || 0);
    if (a.state === "active" || a.state === "paused") return s + elapsedMs(a, now) / 3600000;
    return s;
  }, 0);
}
export function overrunH(a, tasksById) {
  const b = budgetH(a, tasksById);
  return a.actual_h != null && b > 0 && a.actual_h > b ? a.actual_h - b : 0;
}

export function status(load) {
  const r = load / CAP;
  if (load === 0) return { key: "free", label: "Available", cls: "free" };
  if (r > 1) return { key: "over", label: "Overloaded", cls: "over" };
  if (r > 0.85) return { key: "busy", label: "Full", cls: "busy" };
  return { key: "free", label: "Has room", cls: "free" };
}
export const pendClass = (st) => (st.cls === "over" ? "over" : st.cls === "busy" ? "busy" : "");

export const STATE_PILL = {
  todo: ["st-todo", "To do"], active: ["st-active", "● Working"], paused: ["st-paused", "⏸ Paused"],
  done: ["st-done", "✓ Done"], late: ["st-late", "⚑ Late"],
};

export const COLORS = ["#3B45D6", "#1F9D6B", "#E0912F", "#C0468A", "#2C8FBF", "#7A5AD6", "#D64550"];
