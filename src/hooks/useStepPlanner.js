import { useState, useEffect } from "react";

/**
 * Custom hook for managing step planning logic
 * @returns {Object} Step planning state and functions
 */
const useStepPlanner = () => {
  const getFromStorageNumber = (key, fallback) => {
    const raw = localStorage.getItem(key);
    const parsed = raw !== null ? Number(raw) : NaN;
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const getFromStorageString = (key, fallback) => {
    const raw = localStorage.getItem(key);
    return raw !== null ? raw : fallback;
  };

  const getFromStorageBool = (key, fallback) => {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return raw === "true";
  };

  const [targetSteps, setTargetSteps] = useState(() => getFromStorageNumber("targetSteps", 8000));
  const [targetTime, setTargetTime] = useState(() => getFromStorageString("targetTime", "18:00"));
  const [walkingPace, setWalkingPace] = useState(() => getFromStorageNumber("walkingPace", 110));
  const [currentSteps, setCurrentSteps] = useState(() => getFromStorageNumber("currentSteps", 0));
  const [historicalData, setHistoricalData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [checkpointInterval, setCheckpointInterval] = useState(() => getFromStorageNumber("checkpointInterval", 60));
  const [autoPlan, setAutoPlan] = useState(() => getFromStorageBool("autoPlan", true));
  const [status, setStatus] = useState({
    stepsLeft: 0,
    percentComplete: 0,
    timeLeftHours: 0,
    walkingMinutesTotal: 0,
    restMinutesTotal: 0,
    minutesToWalkThisHour: 0,
    targetPassed: false,
  });
  const [metrics, setMetrics] = useState({
    stepsPerHour: 0,
    restWalkRatio: "0.00",
    minutesWalkPerHour: 0,
  });

  // Persist settings
  useEffect(() => {
    localStorage.setItem("targetSteps", String(targetSteps));
  }, [targetSteps]);

  useEffect(() => {
    localStorage.setItem("targetTime", targetTime);
  }, [targetTime]);

  useEffect(() => {
    localStorage.setItem("walkingPace", String(walkingPace));
  }, [walkingPace]);

  useEffect(() => {
    localStorage.setItem("currentSteps", String(currentSteps));
  }, [currentSteps]);

  useEffect(() => {
    localStorage.setItem("checkpointInterval", String(checkpointInterval));
  }, [checkpointInterval]);

  useEffect(() => {
    localStorage.setItem("autoPlan", String(autoPlan));
  }, [autoPlan]);

  // Helper to get today's date in YYYY-MM-DD format
  const getTodayDateString = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  // Filter data to only include today's entries
  const filterTodayData = (data) => {
    const todayString = getTodayDateString();
    return data.filter((item) => item.date === todayString);
  };

  // Load saved data on component mount and clean up old data
  useEffect(() => {
    const savedData = localStorage.getItem("stepData");

    if (savedData) {
      const parsedData = JSON.parse(savedData);

      // Check if data has date field (for backward compatibility)
      const hasDateField = parsedData.length > 0 && "date" in parsedData[0];

      // If data has date field, filter to only today's data
      const todayData = hasDateField ? filterTodayData(parsedData) : parsedData;

      // If we have today's data, use it
      if (todayData.length > 0) {
        setHistoricalData(todayData);
        setCurrentSteps(todayData[todayData.length - 1].steps);
      } else {
        // No today's data, reset
        setHistoricalData([]);
        setCurrentSteps(0);
      }

      // Update localStorage to only keep today's data
      if (hasDateField && todayData.length !== parsedData.length) {
        localStorage.setItem("stepData", JSON.stringify(todayData));
      }
    }
  }, []);

  // Save current steps to local storage (log a checkpoint)
  const saveCurrentSteps = () => {
    const now = new Date();
    const newDataPoint = {
      date: getTodayDateString(),
      time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      steps: currentSteps,
    };

    const updatedData = [...historicalData, newDataPoint];

    // Only keep today's data before saving
    const todayData = filterTodayData(updatedData);

    setHistoricalData(todayData);
    localStorage.setItem("stepData", JSON.stringify(todayData));

    if (autoPlan) {
      // Recalculate after logging
      calculatePlan();
    }
  };

  const resetToday = () => {
    setHistoricalData([]);
    setCurrentSteps(0);
    localStorage.setItem("stepData", JSON.stringify([]));
    setChartData([]);
  };

  // Calculate the step plan
  const calculatePlan = () => {
    const now = new Date();
    const target = new Date(now.toDateString() + " " + targetTime);

    // If target time is earlier than now (today), assume it's for tomorrow
    if (target < now) {
      // Mark as passed for today and compute status accordingly
      const stepsLeft = Math.max(0, targetSteps - currentSteps);
      setMetrics({ stepsPerHour: 0, restWalkRatio: "0.00", minutesWalkPerHour: 0 });
      setStatus({
        stepsLeft,
        percentComplete: Math.min(100, (currentSteps / targetSteps) * 100) || 0,
        timeLeftHours: 0,
        walkingMinutesTotal: 0,
        restMinutesTotal: 0,
        minutesToWalkThisHour: 0,
        targetPassed: true,
      });
      setChartData([]);
      return;
    }

    const timeLeft = (target - now) / 3600000; // hours left

    const stepsLeft = Math.max(0, targetSteps - currentSteps);

    // Guard divide by zero
    if (timeLeft <= 0 || stepsLeft === 0) {
      setMetrics({ stepsPerHour: 0, restWalkRatio: "0.00", minutesWalkPerHour: 0 });
      setStatus({
        stepsLeft,
        percentComplete: Math.min(100, (currentSteps / targetSteps) * 100) || 0,
        timeLeftHours: Math.max(0, timeLeft),
        walkingMinutesTotal: 0,
        restMinutesTotal: 0,
        minutesToWalkThisHour: 0,
        targetPassed: timeLeft <= 0,
      });
      setChartData([]);
      return;
    }

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

    // Calculate rest:walk ratio and related stats
    const totalMinutes = timeLeft * 60;
    const walkingMinutes = stepsLeft / walkingPace;
    const restMinutes = Math.max(0, totalMinutes - walkingMinutes);
    const restWalkRatio = walkingMinutes > 0 ? (restMinutes / walkingMinutes).toFixed(2) : "0.00";
    const minutesWalkPerHour = (walkingMinutes / timeLeft).toFixed(2);

    setMetrics({
      stepsPerHour,
      restWalkRatio,
      minutesWalkPerHour,
    });

    setStatus({
      stepsLeft,
      percentComplete: Math.min(100, (currentSteps / targetSteps) * 100) || 0,
      timeLeftHours: timeLeft,
      walkingMinutesTotal: walkingMinutes,
      restMinutesTotal: restMinutes,
      minutesToWalkThisHour: Math.max(0, Math.round(walkingMinutes / timeLeft)),
      targetPassed: false,
    });
  };

  // Debounced auto-calc
  useEffect(() => {
    if (!autoPlan) return;
    const id = setTimeout(() => {
      calculatePlan();
    }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetSteps, targetTime, walkingPace, currentSteps, checkpointInterval, autoPlan]);

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
    status,
    autoPlan,
    setAutoPlan,
    saveCurrentSteps,
    resetToday,
    calculatePlan,
    getIntervalName,
  };
};

export default useStepPlanner;
