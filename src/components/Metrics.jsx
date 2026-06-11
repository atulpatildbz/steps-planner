import PropTypes from "prop-types";

const Row = ({ label, value }) => (
  <div className="flex justify-between items-baseline px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-700/40">
    <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
    <span className="text-lg font-bold text-gray-800 dark:text-white">{value}</span>
  </div>
);
Row.propTypes = { label: PropTypes.string.isRequired, value: PropTypes.node.isRequired };

/**
 * Secondary stats — the catch-up math, for reference.
 */
const Metrics = ({ derived }) => {
  return (
    <div className="space-y-2">
      <Row label="Steps left" value={derived.stepsLeft.toLocaleString()} />
      <Row label="Time left" value={`${derived.hoursLeft.toFixed(1)} h`} />
      <Row label="Catch-up pace" value={`${derived.catchupPace.toLocaleString()}/hr`} />
      <Row label="Walking per hour" value={`${Math.round(derived.walkMinPerHour)} min`} />
      <Row label="Where you should be" value={derived.idealNow.toLocaleString()} />
    </div>
  );
};

Metrics.propTypes = { derived: PropTypes.object.isRequired };

export default Metrics;
