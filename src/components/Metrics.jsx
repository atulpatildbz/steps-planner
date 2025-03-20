import PropTypes from "prop-types";

/**
 * Component for displaying additional metrics
 */
const Metrics = ({ metrics }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
      <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
        Additional Metrics
      </h3>
      
      <div className="space-y-4">
        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Steps needed per hour
            </span>
            <span className="text-2xl font-bold text-gray-800 dark:text-white">
              {metrics.stepsPerHour.toLocaleString()}
            </span>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Rest to Walk ratio
            </span>
            <span className="text-2xl font-bold text-gray-800 dark:text-white">
              {parseFloat(metrics.restWalkRatio) > 0 
                ? metrics.restWalkRatio 
                : "0.00"}
            </span>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Minutes to walk per hour
            </span>
            <span className="text-2xl font-bold text-gray-800 dark:text-white">
              {metrics.minutesWalkPerHour}
            </span>
          </div>
        </div>
      </div>
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
