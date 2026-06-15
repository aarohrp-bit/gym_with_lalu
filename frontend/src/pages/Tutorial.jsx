import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell, Target, Hand, Zap, Sprout, CheckCircle2, ArrowRight, ChevronRight } from "lucide-react";
import { markTutorialSeen, getActive } from "@/lib/storage";

const SLIDES = [
  {
    icon: Dumbbell,
    title: "Gym with Lalu",
    body: "Your 6-day workout companion. Each day trains one muscle group — Sunday is rest.",
    example: "Mon Shoulders · Tue Chest · Wed Triceps · Thu Legs · Fri Back · Sat Biceps",
  },
  {
    icon: Target,
    title: "Hit 5 points a day",
    body: "Finish any 5 things from the day's stack and the day is complete. Simple.",
    example: "5 exercises = 5 points  ·  or 4 exercises + 1 circuit",
  },
  {
    icon: Hand,
    title: "Work the cards",
    body: "Swipe right to finish an exercise. Swipe up or down to browse the ones you haven't done. Double-tap to flip for coaching and your last weight.",
    example: "→ finish   ↑ ↓ browse   double-tap flip",
  },
  {
    icon: Zap,
    title: "Timed circuits",
    body: "Some days have a Type-B circuit of 6 quick moves. Tap Start, train along, and when the timer hits zero, Finish earns 1 point.",
    example: "Start → timer runs → Finish = 1 point",
  },
  {
    icon: Sprout,
    title: "Train with a friend",
    body: "Type the same seed as a friend and you both get the exact same week — same days, same order.",
    example: 'Seed "leg-day-777" = identical week for both of you',
  },
  {
    icon: CheckCircle2,
    title: "You're all set",
    body: "Everything stays on this phone. Adjust timers, switch theme, or back up your data anytime in Settings.",
    example: "Tip: Settings → Export data to move to a new phone",
  },
];

export default function Tutorial() {
  const navigate = useNavigate();
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const last = i === SLIDES.length - 1;

  const go = (n) => {
    if (n < 0 || n >= SLIDES.length) return;
    setDir(n > i ? 1 : -1);
    setI(n);
  };

  const finish = () => {
    markTutorialSeen();
    navigate(getActive() ? "/dashboard" : "/");
  };

  const onDragEnd = (_, info) => {
    if (info.offset.x < -60 || info.velocity.x < -400) go(i + 1);
    else if (info.offset.x > 60 || info.velocity.x > 400) go(i - 1);
  };

  const slide = SLIDES[i];
  const Icon = slide.icon;

  return (
    <div className="w-full max-w-md mx-auto px-6 pt-8 pb-8 min-h-screen flex flex-col select-none">
      <div className="flex justify-between items-center">
        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 font-body">
          {i + 1} / {SLIDES.length}
        </p>
        {!last && (
          <button data-testid="tutorial-skip" onClick={finish} className="text-slate-400 active:text-white font-body text-sm px-2 py-1">
            Skip
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 relative my-4 flex items-center" style={{ overflow: "hidden" }}>
        <AnimatePresence custom={dir} mode="popLayout">
          <motion.div
            key={i}
            custom={dir}
            data-testid={`tutorial-slide-${i}`}
            drag="x"
            dragSnapToOrigin
            dragElastic={0.4}
            onDragEnd={onDragEnd}
            initial={(d) => ({ x: d > 0 ? 320 : -320, opacity: 0 })}
            animate={{ x: 0, opacity: 1 }}
            exit={(d) => ({ x: d > 0 ? -320 : 320, opacity: 0 })}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center px-2 touch-none cursor-grab active:cursor-grabbing"
          >
            <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mb-8">
              <Icon className="w-9 h-9 text-indigo-400" strokeWidth={1.5} />
            </div>
            <h1 className="font-display text-5xl font-bold text-white tracking-tight leading-none mb-4">{slide.title}</h1>
            <p className="font-body text-slate-300 text-base leading-relaxed max-w-sm">{slide.body}</p>
            <div className="mt-8 px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 max-w-sm">
              <p className="font-body text-slate-400 text-sm">{slide.example}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 mb-6" data-testid="tutorial-dots">
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => go(idx)}
            className={`h-2 rounded-full transition-all ${idx === i ? "w-6 bg-indigo-400" : "w-2 bg-slate-700"}`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        data-testid="tutorial-next"
        onClick={() => (last ? finish() : go(i + 1))}
        className="w-full bg-white text-slate-950 rounded-2xl py-4 font-body font-semibold flex items-center justify-center gap-2 min-h-[56px]"
      >
        {last ? "Get started" : "Next"}
        {last ? <ChevronRight className="w-4 h-4" strokeWidth={2.5} /> : <ArrowRight className="w-4 h-4" strokeWidth={2.5} />}
      </motion.button>
    </div>
  );
}
