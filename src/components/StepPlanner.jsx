import InputForm from "./InputForm";
import StepChart from "./StepChart";
import Checkpoints from "./Checkpoints";
import Metrics from "./Metrics";
import useDarkMode from "../hooks/useDarkMode";
import useStepPlanner from "../hooks/useStepPlanner";
import { useState, useEffect } from "react";

/**
 * Main StepPlanner component that orchestrates the application
 */
const StepPlanner = () => {
  const [isDarkMode, setIsDarkMode] = useDarkMode();
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
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
    status,
    autoPlan,
    setAutoPlan,
    saveCurrentSteps,
    resetToday,
    calculatePlan,
    getIntervalName,
  } = useStepPlanner();

  // Handle resize events to determine if desktop layout should be used
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const presets = [
    { label: "8k by 6 PM", steps: 8000, time: "18:00" },
    { label: "10k by 8 PM", steps: 10000, time: "20:00" },
    { label: "12k by 9 PM", steps: 12000, time: "21:00" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Step Planner
            </h1>
            <div className="hidden sm:flex items-center gap-2">
              {presets.map((p) => (
                <button
                  key={p.label}
                  onClick={() => { setTargetSteps(p.steps); setTargetTime(p.time); }}
                  className="px-3 py-1.5 text-sm rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="px-3 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:ring-opacity-50 transition-colors duration-200 shadow-md"
            >
              {isDarkMode ? "Light" : "Dark"}
            </button>
            <button
              onClick={() => setAutoPlan(!autoPlan)}
              className={`px-3 py-2 rounded-lg transition-colors duration-200 shadow-md ${autoPlan ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
              title="Auto recalculate plan when inputs change"
            >
              {autoPlan ? 'Auto Update: On' : 'Auto Update: Off'}
            </button>
            <button
              onClick={resetToday}
              className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors duration-200 shadow-md"
              title="Clear today\'s saved checkpoints"
            >
              Reset Today
            </button>
          </div>
        </div>

        {/* Status summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <div className="text-xs text-gray-500 dark:text-gray-400">Steps Left</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{status.stepsLeft.toLocaleString()}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <div className="text-xs text-gray-500 dark:text-gray-400">Progress</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{status.percentComplete.toFixed(0)}%</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <div className="text-xs text-gray-500 dark:text-gray-400">Time Left</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{status.timeLeftHours.toFixed(2)}h</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <div className="text-xs text-gray-500 dark:text-gray-400">Walk Total</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{Math.round(status.walkingMinutesTotal)}m</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <div className="text-xs text-gray-500 dark:text-gray-400">Rest Total</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{Math.round(status.restMinutesTotal)}m</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <div className="text-xs text-gray-500 dark:text-gray-400">This Hour</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{status.minutesToWalkThisHour}m</div>
          </div>
        </div>

        {status.targetPassed && (
          <div className="mb-4 p-3 rounded-md bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200">
            Target time has passed for today. Adjust target time or steps to plan again.
          </div>
        )}

        <div className={`${isDesktop ? 'lg:grid lg:grid-cols-12 lg:gap-8' : ''}`}>
          {/* Input section */}
          <div className={`${isDesktop ? 'lg:col-span-5' : ''} bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 transition-all duration-200`}>
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Plan Settings</h2>
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
              autoPlan={autoPlan}
            />
          </div>

          {/* Results section */}
          {chartData.length > 0 && (
            <div className={`${isDesktop ? 'lg:col-span-7' : ''} bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-all duration-200`}>
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Your Step Plan</h2>
              
              <div className="mb-6">
                <StepChart chartData={chartData} targetSteps={targetSteps} />
              </div>
              
              <div className={`${isDesktop ? 'grid grid-cols-2 gap-6' : ''}`}>
                <Checkpoints
                  chartData={chartData}
                  checkpointInterval={checkpointInterval}
                  getIntervalName={getIntervalName}
                />
                <Metrics metrics={metrics} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StepPlanner;
