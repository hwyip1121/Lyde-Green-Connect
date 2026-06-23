"use client";
// ================================================================
// Lyde Green Connect — Notice Board Page
// app/notices/page.tsx
// ================================================================
import { useState, useEffect } from "react";
import AppShell from "@/components/bs16/AppShell";
import { createClient } from "@/lib/supabase";
import { moderateContent, checkRateLimit, formatResetTime, relativeTime, NOTICE_TAGS, type NoticeTag } from "@/lib/utils";
import { Plus, Pin, X, Loader2, Flag, EyeOff, Eye, Trash2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

const TAG_CONFIG: Record<NoticeTag, { emoji: string; stripe: string; bg: string; text: string; border: string }> = {
  "Event":        { emoji: "🎉", stripe: "bg-purple-400", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  "Lost & Found": { emoji: "🔍", stripe: "bg-amber-400",  bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200"  },
  "Local News":   { emoji: "📰", stripe: "bg-blue-400",   bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200"   },
};

// ── Notice Card — own component so useState is legal ─────────────
function NoticeCard({ post, userId, isAdmin, onFlagged, onRefresh }: { post: any; userId: string; isAdmin: boolean; onFlagged: () => void; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [flagState, setFlagState] = useState<"idle"|"confirm"|"done">("idle");
  const cfg = TAG_CONFIG[post.tag as NoticeTag];

  const handleFlag = async () => {
    const supabase = createClient();
    try {
      await supabase.from("content_flags").insert({ reporter_id: userId, target_table: "notice_posts", target_id: post.id });
      await supabase.rpc("increment_flag_count", { p_table: "notice_posts", p_id: post.id });
      setFlagState("done"); toast.success("Post reported."); onFlagged();
    } catch { toast.error("Already reported"); setFlagState("idle"); }
  };

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden ${!post.is_visible ? "border-orange-300 bg-orange-50/30" : "border-slate-200"}`}>
      <div className={`h-1 ${cfg.stripe}`} />
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
            {cfg.emoji} {post.tag}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400">{relativeTime(post.created_at)}</span>
            {flagState === "done" ? <span className="text-[10px] text-slate-400">Reported ✓</span>
              : flagState === "confirm" ? <div className="flex items-center gap-1"><button onClick={handleFlag} className="text-[10px] font-semibold px-2 py-0.5 bg-red-100 text-red-700 rounded-lg">Confirm</button><button onClick={() => setFlagState("idle")} className="text-[10px] text-slate-400">Cancel</button></div>
              : <button onClick={() => setFlagState("confirm")} className="opacity-30 hover:opacity-100 transition-opacity"><Flag className="w-3 h-3 text-slate-500" /></button>}
          </div>
        </div>
        {!post.is_visible && <div className="flex items-center gap-1.5 bg-orange-100 text-orange-700 text-[10px] font-semibold px-2 py-1 rounded-lg mb-2"><EyeOff className="w-3 h-3" />Hidden from residents</div>}
        <h3 className="font-semibold text-slate-900 text-sm leading-snug mb-1">{post.title}</h3>
        <p className={`text-sm text-slate-600 leading-relaxed ${!expanded ? "line-clamp-3" : ""}`}>{post.body}</p>
        {post.body.length > 180 && (
          <button onClick={() => setExpanded(!expanded)} className="text-xs text-emerald-700 font-medium mt-1 hover:underline">
            {expanded ? "Show less" : "Read more"}
          </button>
        )}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
          <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-[9px] font-bold text-emerald-700">
            {(post.profiles?.display_name || "?")[0].toUpperCase()}
          </div>
          <span className="text-xs text-slate-500">
            {post.profiles?.display_name || "Neighbour"} · <strong className="text-slate-600">{post.neighbourhood}</strong>
          </span>
        </div>
        {isAdmin && <AdminNoticeControls post={post} onRefresh={onRefresh} />}
      </div>
    </div>
  );
}

// ── Admin Notice Controls ─────────────────────────────────────────
function AdminNoticeControls({ post, onRefresh }: { post: any; onRefresh: () => void }) {
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const toggleVisibility = async () => {
    setBusy(true);
    const supabase = createClient();
    await supabase.from("notice_posts").update({ is_visible: !post.is_visible }).eq("id", post.id);
    toast.success(post.is_visible ? "Notice hidden" : "Notice restored");
    onRefresh();
    setBusy(false);
  };

  const deletePost = async () => {
    setBusy(true);
    const supabase = createClient();
    await supabase.from("notice_posts").delete().eq("id", post.id);
    toast.success("Notice deleted");
    onRefresh();
    setBusy(false);
  };

  if (confirmDelete) return (
    <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-xl p-2 mt-2">
      <ShieldAlert className="w-3.5 h-3.5 text-red-600 shrink-0" />
      <span className="text-[10px] text-red-700 font-medium flex-1">Delete permanently?</span>
      <button onClick={deletePost} disabled={busy} className="text-[10px] font-bold px-2 py-1 bg-red-600 text-white rounded-lg disabled:opacity-50">Yes</button>
      <button onClick={() => setConfirmDelete(false)} className="text-[10px] text-slate-500">No</button>
    </div>
  );

  return (
    <div className="flex gap-1.5 mt-2 pt-2 border-t border-slate-100">
      <button onClick={toggleVisibility} disabled={busy}
        className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-semibold border transition-colors disabled:opacity-50 ${post.is_visible ? "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100" : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"}`}>
        {post.is_visible ? <><EyeOff className="w-3 h-3" />Hide</> : <><Eye className="w-3 h-3" />Restore</>}
      </button>
      <button onClick={() => setConfirmDelete(true)} disabled={busy}
        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50">
        <Trash2 className="w-3 h-3" />Delete
      </button>
    </div>
  );
}

// ── Create modal ──────────────────────────────────────────────────
function CreateNoticeModal({ user, onClose, onCreated }: { user: any; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ title: "", body: "", tag: "" as NoticeTag | "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!form.tag) { setError("Please select a category."); return; }
    const rl = checkRateLimit(user.id);
    if (!rl.allowed) { setError(`Please wait ${formatResetTime(rl.resetInMs)} before posting again.`); return; }
    const titleMod = moderateContent(form.title);
    const bodyMod = moderateContent(form.body);
    if (!titleMod.safe || !bodyMod.safe) { setError("Your post contains content that isn't allowed."); return; }
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: profile } = await supabase.from("profiles").select("neighbourhood").eq("id", user.id).single();
      await supabase.from("notice_posts").insert({
        user_id: user.id, title: titleMod.sanitised, body: bodyMod.sanitised,
        tag: form.tag, neighbourhood: profile?.neighbourhood || "Lyde Green",
      });
      onCreated(); toast.success("Notice posted!");
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">Create Notice</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">Category *</label>
            <div className="grid grid-cols-3 gap-2">
              {NOTICE_TAGS.map(tag => {
                const cfg = TAG_CONFIG[tag];
                return (
                  <button key={tag} onClick={() => setForm(f => ({ ...f, tag }))}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-medium transition-colors
                      ${form.tag === tag ? `${cfg.bg} ${cfg.text} border-2 ${cfg.border}` : "border-slate-200 hover:bg-slate-50 text-slate-600"}`}>
                    <span className="text-lg">{cfg.emoji}</span>{tag}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Title *</label>
            <input type="text" placeholder="Short, descriptive title" value={form.title} maxLength={100}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Details *</label>
            <textarea placeholder="Share the details…" value={form.body} maxLength={2000}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              rows={4} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>}
        </div>
        <div className="p-5 pt-0 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm">Cancel</button>
          <button onClick={handleSubmit} disabled={loading || !form.title.trim() || !form.body.trim()}
            className="flex-1 py-3 rounded-xl bg-emerald-700 text-white font-semibold text-sm hover:bg-emerald-800 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Posting…</> : "Post Notice"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────
export default function NoticesPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState<NoticeTag | "All">("All");
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
        loadPosts(admin);
      } else {
        loadPosts(false);
      }
    });
  }, []);

  useEffect(() => {
    loadPosts(isAdmin);
  }, [activeTag]);

  const loadPosts = async (adminMode = false) => {
    setLoading(true);
    const supabase = createClient();
    let query = supabase.from("notice_posts")
      .select("*, profiles:user_id(display_name, neighbourhood)")
      .order("created_at", { ascending: false });
    if (!adminMode) query = query.eq("is_visible", true);
    if (activeTag !== "All") query = query.eq("tag", activeTag);
    const { data } = await query;
    setPosts(data || []); setLoading(false);
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 pt-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div><h1 className="text-xl font-bold text-slate-900">Notice Board</h1><p className="text-sm text-slate-500">Local events, news & lost items</p></div>
          <button onClick={() => user ? setShowCreate(true) : toast.error("Sign in to post")}
            className="flex items-center gap-2 bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-800 transition-colors">
            <Plus className="w-4 h-4" /> Post
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
          {(["All", ...NOTICE_TAGS] as const).map(tag => {
            const cfg = tag !== "All" ? TAG_CONFIG[tag] : null;
            return (
              <button key={tag} onClick={() => setActiveTag(tag)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                  ${activeTag === tag ? "bg-emerald-700 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-emerald-300"}`}>
                {cfg?.emoji} {tag}
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
        ) : posts.length === 0 ? (
          <div className="text-center py-16"><Pin className="w-10 h-10 text-slate-300 mx-auto mb-3" /><p className="text-slate-500 font-medium">Nothing posted yet</p><p className="text-slate-400 text-sm mt-1">Share something with your neighbours!</p></div>
        ) : (
          <div className="space-y-3">
            {posts.map(post => <NoticeCard key={post.id} post={post} userId={user?.id} isAdmin={isAdmin} onFlagged={() => loadPosts(isAdmin)} onRefresh={() => loadPosts(isAdmin)} />)}
          </div>
        )}
      </div>
      {showCreate && <CreateNoticeModal user={user} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); loadPosts(); }} />}
    </AppShell>
  );
}
