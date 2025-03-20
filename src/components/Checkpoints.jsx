import PropTypes from "prop-types";

/**
 * Component for displaying checkpoints list
 */
const Checkpoints = ({ chartData, checkpointInterval, getIntervalName }) => {
  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2">
        {getIntervalName(checkpointInterval)} Checkpoints
      </h3>
      <ul className="list-disc pl-5">
        {chartData.map((point, index) => {
          const isPast = new Date(point.time) < new Date();
          return (
            <li key={index} className={`mb-1 ${isPast ? "text-gray-400" : ""}`}>
              {new Date(point.time).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
              : {point.steps} steps
            </li>
          );
        })}
      </ul>
    </div>
  );
};

Checkpoints.propTypes = {
  chartData: PropTypes.arrayOf(
    PropTypes.shape({
      time: PropTypes.number.isRequired,
      steps: PropTypes.number.isRequired,
    })
  ).isRequired,
  checkpointInterval: PropTypes.number.isRequired,
  getIntervalName: PropTypes.func.isRequired,
};

export default Checkpoints;
