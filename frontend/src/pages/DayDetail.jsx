import React, { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, Zap } from "lucide-react";
import { DAY_META, EXERCISES } from "@/data/exercises";
import { getActive, getWeekProgress, setDayStatus } from "@/lib/storage";
import { mondayKey } from "@/lib/week";
import StatusBadge from "@/components/StatusBadge";

export default function DayDetail() {
  const { day } = useParams();
  const navigate = useNavigate();
  const dayNum = Number(day);
  const meta = DAY_META.find((d) => d.day === dayNum);
  const exercises = EXERCISES[dayNum] || [];
  const weekStart = useMemo(() => mondayKey(), []);
  const active = getActive();
  const pid = active ? (active.isGuest ? "guest" : active.profileId) : null;
  const progress = pid ? getWeekProgress(pid, weekStart) : {};
  const status = progress[dayNum] || "pending";

  if (!meta) {
    navigate("/dashboard");
    return null;
  }

  const mark = (s) => {
    if (!pid) return;
    setDayStatus(pid, weekStart, dayNum, s);
    navigate("/dashboard");
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

      <div className="mt-6 mb-6 flex items-end justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 font-body">Day {meta.day} · {meta.label}</p>
          <h1 className="font-display text-5xl font-bold text-white uppercase tracking-tight leading-none mt-1">{meta.title}</h1>
        </div>
        <StatusBadge status={status} testId="day-detail-status" />
      </div>

      <p className="text-slate-400 text-sm font-body mb-6">{exercises.length} exercises</p>

      <div className="flex flex-col gap-3" data-testid="exercise-list">
        {exercises.map((ex, idx) => (
          <motion.div
            key={ex.id}
            data-testid={`exercise-card-${ex.id}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.03 * idx, duration: 0.25 }}
            className={`rounded-2xl border ${ex.type === "B" ? "bg-indigo-500/5 border-indigo-500/30" : "bg-slate-900 border-slate-800"} p-4`}
          >
            {ex.type === "B" && (
              <div className="flex items-center gap-1.5 mb-3 text-indigo-300">
                <Zap className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span className="text-[10px] uppercase tracking-[0.2em] font-body font-semibold">Circuit</span>
              </div>
            )}
            <div className="flex gap-4 items-start">
              {/* Grey placeholder image */}
              <div className="w-20 h-20 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0">
                <span className="text-[9px] text-slate-500 font-body uppercase tracking-wider text-center px-1 leading-tight">
                  {ex.name.split(" ").slice(0, 2).join(" ")}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body text-white font-medium leading-tight">{ex.name}</p>
                <p className="text-slate-500 text-xs font-body mt-1 line-clamp-2">{ex.whatItDoes}</p>
              </div>
            </div>

            {ex.type === "B" && ex.circuit && (
              <div className="mt-4 pt-4 border-t border-indigo-500/20">
                <p className="text-[10px] uppercase tracking-[0.18em] text-indigo-300/70 font-body mb-2">Inside the circuit</p>
                <div className="flex flex-wrap gap-1.5" data-testid={`circuit-mini-${ex.id}`}>
                  {ex.circuit.miniExercises.map((m) => (
                    <span key={m} className="text-[11px] font-body text-slate-300 bg-slate-900/60 border border-slate-800 rounded-full px-2.5 py-1">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Status actions */}
      <div className="fixed bottom-20 left-0 right-0 px-6 z-30">
        <div className="max-w-md mx-auto grid grid-cols-3 gap-2 bg-slate-950/95 backdrop-blur border border-slate-800 rounded-2xl p-2">
          <button
            data-testid="mark-done"
            onClick={() => mark("done")}
            className="py-3 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-body text-sm font-semibold active:bg-emerald-500/25"
          >
            Done
          </button>
          <button
            data-testid="mark-pending"
            onClick={() => mark("pending")}
            className="py-3 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 font-body text-sm font-semibold active:bg-slate-700"
          >
            Pending
          </button>
          <button
            data-testid="mark-skipped"
            onClick={() => mark("skipped")}
            className="py-3 rounded-xl bg-violet-500/15 text-violet-300 border border-violet-500/30 font-body text-sm font-semibold active:bg-violet-500/25"
          >
            Skipped
          </button>
        </div>
      </div>
    </div>
  );
}
