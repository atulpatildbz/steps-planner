import PropTypes from "prop-types";

/**
 * Component for displaying additional metrics
 */
const Metrics = ({ metrics }) => {
  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2">Additional Metrics</h3>
      <p>Steps needed per hour: {metrics.stepsPerHour}</p>
      <p>Rest to Walk ratio: {metrics.restWalkRatio}</p>
      <p>Minutes walked per hour: {metrics.minutesWalkPerHour}</p>
    </div>
  );
};

Metrics.propTypes = {
  metrics: PropTypes.shape({
    stepsPerHour: PropTypes.number.isRequired,
    restWalkRatio: PropTypes.string.isRequired,
    minutesWalkPerHour: PropTypes.string.isRequired,
  }).isRequired,
};

export default Metrics;
