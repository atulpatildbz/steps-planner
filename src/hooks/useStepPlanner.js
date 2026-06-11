import { useState, useEffect, useMemo, useCallback } from "react";

/**
 * Custom hook for managing step planning logic.
 *
 * Model (v2): a *fixed* morning plan you can slip against, plus a *live* catch-up.
 *  - You set a goal + target time + pace, then tap Start. That stamps an anchor
 *    (now, currentSteps) and freezes the ideal line anchor -> target.
 *  - Logging only moves "you are here" + the live catch-up; the line never moves.
 *  - Re-plan re-anchors. Everything resets at midnight (single-day only).
 */

const todayString = () => new Date().toISOString().split("T")[0];

const readNumber = (key, fallback) => {
  const raw = localStorage.getItem(key);
  const parsed = raw !== null ? Number(raw) : NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
};
const readString = (key, fallback) => {
  const raw = localStorage.getItem(key);
  return raw !== null ? raw : fallback;
};
const readJSON = (key, fallback) => {
  const raw = localStorage.getItem(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

// Tunables for the status model.
const BAND_FRACTION = 0.05; // +/-5% of where you should be
const BAND_FLOOR = 150; // steps; keeps early-morning from flickering
const MAX_WALK_MIN_PER_HOUR = 50; // above this, the goal is "unreachable"

// Build a timestamp for a "HH:MM" target time on today's date.
const targetTimestamp = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date();
  d.setHours(h || 0, m || 0, 0, 0);
  return d.getTime();
};

const useStepPlanner = () => {
  // ---- Editable settings (persist as defaults for the next day) ----
  const [targetSteps, setTargetSteps] = useState(() => readNumber("targetSteps", 8000));
  const [targetTime, setTargetTime] = useState(() => readString("targetTime", "18:00"));
  const [walkingPace, setWalkingPace] = useState(() => readNumber("walkingPace", 110));
  const [checkpointInterval, setCheckpointInterval] = useState(() =>
    readNumber("checkpointInterval", 60)
  );

  // ---- Live, per-day state ----
  const [currentSteps, setCurrentSteps] = useState(() => readNumber("currentSteps", 0));
  const [logs, setLogs] = useState(() => readJSON("stepLogs", [])); // [{ time, steps }]
  // The frozen plan, or null when in setup mode. Snapshotted at Start.
  const [plan, setPlan] = useState(() => {
    const saved = readJSON("plan", null);
    if (saved && saved.date === todayString()) return saved;
    return null;
  });

  // A ticking clock so live numbers refresh while the app is open.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  // ---- Persist settings ----
  useEffect(() => localStorage.setItem("targetSteps", String(targetSteps)), [targetSteps]);
  useEffect(() => localStorage.setItem("targetTime", targetTime), [targetTime]);
  useEffect(() => localStorage.setItem("walkingPace", String(walkingPace)), [walkingPace]);
  useEffect(
    () => localStorage.setItem("checkpointInterval", String(checkpointInterval)),
    [checkpointInterval]
  );
  useEffect(() => localStorage.setItem("currentSteps", String(currentSteps)), [currentSteps]);
  useEffect(() => localStorage.setItem("stepLogs", JSON.stringify(logs)), [logs]);
  useEffect(() => {
    if (plan) localStorage.setItem("plan", JSON.stringify(plan));
    else localStorage.removeItem("plan");
  }, [plan]);

  // ---- New-day cleanup: if the saved plan/logs are from a past day, reset. ----
  useEffect(() => {
    const t = todayString();
    if (plan && plan.date !== t) {
      setPlan(null);
      setLogs([]);
      setCurrentSteps(0);
    } else if (!plan) {
      // Drop any stale logs left over from a previous day.
      const stale = logs.some((l) => l.date && l.date !== t);
      if (stale) {
        setLogs([]);
        setCurrentSteps(0);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Actions ----

  // Lock in the plan: freeze the ideal line from (now, currentSteps) -> (target).
  const startPlan = useCallback(() => {
    const t = todayString();
    const anchorTime = Date.now();
    const newPlan = {
      date: t,
      anchorTime,
      anchorSteps: currentSteps,
      targetSteps,
      targetTime,
      walkingPace,
    };
    setPlan(newPlan);
    const firstLog = { date: t, time: anchorTime, steps: currentSteps };
    setLogs([firstLog]);
  }, [currentSteps, targetSteps, targetTime, walkingPace]);

  // Throw away today's plan and go back to setup.
  const rePlan = useCallback(() => {
    setPlan(null);
    setLogs([]);
  }, []);

  // Log the current step count (updates "you are here", not the frozen line).
  const logSteps = useCallback(
    (steps) => {
      const value = Math.max(0, Number(steps) || 0);
      setCurrentSteps(value);
      setLogs((prev) => [...prev, { date: todayString(), time: Date.now(), steps: value }]);
    },
    [setCurrentSteps]
  );

  const resetToday = useCallback(() => {
    setPlan(null);
    setLogs([]);
    setCurrentSteps(0);
  }, []);

  // ---- Derived live computation (active mode) ----
  const derived = useMemo(() => {
    if (!plan) return null;

    const { anchorTime, anchorSteps, targetSteps: goal, targetTime: tt, walkingPace: pace } = plan;
    const targetTimeMs = targetTimestamp(tt);

    const span = targetTimeMs - anchorTime;
    const idealAt = (t) => {
      if (span <= 0) return goal;
      const frac = Math.min(1, Math.max(0, (t - anchorTime) / span));
      return Math.round(anchorSteps + (goal - anchorSteps) * frac);
    };

    const idealNow = idealAt(now);
    const diff = currentSteps - idealNow; // + ahead, - behind
    const stepsLeft = Math.max(0, goal - currentSteps);
    const msLeft = targetTimeMs - now;
    const hoursLeft = msLeft / 3600000;
    const minsLeft = msLeft / 60000;

    const reached = currentSteps >= goal;
    const timeUp = now >= targetTimeMs;

    // Catch-up pace: spread the remaining steps evenly over the remaining time.
    const catchupPace = hoursLeft > 0 ? stepsLeft / hoursLeft : Infinity; // steps/hr
    const walkMinPerHour = pace > 0 ? catchupPace / pace : Infinity;

    // Rolling next-60-min instruction.
    const windowMin = Math.min(60, Math.max(0, minsLeft));
    const stepsNextWindow = Math.round(catchupPace * (windowMin / 60));
    const minutesNextWindow = pace > 0 ? Math.round(stepsNextWindow / pace) : 0;

    // Status pill state.
    const band = Math.max(BAND_FLOOR, BAND_FRACTION * idealNow);
    let state;
    if (reached) state = "done";
    else if (timeUp) state = "timeup";
    else if (walkMinPerHour > MAX_WALK_MIN_PER_HOUR) state = "unreachable";
    else if (diff > band) state = "ahead";
    else if (diff < -band) state = "behind";
    else state = "ontrack";

    // Suggestions when unreachable: how much later / how much lower would work.
    let suggestion = null;
    if (state === "unreachable") {
      const sustainablePerHour = MAX_WALK_MIN_PER_HOUR * pace; // steps/hr you could sustain
      const hoursNeeded = stepsLeft / sustainablePerHour;
      const suggestedTargetMs = now + hoursNeeded * 3600000;
      const sd = new Date(suggestedTargetMs);
      const suggestedTime = `${String(sd.getHours()).padStart(2, "0")}:${String(
        sd.getMinutes()
      ).padStart(2, "0")}`;
      const suggestedGoal =
        currentSteps + Math.floor((sustainablePerHour * Math.max(0, hoursLeft)) / 100) * 100;
      suggestion = { suggestedTime, suggestedGoal };
    }

    // Next clock-aligned checkpoint after now (catch-up target to still finish).
    const intervalMs = checkpointInterval * 60000;
    let nextCp = null;
    if (!timeUp && !reached) {
      const minutes = new Date(now).getMinutes();
      const remainder = minutes % checkpointInterval;
      const addMin = remainder === 0 ? checkpointInterval : checkpointInterval - remainder;
      let cpTime = new Date(now);
      cpTime.setMinutes(minutes + addMin, 0, 0);
      let cpMs = cpTime.getTime();
      if (cpMs > targetTimeMs) cpMs = targetTimeMs;
      const cpTarget = Math.min(
        goal,
        Math.round(currentSteps + catchupPace * ((cpMs - now) / 3600000))
      );
      nextCp = {
        time: cpMs,
        target: cpTarget,
        idealTarget: idealAt(cpMs),
      };
    }

    // Reference checkpoint list along the FROZEN plan line.
    const checkpoints = [];
    {
      let t = anchorTime;
      // First checkpoint after the anchor, clock-aligned.
      const start = new Date(anchorTime);
      const rem = start.getMinutes() % checkpointInterval;
      const add = rem === 0 ? checkpointInterval : checkpointInterval - rem;
      start.setMinutes(start.getMinutes() + add, 0, 0);
      t = start.getTime();
      while (t < targetTimeMs) {
        checkpoints.push({ time: t, steps: idealAt(t), past: t < now });
        t += intervalMs;
      }
      checkpoints.push({ time: targetTimeMs, steps: goal, past: targetTimeMs < now });
    }

    // Chart series: union of x points with ideal / catchup / actual fields.
    const xs = new Set([anchorTime, targetTimeMs, now]);
    logs.forEach((l) => xs.add(l.time));
    checkpoints.forEach((c) => xs.add(c.time));
    const logByTime = new Map(logs.map((l) => [l.time, l.steps]));
    const chartData = Array.from(xs)
      .sort((a, b) => a - b)
      .map((t) => {
        const point = { time: t, ideal: idealAt(t) };
        if (logByTime.has(t)) point.actual = logByTime.get(t);
        if (t === now) point.actual = currentSteps;
        if (t >= now && !reached && !timeUp) {
          point.catchup = Math.min(goal, Math.round(currentSteps + catchupPace * ((t - now) / 3600000)));
        }
        return point;
      });

    const percent = Math.min(100, goal > 0 ? (currentSteps / goal) * 100 : 0);

    return {
      targetTimeMs,
      idealNow,
      diff,
      stepsLeft,
      hoursLeft: Math.max(0, hoursLeft),
      reached,
      timeUp,
      catchupPace: Number.isFinite(catchupPace) ? Math.round(catchupPace) : 0,
      walkMinPerHour: Number.isFinite(walkMinPerHour) ? walkMinPerHour : 0,
      stepsNextWindow,
      minutesNextWindow,
      windowMin: Math.round(windowMin),
      state,
      suggestion,
      nextCp,
      checkpoints,
      chartData,
      percent,
      goal,
    };
  }, [plan, now, currentSteps, logs, checkpointInterval]);

  return {
    // mode
    isActive: !!plan,
    plan,
    now,
    // settings
    targetSteps,
    setTargetSteps,
    targetTime,
    setTargetTime,
    walkingPace,
    setWalkingPace,
    checkpointInterval,
    setCheckpointInterval,
    // live
    currentSteps,
    setCurrentSteps,
    logs,
    // actions
    startPlan,
    rePlan,
    logSteps,
    resetToday,
    // derived
    derived,
  };
};

export default useStepPlanner;
