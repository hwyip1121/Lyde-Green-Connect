"use client";
// ================================================================
// BS16 Hub — Jobs Page (Homeowner posts + Trader views)
// app/jobs/page.tsx
// ================================================================
import { useState, useEffect } from "react";
import AppShell from "@/components/bs16/AppShell";
import { createClient } from "@/lib/supabase";
import { moderateContent, checkRateLimit, formatResetTime, relativeTime, JOB_CATEGORIES, type JobCategory } from "@/lib/utils";
import { Plus, Briefcase, MapPin, Clock, Wrench, Leaf, Loader2, X, Clock3, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const CAT_CONFIG: Record<JobCategory, { emoji: string; bg: string; text: string; border: string }> = {
  "Home Maintenance":    { emoji: "🔧", bg: "bg-blue-50",  text: "text-blue-700",  border: "border-blue-200"  },
  "Gardening & Outdoors":{ emoji: "🌿", bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
};

// ── Trader pending gate ───────────────────────────────────────────
function TraderPendingGate({ rejectReason }: { rejectReason?: string }) {
  if (rejectReason) return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-sm text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-2xl">❌</span></div>
        <h2 className="text-lg font-bold text-slate-900 mb-2">Application Not Approved</h2>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-left"><p className="text-sm text-red-800">{rejectReason}</p></div>
        <p className="text-sm text-slate-500">Please contact us if you'd like to reapply.</p>
      </div>
    </div>
  );
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-sm text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4"><Clock3 className="w-8 h-8 text-amber-600" /></div>
        <h2 className="text-lg font-bold text-slate-900 mb-2">Awaiting Approval</h2>
        <p className="text-slate-500 text-sm mb-4 leading-relaxed">Your trader profile is being reviewed. You'll have full access to the job feed once approved — usually within 24 hours.</p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left space-y-2">
          <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-600" /><span className="text-sm text-amber-800">Profile submitted ✓</span></div>
          <div className="flex items-center gap-2"><Clock3 className="w-4 h-4 text-amber-600" /><span className="text-sm text-amber-800">Admin verification in progress…</span></div>
        </div>
      </div>
    </div>
  );
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [traderProfile, setTraderProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<JobCategory | "All">("All");
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(p);
      if (p?.role === "trader") {
        const { data: tp } = await supabase.from("trader_profiles").select("*").eq("user_id", user.id).single();
        setTraderProfile(tp);
      }
      await loadJobs();
      setLoading(false);
    };
    init();
  }, []);

  const loadJobs = async () => {
    const supabase = createClient();
    const { data } = await supabase.from("jobs")
      .select("*, profiles:user_id(display_name, neighbourhood)")
      .eq("is_active", true).order("created_at", { ascending: false });
    setJobs(data || []);
  };

  const filtered = jobs.filter(j => filter === "All" || j.category === filter);

  // Trader not approved
  if (!loading && profile?.role === "trader" && traderProfile && !traderProfile.is_approved) {
    return <AppShell><div className="max-w-2xl mx-auto px-4 pt-4"><div className="flex items-center justify-between mb-4"><div><h1 className="text-xl font-bold text-slate-900">Local Jobs</h1><p className="text-sm text-slate-500">BS16 · Lyde Green & Emersons Green</p></div></div><TraderPendingGate rejectReason={traderProfile.reject_reason} /></div></AppShell>;
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 pt-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div><h1 className="text-xl font-bold text-slate-900">Local Jobs</h1><p className="text-sm text-slate-500">BS16 · Lyde Green & Emersons Green</p></div>
          {profile?.role === "homeowner" && (
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
              <Plus className="w-4 h-4" /> Post Job
            </button>
          )}
        </div>

        {/* Category cards */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <button onClick={() => setFilter("All")} className={`p-4 rounded-2xl border-2 text-left transition-all ${filter === "All" ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
            <div className="text-2xl mb-1">🏠</div>
            <div className={`font-semibold text-sm ${filter === "All" ? "text-blue-700" : "text-slate-800"}`}>All Jobs</div>
            <div className="text-xs text-slate-500 mt-0.5">{jobs.length} active</div>
          </button>
          {JOB_CATEGORIES.map(cat => {
            const cfg = CAT_CONFIG[cat];
            return (
              <button key={cat} onClick={() => setFilter(cat)} className={`p-4 rounded-2xl border-2 text-left transition-all ${filter === cat ? `${cfg.border} ${cfg.bg}` : "border-slate-200 bg-white hover:border-slate-300"}`}>
                <div className="text-2xl mb-1">{cfg.emoji}</div>
                <div className={`font-semibold text-sm ${filter === cat ? cfg.text : "text-slate-800"}`}>{cat}</div>
                <div className="text-xs text-slate-500 mt-0.5">{jobs.filter(j => j.category === cat).length} active</div>
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16"><Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" /><p className="text-slate-500 font-medium">No jobs yet</p><p className="text-slate-400 text-sm mt-1">Check back soon</p></div>
        ) : (
          <div className="space-y-3">
            {filtered.map(job => {
              const cfg = CAT_CONFIG[job.category as JobCategory];
              return (
                <div key={job.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex hover:shadow-md transition-shadow cursor-pointer">
                  <div className={`w-28 flex-shrink-0 flex items-center justify-center ${cfg.bg}`}>
                    {job.photo_url ? <img src={job.photo_url} alt={job.title} className="w-full h-full object-cover" /> : <span className="text-3xl">{cfg.emoji}</span>}
                  </div>
                  <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-snug mb-1 line-clamp-2">{job.title}</h3>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border mb-2 ${cfg.bg} ${cfg.text} ${cfg.border}`}>{cfg.emoji} {job.category}</span>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{job.description}</p>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> BS16</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {relativeTime(job.created_at)}</span>
                      </div>
                      {profile?.role === "trader" && profile?.id !== job.user_id && (
                        <a href={`/inbox?new=1&listing_id=${job.id}&listing_type=job&receiver_id=${job.user_id}&receiver_name=${encodeURIComponent(job.profiles?.display_name || "Homeowner")}`}
                          className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                          💬 Contact
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {showCreate && <PostJobModal userId={profile?.id} neighbourhood={profile?.neighbourhood} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); loadJobs(); }} />}
    </AppShell>
  );
}

function PostJobModal({ userId, neighbourhood, onClose, onCreated }: { userId: string; neighbourhood: string; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ title: "", description: "", category: "" as JobCategory | "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!form.category) { setError("Please select a category."); return; }
    const rl = checkRateLimit(userId);
    if (!rl.allowed) { setError(`Please wait ${formatResetTime(rl.resetInMs)} before posting again.`); return; }
    const titleMod = moderateContent(form.title);
    const descMod = moderateContent(form.description);
    if (!titleMod.safe || !descMod.safe) { setError("Your post contains content that isn't allowed."); return; }
    setLoading(true);
    try {
      const supabase = createClient();
      await supabase.from("jobs").insert({ user_id: userId, title: titleMod.sanitised, description: descMod.sanitised, category: form.category, neighbourhood });
      onCreated(); toast.success("Job posted!");
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">Post a Job</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div><label className="text-sm font-medium text-slate-700 block mb-2">Category *</label>
            <div className="grid grid-cols-2 gap-3">
              {JOB_CATEGORIES.map(cat => {
                const cfg = CAT_CONFIG[cat];
                return <button key={cat} onClick={() => setForm(f => ({ ...f, category: cat }))} className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${form.category === cat ? `${cfg.bg} ${cfg.border} border-2` : "border-slate-200 hover:bg-slate-50"}`}><span className="text-2xl">{cfg.emoji}</span><span className={`text-xs font-semibold ${form.category === cat ? cfg.text : "text-slate-600"}`}>{cat}</span></button>;
              })}
            </div>
          </div>
          <div className="space-y-1.5"><label className="text-sm font-medium text-slate-700">Job Title *</label><input type="text" placeholder="e.g. Leaking bathroom tap" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} maxLength={100} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div className="space-y-1.5"><label className="text-sm font-medium text-slate-700">Description *</label><textarea placeholder="Describe the work needed…" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} maxLength={1000} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" /></div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>}
        </div>
        <div className="p-5 pt-0 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm">Cancel</button>
          <button onClick={handleSubmit} disabled={loading || !form.title.trim() || !form.description.trim()} className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Posting…</> : "Post Job"}
          </button>
        </div>
      </div>
    </div>
  );
}
