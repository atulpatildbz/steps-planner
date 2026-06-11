import PropTypes from "prop-types";

const field =
  "block w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900/50 outline-none transition tabular-nums dark:bg-slate-800 dark:border-slate-700 dark:text-white";
const labelCls = "block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1";

const presets = [
  { label: "8k by 6 PM", steps: 8000, time: "18:00" },
  { label: "10k by 8 PM", steps: 10000, time: "20:00" },
  { label: "12k by 9 PM", steps: 12000, time: "21:00" },
];

/**
 * Morning setup: pick a goal, then Start to freeze the plan.
 */
const SetupForm = ({
  targetSteps,
  setTargetSteps,
  targetTime,
  setTargetTime,
  walkingPace,
  setWalkingPace,
  currentSteps,
  setCurrentSteps,
  startPlan,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl ring-1 ring-slate-900/5 dark:ring-white/10 shadow-xl shadow-slate-900/5 dark:shadow-black/30 p-5 sm:p-6">
      <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-0.5">Plan today&apos;s goal</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Set your target, then tap Start to lock in the plan.</p>

      <div className="flex flex-wrap gap-2 mb-5">
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => {
              setTargetSteps(p.steps);
              setTargetTime(p.time);
            }}
            className={`px-3 py-1.5 text-sm rounded-full border transition ${
              targetSteps === p.steps && targetTime === p.time
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-transparent hover:bg-slate-200 dark:hover:bg-slate-600"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className={labelCls}>Target steps</label>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={100}
            value={targetSteps}
            onChange={(e) => setTargetSteps(Math.max(0, Number(e.target.value)))}
            className={field}
          />
        </div>
        <div>
          <label className={labelCls}>Target time</label>
          <input type="time" value={targetTime} onChange={(e) => setTargetTime(e.target.value)} className={field} />
        </div>
        <div>
          <label className={labelCls}>Current steps right now</label>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={100}
            value={currentSteps}
            onChange={(e) => setCurrentSteps(Math.max(0, Number(e.target.value)))}
            className={field}
          />
        </div>
        <div>
          <label className={labelCls}>Walking pace (steps/min)</label>
          <input
            type="number"
            inputMode="numeric"
            min={30}
            max={300}
            step={5}
            value={walkingPace}
            onChange={(e) => setWalkingPace(Math.min(300, Math.max(30, Number(e.target.value))))}
            className={field}
          />
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Typical 80–130</p>
        </div>
      </div>

      <button
        onClick={startPlan}
        className="mt-5 w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 active:scale-[0.99] transition"
      >
        Start plan
      </button>
    </div>
  );
};

SetupForm.propTypes = {
  targetSteps: PropTypes.number.isRequired,
  setTargetSteps: PropTypes.func.isRequired,
  targetTime: PropTypes.string.isRequired,
  setTargetTime: PropTypes.func.isRequired,
  walkingPace: PropTypes.number.isRequired,
  setWalkingPace: PropTypes.func.isRequired,
  currentSteps: PropTypes.number.isRequired,
  setCurrentSteps: PropTypes.func.isRequired,
  startPlan: PropTypes.func.isRequired,
};

export default SetupForm;
