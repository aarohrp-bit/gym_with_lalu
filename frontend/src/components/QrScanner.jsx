import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { X, QrCode } from "lucide-react";
import jsQR from "jsqr";
import { parseCardRaw } from "@/lib/cardlink";

// Live camera QR scanner. Calls onResult(parsedCardsPayload) when it reads one of our
// card links, or onClose when dismissed.
export default function QrScanner({ onResult, onClose }) {
  const videoRef = useRef(null);
  const [error, setError] = useState("");
  // Keep onResult in a ref so the camera effect runs once (not on every parent render).
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useEffect(() => {
    let cancelled = false;
    let raf = 0;
    let stream = null;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    const stop = () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        const v = videoRef.current;
        if (!v) return;
        v.srcObject = stream;
        v.setAttribute("playsinline", "true");
        await v.play();
        const tick = () => {
          if (cancelled) return;
          if (v.readyState === v.HAVE_ENOUGH_DATA && v.videoWidth) {
            canvas.width = v.videoWidth;
            canvas.height = v.videoHeight;
            ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
            const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(img.data, img.width, img.height);
            if (code && code.data) {
              try {
                const u = new URL(code.data);
                const raw = new URLSearchParams(u.search).get("card");
                const parsed = raw ? parseCardRaw(raw) : null;
                if (parsed) { stop(); onResultRef.current(parsed); return; }
              } catch { /* not a card link — keep scanning */ }
            }
          }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      } catch {
        setError("Camera unavailable or permission denied.");
      }
    })();

    return stop;
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] bg-slate-950 flex flex-col items-center justify-center px-6 select-none"
      data-testid="qr-scanner"
    >
      <button
        data-testid="qr-scanner-close"
        onClick={onClose}
        className="absolute top-6 right-6 w-11 h-11 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center active:bg-slate-800"
        aria-label="Close scanner"
      >
        <X className="w-5 h-5 text-slate-300" strokeWidth={2} />
      </button>
      <div className="flex items-center gap-2 mb-4 text-slate-300">
        <QrCode className="w-5 h-5 text-indigo-400" strokeWidth={1.75} />
        <p className="font-display text-2xl text-white tracking-tight">Scan a card QR</p>
      </div>
      {error ? (
        <p className="text-rose-400 font-body text-sm text-center max-w-xs">{error}</p>
      ) : (
        <div className="relative w-full max-w-xs aspect-square rounded-3xl overflow-hidden border border-slate-800 bg-black">
          <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" muted playsInline />
          <div className="absolute inset-6 border-2 border-indigo-400/70 rounded-2xl" />
        </div>
      )}
      <p className="text-slate-500 font-body text-xs mt-4 text-center max-w-xs">
        Point at a Gym with Lalu card QR. It adds the card (without its photo).
      </p>
    </motion.div>
  );
}
