import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, LogOut, Moon, Dumbbell, Sprout, RotateCcw, X } from "lucide-react";
import {
  getActive, clearActive, getWeekProgress, getProfile,
  ensureWeek, applySeed, startNewWeek,
} from "@/lib/storage";
import { mondayKey, todayDayNum } from "@/lib/week";
import { categoryForDay } from "@/lib/weekgen";
import { DAY_META, EXERCISES, categoryTitle } from "@/data/exercises";
import StatusBadge from "@/components/StatusBadge";

export default function Dashboard() {
  const navigate = useNavigate();
  const [active, setActive] = useState(null);
  const [progress, setProgress] = useState({});
  const [week, setWeek] = useState(null);
  const [seedInput, setSeedInput] = useState("");
  const [showSeed, setShowSeed] = useState(false);
  const weekStart = useMemo(() => mondayKey(), []);
  const today = todayDayNum();

  const pidOf = (a) => (a.isGuest ? "guest" : a.profileId);

  useEffect(() => {
    const a = getActive();
    if (!a) { navigate("/"); return; }
    setActive(a);
    const pid = pidOf(a);
    setWeek(ensureWeek(pid, weekStart));
    setProgress(getWeekProgress(pid, weekStart));
  }, [navigate, weekStart]);

  const onLogout = () => {
    // Prevent the default-profile auto-advance from immediately bouncing us back.
    try { sessionStorage.setItem("gym_lalu_skip_auto", "1"); } catch { /* ignore */ }
    clearActive();
    navigate("/");
  };
  const onOpenDay = (day) => navigate(`/day/${day}`);

  const refresh = () => {
    if (!active) return;
    const pid = pidOf(active);
    setWeek(ensureWeek(pid, weekStart));
    setProgress(getWeekProgress(pid, weekStart));
  };

  const onApplySeed = () => {
    if (!active || !seedInput.trim()) return;
    const pid = pidOf(active);
    setWeek(applySeed(pid, weekStart, seedInput.trim()));
    setProgress(getWeekProgress(pid, weekStart));
    setShowSeed(false);
  };

  const onClearSeed = () => {
    if (!active) return;
    const pid = pidOf(active);
    if (!window.confirm("Clear the seed and shuffle a fresh personalized week? This resets this week's progress.")) return;
    setWeek(startNewWeek(pid, weekStart));
    setProgress(getWeekProgress(pid, weekStart));
    setSeedInput("");
  };

  const onNewWeek = () => {
    if (!active) return;
    if (!window.confirm("Start a new week? This shuffles the layout and resets this week's progress.")) return;
    const pid = pidOf(active);
    setWeek(startNewWeek(pid, weekStart));
    setProgress(getWeekProgress(pid, weekStart));
    setSeedInput("");
  };

  if (!active) return null;
  const profile = active.isGuest ? { name: "Guest" } : getProfile(active.profileId);
  const doneCount = Object.entries(progress).filter(([d, s]) => Number(d) <= 6 && s === "done").length;
  const seedActive = !!week?.seed;

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
      <div className="mb-5 p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-4">
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

      {/* Seed banner / controls */}
      {seedActive ? (
        <div className="mb-5 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3" data-testid="seed-banner">
          <div className="flex items-center gap-3 min-w-0">
            <Sprout className="w-5 h-5 text-emerald-300 flex-shrink-0" strokeWidth={1.75} />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-300/80 font-body">Seeded week</p>
              <p className="font-display text-xl text-white tracking-tight truncate" data-testid="seed-value">{week.seed}</p>
            </div>
          </div>
          <button
            data-testid="clear-seed-button"
            onClick={onClearSeed}
            className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 active:bg-emerald-500/20"
            aria-label="Clear seed"
          >
            <X className="w-4 h-4 text-emerald-300" strokeWidth={2} />
          </button>
        </div>
      ) : showSeed ? (
        <div className="mb-5 p-4 rounded-2xl bg-slate-900 border border-slate-800" data-testid="seed-input-row">
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-body mb-2">Enter a seed</p>
          <div className="flex gap-2">
            <input
              data-testid="seed-input"
              value={seedInput}
              onChange={(e) => setSeedInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onApplySeed()}
              placeholder="e.g. leg-day-777"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-body placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 min-h-[48px]"
            />
            <button
              data-testid="apply-seed-button"
              onClick={onApplySeed}
              disabled={!seedInput.trim()}
              className="px-5 rounded-xl bg-indigo-400 text-slate-950 font-body font-semibold disabled:opacity-30 min-h-[48px]"
            >
              Set
            </button>
          </div>
          <p className="text-slate-500 text-[11px] font-body mt-2">
            Same seed = the same week for you and a friend. It lasts one week.
          </p>
        </div>
      ) : (
        <div className="mb-5 flex gap-2">
          <button
            data-testid="open-seed-button"
            onClick={() => setShowSeed(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-body text-sm active:bg-slate-800 min-h-[48px]"
          >
            <Sprout className="w-4 h-4" strokeWidth={1.75} /> Enter seed
          </button>
          <button
            data-testid="new-week-button"
            onClick={onNewWeek}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-body text-sm active:bg-slate-800 min-h-[48px]"
          >
            <RotateCcw className="w-4 h-4" strokeWidth={1.75} /> New week
          </button>
        </div>
      )}

      {/* Day tiles */}
      <div className="flex flex-col gap-3" data-testid="day-tiles">
        {DAY_META.map((d, idx) => {
          const status = progress[d.day] || "pending";
          const isToday = d.day === today;
          const catId = categoryForDay(week, d.day);
          const title = d.rest ? "Rest" : categoryTitle(catId);
          const cardCount = d.rest ? 0 : (EXERCISES[catId]?.length || 0);
          const restTile = d.rest;
          return (
            <motion.button
              key={d.day}
              data-testid={`day-tile-${d.label.toLowerCase()}`}
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
                  <p className="font-display text-2xl text-white uppercase tracking-tight leading-none" data-testid={`day-category-${d.label.toLowerCase()}`}>{title}</p>
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
