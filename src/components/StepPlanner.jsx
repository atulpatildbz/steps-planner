import useDarkMode from "../hooks/useDarkMode";
import useStepPlanner from "../hooks/useStepPlanner";
import SetupForm from "./SetupForm";
import Hero from "./Hero";
import StepChart from "./StepChart";
import Checkpoints from "./Checkpoints";
import Metrics from "./Metrics";
import Section from "./Section";

const StepPlanner = () => {
  const [isDarkMode, setIsDarkMode] = useDarkMode();
  const {
    isActive,
    plan,
    now,
    targetSteps,
    setTargetSteps,
    targetTime,
    setTargetTime,
    walkingPace,
    setWalkingPace,
    checkpointInterval,
    setCheckpointInterval,
    currentSteps,
    setCurrentSteps,
    startPlan,
    rePlan,
    logSteps,
    resetToday,
    derived,
  } = useStepPlanner();

  const fmtTarget = plan
    ? `${plan.targetSteps.toLocaleString()} by ${new Date(derived?.targetTimeMs).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })}`
    : "";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-2xl mx-auto px-4 py-5 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Step Planner</h1>
            {isActive && <p className="text-sm text-gray-500 dark:text-gray-400">{fmtTarget}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="px-3 py-2 text-sm rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              title="Toggle theme"
            >
              {isDarkMode ? "☀︎" : "☾"}
            </button>
            {isActive && (
              <button
                onClick={rePlan}
                className="px-3 py-2 text-sm rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Re-plan
              </button>
            )}
          </div>
        </div>

        {!isActive || !derived ? (
          <SetupForm
            targetSteps={targetSteps}
            setTargetSteps={setTargetSteps}
            targetTime={targetTime}
            setTargetTime={setTargetTime}
            walkingPace={walkingPace}
            setWalkingPace={setWalkingPace}
            currentSteps={currentSteps}
            setCurrentSteps={setCurrentSteps}
            startPlan={startPlan}
          />
        ) : (
          <div className="space-y-4">
            <Hero
              derived={derived}
              currentSteps={currentSteps}
              logSteps={logSteps}
              setTargetTime={setTargetTime}
              setTargetSteps={setTargetSteps}
            />

            <Section title="Chart" defaultOpen={false}>
              <StepChart chartData={derived.chartData} targetSteps={derived.goal} now={now} />
            </Section>

            <Section
              title="Checkpoints"
              right={
                <select
                  value={checkpointInterval}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setCheckpointInterval(Number(e.target.value))}
                  className="bg-transparent text-gray-500 dark:text-gray-400 text-sm outline-none cursor-pointer"
                >
                  <option value="15">every 15m</option>
                  <option value="30">every 30m</option>
                  <option value="60">every 1h</option>
                  <option value="120">every 2h</option>
                </select>
              }
            >
              <Checkpoints checkpoints={derived.checkpoints} now={now} />
            </Section>

            <Section title="More stats">
              <Metrics derived={derived} />
            </Section>

            <div className="pt-2 text-center">
              <button
                onClick={resetToday}
                className="text-sm text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 underline bg-transparent"
              >
                Reset today
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StepPlanner;
