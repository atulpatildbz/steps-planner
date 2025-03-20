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
    saveCurrentSteps,
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Step Planner
          </h1>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:ring-opacity-50 transition-colors duration-200 shadow-md"
          >
            {isDarkMode ? "Light Mode" : "Dark Mode"}
          </button>
        </div>

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
            />
          </div>

          {/* Results section */}
          {chartData.length > 0 && (
            <div className={`${isDesktop ? 'lg:col-span-7' : ''} bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-all duration-200`}>
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Your Step Plan</h2>
              
              <div className="mb-6">
                <StepChart chartData={chartData} />
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
