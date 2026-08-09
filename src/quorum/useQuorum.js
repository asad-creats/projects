import { useCallback, useEffect, useRef, useState } from "react";
import { quorum, quorumConfigured, usernameToEmail, functionsBase } from "./quorumClient";
import { fnv, elapsedMs, budgetH } from "./quorumLogic";

const EMPTY = { employees: [], tasks: [], assignments: [], proposals: [], votes: [], ledger: [], busy: [] };

export function useQuorum() {
  const [session, setSession] = useState(null);
  const [me, setMe] = useState(null);
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const reloadTimer = useRef(null);

  // ---- session ----
  useEffect(() => {
    if (!quorumConfigured) { setLoading(false); return; }
    quorum.auth.getSession().then(({ data: d }) => setSession(d.session));
    const { data: sub } = quorum.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // ---- load everything ----
  const loadAll = useCallback(async () => {
    if (!quorumConfigured || !session) return;
    const [emp, tasks, asg, props, votes, ledger, busy] = await Promise.all([
      quorum.from("employees").select("*").order("created_at"),
      quorum.from("tasks").select("*").order("created_at"),
      quorum.from("assignments").select("*").order("created_at"),
      quorum.from("proposals").select("*").order("created_at"),
      quorum.from("proposal_votes").select("*"),
      quorum.from("ledger_blocks").select("*").order("idx"),
      quorum.from("busy_status").select("*"),
    ]);
    setData({
      employees: emp.data || [], tasks: tasks.data || [], assignments: asg.data || [],
      proposals: props.data || [], votes: votes.data || [], ledger: ledger.data || [], busy: busy.data || [],
    });
    const mine = (emp.data || []).find((e) => e.id === session.user.id) || null;
    setMe(mine);
    setLoading(false);
  }, [session]);

  const scheduleReload = useCallback(() => {
    clearTimeout(reloadTimer.current);
    reloadTimer.current = setTimeout(loadAll, 200);
  }, [loadAll]);

  // ---- initial load + realtime ----
  useEffect(() => {
    if (!quorumConfigured) return;
    if (!session) { setMe(null); setData(EMPTY); setLoading(false); return; }
    setLoading(true);
    loadAll();
    const ch = quorum
      .channel("quorum-all")
      .on("postgres_changes", { event: "*", schema: "public" }, scheduleReload)
      .subscribe();
    return () => quorum.removeChannel(ch);
  }, [session, loadAll, scheduleReload]);

  // ---- clock tick for live timers ----
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // ---- helpers used by actions ----
  const tasksById = () => Object.fromEntries(data.tasks.map((t) => [t.id, t]));
  const activeRowOf = (eid) => data.assignments.find((a) => a.employee_id === eid && a.state === "active");
  const nonHrCount = () => data.employees.filter((e) => !e.is_hr).length;
  const quorumNeeded = () => Math.floor(Math.max(1, nonHrCount()) / 2) + 1;

  // ===================== AUTH =====================
  const signIn = async (username, password) => {
    const { error } = await quorum.auth.signInWithPassword({ email: usernameToEmail(username), password });
    if (error) throw new Error(/invalid/i.test(error.message) ? "Wrong username or password." : error.message);
  };
  const signOut = () => quorum.auth.signOut();

  const addEmployee = async (payload) => {
    // HR-only (server enforces). Uses the caller's token, or none for the bootstrap.
    const headers = { "Content-Type": "application/json" };
    if (session) headers.Authorization = `Bearer ${session.access_token}`;
    const res = await fetch(`${functionsBase}/create-employee`, {
      method: "POST", headers, body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || "Could not create employee.");
    scheduleReload();
    return body;
  };

  // ===================== TASK LIFECYCLE =====================
  const assignTask = async (eid, taskId) => {
    await quorum.from("assignments").insert({ employee_id: eid, task_id: taskId, origin: "assigned", state: "todo" });
    scheduleReload();
  };
  const addCustomTask = async (eid, title, hours) => {
    await quorum.from("assignments").insert({ employee_id: eid, origin: "custom", title, hours, state: "todo" });
    scheduleReload();
  };
  const addSelfTask = async (title, hours) => {
    await quorum.from("assignments").insert({ employee_id: me.id, origin: "self", title, hours, state: "todo" });
    scheduleReload();
  };
  const removeAssignment = async (id) => { await quorum.from("assignments").delete().eq("id", id); scheduleReload(); };

  const startTask = async (a) => {
    const cur = activeRowOf(a.employee_id);
    if (cur && cur.id !== a.id)
      await quorum.from("assignments").update({ elapsed_ms: elapsedMs(cur, Date.now()), started_at: null, state: "paused" }).eq("id", cur.id);
    await quorum.from("assignments").update({ state: "active", started_at: new Date().toISOString() }).eq("id", a.id);
    scheduleReload();
  };
  const pauseTask = async (a) => {
    await quorum.from("assignments").update({ elapsed_ms: elapsedMs(a, Date.now()), started_at: null, state: "paused" }).eq("id", a.id);
    scheduleReload();
  };
  const completeTask = async (a, late, reason) => {
    const ms = elapsedMs(a, Date.now());
    const budget = budgetH(a, tasksById());
    const actual = ms > 0 ? Math.max(0.1, Math.round((ms / 3600000) * 10) / 10) : budget;
    await quorum.from("assignments").update({
      elapsed_ms: ms, started_at: null, actual_h: actual, state: late ? "late" : "done", reason: late ? reason : "",
    }).eq("id", a.id);
    scheduleReload();
  };

  // ===================== BUSY =====================
  const setBusy = async (note) => {
    await quorum.from("busy_status").upsert({ employee_id: me.id, on_status: true, note, updated_at: new Date().toISOString() });
    scheduleReload();
  };
  const clearBusy = async () => {
    await quorum.from("busy_status").upsert({ employee_id: me.id, on_status: false, note: "", updated_at: new Date().toISOString() });
    scheduleReload();
  };

  // ===================== CONSENSUS =====================
  const addNewProposal = async (title, hours) => {
    await quorum.from("proposals").insert({ type: "new", title, hours, proposer: "HR" });
    scheduleReload();
  };
  const addRetimeProposal = async (task, newHours) => {
    const { data: prop } = await quorum.from("proposals")
      .insert({ type: "retime", task_id: task.id, title: task.title, hours: newHours, old_hours: task.hours, proposer: me.name.split(" ")[0] })
      .select().single();
    if (prop) await quorum.from("proposal_votes").insert({ proposal_id: prop.id, employee_id: me.id });
    scheduleReload();
  };
  const toggleVote = async (proposalId) => {
    const mine = data.votes.find((v) => v.proposal_id === proposalId && v.employee_id === me.id);
    if (mine) await quorum.from("proposal_votes").delete().eq("proposal_id", proposalId).eq("employee_id", me.id);
    else await quorum.from("proposal_votes").insert({ proposal_id: proposalId, employee_id: me.id });
    scheduleReload();
  };
  const sealProposal = async (p) => {
    const voters = data.votes.filter((v) => v.proposal_id === p.id).map((v) => v.employee_id);
    const last = data.ledger[data.ledger.length - 1] || { idx: -1, hash: "0000000000000000" };
    const idx = last.idx + 1;
    let title, note = "", kind = p.type;
    if (p.type === "retime") {
      note = `${p.old_hours}h → ${p.hours}h`;
      title = `${p.title} — retimed`;
      await quorum.from("tasks").update({ hours: p.hours }).eq("id", p.task_id);
    } else {
      title = p.title;
      await quorum.from("tasks").insert({ title: p.title, hours: p.hours });
    }
    const hash = fnv(title + "|" + p.hours + "|" + last.hash + "|" + voters.join(","));
    await quorum.from("ledger_blocks").insert({
      idx, kind, title, hours: p.hours, note, voters, prev_hash: last.hash, hash,
      sealed_at: new Date().toISOString(),
    });
    await quorum.from("proposals").delete().eq("id", p.id); // cascade removes votes
    scheduleReload();
  };

  return {
    configured: quorumConfigured, loading, session, me, data, now,
    tasksById, quorumNeeded,
    actions: {
      signIn, signOut, addEmployee,
      assignTask, addCustomTask, addSelfTask, removeAssignment,
      startTask, pauseTask, completeTask,
      setBusy, clearBusy,
      addNewProposal, addRetimeProposal, toggleVote, sealProposal,
    },
  };
}
