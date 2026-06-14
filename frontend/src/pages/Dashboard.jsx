import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, LogOut, Moon, Dumbbell, RefreshCw, KeyRound, X } from "lucide-react";
import {
  getActive,
  clearActive,
  getWeekProgress,
  getProfile,
  getWeeklyMapping,
  regenerateWeeklyMapping,
  getActiveSeed,
  applySeed,
  clearSeed,
} from "@/lib/storage";
import { mondayKey, todayDayNum } from "@/lib/week";
import { DAY_META, EXERCISES_BY_CATEGORY } from "@/data/exercises";
import StatusBadge from "@/components/StatusBadge";

export default function Dashboard() {
  const navigate = useNavigate();
  const [active] = useState(() => getActive());
  const [tick, setTick] = useState(0);
  const weekStart = useMemo(() => mondayKey(), []);
  const today = todayDayNum();

  useEffect(() => {
    if (!active) navigate("/");
  }, [active, navigate]);

  const pid = active ? (active.isGuest ? "guest" : active.profileId) : null;
  /* eslint-disable react-hooks/exhaustive-deps */
  const progress = useMemo(
    () => (pid ? getWeekProgress(pid, weekStart) : {}),
    [pid, weekStart, tick]
  );
  const mapping = useMemo(
    () => (pid ? getWeeklyMapping(pid, weekStart) : {}),
    [pid, weekStart, tick]
  );
  const activeSeed = useMemo(
    () => (pid ? getActiveSeed(pid, weekStart) : null),
    [pid, weekStart, tick]
  );
  /* eslint-enable react-hooks/exhaustive-deps */
  const [seedInput, setSeedInput] = useState("");

  const onLogout = () => {
    clearActive();
    navigate("/");
  };
  const onOpenDay = (day) => navigate(`/day/${day}`);

  const onStartNewWeek = () => {
    if (!pid) return;
    const ok = window.confirm(
      "Start a new week? This will regenerate the day-to-category mapping and clear this week's progress."
    );
    if (!ok) return;
    regenerateWeeklyMapping(pid, weekStart);
    setTick((t) => t + 1);
  };

  const onApplySeed = () => {
    if (!pid) return;
    const s = (seedInput || "").trim();
    if (!s) return;
    applySeed(pid, weekStart, s);
    setSeedInput("");
    setTick((t) => t + 1);
  };

  const onClearSeed = () => {
    if (!pid) return;
    clearSeed(pid);
    setTick((t) => t + 1);
  };

  if (!active) return null;
  const profile = active.isGuest ? { name: "Guest" } : getProfile(active.profileId);
  const doneCount = Object.entries(progress).filter(
    ([d, s]) => Number(d) <= 6 && s === "done"
  ).length;

  return (
    <div className="w-full max-w-md mx-auto px-6 pt-10 pb-24 min-h-screen">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 font-body">
            Hey {profile?.name || "there"}
          </p>
          <h1 className="font-display text-5xl font-bold text-white tracking-tight leading-none mt-1">
            This week
          </h1>
        </div>
        <button
          data-testid="logout-button"
          onClick={onLogout}
          className="w-11 h-11 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center active:bg-slate-800"
          aria-label="Switch profile"
        >
          <LogOut className="w-4 h-4 text-slate-400" strokeWidth={1.75} />
        </button>
      </div>

      {/* Progress summary */}
      <div className="mb-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
          <Dumbbell className="w-5 h-5 text-indigo-400" strokeWidth={1.75} />
        </div>
        <div>
          <p className="font-display text-3xl font-bold text-white tracking-tight" data-testid="week-summary">
            {doneCount} of 6 days done
          </p>
          <p className="text-slate-400 text-sm font-body -mt-0.5">this week</p>
        </div>
      </div>

      {/* Seed input / active seed indicator */}
      <div className="mb-3" data-testid="seed-panel">
        {activeSeed ? (
          <div
            className="px-4 py-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between gap-3"
            data-testid="active-seed-indicator"
          >
            <div className="flex items-center gap-2 min-w-0">
              <KeyRound className="w-4 h-4 text-indigo-300 flex-shrink-0" strokeWidth={1.75} />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.18em] text-indigo-300/80 font-body">Seeded week</p>
                <p
                  className="font-display text-base text-white tracking-tight truncate"
                  data-testid="active-seed-value"
                >
                  {activeSeed}
                </p>
              </div>
            </div>
            <button
              data-testid="clear-seed-button"
              onClick={onClearSeed}
              className="w-9 h-9 rounded-full bg-slate-900/60 border border-slate-700 flex items-center justify-center active:bg-slate-800"
              aria-label="Clear seed"
            >
              <X className="w-4 h-4 text-slate-300" strokeWidth={1.75} />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              data-testid="seed-input"
              type="text"
              value={seedInput}
              onChange={(e) => setSeedInput(e.target.value)}
              placeholder="Enter a seed to share a week"
              className="flex-1 px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-white font-body text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/40"
              onKeyDown={(e) => { if (e.key === "Enter") onApplySeed(); }}
            />
            <button
              data-testid="apply-seed-button"
              onClick={onApplySeed}
              disabled={!seedInput.trim()}
              className="px-4 rounded-2xl bg-indigo-400 text-slate-950 font-body font-semibold text-sm active:bg-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* Start new week */}
      <button
        data-testid="start-new-week-button"
        onClick={onStartNewWeek}
        className="w-full mb-8 px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 active:bg-slate-800 flex items-center justify-center gap-2 text-slate-300 font-body text-sm"
      >
        <RefreshCw className="w-4 h-4 text-slate-400" strokeWidth={1.75} />
        Start new week
      </button>

      {/* Day tiles */}
      <div className="flex flex-col gap-3" data-testid="day-tiles">
        {DAY_META.map((d, idx) => {
          const status = progress[d.day] || "pending";
          const isToday = d.day === today;
          const restTile = d.rest;
          const category = restTile ? "Rest" : mapping[d.day] || "—";
          const cardCount = restTile ? 0 : EXERCISES_BY_CATEGORY[category]?.length || 0;
          return (
            <motion.button
              key={d.day}
              data-testid={`day-tile-${d.label.toLowerCase()}`}
              data-category={category}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * idx, duration: 0.3 }}
              whileTap={restTile ? {} : { scale: 0.98 }}
              onClick={() => !restTile && onOpenDay(d.day)}
              disabled={restTile}
              className={`text-left w-full bg-slate-900 border rounded-2xl p-5 flex items-center justify-between min-h-[88px] transition-colors ${
                isToday ? "border-indigo-500/40" : "border-slate-800"
              } ${restTile ? "opacity-70" : "active:bg-slate-800"}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 text-center">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-body">{d.label}</p>
                  <p className={`font-display text-2xl font-bold tracking-tight -mt-0.5 ${isToday ? "text-indigo-300" : "text-white"}`}>
                    {d.day}
                  </p>
                </div>
                <div>
                  <p
                    className="font-display text-2xl text-white uppercase tracking-tight leading-none"
                    data-testid={`day-tile-title-${d.label.toLowerCase()}`}
                  >
                    {restTile ? "Rest" : category}
                  </p>
                  <p className="text-slate-500 text-xs font-body mt-1 flex items-center gap-1.5">
                    {restTile ? <><Moon className="w-3 h-3" /> Recover</> : `${cardCount} exercises`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!restTile && <StatusBadge status={status} testId={`day-status-${d.label.toLowerCase()}`} />}
                {!restTile && <ChevronRight className="w-4 h-4 text-slate-600" />}
              </div>
            </motion.button>
          );
        })}
      </div>

      <p className="text-center text-[11px] text-slate-600 mt-8 font-body tracking-wide">
        Week of {weekStart}
      </p>
    </div>
  );
}
