import { useState, useEffect } from "react";

/**
 * Custom hook for managing step planning logic
 * @returns {Object} Step planning state and functions
 */
const useStepPlanner = () => {
  const [targetSteps, setTargetSteps] = useState(8000);
  const [targetTime, setTargetTime] = useState("18:00");
  const [walkingPace, setWalkingPace] = useState(110);
  const [currentSteps, setCurrentSteps] = useState(0);
  const [historicalData, setHistoricalData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [checkpointInterval, setCheckpointInterval] = useState(60);
  const [metrics, setMetrics] = useState({
    stepsPerHour: 0,
    restWalkRatio: "0.00",
    minutesWalkPerHour: 0,
  });

  // Load saved data on component mount
  useEffect(() => {
    const savedData = localStorage.getItem("stepData");
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      setHistoricalData(parsedData);
      setCurrentSteps(parsedData[parsedData.length - 1].steps);
    }
  }, []);

  // Save current steps to local storage
  const saveCurrentSteps = () => {
    const now = new Date();
    const newDataPoint = {
      time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      steps: currentSteps,
    };
    const updatedData = [...historicalData, newDataPoint];
    setHistoricalData(updatedData);
    localStorage.setItem("stepData", JSON.stringify(updatedData));
  };

  // Calculate the step plan
  const calculatePlan = () => {
    const now = new Date();
    const target = new Date(now.toDateString() + " " + targetTime);
    const timeLeft = (target - now) / 3600000; // hours left

    const stepsLeft = targetSteps - currentSteps;
    const stepsPerHour = Math.ceil(stepsLeft / timeLeft);

    let newPlan = [];
    let accumulatedSteps = currentSteps;

    // Add current steps and time as the first point in the plan
    newPlan.push({
      time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      steps: currentSteps,
    });

    // Find the next even checkpoint time based on the interval
    const roundToNextCheckpoint = (date) => {
      const minutes = date.getMinutes();
      const remainder = minutes % checkpointInterval;

      if (remainder === 0) {
        // If we're exactly on a checkpoint, move to the next one
        return new Date(date.getTime() + checkpointInterval * 60000);
      }

      // Round up to the next checkpoint time
      const minutesToAdd = checkpointInterval - remainder;
      const nextTime = new Date(date.getTime() + minutesToAdd * 60000);
      // Set seconds to 0 for even checkpoints
      nextTime.setSeconds(0);
      return nextTime;
    };

    // Generate checkpoints at even intervals
    let checkpointTime = roundToNextCheckpoint(now);

    while (checkpointTime <= target) {
      // Calculate how much time has passed since now (in hours)
      const hoursPassed = (checkpointTime - now) / 3600000;
      // Calculate expected steps based on hourly rate
      accumulatedSteps = Math.min(
        targetSteps,
        currentSteps + Math.ceil(hoursPassed * stepsPerHour)
      );

      newPlan.push({
        time: checkpointTime.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        steps: accumulatedSteps,
      });

      // Move to next checkpoint
      checkpointTime = new Date(
        checkpointTime.getTime() + checkpointInterval * 60000
      );
    }

    // Add target time as the final checkpoint if it's not already included
    if (
      newPlan[newPlan.length - 1].time !==
      target.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    ) {
      newPlan.push({
        time: target.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        steps: targetSteps,
      });
    }

    const combinedData = [
      ...historicalData.map((point) => ({
        ...point,
        time: new Date(now.toDateString() + " " + point.time),
      })),
      ...newPlan.map((point) => ({
        ...point,
        time: new Date(now.toDateString() + " " + point.time),
      })),
    ];

    // Remove duplicates based on time
    const uniqueData = Array.from(
      new Map(combinedData.map((item) => [item.time.getTime(), item])).values()
    );

    // Sort the combined data by time
    uniqueData.sort((a, b) => a.time - b.time);

    // Ensure all times are on the same day
    const adjustTime = (time) => {
      if (time < uniqueData[0].time) {
        time.setDate(time.getDate() + 1);
      }
      return time;
    };

    setChartData(
      uniqueData.map((point) => ({
        time: new Date(adjustTime(point.time)).getTime(), // Convert to timestamp
        steps: point.steps,
      }))
    );

    // Calculate rest:walk ratio
    const totalMinutes = timeLeft * 60;
    const walkingMinutes = stepsLeft / walkingPace;
    const restMinutes = totalMinutes - walkingMinutes;
    const restWalkRatio = (restMinutes / walkingMinutes).toFixed(2);
    const minutesWalkPerHour = (walkingMinutes / timeLeft).toFixed(2);

    setMetrics({
      stepsPerHour,
      restWalkRatio,
      minutesWalkPerHour,
    });
  };

  // Get the interval name based on the minutes
  const getIntervalName = (minutes) => {
    switch (minutes) {
      case 15:
        return "15 minutes";
      case 30:
        return "30 minutes";
      case 60:
        return "1 hour";
      case 120:
        return "2 hours";
      default:
        return `${minutes} minutes`;
    }
  };

  return {
    targetSteps,
    setTargetSteps,
    targetTime,
    setTargetTime,
    walkingPace,
    setWalkingPace,
    currentSteps,
    setCurrentSteps,
    historicalData,
    chartData,
    checkpointInterval,
    setCheckpointInterval,
    metrics,
    saveCurrentSteps,
    calculatePlan,
    getIntervalName,
  };
};

export default useStepPlanner;
