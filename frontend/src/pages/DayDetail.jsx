import React, { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, Play, CheckCircle2, Sparkles } from "lucide-react";
import { DAY_META, EXERCISES_BY_CATEGORY } from "@/data/exercises";
import { CATEGORY_BLURBS } from "@/data/categoryBlurbs";
import { getActive, getWorkout, resetWorkout, getWeeklyMapping } from "@/lib/storage";
import { mondayKey, todayDayNum } from "@/lib/week";
import StatusBadge from "@/components/StatusBadge";

export default function DayDetail() {
  const { day } = useParams();
  const navigate = useNavigate();
  const dayNum = Number(day);
  const meta = DAY_META.find((d) => d.day === dayNum);
  const today = todayDayNum();
  // Only today's training day is reachable via /day/:day. Other days redirect
  // back to dashboard (locked-tile semantics enforced at the route level).
  const allowed = !!meta && (meta.rest || dayNum === today);
  useEffect(() => {
    if (!allowed) navigate("/dashboard", { replace: true });
  }, [allowed, navigate]);
  const weekStart = useMemo(() => mondayKey(), []);
  const active = getActive();
  const pid = active ? (active.isGuest ? "guest" : active.profileId) : null;
  const mapping = useMemo(() => (pid ? getWeeklyMapping(pid, weekStart) : {}), [pid, weekStart]);
  const category = meta?.rest ? "Rest" : mapping[dayNum];
  const blurb = category ? CATEGORY_BLURBS[category] : null;
  const workout = pid ? getWorkout(pid, weekStart, dayNum) : null;
  const exercises = category ? EXERCISES_BY_CATEGORY[category] || [] : [];
  const aCount = exercises.length;
  const completedCount = workout?.completions?.length || 0;
  const status = workout?.dayCompleted ? "done" : "pending";

  if (!meta || !allowed) {
    return null;
  }

  const restDay = meta.rest;

  const onEnter = () => {
    if (workout?.dayCompleted) {
      navigate(`/summary/${dayNum}`);
    } else {
      navigate(`/workout/${dayNum}`);
    }
  };

  const onRestart = () => {
    if (!pid) return;
    if (window.confirm("Reset today's progress for this day?")) {
      resetWorkout(pid, weekStart, dayNum);
      navigate(`/workout/${dayNum}`);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-6 pt-8 pb-32 min-h-screen">
      <button
        data-testid="back-button"
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-1 text-slate-400 active:text-white min-h-[44px] -ml-2 px-2"
      >
        <ChevronLeft className="w-5 h-5" />
        <span className="font-body text-sm">Week</span>
      </button>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mt-6"
      >
        <div className="flex items-end justify-between mb-2">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 font-body">
            Day {meta.day} · {meta.label}
          </p>
          {!restDay && <StatusBadge status={status} testId="day-detail-status" />}
        </div>
        <h1
          data-testid="day-detail-title"
          className="font-display text-6xl font-bold text-white uppercase tracking-tight leading-none"
        >
          {meta.rest ? "Rest" : category || "—"}
        </h1>

        {blurb && (
          <div className="mt-8">
            <p className="text-[11px] uppercase tracking-[0.18em] text-indigo-300/70 font-body mb-2">Trains</p>
            <p className="font-body text-white text-base leading-snug mb-6" data-testid="day-trains">
              {blurb.trains}
            </p>
            <p className="text-[11px] uppercase tracking-[0.18em] text-indigo-300/70 font-body mb-2">About</p>
            <p className="font-body text-slate-300 text-base leading-relaxed" data-testid="day-blurb">
              {blurb.blurb}
            </p>
          </div>
        )}

        {!restDay && (
          <div className="mt-10 p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 font-body">Today</p>
              <p className="font-display text-3xl font-bold text-white tracking-tight" data-testid="day-points">
                {completedCount} / 5 done
              </p>
              <p className="text-slate-500 text-xs font-body mt-0.5">{aCount} exercises available</p>
            </div>
            {workout?.dayCompleted ? (
              <CheckCircle2 className="w-9 h-9 text-emerald-400" strokeWidth={1.5} />
            ) : (
              <Sparkles className="w-9 h-9 text-indigo-400" strokeWidth={1.5} />
            )}
          </div>
        )}
      </motion.div>

      {!restDay && (
        <div className="fixed bottom-20 left-0 right-0 px-6 z-30">
          <div className="max-w-md mx-auto flex flex-col gap-2">
            {workout?.dayCompleted && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                data-testid="restart-day-button"
                onClick={onRestart}
                className="w-full bg-slate-900/90 backdrop-blur border border-slate-800 text-slate-300 rounded-2xl py-3.5 font-body font-medium text-sm"
              >
                Restart this day
              </motion.button>
            )}
            <motion.button
              whileTap={{ scale: 0.97 }}
              data-testid="enter-workout-button"
              onClick={onEnter}
              className="w-full bg-white text-slate-950 rounded-2xl py-4 font-body font-semibold flex items-center justify-center gap-2 min-h-[56px]"
            >
              <Play className="w-4 h-4 fill-current" strokeWidth={2} />
              {workout?.dayCompleted ? "View summary" : completedCount > 0 ? "Continue workout" : "Enter workout"}
            </motion.button>
          </div>
        </div>
      )}

      {restDay && (
        <div className="mt-10 text-center">
          <p className="font-display text-2xl text-slate-400 tracking-tight">No workout today.</p>
        </div>
      )}
    </div>
  );
}
