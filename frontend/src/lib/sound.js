import { getSettings } from "@/lib/storage";

// Tiny WebAudio cue (no asset files). No-op when disabled or unsupported.
let ctx = null;
export const beep = (freq = 880, ms = 140) => {
  try {
    if (getSettings().sound === false) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = ctx || new AC();
    if (ctx.state === "suspended") ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + ms / 1000);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + ms / 1000);
  } catch {
    /* ignore */
  }
};

// A pleasant two-note "done" chime.
export const chime = () => {
  beep(660, 130);
  setTimeout(() => beep(990, 200), 130);
};
