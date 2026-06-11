import PropTypes from "prop-types";
import { timeFormat } from "d3-time-format";
import { fmtK } from "../lib/format";

const fmt = timeFormat("%-I%p"); // 1PM -> we lowercase below

/**
 * One-line, horizontally-scrollable timeline of the frozen plan.
 * Past = dim, next-up = accent, future = normal.
 */
const CheckpointStrip = ({ checkpoints, now }) => {
  return (
    <div className="flex gap-0 overflow-x-auto no-scrollbar text-xs py-1">
      {checkpoints.map((cp, i) => {
        const isPast = cp.time < now;
        const isNext = !isPast && (i === 0 || checkpoints[i - 1].time < now);
        return (
          <div
            key={cp.time}
            className={`flex flex-col items-center shrink-0 px-2.5 py-1 border-r border-slate-100 dark:border-slate-700/60 last:border-r-0 ${
              isPast
                ? "text-slate-300 dark:text-slate-600"
                : isNext
                ? "text-indigo-600 dark:text-indigo-400 font-semibold"
                : "text-slate-600 dark:text-slate-300"
            }`}
          >
            <span className="tabular-nums">{fmt(new Date(cp.time)).toLowerCase()}</span>
            <span className="tabular-nums font-medium">{fmtK(cp.steps)}</span>
          </div>
        );
      })}
    </div>
  );
};

CheckpointStrip.propTypes = {
  checkpoints: PropTypes.arrayOf(PropTypes.shape({ time: PropTypes.number.isRequired, steps: PropTypes.number.isRequired })).isRequired,
  now: PropTypes.number.isRequired,
};

export default CheckpointStrip;
