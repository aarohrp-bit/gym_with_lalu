import React from "react";

const STYLES = {
  done: "bg-emerald-950 text-emerald-300 border-emerald-800",
  pending: "bg-slate-800 text-slate-400 border-slate-700",
  skipped: "bg-violet-950 text-violet-300 border-violet-800",
};

const LABELS = { done: "Done", pending: "Pending", skipped: "Skipped" };

export const StatusBadge = ({ status = "pending", testId }) => {
  const cls = STYLES[status] || STYLES.pending;
  return (
    <span
      data-testid={testId}
      className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-body uppercase tracking-wider font-semibold border ${cls}`}
    >
      {LABELS[status] || "Pending"}
    </span>
  );
};

export default StatusBadge;
