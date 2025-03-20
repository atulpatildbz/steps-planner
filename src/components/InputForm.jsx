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
}) => {
  return (
    <>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Target Steps
          </label>
          <input
            type="number"
            value={targetSteps}
            onChange={(e) => setTargetSteps(Number(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Target Time
          </label>
          <input
            type="time"
            value={targetTime}
            onChange={(e) => setTargetTime(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Walking Pace (steps/min)
          </label>
          <input
            type="number"
            value={walkingPace}
            onChange={(e) => setWalkingPace(Number(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Current Steps
          </label>
          <div className="flex items-center">
            <input
              type="number"
              value={currentSteps}
              onChange={(e) => setCurrentSteps(Number(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
            />
            <button
              onClick={saveCurrentSteps}
              className="ml-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
            >
              Save
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Checkpoint Interval
          </label>
          <select
            value={checkpointInterval}
            onChange={(e) => setCheckpointInterval(Number(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
          >
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="60">1 hour</option>
            <option value="120">2 hours</option>
          </select>
        </div>
      </div>
      <button
        onClick={calculatePlan}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
      >
        Calculate Plan
      </button>
    </>
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
};

export default InputForm;
