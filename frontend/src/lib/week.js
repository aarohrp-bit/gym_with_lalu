// Week utilities: Monday-based week key + auto reset.

// Returns ISO date string (YYYY-MM-DD) of the Monday of the week containing `date`.
export const mondayKey = (date = new Date()) => {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dow = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const diffToMonday = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diffToMonday);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// Compute today's day-of-week number aligned to our schema (1=Mon ... 7=Sun)
export const todayDayNum = (date = new Date()) => {
  const dow = date.getDay();
  return dow === 0 ? 7 : dow;
};
