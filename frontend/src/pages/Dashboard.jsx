import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, LogOut, Moon, Dumbbell } from "lucide-react";
import { getActive, clearActive, getWeekProgress, getProfile } from "@/lib/storage";
import { mondayKey, todayDayNum } from "@/lib/week";
import { DAY_META, EXERCISES } from "@/data/exercises";
import StatusBadge from "@/components/StatusBadge";

export default function Dashboard() {
  const navigate = useNavigate();
  const [active, setActive] = useState(null);
  const [progress, setProgress] = useState({});
  const weekStart = useMemo(() => mondayKey(), []);
  const today = todayDayNum();

  useEffect(() => {
    const a = getActive();
    if (!a) { navigate("/"); return; }
    setActive(a);
    const pid = a.isGuest ? "guest" : a.profileId;
    setProgress(getWeekProgress(pid, weekStart));
  }, [navigate, weekStart]);

  const onLogout = () => { clearActive(); navigate("/"); };
  const onOpenDay = (day) => navigate(`/day/${day}`);

  if (!active) return null;
  const profile = active.isGuest ? { name: "Guest" } : getProfile(active.profileId);
  const doneCount = Object.entries(progress).filter(([d, s]) => Number(d) <= 6 && s === "done").length;

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
      <div className="mb-8 p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-4">
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

      {/* Day tiles */}
      <div className="flex flex-col gap-3" data-testid="day-tiles">
        {DAY_META.map((d, idx) => {
          const status = progress[d.day] || "pending";
          const isToday = d.day === today;
          const cardCount = EXERCISES[d.day]?.length || 0;
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
                  <p className="font-display text-2xl text-white uppercase tracking-tight leading-none">{d.title}</p>
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
