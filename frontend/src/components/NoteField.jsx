import React, { useState } from "react";
import { getNote, setNote } from "@/lib/storage";

// A tiny per-exercise note (e.g. "last: 12kg") shown on the card back.
// stopPropagation on pointer-down keeps the parent card's drag/tap gestures from
// hijacking taps meant for the input.
export default function NoteField({ pid, exId }) {
  const [val, setVal] = useState(() => getNote(pid, exId));
  const onChange = (e) => {
    setVal(e.target.value);
    setNote(pid, exId, e.target.value);
  };
  return (
    <div className="mt-5" onPointerDownCapture={(e) => e.stopPropagation()}>
      <p className="text-[10px] uppercase tracking-[0.18em] text-indigo-300/80 font-body mb-2">Last time</p>
      <input
        data-testid="exercise-note"
        value={val}
        onChange={onChange}
        placeholder="e.g. 12 kg × 10"
        maxLength={48}
        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-body text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50"
      />
    </div>
  );
}
