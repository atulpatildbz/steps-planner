import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { timeFormat } from "d3-time-format";

const fmtClock = timeFormat("%I:%M %p");

// Visual language: color comes only from the status state.
const STATES = {
  done: { label: "Goal reached", ring: "#22c55e", chip: "bg-green-500", text: "text-green-700 dark:text-green-300" },
  ahead: { label: "Ahead", ring: "#22c55e", chip: "bg-green-500", text: "text-green-700 dark:text-green-300" },
  ontrack: { label: "On track", ring: "#3b82f6", chip: "bg-blue-500", text: "text-blue-700 dark:text-blue-300" },
  behind: { label: "Behind", ring: "#f59e0b", chip: "bg-amber-500", text: "text-amber-700 dark:text-amber-300" },
  unreachable: { label: "Unreachable", ring: "#ef4444", chip: "bg-red-500", text: "text-red-700 dark:text-red-300" },
  timeup: { label: "Time's up", ring: "#6b7280", chip: "bg-gray-500", text: "text-gray-600 dark:text-gray-300" },
};

// A circular progress ring.
const ProgressRing = ({ percent, color }) => {
  const r = 52;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, percent) / 100) * c;
  return (
    <svg width="128" height="128" viewBox="0 0 128 128" className="shrink-0">
      <circle cx="64" cy="64" r={r} fill="none" stroke="currentColor" strokeWidth="10" className="text-gray-200 dark:text-gray-700" />
      <circle
        cx="64"
        cy="64"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform="rotate(-90 64 64)"
        style={{ transition: "stroke-dashoffset 0.5s ease, stroke 0.3s ease" }}
      />
      <text x="64" y="60" textAnchor="middle" className="fill-gray-900 dark:fill-white" fontSize="24" fontWeight="700">
        {Math.round(percent)}%
      </text>
      <text x="64" y="80" textAnchor="middle" className="fill-gray-400 dark:fill-gray-500" fontSize="11">
        of goal
      </text>
    </svg>
  );
};
ProgressRing.propTypes = { percent: PropTypes.number.isRequired, color: PropTypes.string.isRequired };

const Hero = ({ derived, currentSteps, logSteps, setTargetTime, setTargetSteps }) => {
  const s = STATES[derived.state] || STATES.ontrack;
  const [draft, setDraft] = useState(String(currentSteps));

  // Keep the input in sync when steps change elsewhere (e.g. re-plan).
  useEffect(() => setDraft(String(currentSteps)), [currentSteps]);

  const behindBy = Math.round(Math.abs(derived.diff));
  const submit = () => {
    const v = Math.max(0, Number(draft) || 0);
    logSteps(v);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
        <ProgressRing percent={derived.percent} color={s.ring} />

        <div className="flex-1 min-w-0">
          {/* Status pill */}
          <div className="flex items-center gap-2 mb-3">
            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-white text-sm font-semibold ${s.chip}`}>
              <span className={`h-2 w-2 rounded-full bg-white ${derived.state === "behind" || derived.state === "unreachable" ? "animate-pulse" : ""}`} />
              {s.label}
            </span>
            {derived.state !== "done" && derived.state !== "timeup" && (
              <span className={`text-sm font-medium ${s.text}`}>
                {derived.diff >= 0 ? "+" : "−"}
                {behindBy.toLocaleString()} vs plan
              </span>
            )}
          </div>

          {/* The headline instruction */}
          {derived.state === "done" ? (
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              🎉 {currentSteps.toLocaleString()} steps — goal smashed!
            </p>
          ) : derived.state === "timeup" ? (
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Target time passed. {derived.stepsLeft.toLocaleString()} steps short — tap Re-plan to set a new target.
            </p>
          ) : derived.state === "unreachable" ? (
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                That pace isn&apos;t realistic anymore.
              </p>
              {derived.suggestion && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  Try{" "}
                  <button
                    onClick={() => setTargetTime(derived.suggestion.suggestedTime)}
                    className="font-semibold text-blue-600 dark:text-blue-400 underline"
                  >
                    moving target to {derived.suggestion.suggestedTime}
                  </button>{" "}
                  or{" "}
                  <button
                    onClick={() => setTargetSteps(derived.suggestion.suggestedGoal)}
                    className="font-semibold text-blue-600 dark:text-blue-400 underline"
                  >
                    dropping goal to {derived.suggestion.suggestedGoal.toLocaleString()}
                  </button>
                  , then Re-plan.
                </p>
              )}
            </div>
          ) : (
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">
                Next {derived.windowMin} min
              </p>
              <p className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight">
                Walk ~{derived.minutesNextWindow} min
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                ≈ {derived.stepsNextWindow.toLocaleString()} steps
                {derived.nextCp && (
                  <>
                    {" · "}reach{" "}
                    <span className="font-semibold text-gray-700 dark:text-gray-200">
                      {derived.nextCp.target.toLocaleString()}
                    </span>{" "}
                    by {fmtClock(new Date(derived.nextCp.time))}
                  </>
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick log */}
      <div className="mt-6">
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
          Update current steps (from your phone)
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={100}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            className="flex-1 w-full px-4 py-3 text-lg rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 outline-none transition"
          />
          <button
            onClick={submit}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 active:scale-[0.98] transition shadow"
          >
            Update
          </button>
        </div>
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
