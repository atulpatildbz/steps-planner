import useDarkMode from "../hooks/useDarkMode";
import useStepPlanner from "../hooks/useStepPlanner";
import SetupForm from "./SetupForm";
import Hero from "./Hero";
import StatStrip from "./StatStrip";
import StepChart from "./StepChart";
import CheckpointStrip from "./CheckpointStrip";
import { timeFormat } from "d3-time-format";

const fmtClock = timeFormat("%-I:%M %p");

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
    derived,
  } = useStepPlanner();

  const iconBtn =
    "h-8 w-8 inline-flex items-center justify-center text-sm rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition";

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      <div className="max-w-2xl mx-auto px-3 py-4 sm:px-4 sm:py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-baseline gap-2 min-w-0">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white shrink-0">Step Planner</h1>
            {isActive && derived && (
              <span className="text-sm text-gray-400 dark:text-gray-500 truncate tabular-nums">
                {plan.targetSteps.toLocaleString()} by {fmtClock(new Date(derived.targetTimeMs))}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className={iconBtn} title="Toggle theme">
              {isDarkMode ? "☀" : "☾"}
            </button>
            {isActive && (
              <button onClick={rePlan} className={iconBtn} title="Re-plan">
                ↻
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden divide-y divide-gray-100 dark:divide-gray-700/60">
            <Hero
              derived={derived}
              currentSteps={currentSteps}
              logSteps={logSteps}
              setTargetTime={setTargetTime}
              setTargetSteps={setTargetSteps}
            />

            <StatStrip derived={derived} />

            <div className="px-2 pt-2">
              <StepChart chartData={derived.chartData} targetSteps={derived.goal} now={now} compact />
            </div>

            {/* Checkpoint timeline + interval control */}
            <div className="flex items-stretch">
              <div className="flex-1 min-w-0">
                <CheckpointStrip checkpoints={derived.checkpoints} now={now} />
              </div>
              <select
                value={checkpointInterval}
                onChange={(e) => setCheckpointInterval(Number(e.target.value))}
                aria-label="Checkpoint interval"
                className="shrink-0 self-stretch border-l border-gray-100 dark:border-gray-700/60 bg-transparent text-[11px] text-gray-400 dark:text-gray-500 px-2 outline-none cursor-pointer"
              >
                <option value="15">15m</option>
                <option value="30">30m</option>
                <option value="60">1h</option>
                <option value="120">2h</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StepPlanner;
