import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { timeFormat } from "d3-time-format";
import { fmtK } from "../lib/format";

const fmtClock = timeFormat("%-I:%M %p");

// Visual language: color comes only from the status state.
const STATES = {
  done: { label: "Goal reached", ring: "#22c55e", chip: "bg-green-500", pulse: false },
  ahead: { label: "Ahead", ring: "#22c55e", chip: "bg-green-500", pulse: false },
  ontrack: { label: "On track", ring: "#6366f1", chip: "bg-indigo-500", pulse: false },
  behind: { label: "Behind", ring: "#f59e0b", chip: "bg-amber-500", pulse: true },
  unreachable: { label: "Unreachable", ring: "#ef4444", chip: "bg-red-500", pulse: true },
  timeup: { label: "Time's up", ring: "#6b7280", chip: "bg-slate-500", pulse: false },
};

const ProgressRing = ({ percent, color }) => {
  const r = 40;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, percent) / 100) * c;
  return (
    <svg width="104" height="104" viewBox="0 0 104 104" className="shrink-0">
      <circle cx="52" cy="52" r={r} fill="none" stroke="currentColor" strokeWidth="9" className="text-slate-200 dark:text-slate-800" />
      <circle
        cx="52"
        cy="52"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform="rotate(-90 52 52)"
        style={{ transition: "stroke-dashoffset 0.5s ease, stroke 0.3s ease" }}
      />
      <text x="52" y="50" textAnchor="middle" className="fill-slate-900 dark:fill-white tabular-nums" fontSize="22" fontWeight="700">
        {Math.round(percent)}%
      </text>
      <text x="52" y="67" textAnchor="middle" className="fill-slate-400 dark:fill-slate-500" fontSize="9.5" letterSpacing="0.5">
        OF GOAL
      </text>
    </svg>
  );
};
ProgressRing.propTypes = { percent: PropTypes.number.isRequired, color: PropTypes.string.isRequired };

const Hero = ({ derived, currentSteps, logSteps, setTargetTime, setTargetSteps }) => {
  const s = STATES[derived.state] || STATES.ontrack;
  const [draft, setDraft] = useState(String(currentSteps));
  useEffect(() => setDraft(String(currentSteps)), [currentSteps]);

  const submit = () => logSteps(Math.max(0, Number(draft) || 0));
  const ahead = derived.diff >= 0;
  const live = derived.state !== "done" && derived.state !== "timeup" && derived.state !== "unreachable";

  return (
    <div className="p-4 sm:p-5 flex gap-4 sm:gap-5">
      <ProgressRing percent={derived.percent} color={s.ring} />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* status row */}
        <div className="flex items-center gap-2 mb-1.5">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-white text-xs font-semibold ${s.chip}`}>
            <span className={`h-1.5 w-1.5 rounded-full bg-white ${s.pulse ? "animate-pulse" : ""}`} />
            {s.label}
          </span>
          {derived.state !== "done" && derived.state !== "timeup" && (
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500 tabular-nums">
              {ahead ? "+" : "−"}
              {fmtK(Math.abs(derived.diff))} vs plan
            </span>
          )}
        </div>

        {/* headline */}
        {derived.state === "done" ? (
          <p className="text-xl font-bold text-slate-900 dark:text-white">🎉 {currentSteps.toLocaleString()} — goal smashed</p>
        ) : derived.state === "timeup" ? (
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Target passed, {fmtK(derived.stepsLeft)} short. Tap ↻ to set a new target.
          </p>
        ) : derived.state === "unreachable" ? (
          <div>
            <p className="text-lg font-bold text-slate-900 dark:text-white leading-snug">Pace isn&apos;t realistic anymore.</p>
            {derived.suggestion && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <button onClick={() => setTargetTime(derived.suggestion.suggestedTime)} className="font-semibold text-indigo-600 dark:text-indigo-400 underline">
                  push to {fmtClock(new Date(`2000-01-01T${derived.suggestion.suggestedTime}`))}
                </button>{" "}
                or{" "}
                <button onClick={() => setTargetSteps(derived.suggestion.suggestedGoal)} className="font-semibold text-indigo-600 dark:text-indigo-400 underline">
                  drop to {fmtK(derived.suggestion.suggestedGoal)}
                </button>
                , then ↻
              </p>
            )}
          </div>
        ) : (
          <div className="leading-none">
            <span className="text-[11px] uppercase tracking-wide text-slate-400 dark:text-slate-500">Next {derived.windowMin} min</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums mt-0.5">
              Walk {derived.minutesNextWindow}<span className="text-lg font-bold">m</span>
              <span className="text-sm font-medium text-slate-400 dark:text-slate-500"> · {fmtK(derived.stepsNextWindow)}</span>
            </p>
            {derived.nextCp && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                reach <span className="font-semibold text-slate-700 dark:text-slate-200">{derived.nextCp.target.toLocaleString()}</span> by {fmtClock(new Date(derived.nextCp.time))}
              </p>
            )}
          </div>
        )}

        {/* quick log */}
        <div className="flex gap-2 mt-3">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={100}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            aria-label="Current steps from your phone"
            className="flex-1 w-full px-3 py-2 text-base tabular-nums rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900/50 outline-none transition"
          />
          <button onClick={submit} className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 active:scale-95 transition">
            Update
          </button>
        </div>
        {live && <span className="sr-only">updated</span>}
      </div>
    </div>
  );
};

Hero.propTypes = {
  derived: PropTypes.object.isRequired,
  currentSteps: PropTypes.number.isRequired,
  logSteps: PropTypes.func.isRequired,
  setTargetTime: PropTypes.func.isRequired,
  setTargetSteps: PropTypes.func.isRequired,
};

export default Hero;
