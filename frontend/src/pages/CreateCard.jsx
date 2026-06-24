import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ImagePlus, Trash2, Check, Share2, Pencil, X, QrCode, Copy, Dumbbell, Zap, Plus } from "lucide-react";
import QRCode from "qrcode";
import { getActive, addCustomCard, getCustomCards, deleteCustomCard, updateCustomCard, MAX_CUSTOM_CARDS } from "@/lib/storage";
import { CATEGORIES } from "@/data/exercises";
import { shareOrDownload } from "@/lib/share";
import { cardShareUrl } from "@/lib/cardlink";

const TARGET_AR = 9 / 16; // 0.5625 — the exercise-card aspect ratio
const AR_TOL = 0.08;       // ±8%

// Validate a portrait ~9:16 image and return a downscaled webp data URL.
function processImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const ar = img.width / img.height;
      if (Math.abs(ar - TARGET_AR) / TARGET_AR > AR_TOL) {
        URL.revokeObjectURL(url);
        reject(new Error(`Photo must be portrait ~9:16 (got ${img.width}×${img.height}).`));
        return;
      }
      const w = Math.min(540, img.width);
      const h = Math.round(w / ar);
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      c.getContext("2d").drawImage(img, 0, 0, w, h);
      let dataUrl;
      try { dataUrl = c.toDataURL("image/webp", 0.82); } catch { dataUrl = c.toDataURL("image/jpeg", 0.82); }
      URL.revokeObjectURL(url);
      resolve(dataUrl);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Couldn't read that image.")); };
    img.src = url;
  });
}

const emptyMini = () => ({ name: "", howTo: "", img: null });

export default function CreateCard() {
  const navigate = useNavigate();
  const active = getActive();
  const pid = active ? (active.isGuest ? "guest" : active.profileId) : null;
  const fileRef = useRef(null);
  const miniFileRef = useRef(null);
  const miniTargetRef = useRef(0);

  const [cardType, setCardType] = useState("A"); // "A" | "B"
  const [name, setName] = useState("");
  const [howTo, setHowTo] = useState("");
  const [whatItDoes, setWhatItDoes] = useState("");
  const [category, setCategory] = useState(1);
  const [image, setImage] = useState(null);
  const [minis, setMinis] = useState(() => [emptyMini(), emptyMini(), emptyMini()]);
  const [imgErr, setImgErr] = useState("");
  const [msg, setMsg] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [qr, setQr] = useState(null);

  useEffect(() => { if (!active) navigate("/"); }, [active, navigate]);
  if (!active) return null;

  const cards = getCustomCards(pid);
  const atLimit = cards.length >= MAX_CUSTOM_CARDS && !editingId;

  const resetForm = () => {
    setCardType("A"); setName(""); setHowTo(""); setWhatItDoes(""); setImage(null);
    setCategory(1); setMinis([emptyMini(), emptyMini(), emptyMini()]); setEditingId(null); setImgErr("");
  };

  const startEdit = (c) => {
    setEditingId(c.id);
    setCardType(c.type === "B" ? "B" : "A");
    setName(c.name || "");
    setCategory(Number(c.category) || 1);
    setImgErr(""); setMsg("");
    if (c.type === "B") {
      setMinis((c.miniExercises || []).map((m) => ({ name: m.name || "", howTo: m.howTo || "", img: m.img || null })));
    } else {
      setHowTo(c.howTo || ""); setWhatItDoes(c.whatItDoes || ""); setImage(c.img || null);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── A photo ──
  const onFile = (e) => {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    setImgErr("");
    processImage(file).then(setImage).catch((err) => setImgErr(err.message));
  };

  // ── Mini editing (Type B) ──
  const setMini = (i, field, val) => setMinis((arr) => arr.map((m, idx) => (idx === i ? { ...m, [field]: val } : m)));
  const addMini = () => setMinis((arr) => (arr.length >= 10 ? arr : [...arr, emptyMini()]));
  const removeMini = (i) => setMinis((arr) => (arr.length <= 2 ? arr : arr.filter((_, idx) => idx !== i)));
  const pickMiniPhoto = (i) => { miniTargetRef.current = i; miniFileRef.current?.click(); };
  const onMiniFile = (e) => {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    setImgErr("");
    processImage(file).then((d) => setMini(miniTargetRef.current, "img", d)).catch((err) => setImgErr(err.message));
  };

  const validMinis = minis.map((m) => ({ ...m, name: m.name.trim() })).filter((m) => m.name);
  const canSave = cardType === "A"
    ? !!(image && name.trim() && !atLimit)
    : !!(name.trim() && validMinis.length >= 2 && !atLimit);

  const onSave = () => {
    if (!canSave) return;
    const card = cardType === "B"
      ? { type: "B", category, name, miniExercises: validMinis }
      : { type: "A", category, name, howTo, whatItDoes, img: image };
    try {
      if (editingId) { updateCustomCard(pid, editingId, card); setMsg("Card updated."); }
      else { addCustomCard(pid, card); setMsg(`${cardType === "B" ? "Circuit" : "Card"} added to your stack.`); }
      resetForm();
      setRefresh((r) => r + 1);
      setTimeout(() => setMsg(""), 2500);
    } catch (err) {
      setMsg(err.message || "Could not save card.");
    }
  };

  const onDelete = (id) => { deleteCustomCard(pid, id); setRefresh((r) => r + 1); };

  const onShareCard = (c) => {
    shareOrDownload("gym-with-lalu-card.json", {
      type: "gym-with-lalu-cards", version: 1, exportedAt: new Date().toISOString(), cards: [c],
    });
  };

  const onQrCard = async (c) => {
    const url = cardShareUrl(c);
    try {
      const dataUrl = await QRCode.toDataURL(url, { margin: 1, width: 320, errorCorrectionLevel: "M", color: { dark: "#0f172a", light: "#ffffff" } });
      setQr({ name: c.name, url, dataUrl, copied: false });
    } catch {
      setQr({ name: c.name, url, dataUrl: null, copied: false });
    }
  };
  const onCopyLink = async () => { try { await navigator.clipboard.writeText(qr.url); setQr((q) => ({ ...q, copied: true })); } catch { /* ignore */ } };
  const onShareLink = async () => { try { if (navigator.share) await navigator.share({ title: "Gym with Lalu card", url: qr.url }); else onCopyLink(); } catch { /* ignore */ } };

  const catTitle = (c) => (CATEGORIES.find((x) => x.id === Number(c))?.title || "");

  return (
    <div className="w-full max-w-md mx-auto px-6 pt-8 pb-16 min-h-screen" data-refresh={refresh}>
      <button data-testid="back-button" onClick={() => navigate("/dashboard")} className="flex items-center gap-1 text-slate-400 active:text-white min-h-[44px] -ml-2 px-2">
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
      <p className="text-slate-400 text-sm font-body mb-5 truncate">Build your own exercise or circuit.</p>

      {/* Type toggle */}
      <div className="grid grid-cols-2 gap-2 mb-5" data-testid="card-type">
        {[
          { key: "A", label: "Exercise", icon: Dumbbell },
          { key: "B", label: "Circuit", icon: Zap },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            data-testid={`type-${key}`}
            onClick={() => setCardType(key)}
            disabled={!!editingId}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl font-body font-medium min-h-[48px] border ${
              cardType === key ? "bg-indigo-400 text-slate-950 border-indigo-400" : "bg-slate-900 text-slate-300 border-slate-800"
            } ${editingId ? "opacity-60" : ""}`}
          >
            <Icon className="w-4 h-4" strokeWidth={1.75} /> {label}
          </button>
        ))}
      </div>

      {/* Name + category (shared) */}
      <p className="text-[11px] uppercase tracking-[0.18em] text-indigo-300/70 font-body mb-2">{cardType === "B" ? "Circuit name" : "Name"}</p>
      <input
        data-testid="card-name-input"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={48}
        placeholder={cardType === "B" ? "e.g. Finisher Circuit" : "e.g. Cable Rear-Delt Fly"}
        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white font-body placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 min-h-[48px]"
      />
      <p className="text-[11px] uppercase tracking-[0.18em] text-indigo-300/70 font-body mb-2 mt-4">Category</p>
      <div className="grid grid-cols-3 gap-2" data-testid="card-category">
        {CATEGORIES.map((c) => (
          <button key={c.id} onClick={() => setCategory(c.id)}
            className={`py-2.5 rounded-xl font-body text-sm border ${category === c.id ? "bg-indigo-400 text-slate-950 border-indigo-400" : "bg-slate-900 text-slate-300 border-slate-800"}`}>
            {c.title}
          </button>
        ))}
      </div>

      {cardType === "A" ? (
        <>
          {/* A photo */}
          <p className="text-[11px] uppercase tracking-[0.18em] text-indigo-300/70 font-body mb-2 mt-5">Photo (portrait 9:16)</p>
          <button data-testid="card-photo-button" onClick={() => fileRef.current?.click()}
            className="w-full aspect-[9/16] max-h-[44vh] rounded-3xl bg-slate-900 border border-dashed border-slate-700 overflow-hidden flex items-center justify-center relative active:bg-slate-800">
            {image ? <img src={image} alt="preview" className="absolute inset-0 w-full h-full object-contain" /> : (
              <div className="text-center text-slate-500">
                <ImagePlus className="w-8 h-8 mx-auto mb-2" strokeWidth={1.5} />
                <p className="font-body text-sm">Tap to choose a photo</p>
              </div>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" data-testid="card-photo-input" />
          <div className="mt-5 space-y-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-indigo-300/70 font-body mb-2">How to perform</p>
              <textarea data-testid="card-howto-input" value={howTo} onChange={(e) => setHowTo(e.target.value)} rows={3} maxLength={400} placeholder="Short cue on how to do it…"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white font-body placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 resize-none" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-indigo-300/70 font-body mb-2">What it does</p>
              <textarea data-testid="card-whatitdoes-input" value={whatItDoes} onChange={(e) => setWhatItDoes(e.target.value)} rows={2} maxLength={240} placeholder="What it trains…"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white font-body placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 resize-none" />
            </div>
          </div>
        </>
      ) : (
        <>
          {/* B circuit builder */}
          <p className="text-[11px] uppercase tracking-[0.18em] text-indigo-300/70 font-body mb-2 mt-5">Mini-exercises ({validMinis.length})</p>
          <input ref={miniFileRef} type="file" accept="image/*" onChange={onMiniFile} className="hidden" data-testid="mini-photo-input" />
          <div className="flex flex-col gap-3" data-testid="mini-list">
            {minis.map((m, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-3" data-testid={`mini-${i}`}>
                <div className="flex items-start gap-2">
                  <span className="font-display text-indigo-400 text-sm w-5 text-center pt-2.5">{i + 1}</span>
                  <div className="flex-1 min-w-0 space-y-2">
                    <input
                      data-testid={`mini-name-${i}`}
                      value={m.name}
                      onChange={(e) => setMini(i, "name", e.target.value)}
                      maxLength={40}
                      placeholder="Move name (e.g. High Knees)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-body text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50"
                    />
                    <input
                      data-testid={`mini-howto-${i}`}
                      value={m.howTo}
                      onChange={(e) => setMini(i, "howTo", e.target.value)}
                      maxLength={160}
                      placeholder="How to (optional)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 font-body text-xs placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>
                  <button onClick={() => pickMiniPhoto(i)} aria-label="Add photo"
                    className="w-12 h-16 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center flex-shrink-0 active:bg-slate-700">
                    {m.img ? <img src={m.img} alt="" className="w-full h-full object-cover" /> : <ImagePlus className="w-4 h-4 text-slate-400" strokeWidth={1.5} />}
                  </button>
                  <button onClick={() => removeMini(i)} disabled={minis.length <= 2} aria-label="Remove move"
                    className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 active:bg-slate-700 disabled:opacity-30">
                    <X className="w-4 h-4 text-slate-400" strokeWidth={2} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {minis.length < 10 && (
            <button data-testid="add-mini" onClick={addMini}
              className="w-full mt-3 flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 border border-dashed border-slate-700 text-slate-400 font-body text-sm active:bg-slate-800 min-h-[48px]">
              <Plus className="w-4 h-4" strokeWidth={1.75} /> Add move
            </button>
          )}
        </>
      )}

      {imgErr && <p className="text-rose-400 text-xs font-body mt-3" data-testid="card-photo-error">{imgErr}</p>}
      {atLimit && <p className="text-amber-400 text-xs font-body mt-4">You've reached {MAX_CUSTOM_CARDS} custom cards. Delete one to add more.</p>}
      {msg && <p className="text-emerald-400 text-sm font-body mt-4" data-testid="card-message">{msg}</p>}

      <motion.button whileTap={{ scale: 0.97 }} data-testid="card-save-button" onClick={onSave} disabled={!canSave}
        className="w-full mt-5 bg-white text-slate-950 rounded-2xl py-4 font-body font-semibold flex items-center justify-center gap-2 min-h-[56px] disabled:opacity-30 disabled:bg-slate-800 disabled:text-slate-500">
        <Check className="w-4 h-4" strokeWidth={2.5} /> {editingId ? "Save changes" : cardType === "B" ? "Add circuit" : "Add card"}
      </motion.button>

      {/* Existing custom cards */}
      {cards.length > 0 && (
        <div className="mt-10">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 font-body mb-3">Your cards ({cards.length}/{MAX_CUSTOM_CARDS})</p>
          <div className="flex flex-col gap-2" data-testid="custom-card-list">
            {cards.map((c) => (
              <div key={c.id} className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-3">
                <div className="w-10 h-14 rounded-lg bg-slate-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {c.type === "B" ? <Zap className="w-5 h-5 text-indigo-300" strokeWidth={1.75} /> : (c.img && <img src={c.img} alt="" className="w-full h-full object-cover" />)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-body text-white text-sm truncate">{c.name}</p>
                  <p className="text-slate-500 text-xs font-body">{catTitle(c.category)} · {c.type === "B" ? `circuit, ${c.miniExercises?.length || 0} moves` : "exercise"}</p>
                </div>
                <button data-testid={`edit-custom-${c.id}`} onClick={() => startEdit(c)} className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center active:bg-slate-700 flex-shrink-0" aria-label="Edit card">
                  <Pencil className="w-4 h-4 text-slate-300" strokeWidth={1.75} />
                </button>
                <button data-testid={`qr-custom-${c.id}`} onClick={() => onQrCard(c)} className="w-9 h-9 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center active:bg-indigo-500/20 flex-shrink-0" aria-label="Share card via QR">
                  <QrCode className="w-4 h-4 text-indigo-300" strokeWidth={1.75} />
                </button>
                <button data-testid={`share-custom-${c.id}`} onClick={() => onShareCard(c)} className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center active:bg-slate-700 flex-shrink-0" aria-label="Share card file">
                  <Share2 className="w-4 h-4 text-slate-300" strokeWidth={1.75} />
                </button>
                <button data-testid={`delete-custom-${c.id}`} onClick={() => onDelete(c.id)} className="w-9 h-9 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center active:bg-rose-500/20 flex-shrink-0" aria-label="Delete card">
                  <Trash2 className="w-4 h-4 text-rose-400" strokeWidth={1.75} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QR share modal */}
      <AnimatePresence>
        {qr && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center px-6" data-testid="qr-modal" onClick={() => setQr(null)}>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center">
              <h3 className="font-display text-3xl font-bold text-white tracking-tight">Scan to add</h3>
              <p className="font-body text-slate-400 text-sm mt-1 mb-5 truncate">{qr.name}</p>
              {qr.dataUrl ? <img src={qr.dataUrl} alt="QR code" className="w-56 h-56 mx-auto rounded-2xl bg-white p-2" data-testid="qr-image" /> : <p className="text-rose-400 text-sm font-body">Couldn't generate a QR.</p>}
              <p className="text-slate-500 text-[11px] font-body mt-4 leading-relaxed">Point any phone camera at this code to open the app and add it. Sent without photos — add them by editing.</p>
              <div className="flex gap-2 mt-5">
                <button data-testid="qr-copy" onClick={onCopyLink} className="flex-1 flex items-center justify-center gap-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-2xl py-3 font-body text-sm active:bg-slate-700 min-h-[48px]">
                  <Copy className="w-4 h-4" strokeWidth={1.75} /> {qr.copied ? "Copied!" : "Copy link"}
                </button>
                <button data-testid="qr-share" onClick={onShareLink} className="flex-1 flex items-center justify-center gap-2 bg-indigo-400 text-slate-950 rounded-2xl py-3 font-body font-semibold text-sm active:bg-indigo-300 min-h-[48px]">
                  <Share2 className="w-4 h-4" strokeWidth={2} /> Share link
                </button>
              </div>
              <button data-testid="qr-close" onClick={() => setQr(null)} className="w-full mt-3 text-slate-400 font-body text-sm py-2 active:text-white">Close</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
