import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, ImagePlus, Trash2, Check, Share2, Pencil, X } from "lucide-react";
import { getActive, addCustomCard, getCustomCards, deleteCustomCard, updateCustomCard, MAX_CUSTOM_CARDS } from "@/lib/storage";
import { CATEGORIES } from "@/data/exercises";
import { shareOrDownload } from "@/lib/share";

const TARGET_AR = 9 / 16; // 0.5625 — the exercise-card aspect ratio
const AR_TOL = 0.08;       // ±8%

export default function CreateCard() {
  const navigate = useNavigate();
  const active = getActive();
  const pid = active ? (active.isGuest ? "guest" : active.profileId) : null;
  const fileRef = useRef(null);

  const [name, setName] = useState("");
  const [howTo, setHowTo] = useState("");
  const [whatItDoes, setWhatItDoes] = useState("");
  const [category, setCategory] = useState(1);
  const [image, setImage] = useState(null);
  const [imgErr, setImgErr] = useState("");
  const [msg, setMsg] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => { if (!active) navigate("/"); }, [active, navigate]);
  if (!active) return null;

  const cards = getCustomCards(pid);
  const atLimit = cards.length >= MAX_CUSTOM_CARDS && !editingId;

  const resetForm = () => {
    setName(""); setHowTo(""); setWhatItDoes(""); setImage(null); setCategory(1); setEditingId(null); setImgErr("");
  };

  const startEdit = (c) => {
    setEditingId(c.id);
    setName(c.name || ""); setHowTo(c.howTo || ""); setWhatItDoes(c.whatItDoes || "");
    setCategory(Number(c.category) || 1); setImage(c.img || null); setImgErr(""); setMsg("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onShareCard = (c) => {
    shareOrDownload("gym-with-lalu-card.json", {
      type: "gym-with-lalu-cards", version: 1, exportedAt: new Date().toISOString(),
      cards: [{ category: c.category, name: c.name, howTo: c.howTo, whatItDoes: c.whatItDoes, img: c.img }],
    });
  };

  const onFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImgErr("");
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const ar = img.width / img.height;
      if (Math.abs(ar - TARGET_AR) / TARGET_AR > AR_TOL) {
        setImgErr(`Photo must be portrait ~9:16 (got ${img.width}×${img.height}). A phone screenshot or a 1080×1920 image works.`);
        URL.revokeObjectURL(url);
        return;
      }
      const w = Math.min(540, img.width);
      const h = Math.round(w / ar);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      let dataUrl;
      try { dataUrl = canvas.toDataURL("image/webp", 0.82); } catch { dataUrl = canvas.toDataURL("image/jpeg", 0.82); }
      setImage(dataUrl);
      URL.revokeObjectURL(url);
    };
    img.onerror = () => { setImgErr("Couldn't read that image."); URL.revokeObjectURL(url); };
    img.src = url;
  };

  const canSave = image && name.trim() && !atLimit;

  const onSave = () => {
    if (!canSave) return;
    try {
      if (editingId) {
        updateCustomCard(pid, editingId, { category, name, howTo, whatItDoes, img: image });
        setMsg("Card updated.");
      } else {
        addCustomCard(pid, { category, name, howTo, whatItDoes, img: image });
        setMsg("Card added to your stack.");
      }
      resetForm();
      setRefresh((r) => r + 1);
      setTimeout(() => setMsg(""), 2500);
    } catch (err) {
      setMsg(err.message || "Could not save card.");
    }
  };

  const onDelete = (id) => {
    deleteCustomCard(pid, id);
    setRefresh((r) => r + 1);
  };

  const catTitle = (c) => (CATEGORIES.find((x) => x.id === Number(c))?.title || "");

  return (
    <div className="w-full max-w-md mx-auto px-6 pt-8 pb-16 min-h-screen" data-refresh={refresh}>
      <button
        data-testid="back-button"
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-1 text-slate-400 active:text-white min-h-[44px] -ml-2 px-2"
      >
        <ChevronLeft className="w-5 h-5" />
        <span className="font-body text-sm">Week</span>
      </button>

      <div className="flex items-center justify-between mt-4 mb-2">
        <h1 className="font-display text-5xl font-bold text-white tracking-tight leading-none">{editingId ? "Edit card" : "Make a card"}</h1>
        {editingId && (
          <button data-testid="cancel-edit" onClick={resetForm} className="flex items-center gap-1 text-slate-400 active:text-white text-sm font-body">
            <X className="w-4 h-4" /> Cancel
          </button>
        )}
      </div>
      <p className="text-slate-400 text-sm font-body mb-7 truncate">Build your own exercise card.</p>

      {/* Photo */}
      <p className="text-[11px] uppercase tracking-[0.18em] text-indigo-300/70 font-body mb-2">Photo (portrait 9:16)</p>
      <button
        data-testid="card-photo-button"
        onClick={() => fileRef.current?.click()}
        className="w-full aspect-[9/16] max-h-[46vh] rounded-3xl bg-slate-900 border border-dashed border-slate-700 overflow-hidden flex items-center justify-center relative active:bg-slate-800"
      >
        {image ? (
          <img src={image} alt="preview" className="absolute inset-0 w-full h-full object-contain" />
        ) : (
          <div className="text-center text-slate-500">
            <ImagePlus className="w-8 h-8 mx-auto mb-2" strokeWidth={1.5} />
            <p className="font-body text-sm">Tap to choose a photo</p>
          </div>
        )}
      </button>
      <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" data-testid="card-photo-input" />
      {imgErr && <p className="text-rose-400 text-xs font-body mt-2" data-testid="card-photo-error">{imgErr}</p>}

      {/* Fields */}
      <div className="mt-5 space-y-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-indigo-300/70 font-body mb-2">Name</p>
          <input
            data-testid="card-name-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={48}
            placeholder="e.g. Cable Rear-Delt Fly"
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white font-body placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 min-h-[48px]"
          />
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-indigo-300/70 font-body mb-2">How to perform</p>
          <textarea
            data-testid="card-howto-input"
            value={howTo}
            onChange={(e) => setHowTo(e.target.value)}
            rows={3}
            maxLength={400}
            placeholder="Short cue on how to do it…"
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white font-body placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 resize-none"
          />
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-indigo-300/70 font-body mb-2">What it does</p>
          <textarea
            data-testid="card-whatitdoes-input"
            value={whatItDoes}
            onChange={(e) => setWhatItDoes(e.target.value)}
            rows={2}
            maxLength={240}
            placeholder="What it trains…"
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white font-body placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 resize-none"
          />
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-indigo-300/70 font-body mb-2">Category</p>
          <div className="grid grid-cols-3 gap-2" data-testid="card-category">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`py-2.5 rounded-xl font-body text-sm border ${
                  category === c.id ? "bg-indigo-400 text-slate-950 border-indigo-400" : "bg-slate-900 text-slate-300 border-slate-800"
                }`}
              >
                {c.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {atLimit && <p className="text-amber-400 text-xs font-body mt-4">You've reached {MAX_CUSTOM_CARDS} custom cards. Delete one to add more.</p>}
      {msg && <p className="text-emerald-400 text-sm font-body mt-4" data-testid="card-message">{msg}</p>}

      <motion.button
        whileTap={{ scale: 0.97 }}
        data-testid="card-save-button"
        onClick={onSave}
        disabled={!canSave}
        className="w-full mt-5 bg-white text-slate-950 rounded-2xl py-4 font-body font-semibold flex items-center justify-center gap-2 min-h-[56px] disabled:opacity-30 disabled:bg-slate-800 disabled:text-slate-500"
      >
        <Check className="w-4 h-4" strokeWidth={2.5} /> {editingId ? "Save changes" : "Add card"}
      </motion.button>

      {/* Existing custom cards */}
      {cards.length > 0 && (
        <div className="mt-10">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 font-body mb-3">Your cards ({cards.length}/{MAX_CUSTOM_CARDS})</p>
          <div className="flex flex-col gap-2" data-testid="custom-card-list">
            {cards.map((c) => (
              <div key={c.id} className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-3">
                <div className="w-10 h-14 rounded-lg bg-slate-800 overflow-hidden flex-shrink-0">
                  {c.img && <img src={c.img} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-body text-white text-sm truncate">{c.name}</p>
                  <p className="text-slate-500 text-xs font-body">{catTitle(c.category)}</p>
                </div>
                <button
                  data-testid={`edit-custom-${c.id}`}
                  onClick={() => startEdit(c)}
                  className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center active:bg-slate-700 flex-shrink-0"
                  aria-label="Edit card"
                >
                  <Pencil className="w-4 h-4 text-slate-300" strokeWidth={1.75} />
                </button>
                <button
                  data-testid={`share-custom-${c.id}`}
                  onClick={() => onShareCard(c)}
                  className="w-9 h-9 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center active:bg-indigo-500/20 flex-shrink-0"
                  aria-label="Share card"
                >
                  <Share2 className="w-4 h-4 text-indigo-300" strokeWidth={1.75} />
                </button>
                <button
                  data-testid={`delete-custom-${c.id}`}
                  onClick={() => onDelete(c.id)}
                  className="w-9 h-9 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center active:bg-rose-500/20 flex-shrink-0"
                  aria-label="Delete card"
                >
                  <Trash2 className="w-4 h-4 text-rose-400" strokeWidth={1.75} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
