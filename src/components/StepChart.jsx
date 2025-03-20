import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { timeFormat } from "d3-time-format";
import PropTypes from "prop-types";

/**
 * Chart component for displaying step progression
 */
const StepChart = ({ chartData }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="time"
          type="number"
          scale="time"
          domain={["auto", "auto"]}
          tickFormatter={(timeStr) => timeFormat("%H:%M")(new Date(timeStr))}
          className="dark:text-gray-300"
        />
        <YAxis
          domain={[0, "dataMax"]}
          tickFormatter={(value) => Math.round(value)}
          className="dark:text-gray-300"
        />
        <Tooltip
          labelFormatter={(timeStr) => timeFormat("%H:%M")(new Date(timeStr))}
          contentStyle={{
            backgroundColor: "var(--bg-color)",
            color: "var(--text-color)",
          }}
          itemStyle={{ color: "var(--text-color)" }}
        />
        <Legend />
        <Line type="monotone" dataKey="steps" stroke="#8884d8" dot={false} />
      </LineChart>
    </ResponsiveContainer>
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
