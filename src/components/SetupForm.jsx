import PropTypes from "prop-types";

const field =
  "block w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900/50 outline-none transition tabular-nums dark:bg-gray-900 dark:border-gray-700 dark:text-white";
const labelCls = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1";

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
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 sm:p-6">
      <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-0.5">Plan today&apos;s goal</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Set your target, then tap Start to lock in the plan.</p>

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
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-transparent hover:bg-gray-200 dark:hover:bg-gray-600"
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
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Typical 80–130</p>
        </div>
      </div>

      <button
        onClick={startPlan}
        className="mt-5 w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 active:scale-[0.99] transition"
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
