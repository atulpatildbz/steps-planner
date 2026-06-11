import PropTypes from "prop-types";
import { timeFormat } from "d3-time-format";

const fmt = timeFormat("%I:%M %p");

/**
 * Reference list of the frozen morning plan: where you should be at each checkpoint.
 */
const Checkpoints = ({ checkpoints, now }) => {
  return (
    <ul className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
      {checkpoints.map((cp, i) => {
        const isPast = cp.time < now;
        const isNext = !isPast && (i === 0 || checkpoints[i - 1].time < now);
        return (
          <li
            key={cp.time}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
              isPast
                ? "text-gray-400 dark:text-gray-600"
                : isNext
                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-semibold"
                : "text-gray-700 dark:text-gray-200"
            }`}
          >
            <span className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  isPast ? "bg-gray-300 dark:bg-gray-600" : isNext ? "bg-blue-500 animate-pulse" : "bg-green-500"
                }`}
              />
              {fmt(new Date(cp.time))}
            </span>
            <span>{cp.steps.toLocaleString()}</span>
          </li>
        );
      })}
    </ul>
  );
};

Checkpoints.propTypes = {
  checkpoints: PropTypes.arrayOf(
    PropTypes.shape({ time: PropTypes.number.isRequired, steps: PropTypes.number.isRequired })
  ).isRequired,
  now: PropTypes.number.isRequired,
};

export default Checkpoints;
