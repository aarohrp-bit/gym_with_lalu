import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, Delete, Lock, ShieldAlert } from "lucide-react";
import { getProfile, verifyPin, setActive, getLockoutUntil, lockProfile, clearLockout, getGuardSeconds } from "@/lib/storage";

const PAD_KEYS = ["1","2","3","4","5","6","7","8","9","","0","del"];
const fmtMMSS = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export default function PinPad() {
  const { profileId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState(() => getLockoutUntil(profileId));
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const p = getProfile(profileId);
    if (!p) navigate("/");
    else setProfile(p);
  }, [profileId, navigate]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const locked = lockUntil > now;
  const lockRemaining = locked ? Math.ceil((lockUntil - now) / 1000) : 0;

  const onPress = (k) => {
    if (locked) return;
    if (error) setError(false);
    if (k === "del") return setPin((s) => s.slice(0, -1));
    if (k === "") return;
    if (pin.length >= 4) return;
    const next = pin + k;
    setPin(next);
    if (next.length === 4) {
      setTimeout(() => {
        if (verifyPin(profileId, next)) {
          clearLockout(profileId);
          setActive(profileId, false);
          navigate("/dashboard");
        } else {
          const a = attempts + 1;
          setAttempts(a);
          setError(true);
          if (a >= 3) {
            // Lock the profile and start a cooldown to deter intruders.
            const until = lockProfile(profileId, getGuardSeconds());
            setLockUntil(until);
            setPin("");
          } else {
            setTimeout(() => { setPin(""); setError(false); }, 700);
          }
        }
      }, 120);
    }
  };

  if (!profile) return null;

  return (
    <div className="w-full max-w-md mx-auto px-6 pt-8 pb-24 min-h-screen">
      <button
        data-testid="back-button"
        onClick={() => navigate("/")}
        className="flex items-center gap-1 text-slate-400 active:text-white min-h-[44px] -ml-2 px-2"
      >
        <ChevronLeft className="w-5 h-5" />
        <span className="font-body text-sm">Back</span>
      </button>

      <div className="mt-10 text-center">
        <div className={`inline-flex w-14 h-14 rounded-2xl items-center justify-center mb-5 border ${locked ? "bg-rose-500/10 border-rose-500/30" : "bg-indigo-500/10 border-indigo-500/20"}`}>
          {locked ? <ShieldAlert className="w-6 h-6 text-rose-400" strokeWidth={1.5} /> : <Lock className="w-6 h-6 text-indigo-400" strokeWidth={1.5} />}
        </div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 font-body mb-2">Enter PIN for</p>
        <h1 className="font-display text-4xl font-bold text-white tracking-tight" data-testid="pin-profile-name">{profile.name}</h1>
      </div>

      {locked ? (
        <div className="mt-10 text-center" data-testid="pin-locked">
          <p className="font-body text-rose-300 text-sm mb-2">Too many wrong PINs. Locked to protect this profile.</p>
          <p className="font-display text-5xl font-bold text-white tracking-tight">{fmtMMSS(lockRemaining)}</p>
          <p className="text-slate-500 text-xs font-body mt-2">Try again when the cooldown ends.</p>
        </div>
      ) : (
        <>
          <motion.div
            animate={error ? { x: [0, -10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="flex justify-center gap-4 mt-10 mb-12"
            data-testid="pin-dots"
          >
            {[0,1,2,3].map((i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full border transition-colors ${
                  error ? "bg-rose-500 border-rose-500" :
                  pin.length > i ? "bg-indigo-400 border-indigo-400" : "bg-transparent border-slate-700"
                }`}
              />
            ))}
          </motion.div>

          {error && (
            <p className="text-center text-rose-400 text-sm font-body mb-6" data-testid="pin-error">
              Wrong PIN. {3 - attempts} {3 - attempts === 1 ? "try" : "tries"} left.
            </p>
          )}

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
    </div>
  );
}
