"use client";
// ================================================================
// Lyde Green Connect — Skill & Time Swap Page
// app/swap/page.tsx
// ================================================================
import { useState, useEffect } from "react";
import AppShell from "@/components/bs16/AppShell";
import { createClient } from "@/lib/supabase";
import { moderateContent, checkRateLimit, formatResetTime, relativeTime } from "@/lib/utils";
import { Plus, ArrowLeftRight, X, Loader2, EyeOff, Eye, Trash2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type SwapCategory =
  | "Garden" | "Tech" | "Finance" | "Cooking"
  | "DIY" | "Childcare" | "Tutoring" | "Fitness" | "Creative" | "Other";

const SWAP_CATEGORIES: SwapCategory[] = [
  "Garden","Tech","Finance","Cooking","DIY","Childcare","Tutoring","Fitness","Creative","Other",
];

const CAT_CONFIG: Record<SwapCategory, { emoji: string; stripe: string; bg: string; text: string; border: string }> = {
  "Garden":    { emoji: "🌱", stripe: "bg-emerald-400", bg: "bg-emerald-50",  text: "text-emerald-700", border: "border-emerald-200" },
  "Tech":      { emoji: "💻", stripe: "bg-blue-400",    bg: "bg-blue-50",     text: "text-blue-700",    border: "border-blue-200"    },
  "Finance":   { emoji: "💰", stripe: "bg-amber-400",   bg: "bg-amber-50",    text: "text-amber-700",   border: "border-amber-200"   },
  "Cooking":   { emoji: "🍳", stripe: "bg-orange-400",  bg: "bg-orange-50",   text: "text-orange-700",  border: "border-orange-200"  },
  "DIY":       { emoji: "🔨", stripe: "bg-stone-400",   bg: "bg-stone-50",    text: "text-stone-700",   border: "border-stone-200"   },
  "Childcare": { emoji: "👶", stripe: "bg-pink-400",    bg: "bg-pink-50",     text: "text-pink-700",    border: "border-pink-200"    },
  "Tutoring":  { emoji: "📚", stripe: "bg-violet-400",  bg: "bg-violet-50",   text: "text-violet-700",  border: "border-violet-200"  },
  "Fitness":   { emoji: "🏃", stripe: "bg-cyan-400",    bg: "bg-cyan-50",     text: "text-cyan-700",    border: "border-cyan-200"    },
  "Creative":  { emoji: "🎨", stripe: "bg-rose-400",    bg: "bg-rose-50",     text: "text-rose-700",    border: "border-rose-200"    },
  "Other":     { emoji: "✨", stripe: "bg-slate-400",   bg: "bg-slate-50",    text: "text-slate-700",   border: "border-slate-200"   },
};

function SwapCard({ swap, userId, isAdmin, onRefresh }: { swap: any; userId: string; isAdmin: boolean; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();
  const cfg = CAT_CONFIG[swap.category as SwapCategory];

  const handleInterest = () => {
    if (!userId) { toast.error("Sign in to message"); return; }
    if (userId === swap.user_id) { toast.error("This is your own listing"); return; }
    const convId = [userId, swap.user_id, swap.id].sort().join("_");
    router.push(`/inbox?conv=${convId}&recipient=${swap.user_id}&ref=swap&title=${encodeURIComponent(swap.title)}`);
  };

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden ${!swap.is_visible ? "border-orange-300 bg-orange-50/30" : "border-slate-200"}`}>
      <div className={`h-1 ${cfg.stripe}`} />
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
            {cfg.emoji} {swap.category}
          </span>
          <span className="text-[10px] text-slate-400">{relativeTime(swap.created_at)}</span>
        </div>
        {!swap.is_visible && <div className="flex items-center gap-1.5 bg-orange-100 text-orange-700 text-[10px] font-semibold px-2 py-1 rounded-lg mb-2"><EyeOff className="w-3 h-3" />Hidden from residents</div>}
        <h3 className="font-semibold text-slate-900 text-sm leading-snug mb-2">{swap.title}</h3>
        <div className="space-y-1.5 mb-3">
          <div className="flex items-start gap-2">
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0 mt-0.5">Offering</span>
            <p className="text-xs text-slate-600 leading-snug">{swap.offering}</p>
          </div>
          {swap.seeking && (
            <div className="flex items-start gap-2">
              <span className="text-[10px] font-bold text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full shrink-0 mt-0.5">Seeking</span>
              <p className="text-xs text-slate-600 leading-snug">{swap.seeking}</p>
            </div>
          )}
        </div>
        {swap.description && (
          <>
            <p className={`text-sm text-slate-600 leading-relaxed ${!expanded ? "line-clamp-2" : ""}`}>{swap.description}</p>
            {swap.description.length > 120 && (
              <button onClick={() => setExpanded(!expanded)} className="text-xs text-emerald-700 font-medium mt-1 hover:underline">
                {expanded ? "Show less" : "Read more"}
              </button>
            )}
          </>
        )}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-[9px] font-bold text-emerald-700">
              {(swap.profiles?.display_name || "?")[0].toUpperCase()}
            </div>
            <span className="text-xs text-slate-500">{swap.profiles?.display_name || "Neighbour"}</span>
          </div>
          {userId !== swap.user_id && (
            <button onClick={handleInterest}
              className="flex items-center gap-1.5 bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl hover:bg-emerald-800 transition-colors">
              <ArrowLeftRight className="w-3 h-3" /> I'm Interested
            </button>
          )}
        </div>
        {isAdmin && <AdminSwapControls swap={swap} onRefresh={onRefresh} />}
      </div>
    </div>
  );
}

// ── Admin Swap Controls ──────────────────────────────────────────
function AdminSwapControls({ swap, onRefresh }: { swap: any; onRefresh: () => void }) {
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const toggleVisibility = async () => {
    setBusy(true);
    const supabase = createClient();
    await supabase.from("skill_swaps").update({ is_visible: !swap.is_visible }).eq("id", swap.id);
    toast.success(swap.is_visible ? "Swap hidden" : "Swap restored");
    onRefresh();
    setBusy(false);
  };

  const deleteSwap = async () => {
    setBusy(true);
    const supabase = createClient();
    await supabase.from("skill_swaps").delete().eq("id", swap.id);
    toast.success("Swap deleted");
    onRefresh();
    setBusy(false);
  };

  if (confirmDelete) return (
    <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-xl p-2 mt-2">
      <ShieldAlert className="w-3.5 h-3.5 text-red-600 shrink-0" />
      <span className="text-[10px] text-red-700 font-medium flex-1">Delete permanently?</span>
      <button onClick={deleteSwap} disabled={busy} className="text-[10px] font-bold px-2 py-1 bg-red-600 text-white rounded-lg disabled:opacity-50">Yes</button>
      <button onClick={() => setConfirmDelete(false)} className="text-[10px] text-slate-500">No</button>
    </div>
  );

  return (
    <div className="flex gap-1.5 mt-2 pt-2 border-t border-slate-100">
      <button onClick={toggleVisibility} disabled={busy}
        className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-semibold border transition-colors disabled:opacity-50 ${swap.is_visible ? "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100" : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"}`}>
        {swap.is_visible ? <><EyeOff className="w-3 h-3" />Hide</> : <><Eye className="w-3 h-3" />Restore</>}
      </button>
      <button onClick={() => setConfirmDelete(true)} disabled={busy}
        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50">
        <Trash2 className="w-3 h-3" />Delete
      </button>
    </div>
  );
}

function CreateSwapModal({ user, onClose, onCreated }: { user: any; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ title: "", category: "" as SwapCategory | "", offering: "", seeking: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!form.category) { setError("Please select a category."); return; }
    if (!form.offering.trim()) { setError("Please describe what you're offering."); return; }
    const rl = checkRateLimit(user.id);
    if (!rl.allowed) { setError(`Please wait ${formatResetTime(rl.resetInMs)} before posting again.`); return; }
    const titleMod = moderateContent(form.title);
    const offeringMod = moderateContent(form.offering);
    if (!titleMod.safe || !offeringMod.safe) { setError("Your post contains content that isn't allowed."); return; }
    setLoading(true);
    try {
      const supabase = createClient();
      await supabase.from("skill_swaps").insert({
        user_id: user.id, title: titleMod.sanitised, category: form.category,
        offering: offeringMod.sanitised, seeking: form.seeking.trim() || null,
        description: form.description.trim() || null, status: "active",
      });
      onCreated(); toast.success("Skill swap posted!");
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="font-bold text-slate-900">Offer a Skill or Time</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">Category *</label>
            <div className="grid grid-cols-5 gap-2">
              {SWAP_CATEGORIES.map(cat => {
                const cfg = CAT_CONFIG[cat];
                return (
                  <button key={cat} onClick={() => setForm(f => ({ ...f, category: cat }))}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-[10px] font-medium transition-colors
                      ${form.category === cat ? `${cfg.bg} ${cfg.text} border-2 ${cfg.border}` : "border-slate-200 hover:bg-slate-50 text-slate-600"}`}>
                    <span className="text-base">{cfg.emoji}</span>
                    <span className="leading-tight text-center">{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Title *</label>
            <input type="text" placeholder="e.g. Garden help in exchange for cooking lessons"
              value={form.title} maxLength={100} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">What are you offering? *</label>
            <textarea placeholder="e.g. I can help with weeding, planting, and general garden tidying"
              value={form.offering} maxLength={500} onChange={e => setForm(f => ({ ...f, offering: e.target.value }))}
              rows={2} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">What would you like in return? <span className="text-slate-400 font-normal">(optional)</span></label>
            <textarea placeholder="e.g. Help with my tax return, or open to any offers!"
              value={form.seeking} maxLength={500} onChange={e => setForm(f => ({ ...f, seeking: e.target.value }))}
              rows={2} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Extra details <span className="text-slate-400 font-normal">(optional)</span></label>
            <textarea placeholder="Any other info — availability, location preference, etc."
              value={form.description} maxLength={1000} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>}
        </div>
        <div className="p-5 pt-0 flex gap-3 sticky bottom-0 bg-white border-t border-slate-100">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm">Cancel</button>
          <button onClick={handleSubmit} disabled={loading || !form.title.trim() || !form.offering.trim()}
            className="flex-1 py-3 rounded-xl bg-emerald-700 text-white font-semibold text-sm hover:bg-emerald-800 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Posting…</> : "Post Offer"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SwapPage() {
  const [swaps, setSwaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<SwapCategory | "All">("All");
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
        loadSwaps(admin);
      } else {
        loadSwaps(false);
      }
    });
  }, []);

  useEffect(() => {
    loadSwaps(isAdmin);
  }, [activeCategory]);

  const loadSwaps = async (adminMode = false) => {
    setLoading(true);
    const supabase = createClient();
    let query = supabase.from("skill_swaps").select("*, profiles:user_id(display_name)")
      .order("created_at", { ascending: false });
    if (!adminMode) query = query.eq("status", "active").eq("is_visible", true);
    if (activeCategory !== "All") query = query.eq("category", activeCategory);
    const { data } = await query;
    setSwaps(data || []); setLoading(false);
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 pt-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Skill Swap</h1>
            <p className="text-sm text-slate-500">Exchange skills & time with neighbours</p>
          </div>
          <button onClick={() => user ? setShowCreate(true) : toast.error("Sign in to post")}
            className="flex items-center gap-2 bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-800 transition-colors">
            <Plus className="w-4 h-4" /> Offer
          </button>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 mb-4 flex items-start gap-3">
          <ArrowLeftRight className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
          <p className="text-xs text-emerald-800 leading-relaxed">
            <strong>No money, just community.</strong> Offer your time or skills and find a neighbour who can help you in return. Tap <em>I'm Interested</em> to start a conversation.
          </p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
          {(["All", ...SWAP_CATEGORIES] as const).map(cat => {
            const cfg = cat !== "All" ? CAT_CONFIG[cat] : null;
            return (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                  ${activeCategory === cat ? "bg-emerald-700 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-emerald-300"}`}>
                {cfg?.emoji} {cat}
              </button>
            );
          })}
        </div>
        {loading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 animate-pulse">
              <div className="h-3 bg-slate-100 rounded w-1/4 mb-3" /><div className="h-4 bg-slate-100 rounded w-2/3 mb-2" /><div className="h-3 bg-slate-100 rounded w-full" />
            </div>
          ))}</div>
        ) : swaps.length === 0 ? (
          <div className="text-center py-16">
            <ArrowLeftRight className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No skill swaps yet</p>
            <p className="text-slate-400 text-sm mt-1">Be the first to offer your skills to the community!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {swaps.map(swap => <SwapCard key={swap.id} swap={swap} userId={user?.id || ""} isAdmin={isAdmin} onRefresh={() => loadSwaps(isAdmin)} />)}
          </div>
        )}
      </div>
      {showCreate && <CreateSwapModal user={user} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); loadSwaps(); }} />}
    </AppShell>
  );
}
