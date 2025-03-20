import InputForm from "./InputForm";
import StepChart from "./StepChart";
import Checkpoints from "./Checkpoints";
import Metrics from "./Metrics";
import useDarkMode from "../hooks/useDarkMode";
import useStepPlanner from "../hooks/useStepPlanner";

/**
 * Main StepPlanner component that orchestrates the application
 */
const StepPlanner = () => {
  const [isDarkMode, setIsDarkMode] = useDarkMode();
  const {
    targetSteps,
    setTargetSteps,
    targetTime,
    setTargetTime,
    walkingPace,
    setWalkingPace,
    currentSteps,
    setCurrentSteps,
    chartData,
    checkpointInterval,
    setCheckpointInterval,
    metrics,
    saveCurrentSteps,
    calculatePlan,
    getIntervalName,
  } = useStepPlanner();

  return (
    <div className="p-4 max-w-4xl mx-auto dark:bg-gray-900 dark:text-white">
      <h1 className="text-2xl font-bold mb-4">Step Planner</h1>
      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        className="mb-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:ring-opacity-50"
      >
        Toggle Dark Mode
      </button>

      <InputForm
        targetSteps={targetSteps}
        setTargetSteps={setTargetSteps}
        targetTime={targetTime}
        setTargetTime={setTargetTime}
        walkingPace={walkingPace}
        setWalkingPace={setWalkingPace}
        currentSteps={currentSteps}
        setCurrentSteps={setCurrentSteps}
        checkpointInterval={checkpointInterval}
        setCheckpointInterval={setCheckpointInterval}
        saveCurrentSteps={saveCurrentSteps}
        calculatePlan={calculatePlan}
      />

      {chartData.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Your Step Plan</h2>
          <StepChart chartData={chartData} />
          <Checkpoints
            chartData={chartData}
            checkpointInterval={checkpointInterval}
            getIntervalName={getIntervalName}
          />
          <Metrics metrics={metrics} />
        </div>
      )}
    </div>
  );
};

export default StepPlanner;
