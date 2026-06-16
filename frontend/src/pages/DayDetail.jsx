import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Play, CheckCircle2, Sparkles, AlertTriangle, Lock } from "lucide-react";
import { DAY_META, EXERCISES, categoryTitle } from "@/data/exercises";
import { CATEGORY_BLURBS } from "@/data/categoryBlurbs";
import { getActive, getWorkout, resetWorkout, ensureWeek, getPointsTarget, getDisplayCount, getCustomCardsForCategory } from "@/lib/storage";
import { mondayKey, todayDayNum } from "@/lib/week";
import { categoryForDay } from "@/lib/weekgen";
import StatusBadge from "@/components/StatusBadge";

export default function DayDetail() {
  const { day } = useParams();
  const navigate = useNavigate();
  const dayNum = Number(day);
  const meta = DAY_META.find((d) => d.day === dayNum);
  const [confirmReset, setConfirmReset] = useState(false);
  const weekStart = useMemo(() => mondayKey(), []);
  const active = getActive();
  const pid = active ? (active.isGuest ? "guest" : active.profileId) : null;
  const week = pid && meta && !meta.rest ? ensureWeek(pid, weekStart) : null;
  const catId = categoryForDay(week, dayNum);
  const title = meta && !meta.rest ? categoryTitle(catId) : (meta?.title || "");
  const blurb = meta ? CATEGORY_BLURBS[meta.rest ? "Rest" : title] : null;
  const workout = pid ? getWorkout(pid, weekStart, dayNum) : null;
  const pointsTarget = getPointsTarget();
  const poolSize = (EXERCISES[catId] || []).length + (pid && !meta?.rest ? getCustomCardsForCategory(pid, catId).length : 0);
  const aCount = Math.min(poolSize, getDisplayCount());
  const completedCount = workout?.completions?.length || 0;
  const status = workout?.dayCompleted ? "done" : "pending";
  const today = todayDayNum();
  const unlocked = !!week?.seed || today === 7 || dayNum === today;

  if (!meta) {
    navigate("/dashboard");
    return null;
  }

  const restDay = meta.rest;

  const onEnter = () => {
    if (workout?.dayCompleted) {
      navigate(`/summary/${dayNum}`);
    } else if (unlocked) {
      navigate(`/workout/${dayNum}`);
    }
  };

  const doRestart = () => {
    if (!pid) return;
    resetWorkout(pid, weekStart, dayNum);
    navigate(`/workout/${dayNum}`);
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
          {meta.rest ? meta.title : title}
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
                {completedCount} / {pointsTarget} done
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
                onClick={() => setConfirmReset(true)}
                className="w-full bg-slate-900/90 backdrop-blur border border-slate-800 text-slate-300 rounded-2xl py-3.5 font-body font-medium text-sm"
              >
                Restart this day
              </motion.button>
            )}
            {!workout?.dayCompleted && !unlocked ? (
              <div
                data-testid="enter-workout-locked"
                className="w-full bg-slate-900 border border-slate-800 text-slate-400 rounded-2xl py-4 font-body font-medium flex items-center justify-center gap-2 min-h-[56px]"
              >
                <Lock className="w-4 h-4" strokeWidth={1.75} />
                Opens on {meta.label} · do today's workout
              </div>
            ) : (
              <motion.button
                whileTap={{ scale: 0.97 }}
                data-testid="enter-workout-button"
                onClick={onEnter}
                className="w-full bg-white text-slate-950 rounded-2xl py-4 font-body font-semibold flex items-center justify-center gap-2 min-h-[56px]"
              >
                <Play className="w-4 h-4 fill-current" strokeWidth={2} />
                {workout?.dayCompleted ? "View summary" : completedCount > 0 ? "Continue workout" : "Enter workout"}
              </motion.button>
            )}
          </div>
        </div>
      )}

      {restDay && (
        <div className="mt-10 text-center">
          <p className="font-display text-2xl text-slate-400 tracking-tight">No workout today.</p>
        </div>
      )}

      {/* In-app confirm dialog */}
      <AnimatePresence>
        {confirmReset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center px-6"
            data-testid="confirm-dialog"
            onClick={() => setConfirmReset(false)}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-400" strokeWidth={1.75} />
              </div>
              <h3 className="font-display text-3xl font-bold text-white tracking-tight">Restart this day?</h3>
              <p className="font-body text-slate-400 text-sm mt-2 leading-relaxed">
                Clears today's completed exercises so you can start this day's workout over.
              </p>
              <div className="flex gap-2 mt-6">
                <button
                  data-testid="confirm-cancel"
                  onClick={() => setConfirmReset(false)}
                  className="flex-1 bg-slate-800 text-white rounded-2xl py-3.5 font-body font-medium active:bg-slate-700 min-h-[52px]"
                >
                  Cancel
                </button>
                <button
                  data-testid="confirm-ok"
                  onClick={doRestart}
                  className="flex-1 bg-amber-500/20 border border-amber-500/40 text-amber-200 rounded-2xl py-3.5 font-body font-semibold active:bg-amber-500/30 min-h-[52px]"
                >
                  Restart
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
