import { useState } from "react";
import PropTypes from "prop-types";

/**
 * Collapsible reference section. Header always visible; body toggles.
 */
const Section = ({ title, defaultOpen = false, right, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
      <div className="w-full flex items-center justify-between pr-5 hover:bg-gray-50 dark:hover:bg-gray-700/40">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex-1 flex items-center gap-2 px-5 py-4 text-left font-semibold text-gray-800 dark:text-white bg-transparent"
        >
          <span className={`transition-transform ${open ? "rotate-90" : ""}`}>▸</span>
          {title}
        </button>
        {right && <span className="text-sm text-gray-400 dark:text-gray-500 shrink-0">{right}</span>}
      </div>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
};

Section.propTypes = {
  title: PropTypes.string.isRequired,
  defaultOpen: PropTypes.bool,
  right: PropTypes.node,
  children: PropTypes.node,
};

export default Section;
