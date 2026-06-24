import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, RotateCw, Flag, Pause } from "lucide-react";
import { getCircuitSeconds } from "@/lib/storage";
import { vibrate } from "@/lib/haptics";
import { chime } from "@/lib/sound";

const fmtMMSS = (s) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

export default function CircuitRunner({ circuit, onAbort, onFinish, guardActive = false, guardRemaining = 0 }) {
  const [secondsLeft, setSecondsLeft] = useState(() => getCircuitSeconds());
  const endRef = useRef(Date.now() + getCircuitSeconds() * 1000);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const lastTap = useRef(0);
  const mini = circuit?.miniExercises || [];

  // Wall-clock countdown: derive the remaining time from a fixed end timestamp so it stays
  // correct even when the tab is backgrounded / the screen is locked (setInterval throttles
  // in the background, so we never just decrement a counter). Recompute on resume too.
  useEffect(() => {
    const compute = () => setSecondsLeft(Math.max(0, Math.ceil((endRef.current - Date.now()) / 1000)));
    const id = setInterval(compute, 500);
    const onVis = () => { if (!document.hidden) compute(); };
    document.addEventListener("visibilitychange", onVis);
    compute();
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  // Buzz + chime when the timer hits zero (Finish unlocks).
  useEffect(() => {
    if (secondsLeft === 0) { vibrate([60, 40, 60]); chime(); }
  }, [secondsLeft]);

  // Lock browser back during circuit — show confirm instead of leaving
  useEffect(() => {
    const onPop = () => setConfirming(true);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const handleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      setFlipped((f) => !f);
      lastTap.current = 0;
    } else {
      lastTap.current = now;
    }
  };

  const onDragEnd = (_, info) => {
    const { offset } = info;
    const horizontal = Math.abs(offset.x) > Math.abs(offset.y);
    const next = horizontal ? offset.x < -70 : offset.y < -70;   // swipe left or up
    const prev = horizontal ? offset.x > 70 : offset.y > 70;     // swipe right or down
    if (next && idx < mini.length - 1) {
      setIdx((i) => i + 1);
      setFlipped(false);
    } else if (prev && idx > 0) {
      setIdx((i) => i - 1);
      setFlipped(false);
    }
  };

  const canFinish = secondsLeft <= 0 && !guardActive;
  const fmtGuard = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const current = mini[Math.min(idx, mini.length - 1)];

  // Defensive: a malformed/empty circuit (e.g. a bad import) — let the user back out.
  if (!current) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center px-6 select-none" data-testid="circuit-overlay">
        <p className="font-body text-slate-300 text-center mb-5">This circuit has no exercises.</p>
        <button onClick={onAbort} className="px-5 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white font-body font-medium min-h-[48px]">Close</button>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center select-none"
      style={{ overscrollBehavior: "none", touchAction: "none" }}
      data-testid="circuit-overlay"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col min-h-0">
      {/* Abort fixed at top */}
      <div className="px-6 pt-6 flex items-center justify-between">
        <button
          data-testid="circuit-abort-button"
          onClick={() => setConfirming(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 active:bg-rose-500/20 min-h-[44px] font-body text-sm font-medium"
        >
          <X className="w-4 h-4" strokeWidth={2} />
          Abort
        </button>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500 font-body">Circuit</p>
          <p className="font-display text-xl text-white uppercase tracking-tight -mt-0.5" data-testid="circuit-name">
            {circuit.name}
          </p>
        </div>
      </div>

      {/* Sub-card area */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-6 py-4">
        <div className="w-full flex items-center justify-between mb-3">
          <p className="text-[10px] uppercase tracking-[0.22em] text-indigo-300/70 font-body" data-testid="circuit-card-index">
            {idx + 1} of {mini.length}
          </p>
          <div className="flex gap-1.5">
            {mini.map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === idx ? "bg-indigo-400" : "bg-slate-700"}`} />
            ))}
          </div>
        </div>

        <motion.div
          key={idx}
          drag
          dragDirectionLock
          dragSnapToOrigin
          dragElastic={0.4}
          onDragEnd={onDragEnd}
          onTap={handleTap}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
          className="w-full flex-1 min-h-0 rounded-3xl touch-none cursor-grab active:cursor-grabbing"
          style={{ transformStyle: "preserve-3d" }}
          data-testid={`circuit-sub-card-${idx}`}
        >
          <motion.div
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.5 }}
            className="relative w-full h-full rounded-3xl"
            style={{ transformStyle: "preserve-3d" }}
          >
            <div
              className="absolute inset-0 rounded-3xl bg-slate-900 border border-slate-800 p-6 flex flex-col"
              style={{ backfaceVisibility: "hidden" }}
            >
              <div className="flex-1 rounded-2xl bg-slate-800 border border-slate-700 overflow-hidden mb-4 relative">
                {current.img ? (
                  <img
                    src={current.img}
                    alt={current.name}
                    draggable={false}
                    data-testid="circuit-mini-image"
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center p-6">
                    <p className="font-body text-slate-400 text-sm uppercase tracking-wider text-center">{current.name}</p>
                  </div>
                )}
              </div>
              <h3 className="font-display text-2xl text-white font-bold tracking-tight leading-tight" data-testid="circuit-mini-name">
                {current.name}
              </h3>
              <p className="text-slate-500 text-xs font-body mt-2 uppercase tracking-wider">
                Double-tap to flip · Swipe to move
              </p>
            </div>
            <div
              className="absolute inset-0 rounded-3xl bg-indigo-500/5 border border-indigo-500/40 p-6 flex flex-col overflow-hidden"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            >
              <div className="flex items-start justify-between mb-4">
                <p className="text-[10px] uppercase tracking-[0.22em] text-indigo-300/70 font-body">Coaching</p>
                <RotateCw className="w-3.5 h-3.5 text-indigo-300/60" strokeWidth={1.5} />
              </div>
              <h3 className="font-display text-2xl text-white font-bold tracking-tight leading-tight mb-4">{current.name}</h3>
              {current.howTo && (
                <div className="mb-4">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-indigo-300/80 font-body mb-1.5">How to perform</p>
                  <p className="font-body text-slate-200 text-sm leading-relaxed">{current.howTo}</p>
                </div>
              )}
              {current.whatItDoes && (
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-indigo-300/80 font-body mb-1.5">What it does</p>
                  <p className="font-body text-slate-300 text-sm leading-relaxed">{current.whatItDoes}</p>
                </div>
              )}
              {!current.howTo && !current.whatItDoes && (
                <p className="font-body text-slate-400 text-sm">No coaching notes for this move.</p>
              )}
              <p className="text-slate-500 text-xs font-body mt-auto uppercase tracking-wider">Double-tap to flip back</p>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Timer fixed at bottom */}
      <div className="px-6 pb-6 pt-2 border-t border-slate-900">
        <div
          className={`rounded-2xl p-4 border flex items-center justify-between transition-colors ${
            canFinish ? "bg-emerald-500/10 border-emerald-500/40" : "bg-slate-900 border-slate-800"
          }`}
        >
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500 font-body">
              {canFinish ? "Done — finish to claim" : guardActive && secondsLeft <= 0 ? `Locked · ${fmtGuard(guardRemaining)}` : "Time remaining"}
            </p>
            <p
              className={`font-display text-5xl font-bold tracking-tight leading-none mt-0.5 ${
                canFinish ? "text-emerald-300" : "text-white"
              }`}
              data-testid="circuit-timer"
            >
              {fmtMMSS(secondsLeft)}
            </p>
          </div>
          <button
            data-testid="circuit-finish-button"
            disabled={!canFinish}
            onClick={onFinish}
            className={`px-5 py-3.5 rounded-2xl font-body font-semibold text-sm flex items-center gap-2 min-h-[52px] transition-all ${
              canFinish
                ? "bg-emerald-400 text-slate-950 active:bg-emerald-300"
                : "bg-slate-800 text-slate-600 cursor-not-allowed"
            }`}
          >
            <Flag className="w-4 h-4" strokeWidth={2} />
            Finish
          </button>
        </div>
      </div>
      </div>

      {/* Abort confirmation */}
      <AnimatePresence>
        {confirming && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[60] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center px-6"
            data-testid="circuit-abort-confirm"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-4">
                <Pause className="w-5 h-5 text-rose-400" strokeWidth={1.75} />
              </div>
              <h3 className="font-display text-3xl font-bold text-white tracking-tight">Abort this circuit?</h3>
              <p className="font-body text-slate-400 text-sm mt-2 leading-relaxed">
                The timer will stop and the circuit returns to your stack. No point, no penalty — you can start it again later.
              </p>
              <div className="flex gap-2 mt-6">
                <button
                  data-testid="abort-cancel"
                  onClick={() => setConfirming(false)}
                  className="flex-1 bg-slate-800 text-white rounded-2xl py-3.5 font-body font-medium active:bg-slate-700 min-h-[52px]"
                >
                  Keep going
                </button>
                <button
                  data-testid="abort-confirm"
                  onClick={onAbort}
                  className="flex-1 bg-rose-500/20 border border-rose-500/40 text-rose-300 rounded-2xl py-3.5 font-body font-semibold active:bg-rose-500/30 min-h-[52px]"
                >
                  Abort
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
