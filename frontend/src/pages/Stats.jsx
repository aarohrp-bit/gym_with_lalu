import React, { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, Trophy, Flame, TrendingUp, TrendingDown, CalendarDays, BarChart3 } from "lucide-react";
import { load, getActive } from "@/lib/storage";
import { EXERCISES, categoryTitle } from "@/data/exercises";

export default function Stats() {
  const navigate = useNavigate();
  const active = getActive();
  const pid = active ? (active.isGuest ? "guest" : active.profileId) : null;

  useEffect(() => { if (!active) navigate("/"); }, [active, navigate]);

  const stats = useMemo(() => {
    if (!pid) return null;
    const data = load();
    const counts = data.counts[pid] || {};
    const prog = data.progress[pid] || {};

    const meta = {};
    [1, 2, 3, 4, 5, 6].forEach((d) => (EXERCISES[d] || []).forEach((ex) => {
      meta[ex.id] = { name: ex.name, day: ex.day };
    }));

    const all = Object.keys(meta).map((id) => ({ id, name: meta[id].name, day: meta[id].day, n: counts[id] || 0 }));
    const done = all.filter((x) => x.n > 0);
    const totalReps = done.reduce((s, x) => s + x.n, 0);

    let daysDone = 0;
    Object.values(prog).forEach((wk) =>
      Object.entries(wk).forEach(([dn, st]) => { if (Number(dn) <= 6 && st === "done") daysDone++; })
    );

    const most = done.length ? done.reduce((a, b) => (b.n > a.n ? b : a)) : null;
    const least = done.length ? done.reduce((a, b) => (b.n < a.n ? b : a)) : null;

    const catTotals = {};
    all.forEach((x) => { catTotals[x.day] = (catTotals[x.day] || 0) + x.n; });
    let favCat = null, favN = 0;
    Object.entries(catTotals).forEach(([c, n]) => { if (n > favN) { favN = n; favCat = Number(c); } });

    return { totalReps, daysDone, most, least, favCat, hasData: done.length > 0 };
  }, [pid]);

  if (!active || !stats) return null;

  const Stat = ({ icon: Icon, label, value, sub }) => (
    <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-indigo-400" strokeWidth={1.75} />
        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-body">{label}</p>
      </div>
      <p className="font-display text-3xl font-bold text-white tracking-tight leading-none">{value}</p>
      {sub && <p className="text-slate-400 text-xs font-body mt-1">{sub}</p>}
    </div>
  );

  return (
    <div className="w-full max-w-md mx-auto px-6 pt-8 pb-16 min-h-screen">
      <button
        data-testid="back-button"
        onClick={() => navigate("/settings")}
        className="flex items-center gap-1 text-slate-400 active:text-white min-h-[44px] -ml-2 px-2"
      >
        <ChevronLeft className="w-5 h-5" />
        <span className="font-body text-sm">Settings</span>
      </button>

      <h1 className="font-display text-5xl font-bold text-white tracking-tight leading-none mt-4 mb-8">Your stats</h1>

      {!stats.hasData ? (
        <div className="text-center py-16" data-testid="stats-empty">
          <BarChart3 className="w-10 h-10 text-slate-600 mx-auto mb-4" strokeWidth={1.25} />
          <p className="font-body text-slate-400">
            {active.isGuest ? "Guest sessions aren't tracked. Make a profile to build stats." : "Complete some workouts and your stats will appear here."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3" data-testid="stats-grid">
          <Stat icon={Trophy} label="Workouts done" value={stats.daysDone} sub="days completed" />
          <Stat icon={Flame} label="Exercises done" value={stats.totalReps} sub="lifetime total" />
          <div className="col-span-2">
            <Stat
              icon={CalendarDays}
              label="Favourite focus"
              value={stats.favCat ? categoryTitle(stats.favCat) : "—"}
              sub="most-trained muscle group"
            />
          </div>
          <div className="col-span-2">
            <Stat
              icon={TrendingUp}
              label="Most done"
              value={stats.most ? stats.most.name : "—"}
              sub={stats.most ? `${stats.most.n}× completed` : ""}
            />
          </div>
          <div className="col-span-2">
            <Stat
              icon={TrendingDown}
              label="Least done"
              value={stats.least ? stats.least.name : "—"}
              sub={stats.least ? `${stats.least.n}× — give it some love` : ""}
            />
          </div>
        </div>
      )}
    </div>
  );
}
