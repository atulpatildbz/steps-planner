import PropTypes from "prop-types";
import { fmtK, fmtSignedK } from "../lib/format";

const Cell = ({ label, value, accent }) => (
  <div className="flex flex-col items-center justify-center py-2.5 px-1">
    <span className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</span>
    <span className={`text-sm font-bold tabular-nums ${accent || "text-slate-800 dark:text-slate-100"}`}>{value}</span>
  </div>
);
Cell.propTypes = { label: PropTypes.string.isRequired, value: PropTypes.string.isRequired, accent: PropTypes.string };

/**
 * Always-on compact reference stats, divided by hairlines.
 */
const StatStrip = ({ derived }) => {
  const ahead = derived.diff >= 0;
  return (
    <div className="grid grid-cols-4 divide-x divide-slate-100 dark:divide-slate-700/60">
      <Cell label="Left" value={fmtK(derived.stepsLeft)} />
      <Cell label="Pace/hr" value={`${fmtK(derived.catchupPace)}`} />
      <Cell label="Walk/hr" value={`${Math.round(derived.walkMinPerHour)}m`} />
      <Cell
        label="vs plan"
        value={fmtSignedK(derived.diff)}
        accent={ahead ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}
      />
    </div>
  );
};

StatStrip.propTypes = { derived: PropTypes.object.isRequired };

export default StatStrip;
