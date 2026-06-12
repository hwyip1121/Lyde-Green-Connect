"use client";
// ================================================================
// Lyde Green Connect — Admin Trader Approvals
// app/admin/traders/page.tsx
// ================================================================
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { CheckCircle2, XCircle, Clock, Users, ExternalLink, Loader2, Phone, Wrench } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

function RejectModal({ profile, onClose, onDone }: { profile: any; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const handleReject = async () => {
    setLoading(true);
    const supabase = createClient();
    await supabase.from("trader_profiles").update({ is_approved: false, rejected_at: new Date().toISOString(), reject_reason: reason }).eq("id", profile.id);
    toast.success("Trader rejected.");
    onDone(); onClose();
    setLoading(false);
  };
  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
        <h2 className="font-bold text-slate-900 text-lg mb-1">Reject Application</h2>
        <p className="text-sm text-slate-500 mb-4">Rejecting <strong>{profile.business_name}</strong>. The trader will see this reason.</p>
        <textarea placeholder="e.g. Could not verify Gas Safe registration number." value={reason} onChange={e => setReason(e.target.value)} rows={3} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none mb-4" />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm">Cancel</button>
          <button onClick={handleReject} disabled={!reason.trim() || loading} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Rejecting…</> : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminTradersPage() {
  const [pending, setPending] = useState<any[]>([]);
  const [approved, setApproved] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pending" | "approved">("pending");
  const [rejectTarget, setRejectTarget] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") { setLoading(false); return; }
    setIsAdmin(true);
    const { data: traders } = await supabase.from("trader_profiles")
      .select("*, profiles:user_id(display_name, email)").order("created_at", { ascending: false });
    setPending((traders || []).filter(t => !t.is_approved && !t.rejected_at));
    setApproved((traders || []).filter(t => t.is_approved));
    setLoading(false);
  };

  const handleApprove = async (profile: any) => {
    const supabase = createClient();
    await supabase.from("trader_profiles").update({ is_approved: true, approved_at: new Date().toISOString() }).eq("id", profile.id);
    toast.success(`${profile.business_name} approved!`);
    load();
  };

  if (!loading && !isAdmin) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center p-8">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Admin Only</h2>
        <p className="text-slate-500 text-sm mb-4">You don't have permission to view this page.</p>
        <Link href="/market" className="text-emerald-700 font-medium hover:underline">← Back to Hub</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div><h1 className="text-xl font-bold text-slate-900">Trader Approvals</h1><p className="text-sm text-slate-500">Lyde Green Connect Admin</p></div>
            <Link href="/market" className="text-sm text-emerald-700 font-medium hover:underline">← Hub</Link>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center"><div className="text-2xl font-bold text-amber-700">{pending.length}</div><div className="text-xs text-amber-600">Awaiting Review</div></div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center"><div className="text-2xl font-bold text-green-700">{approved.length}</div><div className="text-xs text-green-600">Approved</div></div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setTab("pending")} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === "pending" ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              <Clock className="w-3.5 h-3.5" /> Pending {pending.length > 0 && <span className="bg-white/30 rounded-full px-1.5 text-xs">{pending.length}</span>}
            </button>
            <button onClick={() => setTab("approved")} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === "approved" ? "bg-green-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              <Users className="w-3.5 h-3.5" /> Approved
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5">
        {loading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-slate-400 animate-spin" /></div> : (
          tab === "pending" ? (
            pending.length === 0 ? (
              <div className="text-center py-16"><CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" /><p className="font-medium text-slate-900">All clear!</p><p className="text-slate-500 text-sm mt-1">No pending applications.</p></div>
            ) : (
              <div className="space-y-4">
                {pending.map(p => (
                  <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div><p className="font-bold text-slate-900">{p.business_name}</p><p className="text-xs text-slate-500">{p.profiles?.display_name} · {p.profiles?.email}</p></div>
                      <span className="flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-1 rounded-full"><Clock className="w-3 h-3" /> Pending</span>
                    </div>
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2 text-sm text-slate-600"><Phone className="w-3.5 h-3.5 text-slate-400" /> {p.phone_number}</div>
                      <div className="flex items-center gap-2 text-sm text-slate-600"><Wrench className="w-3.5 h-3.5 text-slate-400" /> {(p.trades as string[]).join(", ")}</div>
                      {p.gas_safe_number && <div className="flex items-center gap-2 text-sm bg-green-50 text-green-700 border border-green-200 rounded-lg px-3 py-2"><CheckCircle2 className="w-3.5 h-3.5" /> Gas Safe: <strong>{p.gas_safe_number}</strong></div>}
                      {(p.trades as string[]).includes("Gas/Heating") && !p.gas_safe_number && <div className="flex items-center gap-2 text-sm bg-red-50 text-red-700 border border-red-200 rounded-lg px-3 py-2"><XCircle className="w-3.5 h-3.5" /> ⚠️ Gas/Heating selected — NO Gas Safe number provided</div>}
                      {p.bio && <p className="text-sm text-slate-500 bg-slate-50 rounded-lg p-3 italic">"{p.bio}"</p>}
                    </div>
                    {(p.google_reviews_url || p.checkatrade_url) && (
                      <div className="flex gap-4 mb-3">
                        {p.google_reviews_url && <a href={p.google_reviews_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-600 hover:underline"><ExternalLink className="w-3 h-3" /> Google Reviews</a>}
                        {p.checkatrade_url && <a href={p.checkatrade_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-600 hover:underline"><ExternalLink className="w-3 h-3" /> Checkatrade</a>}
                      </div>
                    )}
                    <p className="text-[11px] text-slate-400 mb-3">Applied {new Date(p.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                    <div className="flex gap-3">
                      <button onClick={() => setRejectTarget(p)} className="flex-1 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 flex items-center justify-center gap-2"><XCircle className="w-4 h-4" /> Reject</button>
                      <button onClick={() => handleApprove(p)} className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4" /> Approve</button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            approved.length === 0 ? (
              <div className="text-center py-16"><Users className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">No approved traders yet.</p></div>
            ) : (
              <div className="space-y-3">
                {approved.map(p => (
                  <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between">
                    <div><p className="font-semibold text-slate-900">{p.business_name}</p><p className="text-xs text-slate-500">{(p.trades as string[]).join(", ")}</p></div>
                    <span className="flex items-center gap-1 bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full"><CheckCircle2 className="w-3 h-3" /> Approved</span>
                  </div>
                ))}
              </div>
            )
          )
        )}
      </div>
      {rejectTarget && <RejectModal profile={rejectTarget} onClose={() => setRejectTarget(null)} onDone={load} />}
    </div>
  );
}
