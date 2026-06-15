import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Timer, Zap, Sun, Moon, LogOut, Trash2, AlertTriangle, Delete, Download, Upload, BarChart3, BookOpen } from "lucide-react";
import {
  getSettings, setSettings, getActive, clearActive, getProfile,
  verifyPin, deleteProfile, lockProfile, getGuardSeconds,
  exportProfile, importProfile,
} from "@/lib/storage";
import { applyTheme } from "@/lib/theme";

const PAD_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];
const fmtMMSS = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export default function Settings() {
  const navigate = useNavigate();
  const active = getActive();
  const pid = active ? (active.isGuest ? "guest" : active.profileId) : null;
  const profile = active && !active.isGuest ? getProfile(active.profileId) : null;

  const [settings, setLocal] = useState(() => getSettings());
  const [deleteStep, setDeleteStep] = useState(null); // null | "confirm" | "pin"
  const [pin, setPin] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState("");
  const [dataMsg, setDataMsg] = useState(null); // { ok, text }
  const fileRef = useRef(null);

  useEffect(() => { if (!active) navigate("/"); }, [active, navigate]);
  if (!active) return null;

  const update = (partial) => {
    const next = setSettings(partial);
    setLocal({ ...next });
    if ("theme" in partial) applyTheme(partial.theme);
  };

  const onLogout = () => {
    try { sessionStorage.setItem("gym_lalu_skip_auto", "1"); } catch { /* ignore */ }
    clearActive();
    navigate("/");
  };

  const onExport = () => {
    const payload = exportProfile(pid);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safe = (profile?.name || "guest").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    a.href = url;
    a.download = `gym-with-lalu-${safe}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setDataMsg({ ok: true, text: "Backup downloaded." });
  };

  const onImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const p = importProfile(JSON.parse(reader.result));
        setDataMsg({ ok: true, text: `Imported "${p.name}". Find it on the profile screen.` });
        setTimeout(() => navigate("/"), 1300);
      } catch (err) {
        setDataMsg({ ok: false, text: err.message || "Import failed." });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const onPinKey = (k) => {
    setError("");
    if (k === "del") return setPin((s) => s.slice(0, -1));
    if (k === "" || pin.length >= 4) return;
    const next = pin + k;
    setPin(next);
    if (next.length === 4) {
      setTimeout(() => {
        if (verifyPin(active.profileId, next)) {
          deleteProfile(active.profileId);
          clearActive();
          navigate("/");
        } else {
          const a = attempts + 1;
          setAttempts(a);
          setPin("");
          if (a >= 3) {
            // Too many wrong PINs → lock the profile and log out to protect progress.
            lockProfile(active.profileId, getGuardSeconds());
            clearActive();
            navigate("/");
          } else {
            setError(`Wrong PIN. ${3 - a} ${3 - a === 1 ? "try" : "tries"} left.`);
          }
        }
      }, 120);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-6 pt-8 pb-28 min-h-screen">
      <button
        data-testid="back-button"
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-1 text-slate-400 active:text-white min-h-[44px] -ml-2 px-2"
      >
        <ChevronLeft className="w-5 h-5" />
        <span className="font-body text-sm">Week</span>
      </button>

      <h1 className="font-display text-5xl font-bold text-white tracking-tight leading-none mt-4 mb-8">Settings</h1>

      {/* Recovery cooldown */}
      <div className="mb-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-2 mb-1">
          <Timer className="w-4 h-4 text-indigo-400" strokeWidth={1.75} />
          <p className="font-display text-xl text-white tracking-tight">Recovery cooldown</p>
        </div>
        <p className="text-slate-400 text-xs font-body mb-3">Lock between completions. Currently <span className="text-white" data-testid="guard-value">{fmtMMSS(settings.guardSeconds)}</span>.</p>
        <input
          data-testid="guard-slider"
          type="range" min="0" max="600" step="30"
          value={settings.guardSeconds}
          onChange={(e) => update({ guardSeconds: Number(e.target.value) })}
          className="w-full accent-indigo-400"
        />
        <div className="flex justify-between text-[10px] text-slate-600 font-body mt-1"><span>0:00</span><span>10:00</span></div>
      </div>

      {/* Circuit timer */}
      <div className="mb-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-4 h-4 text-indigo-400" strokeWidth={1.75} />
          <p className="font-display text-xl text-white tracking-tight">Circuit timer (Type B)</p>
        </div>
        <p className="text-slate-400 text-xs font-body mb-3">How long the circuit runs. Currently <span className="text-white" data-testid="circuit-value">{Math.round(settings.circuitSeconds / 60)} min</span>.</p>
        <input
          data-testid="circuit-slider"
          type="range" min="60" max="1200" step="60"
          value={settings.circuitSeconds}
          onChange={(e) => update({ circuitSeconds: Number(e.target.value) })}
          className="w-full accent-indigo-400"
        />
        <div className="flex justify-between text-[10px] text-slate-600 font-body mt-1"><span>1 min</span><span>20 min</span></div>
      </div>

      {/* Theme */}
      <div className="mb-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <p className="font-display text-xl text-white tracking-tight mb-3">Theme</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: "dark", label: "Dark", icon: Moon },
            { key: "light", label: "Light", icon: Sun },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              data-testid={`theme-${key}`}
              onClick={() => update({ theme: key })}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl font-body font-medium min-h-[48px] border ${
                settings.theme === key
                  ? "bg-indigo-400 text-slate-950 border-indigo-400"
                  : "bg-slate-800 text-slate-300 border-slate-700"
              }`}
            >
              <Icon className="w-4 h-4" strokeWidth={1.75} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats + replay tutorial */}
      <div className="mb-4 grid grid-cols-2 gap-2">
        <button
          data-testid="stats-button"
          onClick={() => navigate("/stats")}
          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-body text-sm active:bg-slate-800 min-h-[48px]"
        >
          <BarChart3 className="w-4 h-4" strokeWidth={1.75} /> Stats
        </button>
        <button
          data-testid="replay-tutorial-button"
          onClick={() => navigate("/tutorial")}
          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-body text-sm active:bg-slate-800 min-h-[48px]"
        >
          <BookOpen className="w-4 h-4" strokeWidth={1.75} /> How it works
        </button>
      </div>

      {/* Data — export / import (backup, move to a new phone) */}
      <div className="mb-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <p className="font-display text-xl text-white tracking-tight mb-1">Your data</p>
        <p className="text-slate-400 text-xs font-body mb-3">Everything stays on this phone. Back it up or move it to another device.</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            data-testid="export-button"
            onClick={onExport}
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-body text-sm active:bg-slate-700 min-h-[48px]"
          >
            <Download className="w-4 h-4" strokeWidth={1.75} /> Export
          </button>
          <button
            data-testid="import-button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-body text-sm active:bg-slate-700 min-h-[48px]"
          >
            <Upload className="w-4 h-4" strokeWidth={1.75} /> Import
          </button>
        </div>
        <input ref={fileRef} type="file" accept="application/json,.json" onChange={onImportFile} className="hidden" data-testid="import-file" />
        {dataMsg && (
          <p className={`text-xs font-body mt-3 ${dataMsg.ok ? "text-emerald-400" : "text-rose-400"}`} data-testid="data-message">{dataMsg.text}</p>
        )}
      </div>

      {/* Danger zone — delete profile (not for guest) */}
      {profile && (
        <div className="mb-4 p-5 rounded-2xl bg-rose-500/5 border border-rose-500/20">
          <p className="font-display text-xl text-white tracking-tight mb-1">Delete profile</p>
          <p className="text-slate-400 text-xs font-body mb-3">Permanently erases {profile.name} and all of its progress.</p>
          <button
            data-testid="delete-profile-button"
            onClick={() => { setDeleteStep("confirm"); setPin(""); setAttempts(0); setError(""); }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 font-body font-medium min-h-[48px] active:bg-rose-500/25"
          >
            <Trash2 className="w-4 h-4" strokeWidth={1.75} /> Delete this profile
          </button>
        </div>
      )}

      {/* Logout pinned near bottom */}
      <button
        data-testid="logout-button"
        onClick={onLogout}
        className="w-full mt-2 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 font-body font-medium min-h-[52px] active:bg-slate-800"
      >
        <LogOut className="w-4 h-4" strokeWidth={1.75} /> {active.isGuest ? "Exit guest" : "Log out"}
      </button>

      {/* Delete confirm + PIN flow */}
      <AnimatePresence>
        {deleteStep && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center px-6"
            data-testid="delete-dialog"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
              className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-4">
                <AlertTriangle className="w-5 h-5 text-rose-400" strokeWidth={1.75} />
              </div>

              {deleteStep === "confirm" ? (
                <>
                  <h3 className="font-display text-3xl font-bold text-white tracking-tight">Delete {profile?.name}?</h3>
                  <p className="font-body text-slate-400 text-sm mt-2 leading-relaxed">
                    This permanently erases this profile and all its progress. You'll confirm with your PIN next.
                  </p>
                  <div className="flex gap-2 mt-6">
                    <button
                      data-testid="delete-cancel"
                      onClick={() => setDeleteStep(null)}
                      className="flex-1 bg-slate-800 text-white rounded-2xl py-3.5 font-body font-medium active:bg-slate-700 min-h-[52px]"
                    >
                      Cancel
                    </button>
                    <button
                      data-testid="delete-continue"
                      onClick={() => setDeleteStep("pin")}
                      className="flex-1 bg-rose-500/20 border border-rose-500/40 text-rose-300 rounded-2xl py-3.5 font-body font-semibold active:bg-rose-500/30 min-h-[52px]"
                    >
                      Continue
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="font-display text-3xl font-bold text-white tracking-tight">Enter PIN to delete</h3>
                  <p className="font-body text-slate-400 text-sm mt-2">3 wrong tries logs you out to protect your data.</p>
                  <div className="flex justify-center gap-3 my-5" data-testid="delete-pin-dots">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className={`w-3.5 h-3.5 rounded-full border ${pin.length > i ? "bg-indigo-400 border-indigo-400" : "bg-transparent border-slate-700"}`} />
                    ))}
                  </div>
                  {error && <p className="text-center text-rose-400 text-sm font-body mb-3" data-testid="delete-pin-error">{error}</p>}
                  <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto">
                    {PAD_KEYS.map((k, i) => (
                      <button
                        key={i}
                        onClick={() => onPinKey(k)}
                        disabled={k === ""}
                        data-testid={k === "" ? `delpad-blank-${i}` : `delpad-key-${k}`}
                        className={`h-16 rounded-2xl flex items-center justify-center font-display text-2xl text-white border ${k === "" ? "opacity-0 pointer-events-none" : "bg-slate-800 border-slate-700 active:bg-slate-700"}`}
                      >
                        {k === "del" ? <Delete className="w-5 h-5" strokeWidth={1.5} /> : k}
                      </button>
                    ))}
                  </div>
                  <button
                    data-testid="delete-cancel"
                    onClick={() => setDeleteStep(null)}
                    className="w-full mt-4 text-slate-400 font-body text-sm py-2 active:text-white"
                  >
                    Cancel
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
