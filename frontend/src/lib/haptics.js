import { getSettings } from "@/lib/storage";

// Vibration feedback (no-op where unsupported or disabled in settings).
export const vibrate = (pattern = 25) => {
  try {
    if (getSettings().haptics !== false && typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  } catch {
    /* ignore */
  }
};
