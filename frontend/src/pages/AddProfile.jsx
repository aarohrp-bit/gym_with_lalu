import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, Delete } from "lucide-react";
import { addProfile, setActive, load, MAX_PROFILES } from "@/lib/storage";

const PAD_KEYS = ["1","2","3","4","5","6","7","8","9","","0","del"];

export default function AddProfile() {
  const navigate = useNavigate();
  const [step, setStep] = useState("name"); // name | pin
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");

  // Enforce the device profile cap (also guards direct navigation here).
  useEffect(() => {
    if ((load().profiles || []).length >= MAX_PROFILES) navigate("/");
  }, [navigate]);

  const onNameContinue = () => {
    if (name.trim().length < 1) return;
    setStep("pin");
  };

  const onPress = (k) => {
    if (k === "del") return setPin((p) => p.slice(0, -1));
    if (k === "") return;
    if (pin.length >= 4) return;
    const next = pin + k;
    setPin(next);
    if (next.length === 4) {
      try {
        const profile = addProfile(name, next);
        setActive(profile.id, false);
        setTimeout(() => navigate("/dashboard"), 200);
      } catch {
        navigate("/");
      }
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-6 pt-8 pb-24 min-h-screen">
      <button
        data-testid="back-button"
        onClick={() => (step === "pin" ? setStep("name") : navigate("/"))}
        className="flex items-center gap-1 text-slate-400 active:text-white min-h-[44px] -ml-2 px-2"
      >
        <ChevronLeft className="w-5 h-5" />
        <span className="font-body text-sm">Back</span>
      </button>

      <motion.div
        key={step}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mt-8"
      >
        {step === "name" ? (
          <>
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 font-body mb-2">Step 1 of 2</p>
            <h1 className="font-display text-4xl font-bold text-white tracking-tight mb-2">Your name</h1>
            <p className="text-slate-400 text-sm font-body mb-8">This is how you&apos;ll appear on the profile screen.</p>

            <input
              data-testid="profile-name-input"
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={24}
              placeholder="e.g. Lalu"
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-white font-display text-2xl placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 min-h-[64px]"
            />

            <motion.button
              whileTap={{ scale: 0.97 }}
              data-testid="continue-to-pin-button"
              onClick={onNameContinue}
              disabled={name.trim().length < 1}
              className="w-full mt-6 bg-white text-slate-950 rounded-2xl py-4 font-body font-semibold disabled:opacity-30 disabled:bg-slate-800 disabled:text-slate-500 min-h-[56px]"
            >
              Continue
            </motion.button>
          </>
        ) : (
          <>
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 font-body mb-2">Step 2 of 2</p>
            <h1 className="font-display text-4xl font-bold text-white tracking-tight mb-2">Create PIN</h1>
            <p className="text-slate-400 text-sm font-body mb-10">A 4-digit code, just to keep things separate.</p>

            <div className="flex justify-center gap-4 mb-12" data-testid="pin-dots">
              {[0,1,2,3].map((i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full border ${pin.length > i ? "bg-indigo-400 border-indigo-400" : "bg-transparent border-slate-700"}`}
                />
              ))}
            </div>

            <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto" data-testid="pin-pad">
              {PAD_KEYS.map((k, i) => (
                <motion.button
                  key={i}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => onPress(k)}
                  disabled={k === ""}
                  data-testid={k === "" ? `pad-blank-${i}` : `pad-key-${k}`}
                  className={`w-20 h-20 rounded-full flex items-center justify-center font-display text-3xl text-white border ${k === "" ? "opacity-0 pointer-events-none" : "bg-slate-900 border-slate-800 active:bg-slate-800"}`}
                >
                  {k === "del" ? <Delete className="w-6 h-6" strokeWidth={1.5} /> : k}
                </motion.button>
              ))}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
