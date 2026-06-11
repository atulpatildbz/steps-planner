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

const fmtTime = timeFormat("%I:%M %p");

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg text-sm">
      <p className="text-gray-500 dark:text-gray-400 mb-1">{fmtTime(new Date(label))}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="font-semibold" style={{ color: p.color }}>
          {p.name}: {Math.round(p.value).toLocaleString()}
        </p>
      ))}
    </div>
  );
};

CustomTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  label: PropTypes.number,
};

/**
 * Chart: frozen ideal line (plan) + live catch-up line + your actual logged dots.
 */
const StepChart = ({ chartData, targetSteps, now, compact = false }) => {
  return (
    <div className="rounded-lg">
      <ResponsiveContainer width="100%" height={compact ? 132 : 280}>
        <LineChart data={chartData} margin={{ top: 8, right: 10, left: compact ? 2 : 4, bottom: 0 }}>
          {!compact && <CartesianGrid strokeDasharray="3 3" stroke="#9ca3af" strokeOpacity={0.2} />}
          <XAxis
            dataKey="time"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(t) => timeFormat("%-I%p")(new Date(t)).toLowerCase()}
            stroke="#9ca3af"
            fontSize={10}
            tickMargin={6}
            tickLine={false}
            axisLine={false}
            minTickGap={28}
          />
          <YAxis
            domain={[0, "dataMax"]}
            tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)}
            stroke="#9ca3af"
            fontSize={10}
            width={compact ? 0 : 40}
            tick={!compact}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          {!compact && (
            <Legend
              wrapperStyle={{ paddingTop: 8 }}
              formatter={(value) => <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">{value}</span>}
            />
          )}

          <ReferenceLine x={now} stroke="#f97316" strokeWidth={1.5} strokeDasharray="3 3" />
          <ReferenceLine y={targetSteps} stroke="#10b981" strokeDasharray="4 4" strokeOpacity={0.5} />

          {/* Frozen morning plan */}
          <Line type="monotone" dataKey="ideal" name="Plan" stroke="#9ca3af" strokeWidth={1.5} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
          {/* Live catch-up to still finish */}
          <Line type="monotone" dataKey="catchup" name="Catch-up" stroke="#3b82f6" strokeWidth={2} dot={false} connectNulls isAnimationActive={false} />
          {/* Your actual logged counts */}
          <Line
            type="monotone"
            dataKey="actual"
            name="You"
            stroke="#22c55e"
            strokeWidth={2.5}
            dot={{ fill: "#22c55e", r: compact ? 2.5 : 4 }}
            activeDot={{ fill: "#22c55e", stroke: "#fff", r: 6, strokeWidth: 2 }}
            connectNulls
            isAnimationActive={false}
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
      ideal: PropTypes.number,
      catchup: PropTypes.number,
      actual: PropTypes.number,
    })
  ).isRequired,
  targetSteps: PropTypes.number,
  now: PropTypes.number,
  compact: PropTypes.bool,
};

export default StepChart;
