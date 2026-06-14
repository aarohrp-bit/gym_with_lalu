import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, RotateCw, ArrowRight, ChevronUp, ChevronDown, Zap, Play, Lock } from "lucide-react";
import { DAY_META, EXERCISES, categoryTitle } from "@/data/exercises";
import { getActive, getWorkout, addCompletion, POINTS_TARGET, getCounts, getLastCompletionAt, getGuardSeconds, ensureWeek } from "@/lib/storage";
import { mondayKey } from "@/lib/week";
import { categoryForDay } from "@/lib/weekgen";
import CircuitRunner from "@/components/CircuitRunner";

export default function Workout() {
  const { day } = useParams();
  const dayNum = Number(day);
  const navigate = useNavigate();
  const meta = DAY_META.find((d) => d.day === dayNum);
  const weekStart = useMemo(() => mondayKey(), []);
  const active = getActive();
  const pid = active ? (active.isGuest ? "guest" : active.profileId) : null;
  const week = useMemo(() => (pid && meta && !meta.rest ? ensureWeek(pid, weekStart) : null), [pid, meta, weekStart]);
  const catId = categoryForDay(week, dayNum);
  const title = meta && !meta.rest ? categoryTitle(catId) : (meta?.title || "");

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
  const [currentIdx, setCurrentIdx] = useState(0);
  const [action, setAction] = useState({ type: "init" }); // drives directional enter/exit
  const lastTap = useRef(0);

  // Eligible cards: ALL types (A + B), not yet completed.
  // Seed → fixed reproducible order; else least-done-first; guest → stable order.
  const counts = useMemo(() => (pid ? getCounts(pid) : {}), [pid]);
  const allCards = useMemo(() => {
    const base = EXERCISES[catId] || [];
    if (week?.seed && week.cardOrder?.[catId]) {
      const order = week.cardOrder[catId];
      const byId = Object.fromEntries(base.map((e) => [e.id, e]));
      const ordered = order.map((id) => byId[id]).filter(Boolean);
      base.forEach((e) => { if (!order.includes(e.id)) ordered.push(e); });
      return ordered;
    }
    if (!pid || pid === "guest") return base;
    return base
      .map((e, i) => ({ e, i, c: counts[e.id] || 0 }))
      .sort((a, b) => a.c - b.c || a.i - b.i)
      .map((x) => x.e);
  }, [catId, pid, counts, week]);
  const remaining = useMemo(
    () => allCards.filter((e) => !completedIds.has(e.id)),
    [allCards, completedIds]
  );

  const safeIdx = remaining.length ? Math.min(currentIdx, remaining.length - 1) : 0;
  const current = remaining[safeIdx];
  const peek = remaining.slice(safeIdx + 1, safeIdx + 3);

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

  // Auto-route to summary at POINTS_TARGET points (handles A and B completions alike).
  useEffect(() => {
    if (points >= POINTS_TARGET) {
      const t = setTimeout(() => navigate(`/summary/${dayNum}`), 380);
      return () => clearTimeout(t);
    }
  }, [points, dayNum, navigate]);

  if (!meta || meta.rest || !pid) return null;

  const handleTap = () => {
    if (!current || completingId || current.type === "B") return;
    const t = Date.now();
    if (t - lastTap.current < 300) {
      setFlipped((f) => !f);
      lastTap.current = 0;
    } else {
      lastTap.current = t;
    }
  };

  // Remove a card from the stack (used by A complete + B finish). +1 point, keep index valid.
  const removeCard = (card, exitType) => {
    setAction({ type: exitType || "complete" });
    setCompletingId(card.id);
    setPoints((p) => p + 1);
    setFlipped(false);
    setCompletedIds((s) => {
      const n = new Set(s);
      n.add(card.id);
      return n;
    });
    setCurrentIdx(() => {
      const newLen = remaining.length - 1;
      if (newLen <= 0) return 0;
      return Math.min(safeIdx, newLen - 1);
    });
    setTimeout(() => setCompletingId(null), 380);
  };

  const completeCurrent = () => {
    if (!current || completingId || current.type === "B" || guardActive) return;
    addCompletion(pid, weekStart, dayNum, current.id, current.name);
    removeCard(current, "complete");
  };

  const goNext = () => {
    if (remaining.length <= 1) return;
    setAction({ type: "next" });
    setFlipped(false);
    setCurrentIdx((i) => (Math.min(i, remaining.length - 1) + 1) % remaining.length);
  };
  const goPrev = () => {
    if (remaining.length <= 1) return;
    setAction({ type: "prev" });
    setFlipped(false);
    setCurrentIdx((i) => (Math.min(i, remaining.length - 1) - 1 + remaining.length) % remaining.length);
  };

  // Axis-locked swipes: horizontal-right finishes (A only); vertical browses the stack.
  const SWIPE_DIST = 70;
  const FLING_VEL = 500;
  const onDragEnd = (_, info) => {
    if (completingId) return;
    const { offset, velocity } = info;
    const horizontal = Math.abs(offset.x) > Math.abs(offset.y);
    if (horizontal) {
      if ((offset.x > SWIPE_DIST || velocity.x > FLING_VEL) && current?.type === "A") {
        completeCurrent();
      }
      // left swipe → no-op (no negative marking)
    } else {
      if (offset.y < -SWIPE_DIST || velocity.y < -FLING_VEL) goNext();
      else if (offset.y > SWIPE_DIST || velocity.y > FLING_VEL) goPrev();
    }
  };

  const onCircuitFinish = () => {
    if (!current || current.type !== "B") return;
    addCompletion(pid, weekStart, dayNum, current.id, current.name);
    setCircuitOpen(false);
    removeCard(current, "complete");
  };
  const onCircuitAbort = () => setCircuitOpen(false);

  const dayDone = points >= POINTS_TARGET;

  const cardVariants = {
    enter: (a) => ({
      y: a?.type === "next" ? "55%" : a?.type === "prev" ? "-55%" : 0,
      opacity: 0,
      scale: 0.95,
    }),
    center: { x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 },
    exit: (a) => ({
      x: a?.type === "complete" ? "120%" : 0,
      y: a?.type === "next" ? "-55%" : a?.type === "prev" ? "55%" : 0,
      opacity: 0,
      rotate: a?.type === "complete" ? 12 : 0,
      transition: { duration: 0.3 },
    }),
  };

  return (
    <div className="w-full max-w-md mx-auto px-5 pt-5 pb-5 min-h-screen flex flex-col select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
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
          <p className="font-display text-xl text-white uppercase tracking-tight -mt-0.5">{title}</p>
        </div>
      </div>

      {/* Five-minute guard banner */}
      {guardActive && (
        <div
          data-testid="guard-banner"
          className="mb-2 px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3"
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

      {/* Compact counter row */}
      <div className="mb-2 px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
        <p className="font-display text-2xl font-bold text-white tracking-tight leading-none" data-testid="points-counter">
          <span data-testid="points-current">{points}</span>
          <span className="text-slate-600"> / {POINTS_TARGET}</span>
          <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-body ml-2 align-middle">points</span>
        </p>
        <div className="flex gap-1.5" data-testid="points-pips">
          {[...Array(POINTS_TARGET)].map((_, i) => (
            <div key={i} className={`w-2.5 h-6 rounded-full ${i < points ? "bg-indigo-400" : "bg-slate-800"}`} />
          ))}
        </div>
      </div>

      {/* Card stack — fills remaining vertical space */}
      <div className="flex-1 min-h-0 relative my-2" style={{ perspective: 1200 }} data-testid="card-stack">
        {!dayDone && current ? (
          <>
            {/* Back peek cards */}
            {peek.map((c, i) => (
              <div
                key={c.id}
                className="absolute inset-0 bg-slate-900 border border-slate-800 rounded-3xl"
                style={{
                  transform: `translateY(${(i + 1) * 10}px) scale(${1 - (i + 1) * 0.035})`,
                  opacity: 0.5 - i * 0.15,
                  zIndex: -i - 1,
                }}
                aria-hidden
              />
            ))}

            <AnimatePresence custom={action} initial={false} mode="popLayout">
              <motion.div
                key={current.id}
                custom={action}
                data-testid={`workout-card-${current.id}`}
                drag={!completingId}
                dragDirectionLock
                dragSnapToOrigin
                dragElastic={0.35}
                onDragEnd={onDragEnd}
                onTap={handleTap}
                variants={cardVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 320, damping: 32 }}
                className="absolute inset-0 rounded-3xl cursor-grab active:cursor-grabbing touch-none"
                style={{ transformStyle: "preserve-3d" }}
              >
                {current.type === "B" ? (
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
                      {current.circuit?.name || current.name}
                    </h2>
                    <p className="text-slate-400 text-xs font-body mb-4">10-minute timed sub-stack · {current.circuit?.miniExercises?.length || 6} exercises</p>
                    <div className="flex-1 overflow-y-auto">
                      <div className="flex flex-col gap-1.5" data-testid="circuit-mini-list">
                        {(current.circuit?.miniExercises || []).map((m, i) => (
                          <div key={m.name} className="flex items-center gap-2 text-sm font-body text-slate-200 bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2">
                            <span className="font-display text-indigo-400 text-xs w-5 text-center">{i + 1}</span>
                            <span className="truncate">{m.name}</span>
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
                      Start circuit
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
                      className="absolute inset-0 rounded-3xl bg-slate-900 border border-slate-800 p-5 flex flex-col"
                      style={{ backfaceVisibility: "hidden" }}
                      data-testid="card-front"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500 font-body">Exercise</p>
                        <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500 font-body" data-testid="card-position">
                          {safeIdx + 1} of {remaining.length} left
                        </p>
                      </div>
                      <div className="flex-1 min-h-0 rounded-2xl bg-slate-800 border border-slate-700 overflow-hidden mb-4 relative">
                        {current.img ? (
                          <img
                            src={current.img}
                            alt={current.name}
                            draggable={false}
                            data-testid="card-image"
                            className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
                            onError={(e) => { e.currentTarget.style.display = "none"; }}
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center p-6">
                            <p className="font-body text-slate-400 text-sm uppercase tracking-wider text-center">{current.name}</p>
                          </div>
                        )}
                      </div>
                      <h2 className="font-display text-3xl text-white font-bold tracking-tight leading-tight" data-testid="card-name">
                        {current.name}
                      </h2>
                      <p className="text-slate-500 text-[11px] font-body mt-1.5 uppercase tracking-wider">
                        Double-tap to flip · Swipe right to finish · Swipe up / down to browse
                      </p>
                    </div>

                    {/* Back face */}
                    <div
                      className="absolute inset-0 rounded-3xl bg-indigo-500/5 border border-indigo-500/40 p-6 flex flex-col overflow-y-auto"
                      style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                      data-testid="card-back"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <p className="text-[10px] uppercase tracking-[0.22em] text-indigo-300/70 font-body">Coaching</p>
                        <RotateCw className="w-3.5 h-3.5 text-indigo-300/60" strokeWidth={1.5} />
                      </div>
                      <h3 className="font-display text-2xl text-white font-bold tracking-tight leading-tight mb-5">
                        {current.name}
                      </h3>
                      <div className="mb-5">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-indigo-300/80 font-body mb-2">How to perform</p>
                        <p className="font-body text-slate-200 text-sm leading-relaxed">{current.howTo}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-indigo-300/80 font-body mb-2">What it does</p>
                        <p className="font-body text-slate-300 text-sm leading-relaxed">{current.whatItDoes}</p>
                      </div>
                      <p className="text-slate-500 text-xs font-body mt-auto uppercase tracking-wider pt-4">
                        Double-tap to flip back
                      </p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </>
        ) : !dayDone && !current ? (
          <div className="absolute inset-0 flex items-center justify-center text-center text-slate-400 font-body">
            <p>No more exercises available.</p>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-center text-emerald-400 font-display text-2xl tracking-tight">
            Day complete →
          </div>
        )}
      </div>

      {/* Gesture hint */}
      {!dayDone && current && (
        <div className="flex items-center justify-center gap-3 text-slate-500 text-[11px] font-body mt-1">
          {current.type === "A" && (
            <span className="flex items-center gap-1">
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} /> finish
            </span>
          )}
          <span className="flex items-center gap-1">
            <ChevronUp className="w-3.5 h-3.5" strokeWidth={1.5} />
            <ChevronDown className="w-3.5 h-3.5" strokeWidth={1.5} /> browse
          </span>
        </div>
      )}

      {/* Hidden complete button for accessibility / testing fallback (A cards only) */}
      {!dayDone && current && current.type === "A" && (
        <button
          data-testid="complete-top-card"
          onClick={completeCurrent}
          className="sr-only"
          aria-label="Mark current card complete"
        >
          Complete
        </button>
      )}

      {/* Circuit runner overlay (locks the rest of the app) */}
      {circuitOpen && current?.type === "B" && current.circuit && (
        <CircuitRunner
          circuit={current.circuit}
          guardActive={guardActive}
          guardRemaining={guardRemaining}
          onAbort={onCircuitAbort}
          onFinish={onCircuitFinish}
        />
      )}
    </div>
  );
}
