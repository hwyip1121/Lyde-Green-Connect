"use client";
// ================================================================
// Lyde Green Connect — Trader Profile Setup
// app/trader-setup/page.tsx
// ================================================================
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { NEIGHBOURHOODS } from "@/lib/utils";
import { Loader2, AlertCircle, Clock, CheckCircle2, ExternalLink, Shield } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const TRADES = ["Plumbing","Electrical","Gas/Heating","Carpentry","Painting & Decorating","Roofing","Landscaping","General Maintenance"];

function PendingScreen() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6"><Clock className="w-10 h-10 text-amber-600" /></div>
        <h1 className="text-2xl font-bold text-slate-900 mb-3">Application Submitted!</h1>
        <p className="text-slate-600 mb-6 leading-relaxed">Your trader profile is under review. You'll be able to access the job feed once approved — usually within 24 hours.</p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left space-y-3 mb-6">
          <div className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-amber-600" /><p className="text-sm text-amber-800">Profile submitted successfully</p></div>
          <div className="flex items-center gap-3"><Clock className="w-4 h-4 text-amber-600" /><p className="text-sm text-amber-800">Awaiting admin verification (usually within 24 hours)</p></div>
        </div>
        <Link href="/market" className="inline-block w-full py-3 rounded-xl bg-emerald-700 text-white font-semibold text-sm hover:bg-emerald-800 text-center">← Back to Hub</Link>
      </div>
    </div>
  );
}

export default function TraderSetupPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [existing, setExisting] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    businessName: "", phoneNumber: "", bio: "",
    selectedTrades: [] as string[], gasSafeNumber: "",
    googleReviewsUrl: "", checkatradeUrl: "",
  });

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }
      setUser(user);
      const { data: tp } = await supabase.from("trader_profiles").select("*").eq("user_id", user.id).single();
      if (tp) setExisting(tp);
      setLoading(false);
    };
    init();
  }, []);

  const toggleTrade = (t: string) => setForm(f => ({
    ...f, selectedTrades: f.selectedTrades.includes(t) ? f.selectedTrades.filter(x => x !== t) : [...f.selectedTrades, t]
  }));

  const hasGas = form.selectedTrades.includes("Gas/Heating");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.businessName.trim()) { toast.error("Please enter your business name"); return; }
    if (!form.phoneNumber.trim()) { toast.error("Please enter your phone number"); return; }
    if (form.selectedTrades.length === 0) { toast.error("Please select at least one trade"); return; }
    if (hasGas && !form.gasSafeNumber.trim()) { toast.error("Gas Safe Registration Number is required for Gas/Heating trades"); return; }
    setSubmitting(true);
    try {
      const supabase = createClient();
      await supabase.from("trader_profiles").insert({
        user_id: user.id, business_name: form.businessName, phone_number: form.phoneNumber,
        bio: form.bio || null, trades: form.selectedTrades,
        gas_safe_number: form.gasSafeNumber || null,
        google_reviews_url: form.googleReviewsUrl || null,
        checkatrade_url: form.checkatradeUrl || null,
      });
      setExisting({ is_approved: false });
    } catch (e: any) { toast.error(e.message); } finally { setSubmitting(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 text-slate-400 animate-spin" /></div>;
  if (existing) return <PendingScreen />;

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <header className="bg-white border-b border-slate-200 px-5 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-emerald-700 flex items-center justify-center"><span className="text-white text-[11px] font-bold">B</span></div>
          <span className="font-bold text-slate-900 tracking-tight">Trader Profile Setup</span>
        </div>
        <Link href="/market" className="text-sm text-slate-500 hover:text-slate-700">Cancel</Link>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-6">
        <p className="text-slate-600 mb-4 leading-relaxed">Set up your trader profile. Once submitted, our team will review and approve your account — usually within 24 hours.</p>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex gap-3">
          <Clock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-800 leading-relaxed"><strong>Manual verification required.</strong> To protect BS16 homeowners, all trader profiles are manually reviewed before activation.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Business info */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h2 className="font-bold text-slate-900">Business Information</h2>
            {[["businessName","Business Name *","Your business name","text"],["phoneNumber","Phone Number *","Your contact number","tel"],["bio","About Your Business","Tell homeowners about your experience…","textarea"]].map(([k,label,ph,type]) => (
              <div key={k} className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 block">{label}</label>
                {type === "textarea"
                  ? <textarea placeholder={ph} value={(form as any)[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} rows={3} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
                  : <input type={type} placeholder={ph} value={(form as any)[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />}
              </div>
            ))}
          </div>

          {/* Trades */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="font-bold text-slate-900 mb-3">Your Trades *</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TRADES.map(trade => (
                <button key={trade} type="button" onClick={() => toggleTrade(trade)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors text-left
                    ${form.selectedTrades.includes(trade) ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-slate-300 bg-white"}`}>
                  <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${form.selectedTrades.includes(trade) ? "border-emerald-500 bg-emerald-500" : "border-slate-300"}`}>
                    {form.selectedTrades.includes(trade) && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-sm font-medium text-slate-700">{trade}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Gas Safe — conditional */}
          {hasGas && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <div className="flex items-start gap-3 mb-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div><h2 className="font-bold text-amber-900">Gas Safe Registration Required</h2><p className="text-sm text-amber-700 mt-0.5">Required by law for Gas/Heating trades</p></div>
              </div>
              <label className="text-sm font-medium text-amber-900 block mb-1.5">Gas Safe Registration Number *</label>
              <input type="text" placeholder="Your Gas Safe Registration Number" value={form.gasSafeNumber}
                onChange={e => setForm(f => ({ ...f, gasSafeNumber: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-amber-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white" />
              <p className="text-xs text-amber-700 mt-2">Homeowners will see this to verify your credentials.</p>
            </div>
          )}

          {/* External links */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-slate-500" />
              <h2 className="font-bold text-slate-900">External Trust Links <span className="text-slate-400 font-normal text-sm">(Optional)</span></h2>
            </div>
            {[["googleReviewsUrl","Google Reviews URL","https://www.google.com/maps/..."],["checkatradeUrl","Checkatrade Profile URL","https://www.checkatrade.com/..."]].map(([k,label,ph]) => (
              <div key={k} className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 block">{label}</label>
                <input type="url" placeholder={ph} value={(form as any)[k]}
                  onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            ))}
            <div className="bg-slate-100 rounded-xl p-3">
              <p className="text-xs text-slate-500 leading-relaxed">⚠️ External links are provided by the trader and are not verified by this platform.</p>
            </div>
          </div>

          <button type="submit" disabled={submitting || form.selectedTrades.length === 0}
            className="w-full py-3 rounded-xl bg-emerald-700 text-white font-semibold text-sm hover:bg-emerald-800 disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting…</> : "Submit for Approval"}
          </button>
        </form>
      </div>
    </div>
  );
}
