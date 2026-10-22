import { useCallback, useEffect, useRef, useState } from "react";
import { quorum, quorumConfigured, usernameToEmail, functionsBase } from "./quorumClient";
import { fnv, elapsedMs, budgetH, todayLocal, busyRowOf } from "./quorumLogic";

const EMPTY = { company: null, employees: [], tasks: [], assignments: [], proposals: [], votes: [], ledger: [], busy: [], busyHistory: [] };

// How many days of busy history HR can review.
const BUSY_HISTORY_DAYS = 14;
const daysAgo = (n) => todayLocal(new Date(Date.now() - n * 86400000));

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
    const today = todayLocal();

    // Roll the previous day over before reading, so the board never shows stale
    // rows. Whoever opens the app first does it for the whole team.
    await quorum.rpc("close_stale_assignments", { p_today: today });

    const [company, emp, tasks, asg, props, votes, ledger, busy, busyHist] = await Promise.all([
      // RLS returns only the caller's own company.
      quorum.from("companies").select("*").maybeSingle(),
      quorum.from("employees").select("*").order("created_at"),
      quorum.from("tasks").select("*").order("created_at"),
      // Today only: capacity is a per-day budget, so yesterday's rows must not
      // count against it.
      quorum.from("assignments").select("*").eq("work_date", today).order("created_at"),
      quorum.from("proposals").select("*").order("created_at"),
      quorum.from("proposal_votes").select("*"),
      quorum.from("ledger_blocks").select("*").order("idx"),
      quorum.from("busy_status").select("*"),
      quorum.from("assignments").select("*").eq("is_busy", true)
        .gte("work_date", daysAgo(BUSY_HISTORY_DAYS)).order("work_date", { ascending: false }),
    ]);
    setData({
      company: company.data || null,
      employees: emp.data || [], tasks: tasks.data || [], assignments: asg.data || [],
      proposals: props.data || [], votes: votes.data || [], ledger: ledger.data || [], busy: busy.data || [],
      busyHistory: busyHist.data || [],
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

  // ---- midnight rollover for a tab left open ----
  // Without this, a dashboard open overnight would keep showing yesterday's
  // board until someone manually refreshed.
  const dayRef = useRef(todayLocal());
  useEffect(() => {
    const d = todayLocal();
    if (d !== dayRef.current) { dayRef.current = d; loadAll(); }
  }, [now, loadAll]);

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
    // HR-only (server enforces); the new person joins the caller's company.
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

  // Public: creates a new company and its first (HR) account, then signs in.
  const registerCompany = async ({ companyName, name, username, password }) => {
    const res = await fetch(`${functionsBase}/create-employee`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company_name: companyName, name, username, password, role: "HR" }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || "Could not register the company.");
    await signIn(username, password);
  };

  // ===================== TASK LIFECYCLE =====================
  const assignTask = async (eid, taskId) => {
    await quorum.from("assignments").insert({ employee_id: eid, task_id: taskId, origin: "assigned", state: "todo", work_date: todayLocal() });
    scheduleReload();
  };
  const addCustomTask = async (eid, title, hours) => {
    await quorum.from("assignments").insert({ employee_id: eid, origin: "custom", title, hours, state: "todo", work_date: todayLocal() });
    scheduleReload();
  };
  const addSelfTask = async (title, hours) => {
    await quorum.from("assignments").insert({ employee_id: me.id, origin: "self", title, hours, state: "todo", work_date: todayLocal() });
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
  // Going busy opens a self-origin assignment with its timer already running, so
  // the period is measured like any other work and lands in the same hours
  // ledger. hours (the budget) stays 0 while it runs — an open-ended period
  // shouldn't inflate committed load — and is set to the measured duration on
  // clear, at which point it counts against the day's capacity.
  const setBusy = async (note) => {
    const label = (note || "").trim() || "Busy";
    const cur = activeRowOf(me.id);
    if (cur) await quorum.from("assignments")
      .update({ elapsed_ms: elapsedMs(cur, Date.now()), started_at: null, state: "paused" }).eq("id", cur.id);
    await quorum.from("assignments").insert({
      employee_id: me.id, origin: "self", title: label, hours: 0, is_busy: true,
      state: "active", started_at: new Date().toISOString(), work_date: todayLocal(),
    });
    await quorum.from("busy_status").upsert({ employee_id: me.id, on_status: true, note: label, updated_at: new Date().toISOString() });
    scheduleReload();
  };
  const clearBusy = async () => {
    const row = busyRowOf(data.assignments, me.id);
    if (row) {
      const ms = elapsedMs(row, Date.now());
      const h = Math.round((ms / 3600000) * 100) / 100;
      await quorum.from("assignments").update({
        elapsed_ms: ms, started_at: null, state: "done", hours: h, actual_h: h,
      }).eq("id", row.id);
    }
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
      signIn, signOut, addEmployee, registerCompany,
      assignTask, addCustomTask, addSelfTask, removeAssignment,
      startTask, pauseTask, completeTask,
      setBusy, clearBusy,
      addNewProposal, addRetimeProposal, toggleVote, sealProposal,
    },
  };
}
