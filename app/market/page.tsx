"use client";
// ================================================================
// Lyde Green Connect — Market Page
// app/market/page.tsx
// ================================================================
import { useState, useEffect, useRef } from "react";
import AppShell from "@/components/bs16/AppShell";
import { createClient } from "@/lib/supabase";
import { moderateContent, checkRateLimit, formatResetTime, formatPrice, relativeTime, NEIGHBOURHOODS, type Neighbourhood } from "@/lib/utils";
import { Plus, Package, X, Loader2, Flag, ImageIcon, EyeOff, Eye, Trash2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

const FILTERS = ["All", "For Sale", "Free / Swap", "Ask / Wanted", "Available Only"] as const;

// ── Welcome Banner ────────────────────────────────────────────────
function WelcomeBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [showTrades, setShowTrades] = useState(false);
  if (dismissed) return null;
  return (
    <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 rounded-2xl p-5 mb-5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8 pointer-events-none" />
      <button onClick={() => setDismissed(true)} className="absolute top-3 right-3 w-7 h-7 bg-white/10 rounded-full flex items-center justify-center text-white/70 hover:bg-white/20">
        <X className="w-3.5 h-3.5" />
      </button>
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm">🏡</span>
          <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider">Phase 1 — Community Hub</span>
        </div>
        <h2 className="text-white font-bold text-lg leading-snug mb-2">Welcome to Lyde Green Connect</h2>
        <p className="text-emerald-100 text-sm leading-relaxed mb-4">Your private community exchange for Lyde Green residents. Gift, swap, sell and share with your neighbours.</p>
        <span className="inline-flex items-center gap-2 bg-white/10 text-white/60 text-xs px-3 py-2 rounded-xl border border-white/10">
          🔨 Trader registration coming in Phase 2
        </span>
      </div>
    </div>
  );
}

// ── Flag button ───────────────────────────────────────────────────
function FlagBtn({ targetTable, targetId }: { targetTable: string; targetId: string }) {
  const [state, setState] = useState<"idle"|"confirm"|"done">("idle");
  const handleFlag = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Sign in to report posts"); return; }
    try {
      await supabase.from("content_flags").insert({ reporter_id: user.id, target_table: targetTable, target_id: targetId });
      await supabase.rpc("increment_flag_count", { p_table: targetTable, p_id: targetId });
      setState("done"); toast.success("Post reported. Thank you.");
    } catch { toast.error("Already reported"); setState("idle"); }
  };
  if (state === "done") return <span className="text-[10px] text-slate-400">Reported ✓</span>;
  if (state === "confirm") return (
    <div className="flex items-center gap-1.5">
      <button onClick={handleFlag} className="text-[10px] font-semibold px-2 py-1 bg-red-100 text-red-700 rounded-lg">Confirm</button>
      <button onClick={() => setState("idle")} className="text-[10px] text-slate-400">Cancel</button>
    </div>
  );
  return <button onClick={() => setState("confirm")} className="opacity-30 hover:opacity-100 transition-opacity"><Flag className="w-3 h-3 text-slate-500" /></button>;
}

// ── Lightbox ─────────────────────────────────────────────────────
function Lightbox({ imgs, startIdx, onClose }: { imgs: string[]; startIdx: number; onClose: () => void }) {
  const [idx, setIdx] = useState(startIdx);
  const startX = useRef<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIdx(i => Math.min(imgs.length - 1, i + 1));
      if (e.key === "ArrowLeft") setIdx(i => Math.max(0, i - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [imgs.length, onClose]);

  const onTouchStart = (e: React.TouchEvent) => { startX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (startX.current === null) return;
    const diff = startX.current - e.changedTouches[0].clientX;
    if (diff > 40) setIdx(i => Math.min(imgs.length - 1, i + 1));
    else if (diff < -40) setIdx(i => Math.max(0, i - 1));
    startX.current = null;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/95 flex items-center justify-center"
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 z-10">
        <X className="w-5 h-5" />
      </button>
      {imgs.length > 1 && <span className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">{idx + 1} / {imgs.length}</span>}
      <img src={imgs[idx]} alt={`Photo ${idx + 1}`} className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" />
      {imgs.length > 1 && (
        <>
          {idx > 0 && <button onClick={() => setIdx(i => i - 1)} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white text-xl hover:bg-white/20">‹</button>}
          {idx < imgs.length - 1 && <button onClick={() => setIdx(i => i + 1)} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white text-xl hover:bg-white/20">›</button>}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5">
            {imgs.map((_, i) => <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === idx ? "bg-white" : "bg-white/30"}`} />)}
          </div>
        </>
      )}
    </div>
  );
}

// ── Listing Carousel ─────────────────────────────────────────────
function ListingCarousel({ listing }: { listing: any }) {
  const [idx, setIdx] = useState(0);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const imgs: string[] = listing.image_urls?.length ? listing.image_urls : listing.image_url ? [listing.image_url] : [];
  const startX = useRef<number | null>(null);
  const didSwipe = useRef(false);

  const prev = (e: React.MouseEvent) => { e.stopPropagation(); setIdx(i => Math.max(0, i - 1)); };
  const next = (e: React.MouseEvent) => { e.stopPropagation(); setIdx(i => Math.min(imgs.length - 1, i + 1)); };

  const onTouchStart = (e: React.TouchEvent) => { startX.current = e.touches[0].clientX; didSwipe.current = false; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (startX.current === null) return;
    const diff = startX.current - e.changedTouches[0].clientX;
    if (diff > 40) { setIdx(i => Math.min(imgs.length - 1, i + 1)); didSwipe.current = true; }
    else if (diff < -40) { setIdx(i => Math.max(0, i - 1)); didSwipe.current = true; }
    startX.current = null;
  };

  const handleImageClick = () => {
    if (didSwipe.current || imgs.length === 0) return;
    setLightboxIdx(idx);
  };

  return (
    <>
      <div className="relative h-36 bg-slate-100 flex-shrink-0 overflow-hidden"
        onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {imgs.length > 0
          ? <img src={imgs[idx]} alt={listing.title} className="w-full h-full object-cover cursor-zoom-in" onClick={handleImageClick} />
          : <div className="w-full h-full flex items-center justify-center text-3xl text-slate-300">📦</div>}
        {imgs.length > 1 && (
          <>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {imgs.map((_, i) => <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === idx ? "bg-white" : "bg-white/40"}`} />)}
            </div>
            {idx > 0 && <button onClick={prev} className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-900/40 rounded-full flex items-center justify-center text-white text-xs">‹</button>}
            {idx < imgs.length - 1 && <button onClick={next} className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-900/40 rounded-full flex items-center justify-center text-white text-xs">›</button>}
          </>
        )}
        {listing.status === "gone" && <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center"><span className="bg-white text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">GONE</span></div>}
        <div className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${listing.is_wanted ? "bg-blue-600 text-white" : listing.is_free_swap || (listing.price_pence ?? 0) === 0 ? "bg-emerald-600 text-white" : "bg-white text-slate-800 border border-slate-200"}`}>
          {listing.is_wanted ? "Ask / Wanted" : formatPrice(listing.price_pence, listing.is_free_swap)}
        </div>
      </div>
      {lightboxIdx !== null && <Lightbox imgs={imgs} startIdx={lightboxIdx} onClose={() => setLightboxIdx(null)} />}
    </>
  );
}

export default function MarketPage() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<typeof FILTERS[number]>("All");
  const [showCreate, setShowCreate] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user);
      if (data.user) {
        const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", data.user.id).single();
        const admin = profile?.is_admin === true;
        setIsAdmin(admin);
        loadListings(admin);
      } else {
        loadListings(false);
      }
    });
  }, []);

  const loadListings = async (adminMode = false) => {
    const supabase = createClient();
    let query = supabase.from("market_listings")
      .select("*, profiles:user_id(display_name, neighbourhood)")
      .order("created_at", { ascending: false });
    if (!adminMode) query = query.eq("is_visible", true);
    const { data } = await query;
    setListings(data || []); setLoading(false);
  };

  const filtered = listings.filter(l => {
    if (filter === "For Sale") return !l.is_free_swap && (l.price_pence ?? 0) > 0;
    if (filter === "Free / Swap") return l.is_free_swap || l.price_pence === 0;
    if (filter === "Available Only") return l.status === "available";
    if (filter === "Ask / Wanted") return l.is_wanted === true;
    return true;
  });

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 pt-4 pb-6">
        <WelcomeBanner />
        <div className="flex items-center justify-between mb-4">
          <div><h1 className="text-xl font-bold text-slate-900">Community Exchange</h1><p className="text-sm text-slate-500">Gift, swap & sell with your neighbours</p></div>
          <button onClick={() => user ? setShowCreate(true) : toast.error("Sign in to post")}
            className="flex items-center gap-2 bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-800 transition-colors">
            <Plus className="w-4 h-4" /> Post Item
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === f ? "bg-emerald-700 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-emerald-300"}`}>
              {f}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="grid grid-cols-2 gap-3">{[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse"><div className="h-36 bg-slate-100" /><div className="p-3 space-y-2"><div className="h-3 bg-slate-100 rounded w-3/4" /><div className="h-3 bg-slate-100 rounded w-1/2" /></div></div>)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16"><Package className="w-10 h-10 text-slate-300 mx-auto mb-3" /><p className="text-slate-500 font-medium">No listings yet</p><p className="text-slate-400 text-sm mt-1">Be the first to post something!</p></div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(l => (
              <div key={l.id} className={`bg-white rounded-2xl border overflow-hidden flex flex-col ${l.status === "gone" ? "opacity-60" : ""} ${!l.is_visible ? "border-orange-300 bg-orange-50/30" : "border-slate-200"}`}>
                <ListingCarousel listing={l} />
                <div className="p-3 flex flex-col flex-1 gap-2">
                  {!l.is_visible && <div className="flex items-center gap-1.5 bg-orange-100 text-orange-700 text-[10px] font-semibold px-2 py-1 rounded-lg"><EyeOff className="w-3 h-3" />Hidden from residents</div>}
                  <div><h3 className="text-sm font-semibold text-slate-900 leading-tight line-clamp-2">{l.title}</h3>{l.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{l.description}</p>}</div>
                  <span className="text-[10px] text-slate-500">📍 {l.profiles?.neighbourhood || l.neighbourhood}</span>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-[10px] text-slate-400">{relativeTime(l.created_at)}</span>
                    <FlagBtn targetTable="market_listings" targetId={l.id} />
                  </div>
                  {l.user_id !== user?.id && l.status !== "gone" && l.is_visible && (
                    <a href={`/inbox?new=1&listing_id=${l.id}&listing_type=market&receiver_id=${l.user_id}&receiver_name=${encodeURIComponent(l.profiles?.display_name || "Seller")}`}
                      className="w-full py-2 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-xl hover:bg-emerald-100 border border-emerald-200 block text-center">💬 Message Seller</a>
                  )}
                  {isAdmin && <AdminControls listing={l} onRefresh={() => loadListings(true)} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {showCreate && <CreateListingModal user={user} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); loadListings(); }} />}
    </AppShell>
  );
}

// ── Admin Controls ───────────────────────────────────────────────
function AdminControls({ listing, onRefresh }: { listing: any; onRefresh: () => void }) {
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const toggleVisibility = async () => {
    setBusy(true);
    const supabase = createClient();
    await supabase.from("market_listings").update({ is_visible: !listing.is_visible }).eq("id", listing.id);
    toast.success(listing.is_visible ? "Listing hidden" : "Listing restored");
    onRefresh();
    setBusy(false);
  };

  const deleteListing = async () => {
    setBusy(true);
    const supabase = createClient();
    await supabase.from("market_listings").delete().eq("id", listing.id);
    toast.success("Listing deleted");
    onRefresh();
    setBusy(false);
  };

  if (confirmDelete) return (
    <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-xl p-2">
      <ShieldAlert className="w-3.5 h-3.5 text-red-600 shrink-0" />
      <span className="text-[10px] text-red-700 font-medium flex-1">Delete permanently?</span>
      <button onClick={deleteListing} disabled={busy} className="text-[10px] font-bold px-2 py-1 bg-red-600 text-white rounded-lg disabled:opacity-50">Yes</button>
      <button onClick={() => setConfirmDelete(false)} className="text-[10px] text-slate-500">No</button>
    </div>
  );

  return (
    <div className="flex gap-1.5 pt-1 border-t border-slate-100">
      <button onClick={toggleVisibility} disabled={busy}
        className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-semibold border transition-colors disabled:opacity-50 ${listing.is_visible ? "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100" : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"}`}>
        {listing.is_visible ? <><EyeOff className="w-3 h-3" />Hide</> : <><Eye className="w-3 h-3" />Restore</>}
      </button>
      <button onClick={() => setConfirmDelete(true)} disabled={busy}
        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50">
        <Trash2 className="w-3 h-3" />Delete
      </button>
    </div>
  );
}

function CreateListingModal({ user, onClose, onCreated }: { user: any; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ title: "", description: "", price: "", isFreeSwap: false, isWanted: false });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    const rl = checkRateLimit(user.id);
    if (!rl.allowed) { setError(`Please wait ${formatResetTime(rl.resetInMs)} before posting again.`); return; }
    const titleMod = moderateContent(form.title);
    if (!titleMod.safe) { setError("Your title contains content that isn't allowed."); return; }
    const descMod = moderateContent(form.description);
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: profile } = await supabase.from("profiles").select("neighbourhood").eq("id", user.id).single();
      const uploadedUrls: string[] = [];
      for (const file of imageFiles) {
        const ext = file.name.split(".").pop();
        const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("market-images")
          .upload(filePath, file, { upsert: false });
        if (uploadError) { setError("Image upload failed. Please try again."); setLoading(false); return; }
        const { data: urlData } = supabase.storage.from("market-images").getPublicUrl(filePath);
        uploadedUrls.push(urlData.publicUrl);
      }
      await supabase.from("market_listings").insert({
        user_id: user.id, title: titleMod.sanitised, description: descMod.sanitised,
        price_pence: form.isFreeSwap ? null : form.price ? Math.round(parseFloat(form.price) * 100) : 0,
        is_free_swap: form.isFreeSwap, is_wanted: form.isWanted, neighbourhood: profile?.neighbourhood || "Lyde Green",
        image_url: uploadedUrls[0] || null,
        image_urls: uploadedUrls,
      });
      onCreated();
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const combined = [...imageFiles, ...files].slice(0, 5);
    const oversized = combined.find(f => f.size > 5 * 1024 * 1024);
    if (oversized) { setError("Each image must be under 5MB."); return; }
    setImageFiles(combined);
    setImagePreviews(combined.map(f => URL.createObjectURL(f)));
    setError("");
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">Post an Item</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-1.5"><label className="text-sm font-medium text-slate-700">Title *</label><input type="text" placeholder="e.g. IKEA bookshelf, barely used" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} maxLength={80} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
          <div className="space-y-1.5"><label className="text-sm font-medium text-slate-700">Description</label><textarea placeholder="Condition, dimensions…" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} maxLength={500} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" /></div>
          <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Pricing</label>
            <div className="flex gap-2">
              {[["false","Set Price"],["free","Free / Swap"],["wanted","Ask / Wanted"]].map(([val, label]) => {
              const active = val === "wanted" ? form.isWanted : val === "free" ? form.isFreeSwap && !form.isWanted : !form.isFreeSwap && !form.isWanted;
              return (
                <button key={val} onClick={() => setForm(f => ({ ...f, isWanted: val === "wanted", isFreeSwap: val === "free", price: val !== "false" ? "" : f.price }))}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${active ? "bg-emerald-700 text-white border-emerald-700" : "border-slate-200 text-slate-600"}`}>
                  {label}
                </button>
              );
            })}
            </div>
            {!form.isFreeSwap && !form.isWanted && <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">£</span><input type="number" min="0" step="0.01" placeholder="0.00" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="w-full pl-7 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>}
          </div>
          {/* Photo upload */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">Photos <span className="text-slate-400 font-normal">(optional · up to 5)</span></label>
              {imagePreviews.length > 0 && <span className="text-xs text-slate-400">{imagePreviews.length} / 5</span>}
            </div>
            {imagePreviews.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {imagePreviews.map((src, i) => (
                  <div key={i} className="relative shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-slate-200">
                    <img src={src} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                    <button onClick={() => removeImage(i)} className="absolute top-1 right-1 w-5 h-5 bg-slate-900/60 rounded-full flex items-center justify-center text-white hover:bg-slate-900/80">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
                {imagePreviews.length < 5 && (
                  <label className="shrink-0 w-20 h-20 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/40 transition-colors">
                    <ImageIcon className="w-5 h-5 text-slate-400" />
                    <span className="text-[10px] text-slate-400 mt-1">Add</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleImageChange} />
                  </label>
                )}
              </div>
            )}
            {imagePreviews.length === 0 && (
              <label className="flex flex-col items-center justify-center gap-2 w-full h-28 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/40 transition-colors">
                <ImageIcon className="w-6 h-6 text-slate-400" />
                <span className="text-sm text-slate-500">Tap to add photos</span>
                <span className="text-xs text-slate-400">JPG, PNG or WEBP · max 5MB each</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleImageChange} />
              </label>
            )}
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>}
        </div>
        <div className="p-5 pt-0 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm">Cancel</button>
          <button onClick={handleSubmit} disabled={loading || !form.title.trim()} className="flex-1 py-3 rounded-xl bg-emerald-700 text-white font-semibold text-sm hover:bg-emerald-800 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Posting…</> : "Post Item"}
          </button>
        </div>
      </div>
    </div>
  );
}
