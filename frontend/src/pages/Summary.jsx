import React, { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, Trophy, Share2 } from "lucide-react";
import { DAY_META, categoryTitle } from "@/data/exercises";
import { getActive, getWorkout, getWeek } from "@/lib/storage";
import { mondayKey } from "@/lib/week";
import { categoryForDay } from "@/lib/weekgen";

const fmtTimeHM = (iso) => {
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
};

const fmtSessionDuration = (startIso, endIso) => {
  const ms = new Date(endIso) - new Date(startIso);
  if (!Number.isFinite(ms) || ms < 0) return "—";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, "0")}s`;
  return `${s}s`;
};

export default function Summary() {
  const { day } = useParams();
  const dayNum = Number(day);
  const navigate = useNavigate();
  const meta = DAY_META.find((d) => d.day === dayNum);
  const weekStart = useMemo(() => mondayKey(), []);
  const active = getActive();
  const pid = active ? (active.isGuest ? "guest" : active.profileId) : null;
  const workout = pid ? getWorkout(pid, weekStart, dayNum) : null;
  const week = pid ? getWeek(pid, weekStart) : null;
  const title = meta && !meta.rest ? categoryTitle(categoryForDay(week, dayNum)) : (meta?.title || "");

  if (!meta || !workout || workout.completions.length === 0) {
    navigate("/dashboard");
    return null;
  }

  const completions = workout.completions;
  const first = completions[0];
  const last = completions[completions.length - 1];
  const sessionDuration = fmtSessionDuration(first.completedAt, last.completedAt);

  const onShareImage = async () => {
    const n = completions.length;
    const W = 1080, H = 470 + n * 96 + 150;
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d");
    const rrect = (x, y, w, h, r) => {
      if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
      else { ctx.beginPath(); ctx.rect(x, y, w, h); }
    };
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#818cf8"; ctx.font = "600 34px 'DM Sans', sans-serif";
    ctx.fillText("GYM WITH LALU", 80, 110);
    ctx.fillStyle = "#34d399"; ctx.font = "700 30px 'DM Sans', sans-serif";
    ctx.fillText("DAY COMPLETE", 80, 175);
    ctx.fillStyle = "#ffffff"; ctx.font = "800 104px 'Barlow Condensed', sans-serif";
    ctx.fillText(title.toUpperCase(), 78, 285);
    ctx.fillStyle = "#94a3b8"; ctx.font = "400 32px 'DM Sans', sans-serif";
    ctx.fillText(`${new Date(first.completedAt).toLocaleDateString()}   ·   ${n} done   ·   ${sessionDuration}`, 80, 350);
    let y = 470;
    completions.forEach((c) => {
      ctx.fillStyle = "#0f172a"; rrect(80, y - 54, W - 160, 78, 18); ctx.fill();
      ctx.fillStyle = "#34d399"; ctx.font = "700 36px 'DM Sans', sans-serif"; ctx.fillText("✓", 112, y);
      ctx.fillStyle = "#ffffff"; ctx.font = "500 38px 'DM Sans', sans-serif";
      const name = c.name.length > 26 ? c.name.slice(0, 25) + "…" : c.name;
      ctx.fillText(name, 170, y);
      ctx.fillStyle = "#cbd5e1"; ctx.font = "600 34px 'Barlow Condensed', sans-serif";
      const t = fmtTimeHM(c.completedAt); ctx.fillText(t, W - 90 - ctx.measureText(t).width, y);
      y += 96;
    });
    ctx.fillStyle = "#475569"; ctx.font = "400 28px 'DM Sans', sans-serif";
    ctx.fillText("aarohrp-bit.github.io/gym_with_lalu", 80, H - 60);
    const blob = await new Promise((r) => canvas.toBlob(r, "image/png"));
    if (!blob) return;
    const file = new File([blob], "gym-with-lalu-day.png", { type: "image/png" });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "Gym with Lalu" });
        return;
      }
    } catch (e) { if (e && e.name === "AbortError") return; }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "gym-with-lalu-day.png";
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-md mx-auto px-6 pt-10 pb-32 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <Trophy className="w-7 h-7 text-emerald-400" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-400 font-body">Day complete</p>
            <h1 className="font-display text-4xl font-bold text-white tracking-tight uppercase -mt-0.5">
              {title}
            </h1>
          </div>
        </div>

        <div className="mb-8 p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-indigo-400" strokeWidth={1.75} />
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-body">Session</p>
              <p className="font-display text-2xl text-white font-bold tracking-tight" data-testid="summary-session-time">
                {sessionDuration}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-body">First → Last</p>
            <p className="font-body text-slate-300 text-sm" data-testid="summary-session-range">
              {fmtTimeHM(first.completedAt)} → {fmtTimeHM(last.completedAt)}
            </p>
          </div>
        </div>

        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 font-body mb-3">
          Completed exercises
        </p>

        <div className="flex flex-col gap-2" data-testid="summary-list">
          {completions.map((c, i) => (
            <motion.div
              key={c.exerciseId}
              data-testid={`summary-item-${c.exerciseId}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.25 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <p className="font-body text-white font-medium leading-tight truncate">{c.name}</p>
                  <p className="text-slate-500 text-xs font-body mt-0.5">#{i + 1}</p>
                </div>
              </div>
              <p
                className="font-display text-xl text-white tracking-tight ml-3"
                data-testid={`summary-time-${c.exerciseId}`}
              >
                {fmtTimeHM(c.completedAt)}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <div className="fixed bottom-20 left-0 right-0 px-6 z-30">
        <div className="max-w-md mx-auto flex gap-2">
          <motion.button
            whileTap={{ scale: 0.97 }}
            data-testid="share-day-button"
            onClick={onShareImage}
            className="flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 text-white rounded-2xl py-4 px-5 font-body font-semibold min-h-[56px]"
          >
            <Share2 className="w-4 h-4" strokeWidth={2} /> Share
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            data-testid="back-to-week-button"
            onClick={() => navigate("/dashboard")}
            className="flex-1 bg-white text-slate-950 rounded-2xl py-4 font-body font-semibold min-h-[56px]"
          >
            Back to Week
          </motion.button>
        </div>
      </div>
    </div>
  );
}
