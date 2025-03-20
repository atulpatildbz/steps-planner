import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { timeFormat } from "d3-time-format";
import PropTypes from "prop-types";

// Custom tooltip component with proper prop types
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {timeFormat("%I:%M %p")(new Date(label))}
        </p>
        <p className="font-bold text-blue-600 dark:text-blue-400 text-lg">
          {payload[0].value.toLocaleString()} steps
        </p>
      </div>
    );
  }
  return null;
};

// PropTypes for CustomTooltip
CustomTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.number,
    })
  ),
  label: PropTypes.number,
};

/**
 * Chart component for displaying step progression
 */
const StepChart = ({ chartData }) => {
  // Get current time for reference line
  const now = new Date().getTime();
  
  return (
    <div className="bg-white dark:bg-gray-800 p-1 rounded-lg">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eaeaea" strokeOpacity={0.5} />
          <XAxis
            dataKey="time"
            type="number"
            scale="time"
            domain={["auto", "auto"]}
            tickFormatter={(timeStr) => timeFormat("%H:%M")(new Date(timeStr))}
            stroke="#888"
            fontSize={12}
            tickMargin={8}
            className="dark:text-gray-300"
          />
          <YAxis
            domain={[0, "dataMax"]}
            tickFormatter={(value) => value.toLocaleString()}
            stroke="#888"
            fontSize={12}
            tickMargin={8}
            className="dark:text-gray-300"
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: 10 }}
            formatter={(value) => <span className="text-gray-700 dark:text-gray-300 font-medium">{value}</span>}
          />
          
          {/* Current time reference line */}
          <ReferenceLine 
            x={now} 
            stroke="#FF5722" 
            strokeWidth={2} 
            strokeDasharray="3 3" 
            label={{ 
              value: "Now", 
              position: "insideTopRight", 
              fill: "#FF5722",
              fontSize: 12
            }} 
          />
          
          <Line 
            type="monotone" 
            dataKey="steps" 
            name="Step Count"
            stroke="#3b82f6" 
            strokeWidth={3} 
            dot={{ fill: "#3b82f6", r: 4 }}
            activeDot={{ 
              fill: "#3b82f6", 
              stroke: "#fff", 
              r: 6, 
              strokeWidth: 2 
            }}
            animationDuration={1000}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

StepChart.propTypes = {
  chartData: PropTypes.arrayOf(
    PropTypes.shape({
      time: PropTypes.number.isRequired,
      steps: PropTypes.number.isRequired,
    })
  ).isRequired,
};

export default StepChart;
