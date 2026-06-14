import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, RotateCw, ArrowRight, Zap, Play, Lock } from "lucide-react";
import { DAY_META, EXERCISES } from "@/data/exercises";
import { getActive, getWorkout, addCompletion, POINTS_TARGET, getCounts, getLastCompletionAt, getGuardSeconds } from "@/lib/storage";
import { mondayKey } from "@/lib/week";
import CircuitRunner from "@/components/CircuitRunner";

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
  const [circuitOpen, setCircuitOpen] = useState(false);
  const lastTap = useRef(0);

  // Eligible cards: ALL types (A + B), not yet completed
  // Sorted ascending by lifetime completion count (least-done first); guest = stable default order.
  const counts = useMemo(() => (pid ? getCounts(pid) : {}), [pid]);
  const allCards = useMemo(() => {
    const base = EXERCISES[dayNum] || [];
    if (!pid || pid === "guest") return base;
    return base
      .map((e, i) => ({ e, i, c: counts[e.id] || 0 }))
      .sort((a, b) => a.c - b.c || a.i - b.i)
      .map((x) => x.e);
  }, [dayNum, pid, counts]);
  const remaining = useMemo(
    () => allCards.filter((e) => !completedIds.has(e.id)),
    [allCards, completedIds]
  );

  // ── Five-minute guard ───────────────────────────────────────────
  const guardSeconds = useMemo(() => getGuardSeconds(), []);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const lastAt = pid ? getLastCompletionAt(pid) : null;
  const lastMs = lastAt ? new Date(lastAt).getTime() : 0;
  const secsSince = lastMs ? Math.floor((now - lastMs) / 1000) : Infinity;
  const guardActive = secsSince < guardSeconds && points < POINTS_TARGET;
  const guardRemaining = guardActive ? guardSeconds - secsSince : 0;
  const fmtGuard = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

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
    if (!top || completingId || top.type === "B") return;
    const now = Date.now();
    if (now - lastTap.current < 300) {
      setFlipped((f) => !f);
      lastTap.current = 0;
    } else {
      lastTap.current = now;
    }
  };

  const completeTop = () => {
    if (!top || completingId || top.type === "B" || guardActive) return;
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
    if (top?.type === "B" || guardActive) return;
    if (info.offset.x > 110 && info.velocity.x > -100) {
      completeTop();
    }
  };

  const onCircuitFinish = () => {
    if (!top || top.type !== "B") return;
    addCompletion(pid, weekStart, dayNum, top.id, top.name);
    setCompletedIds((s) => {
      const next = new Set(s);
      next.add(top.id);
      return next;
    });
    setPoints((p) => p + 1);
    setCircuitOpen(false);
  };

  const onCircuitAbort = () => {
    setCircuitOpen(false);
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

      {/* Five-minute guard banner */}
      {guardActive && (
        <div
          data-testid="guard-banner"
          className="mb-3 px-4 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3"
        >
          <Lock className="w-4 h-4 text-amber-300 flex-shrink-0" strokeWidth={1.75} />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-[0.18em] text-amber-300/80 font-body">Recovery lock</p>
            <p className="font-display text-base text-white tracking-tight leading-none mt-0.5">
              Next completion in <span data-testid="guard-remaining">{fmtGuard(guardRemaining)}</span>
            </p>
          </div>
        </div>
      )}

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
              drag={!completingId && top.type === "A" ? "x" : false}
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
              className={`relative w-full aspect-[3/4] rounded-3xl ${top.type === "A" ? "cursor-grab active:cursor-grabbing touch-none" : ""}`}
              style={{ transformStyle: "preserve-3d" }}
            >
              {top.type === "B" ? (
                /* ── Type B circuit card ── */
                <div
                  className="absolute inset-0 rounded-3xl bg-indigo-500/5 border border-indigo-500/40 p-6 flex flex-col"
                  data-testid="circuit-card"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-4 h-4 text-indigo-300" strokeWidth={1.75} />
                    <p className="text-[10px] uppercase tracking-[0.22em] text-indigo-300 font-body font-semibold">Circuit</p>
                  </div>
                  <h2 className="font-display text-3xl text-white font-bold tracking-tight leading-tight mb-1" data-testid="circuit-card-name">
                    {top.circuit?.name || top.name}
                  </h2>
                  <p className="text-slate-400 text-xs font-body mb-4">12-minute timed sub-stack · {top.circuit?.miniExercises?.length || 6} exercises</p>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex flex-col gap-1.5" data-testid="circuit-mini-list">
                      {(top.circuit?.miniExercises || []).map((m, i) => (
                        <div key={m} className="flex items-center gap-2 text-sm font-body text-slate-200 bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2">
                          <span className="font-display text-indigo-400 text-xs w-5 text-center">{i + 1}</span>
                          <span className="truncate">{m}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    data-testid="circuit-start-button"
                    onClick={() => setCircuitOpen(true)}
                    className="w-full mt-4 bg-indigo-400 text-slate-950 rounded-2xl py-3.5 font-body font-semibold flex items-center justify-center gap-2 min-h-[52px] active:bg-indigo-300"
                  >
                    <Play className="w-4 h-4 fill-current" strokeWidth={2} />
                    Start
                  </button>
                </div>
              ) : (
                <motion.div
                  animate={{ rotateY: flipped ? 180 : 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 rounded-3xl"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {/* Front face */}
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
              )}
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
      {!dayDone && top && top.type === "A" && (
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

      {/* Hidden complete button for accessibility / testing fallback (A cards only) */}
      {!dayDone && top && top.type === "A" && (
        <button
          data-testid="complete-top-card"
          onClick={completeTop}
          className="sr-only"
          aria-label="Mark current card complete"
        >
          Complete
        </button>
      )}

      {/* Circuit runner overlay (locks the rest of the app) */}
      {circuitOpen && top?.type === "B" && top.circuit && (
        <CircuitRunner
          circuit={top.circuit}
          guardActive={guardActive}
          guardRemaining={guardRemaining}
          onAbort={onCircuitAbort}
          onFinish={onCircuitFinish}
        />
      )}
    </div>
  );
}
