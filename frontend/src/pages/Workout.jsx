import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, RotateCw, ArrowRight } from "lucide-react";
import { DAY_META, EXERCISES } from "@/data/exercises";
import { getActive, getWorkout, addCompletion, POINTS_TARGET } from "@/lib/storage";
import { mondayKey } from "@/lib/week";

export default function Workout() {
  const { day } = useParams();
  const dayNum = Number(day);
  const navigate = useNavigate();
  const meta = DAY_META.find((d) => d.day === dayNum);
  const weekStart = useMemo(() => mondayKey(), []);
  const active = getActive();
  const pid = active ? (active.isGuest ? "guest" : active.profileId) : null;

  const [completedIds, setCompletedIds] = useState(() => {
    if (!pid) return new Set();
    const w = getWorkout(pid, weekStart, dayNum);
    return new Set((w?.completions || []).map((c) => c.exerciseId));
  });
  const [points, setPoints] = useState(() => {
    if (!pid) return 0;
    const w = getWorkout(pid, weekStart, dayNum);
    return w?.completions?.length || 0;
  });
  const [flipped, setFlipped] = useState(false);
  const [completingId, setCompletingId] = useState(null);
  const lastTap = useRef(0);

  // Eligible cards: type A only, not yet completed
  const aCards = useMemo(
    () => (EXERCISES[dayNum] || []).filter((e) => e.type === "A"),
    [dayNum]
  );
  const remaining = useMemo(
    () => aCards.filter((e) => !completedIds.has(e.id)),
    [aCards, completedIds]
  );

  useEffect(() => {
    if (!active) navigate("/");
    else if (!meta || meta.rest) navigate("/dashboard");
  }, [active, meta, navigate]);

  // Auto-route to summary at POINTS_TARGET points
  useEffect(() => {
    if (points >= POINTS_TARGET) {
      const t = setTimeout(() => navigate(`/summary/${dayNum}`), 350);
      return () => clearTimeout(t);
    }
  }, [points, dayNum, navigate]);

  if (!meta || meta.rest || !pid) return null;

  const top = remaining[0];

  const handleTap = () => {
    if (!top || completingId) return;
    const now = Date.now();
    if (now - lastTap.current < 300) {
      setFlipped((f) => !f);
      lastTap.current = 0;
    } else {
      lastTap.current = now;
    }
  };

  const completeTop = () => {
    if (!top || completingId) return;
    setCompletingId(top.id);
    addCompletion(pid, weekStart, dayNum, top.id, top.name);
    setTimeout(() => {
      setCompletedIds((s) => {
        const next = new Set(s);
        next.add(top.id);
        return next;
      });
      setPoints((p) => p + 1);
      setFlipped(false);
      setCompletingId(null);
    }, 320);
  };

  const onDragEnd = (_, info) => {
    if (info.offset.x > 110 && info.velocity.x > -100) {
      completeTop();
    }
  };

  const dayDone = points >= POINTS_TARGET;
  const next2 = remaining.slice(1, 3); // peek behind cards

  return (
    <div className="w-full max-w-md mx-auto px-6 pt-6 pb-10 min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          data-testid="back-button"
          onClick={() => navigate(`/day/${dayNum}`)}
          className="flex items-center gap-1 text-slate-400 active:text-white min-h-[44px] -ml-2 px-2"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="font-body text-sm">Exit</span>
        </button>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-body">{meta.label} · Day {meta.day}</p>
          <p className="font-display text-xl text-white uppercase tracking-tight -mt-0.5">{meta.title}</p>
        </div>
      </div>

      {/* Counter */}
      <div className="mb-6 p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-body">Points</p>
          <p className="font-display text-4xl font-bold text-white tracking-tight leading-none mt-0.5" data-testid="points-counter">
            <span data-testid="points-current">{points}</span>
            <span className="text-slate-600"> / {POINTS_TARGET}</span>
          </p>
        </div>
        <div className="flex gap-1.5" data-testid="points-pips">
          {[...Array(POINTS_TARGET)].map((_, i) => (
            <div
              key={i}
              className={`w-2.5 h-7 rounded-full ${i < points ? "bg-indigo-400" : "bg-slate-800"}`}
            />
          ))}
        </div>
      </div>

      {/* Card stack */}
      <div className="flex-1 flex items-center justify-center relative" style={{ perspective: 1200 }}>
        {!dayDone && top ? (
          <div className="relative w-full" data-testid="card-stack">
            {/* Back peek cards */}
            {next2.map((c, i) => (
              <div
                key={c.id}
                className="absolute inset-0 bg-slate-900 border border-slate-800 rounded-3xl"
                style={{
                  transform: `translateY(${(i + 1) * 8}px) scale(${1 - (i + 1) * 0.04})`,
                  opacity: 0.5 - i * 0.15,
                  zIndex: -i - 1,
                }}
                aria-hidden
              />
            ))}

            {/* Top draggable card */}
            <motion.div
              key={top.id}
              data-testid={`workout-card-${top.id}`}
              drag={!completingId ? "x" : false}
              dragConstraints={{ left: -30, right: 400 }}
              dragElastic={0.25}
              onDragEnd={onDragEnd}
              onTap={handleTap}
              animate={
                completingId === top.id
                  ? { x: 500, opacity: 0, rotate: 8 }
                  : { x: 0, opacity: 1, rotate: 0 }
              }
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
              className="relative w-full aspect-[3/4] rounded-3xl cursor-grab active:cursor-grabbing touch-none"
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Front face */}
              <motion.div
                animate={{ rotateY: flipped ? 180 : 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 rounded-3xl"
                style={{ transformStyle: "preserve-3d" }}
              >
                <div
                  className="absolute inset-0 rounded-3xl bg-slate-900 border border-slate-800 p-6 flex flex-col"
                  style={{ backfaceVisibility: "hidden" }}
                  data-testid="card-front"
                >
                  <div className="flex items-start justify-between mb-4">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500 font-body">Exercise</p>
                    <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500 font-body">
                      {points + 1} of stack
                    </p>
                  </div>
                  {/* Placeholder image area */}
                  <div className="flex-1 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center p-6 mb-5">
                    <p className="font-body text-slate-400 text-sm uppercase tracking-wider text-center">
                      {top.name}
                    </p>
                  </div>
                  <h2 className="font-display text-3xl text-white font-bold tracking-tight leading-tight" data-testid="card-name">
                    {top.name}
                  </h2>
                  <p className="text-slate-500 text-xs font-body mt-2 uppercase tracking-wider">
                    Double-tap to flip · Swipe right to complete
                  </p>
                </div>

                {/* Back face */}
                <div
                  className="absolute inset-0 rounded-3xl bg-indigo-500/5 border border-indigo-500/40 p-6 flex flex-col overflow-hidden"
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                  data-testid="card-back"
                >
                  <div className="flex items-start justify-between mb-4">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-indigo-300/70 font-body">Coaching</p>
                    <RotateCw className="w-3.5 h-3.5 text-indigo-300/60" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-display text-2xl text-white font-bold tracking-tight leading-tight mb-5">
                    {top.name}
                  </h3>
                  <div className="mb-5">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-indigo-300/80 font-body mb-2">How to perform</p>
                    <p className="font-body text-slate-200 text-sm leading-relaxed">{top.howTo}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-indigo-300/80 font-body mb-2">What it does</p>
                    <p className="font-body text-slate-300 text-sm leading-relaxed">{top.whatItDoes}</p>
                  </div>
                  <p className="text-slate-500 text-xs font-body mt-auto uppercase tracking-wider">
                    Double-tap to flip back
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        ) : !dayDone && !top ? (
          <div className="text-center text-slate-400 font-body">
            <p>No more exercises available.</p>
          </div>
        ) : (
          <div className="text-center text-emerald-400 font-display text-2xl tracking-tight">
            Day complete →
          </div>
        )}
      </div>

      {/* Swipe hint */}
      {!dayDone && top && (
        <div className="flex items-center justify-center gap-2 text-slate-500 text-xs font-body mt-4">
          <span>Swipe</span>
          <motion.span
            animate={{ x: [0, 8, 0] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          >
            <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
          </motion.span>
          <span>to mark complete</span>
        </div>
      )}

      {/* Hidden complete button for accessibility / testing fallback */}
      {!dayDone && top && (
        <button
          data-testid="complete-top-card"
          onClick={completeTop}
          className="sr-only"
          aria-label="Mark current card complete"
        >
          Complete
        </button>
      )}
    </div>
  );
}
