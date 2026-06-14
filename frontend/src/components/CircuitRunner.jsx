import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, RotateCw, Flag, Pause } from "lucide-react";
import { imageForMiniName } from "@/data/exerciseImages";

const CIRCUIT_SECONDS = 12 * 60; // 12:00
const FAST_CIRCUIT_SECONDS = 3; // dev-only fast timer when ?fastTimer=1

const fmtMMSS = (s) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

export default function CircuitRunner({ circuit, onAbort, onFinish, guardActive = false, guardRemaining = 0 }) {
  const fastTimer =
    typeof window !== "undefined" &&
    (window.location.search.includes("fastTimer=1") ||
      window.sessionStorage?.getItem("fastTimer") === "1");
  const initialSeconds = fastTimer ? FAST_CIRCUIT_SECONDS : CIRCUIT_SECONDS;
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const lastTap = useRef(0);
  const mini = circuit.miniExercises;

  // Tick down 1s
  useEffect(() => {
    const id = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, []);

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
    if (info.offset.x < -80 && idx < mini.length - 1) {
      setIdx((i) => i + 1);
      setFlipped(false);
    } else if (info.offset.x > 80 && idx > 0) {
      setIdx((i) => i - 1);
      setFlipped(false);
    }
  };

  const canFinish = secondsLeft <= 0 && !guardActive;
  const fmtGuard = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const current = mini[idx];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950 flex flex-col"
      data-testid="circuit-overlay"
      role="dialog"
      aria-modal="true"
    >
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
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-6">
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
          drag="x"
          dragConstraints={{ left: -50, right: 50 }}
          dragElastic={0.3}
          onDragEnd={onDragEnd}
          onTap={handleTap}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
          className="w-full aspect-[3/4] rounded-3xl touch-none cursor-grab active:cursor-grabbing"
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
              <div className="flex-1 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden mb-4">
                {imageForMiniName(current) ? (
                  <img
                    src={imageForMiniName(current)}
                    alt={current}
                    loading="eager"
                    className="w-full h-full object-cover"
                    data-testid="circuit-mini-image"
                    draggable={false}
                  />
                ) : (
                  <p className="font-body text-slate-400 text-sm uppercase tracking-wider text-center p-6">
                    {current}
                  </p>
                )}
              </div>
              <h3 className="font-display text-2xl text-white font-bold tracking-tight leading-tight" data-testid="circuit-mini-name">
                {current}
              </h3>
              <p className="text-slate-500 text-xs font-body mt-2 uppercase tracking-wider">
                Double-tap to flip · Swipe to move
              </p>
            </div>
            <div
              className="absolute inset-0 rounded-3xl bg-indigo-500/5 border border-indigo-500/40 p-6 flex flex-col"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            >
              <div className="flex items-start justify-between mb-4">
                <p className="text-[10px] uppercase tracking-[0.22em] text-indigo-300/70 font-body">How to perform</p>
                <RotateCw className="w-3.5 h-3.5 text-indigo-300/60" strokeWidth={1.5} />
              </div>
              <h3 className="font-display text-2xl text-white font-bold tracking-tight leading-tight mb-4">{current}</h3>
              <p className="font-body text-slate-200 text-sm leading-relaxed">
                How to: short placeholder cue for {current}. (Full coaching text comes in a later phase.)
              </p>
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
