import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { timeFormat } from 'd3-time-format';

const StepPlanner = () => {
  const [targetSteps, setTargetSteps] = useState(8000);
  const [targetTime, setTargetTime] = useState('18:00');
  const [walkingPace, setWalkingPace] = useState(110);
  const [currentSteps, setCurrentSteps] = useState(0);
  const [historicalData, setHistoricalData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [metrics, setMetrics] = useState({ stepsPerHour: 0, restWalkRatio: '0.00', minutesWalkPerHour: 0 });
  const [isDarkMode, setIsDarkMode] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [checkpointInterval, setCheckpointInterval] = useState(60); // minutes (60 = hourly, 30 = half-hourly)

  useEffect(() => {
    const savedData = localStorage.getItem('stepData');
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      setHistoricalData(parsedData);
      setCurrentSteps(parsedData[parsedData.length - 1].steps);
    }
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => setIsDarkMode(e.matches);

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const saveCurrentSteps = () => {
    const now = new Date();
    const newDataPoint = {
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      steps: currentSteps
    };
    const updatedData = [...historicalData, newDataPoint];
    setHistoricalData(updatedData);
    localStorage.setItem('stepData', JSON.stringify(updatedData));
  };

  const calculatePlan = () => {
    const now = new Date();
    const target = new Date(now.toDateString() + ' ' + targetTime);
    const timeLeft = (target - now) / 3600000; // hours left

    const stepsLeft = targetSteps - currentSteps;
    const stepsPerHour = Math.ceil(stepsLeft / timeLeft);
    
    let newPlan = [];
    let accumulatedSteps = currentSteps;

    // Add current steps and time as the first point in the plan
    newPlan.push({
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
      accumulatedSteps = Math.min(targetSteps, currentSteps + Math.ceil(hoursPassed * stepsPerHour));
      
      newPlan.push({
        time: checkpointTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        steps: accumulatedSteps,
      });
      
      // Move to next checkpoint
      checkpointTime = new Date(checkpointTime.getTime() + checkpointInterval * 60000);
    }

    // Add target time as the final checkpoint if it's not already included
    if (newPlan[newPlan.length - 1].time !== target.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })) {
      newPlan.push({
        time: target.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        steps: targetSteps,
      });
    }

    const combinedData = [
      ...historicalData.map(point => ({
        ...point,
        time: new Date(now.toDateString() + ' ' + point.time)
      })),
      ...newPlan.map(point => ({
        ...point,
        time: new Date(now.toDateString() + ' ' + point.time)
      }))
    ];

    // Remove duplicates based on time
    const uniqueData = Array.from(new Map(combinedData.map(item => [item.time.getTime(), item])).values());

    // Sort the combined data by time
    uniqueData.sort((a, b) => a.time - b.time);

    // Ensure all times are on the same day
    const adjustTime = (time) => {
      if (time < uniqueData[0].time) {
        time.setDate(time.getDate() + 1);
      }
      return time;
    };

    setChartData(uniqueData.map(point => ({
      time: new Date(adjustTime(point.time)).getTime(), // Convert to timestamp
      steps: point.steps
    })));

    // Calculate rest:walk ratio
    const totalMinutes = timeLeft * 60;
    const walkingMinutes = stepsLeft / walkingPace;
    const restMinutes = totalMinutes - walkingMinutes;
    const restWalkRatio = (restMinutes / walkingMinutes).toFixed(2);
    const minutesWalkPerHour = (walkingMinutes / timeLeft).toFixed(2);

    setMetrics({
      stepsPerHour,
      restWalkRatio,
      minutesWalkPerHour
    });
  };

  // Get the interval name based on the minutes
  const getIntervalName = (minutes) => {
    switch (minutes) {
      case 15: return "15 minutes";
      case 30: return "30 minutes";
      case 60: return "1 hour";
      case 120: return "2 hours";
      default: return `${minutes} minutes`;
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto dark:bg-gray-900 dark:text-white">
      <h1 className="text-2xl font-bold mb-4">Step Planner</h1>
      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        className="mb-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:ring-opacity-50"
      >
        Toggle Dark Mode
      </button>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Target Steps</label>
          <input
            type="number"
            value={targetSteps}
            onChange={(e) => setTargetSteps(Number(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Target Time</label>
          <input
            type="time"
            value={targetTime}
            onChange={(e) => setTargetTime(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Walking Pace (steps/min)</label>
          <input
            type="number"
            value={walkingPace}
            onChange={(e) => setWalkingPace(Number(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Current Steps</label>
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Checkpoint Interval</label>
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
      
      {chartData.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Your Step Plan</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="time" 
                type="number"
                scale="time"
                domain={['auto', 'auto']}
                tickFormatter={(timeStr) => timeFormat("%H:%M")(new Date(timeStr))}
                className="dark:text-gray-300"
              />
              <YAxis 
                domain={[0, 'dataMax']}
                tickFormatter={(value) => Math.round(value)}
                className="dark:text-gray-300"
              />
              <Tooltip labelFormatter={(timeStr) => timeFormat("%H:%M")(new Date(timeStr))} contentStyle={{backgroundColor: 'var(--bg-color)', color: 'var(--text-color)'}} itemStyle={{color: 'var(--text-color)'}} />
              <Legend />
              <Line type="monotone" dataKey="steps" stroke="#8884d8" dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">{getIntervalName(checkpointInterval)} Checkpoints</h3>
            <ul className="list-disc pl-5">
              {chartData.map((point, index) => {
                const isPast = new Date(point.time) < new Date();
                return (
                  <li key={index} className={`mb-1 ${isPast ? 'text-gray-400' : ''}`}>
                    {new Date(point.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}: {point.steps} steps
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Additional Metrics</h3>
            <p>Steps needed per hour: {metrics.stepsPerHour}</p>
            <p>Rest to Walk ratio: {metrics.restWalkRatio}</p>
            <p>Minutes walked per hour: {metrics.minutesWalkPerHour}</p>
          </div>
        </div>
      )}
 </div>   
  );
};

export default StepPlanner;
