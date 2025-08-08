import PropTypes from "prop-types";

/**
 * Form for inputting step planning parameters
 */
const InputForm = ({
  targetSteps,
  setTargetSteps,
  targetTime,
  setTargetTime,
  walkingPace,
  setWalkingPace,
  currentSteps,
  setCurrentSteps,
  checkpointInterval,
  setCheckpointInterval,
  saveCurrentSteps,
  calculatePlan,
  autoPlan,
}) => {
  const mobilePresets = [
    { label: "8k@6p", steps: 8000, time: "18:00" },
    { label: "10k@8p", steps: 10000, time: "20:00" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex sm:hidden gap-2 -mt-2">
        {mobilePresets.map((p) => (
          <button
            key={p.label}
            onClick={() => { setTargetSteps(p.steps); setTargetTime(p.time); }}
            className="px-2 py-1 text-xs rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Target Steps
          </label>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={100}
            value={targetSteps}
            onChange={(e) => setTargetSteps(Math.max(0, Number(e.target.value)))}
            className="block w-full px-4 py-3 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition-all duration-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Target Time
          </label>
          <input
            type="time"
            value={targetTime}
            onChange={(e) => setTargetTime(e.target.value)}
            className="block w-full px-4 py-3 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition-all duration-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Walking Pace (steps/min)
          </label>
          <input
            type="number"
            inputMode="numeric"
            min={30}
            max={300}
            step={5}
            value={walkingPace}
            onChange={(e) => setWalkingPace(Math.min(300, Math.max(30, Number(e.target.value))))}
            className="block w-full px-4 py-3 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition-all duration-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">Typical range 80–130 steps/min</p>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Current Steps
          </label>
          <div className="flex">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={100}
              value={currentSteps}
              onChange={(e) => setCurrentSteps(Math.max(0, Number(e.target.value)))}
              className="block flex-1 w-full px-4 py-3 rounded-l-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition-all duration-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
            />
            <button
              onClick={saveCurrentSteps}
              className="px-4 py-3 bg-green-500 text-white font-medium rounded-r-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-colors duration-200"
            >
              Save
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Checkpoint Interval
          </label>
          <select
            value={checkpointInterval}
            onChange={(e) => setCheckpointInterval(Number(e.target.value))}
            className="block w-full px-4 py-3 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition-all duration-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
          >
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="60">1 hour</option>
            <option value="120">2 hours</option>
          </select>
        </div>
      </div>
      
      {!autoPlan && (
        <div className="pt-2">
          <button
            onClick={calculatePlan}
            className="w-full py-3 px-6 bg-blue-600 text-white font-medium rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200 transform hover:scale-[1.02]"
          >
            Calculate Plan
          </button>
        </div>
      )}
    </div>
  );
};

// Props validation
InputForm.propTypes = {
  targetSteps: PropTypes.number.isRequired,
  setTargetSteps: PropTypes.func.isRequired,
  targetTime: PropTypes.string.isRequired,
  setTargetTime: PropTypes.func.isRequired,
  walkingPace: PropTypes.number.isRequired,
  setWalkingPace: PropTypes.func.isRequired,
  currentSteps: PropTypes.number.isRequired,
  setCurrentSteps: PropTypes.func.isRequired,
  checkpointInterval: PropTypes.number.isRequired,
  setCheckpointInterval: PropTypes.func.isRequired,
  saveCurrentSteps: PropTypes.func.isRequired,
  calculatePlan: PropTypes.func.isRequired,
  autoPlan: PropTypes.bool.isRequired,
};

export default InputForm;
