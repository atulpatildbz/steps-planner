import PropTypes from "prop-types";

/**
 * Component for displaying checkpoints list
 */
const Checkpoints = ({ chartData, checkpointInterval, getIntervalName }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
      <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
        {getIntervalName(checkpointInterval)} Checkpoints
      </h3>
      
      <div className="overflow-y-auto max-h-80 pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
        <ul className="space-y-2">
          {chartData.map((point, index) => {
            const isPast = new Date(point.time) < new Date();
            const isNow = Math.abs(new Date(point.time).getTime() - new Date().getTime()) < 15 * 60 * 1000; // Within 15 minutes
            
            return (
              <li 
                key={index} 
                className={`relative pl-5 py-2 rounded-md transition-all duration-200 ${
                  isPast 
                    ? "text-gray-400 dark:text-gray-500" 
                    : isNow 
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium" 
                      : "text-gray-700 dark:text-gray-200"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">
                    {new Date(point.time).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className={`${isPast ? "" : "font-semibold"}`}>
                    {point.steps.toLocaleString()} steps
                  </span>
                </div>
                
                {/* Dot indicator */}
                <span 
                  className={`absolute left-0 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full ${
                    isPast 
                      ? "bg-gray-300 dark:bg-gray-600" 
                      : isNow 
                        ? "bg-blue-500 dark:bg-blue-400 animate-pulse" 
                        : "bg-green-500 dark:bg-green-400"
                  }`}
                ></span>
              </li>
            );
          })}
        </ul>
      </div>
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
