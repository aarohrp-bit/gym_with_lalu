import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, User, UserCircle2, Dumbbell, ChevronRight } from "lucide-react";
import { load, setActive } from "@/lib/storage";

export default function ProfileSelect() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);

  useEffect(() => {
    setProfiles(load().profiles || []);
  }, []);

  const onPickProfile = (p) => navigate(`/pin/${p.id}`);
  const onGuest = () => {
    setActive("guest", true);
    navigate("/dashboard");
  };
  const onAdd = () => navigate("/add-profile");

  return (
    <div className="w-full max-w-md mx-auto px-6 pt-12 pb-24 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-12"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Dumbbell className="w-6 h-6 text-indigo-400" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 font-body">Welcome to</p>
            <h1 className="font-display text-4xl font-bold text-white -mt-0.5">Gym with Lalu</h1>
          </div>
        </div>
        <p className="text-slate-400 text-sm font-body leading-relaxed">
          Choose a profile to continue, or jump in as a guest.
        </p>
      </motion.div>

      <div className="flex flex-col gap-3" data-testid="profile-list">
        {profiles.map((p, idx) => (
          <motion.button
            key={p.id}
            data-testid={`profile-tile-${p.id}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * idx, duration: 0.3 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onPickProfile(p)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between active:bg-slate-800 transition-colors min-h-[72px]"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                <UserCircle2 className="w-5 h-5 text-slate-300" strokeWidth={1.5} />
              </div>
              <span className="font-display text-2xl text-white tracking-tight">{p.name}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500" />
          </motion.button>
        ))}

        {profiles.length === 0 && (
          <div className="text-center py-6 text-slate-500 text-sm font-body">No profiles yet. Add one below.</div>
        )}

        <motion.button
          data-testid="add-profile-button"
          whileTap={{ scale: 0.97 }}
          onClick={onAdd}
          className="w-full bg-transparent border border-dashed border-slate-700 rounded-2xl p-5 flex items-center justify-center gap-2 text-slate-400 active:bg-slate-900 min-h-[64px] mt-2"
        >
          <Plus className="w-5 h-5" strokeWidth={1.75} />
          <span className="font-body font-medium">Add profile</span>
        </motion.button>

        <motion.button
          data-testid="guest-button"
          whileTap={{ scale: 0.97 }}
          onClick={onGuest}
          className="w-full bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-5 flex items-center justify-center gap-2 text-indigo-300 active:bg-indigo-500/20 min-h-[64px] mt-2"
        >
          <User className="w-5 h-5" strokeWidth={1.75} />
          <span className="font-body font-medium">Continue as Guest</span>
        </motion.button>
      </div>

      <p className="text-center text-[11px] text-slate-600 mt-12 font-body tracking-wide">
        Local-only · Works offline
      </p>
    </div>
  );
}
