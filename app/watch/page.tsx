"use client";
// ================================================================
// Lyde Green Connect — Neighbour Watch Page
// app/watch/page.tsx
// ================================================================
import { useState, useEffect, useRef } from "react";
import AppShell from "@/components/bs16/AppShell";
import { createClient } from "@/lib/supabase";
import { moderateContent, checkRateLimit, formatResetTime, relativeTime } from "@/lib/utils";
import { Plus, X, Loader2, Flag, EyeOff, Eye, Trash2, ShieldAlert, Bell, BellOff } from "lucide-react";
import { toast } from "sonner";

// ── Notification Opt-in Banner ───────────────────────────────────
function NotificationBanner({ userId }: { userId: string }) {
  const [status, setStatus] = useState<"idle"|"subscribed"|"denied"|"loading">("idle");
  const [subEndpoint, setSubEndpoint] = useState<string | null>(null);

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) { setStatus("denied"); return; }
    if (Notification.permission === "denied") { setStatus("denied"); return; }
    navigator.serviceWorker.ready.then(reg => {
      reg.pushManager.getSubscription().then(sub => {
        if (sub) { setStatus("subscribed"); setSubEndpoint(sub.endpoint); }
      });
    });
  }, []);

  const subscribe = async () => {
    setStatus("loading");
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setStatus("denied"); return; }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });
      await fetch("/api/push-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON(), userId }),
      });
      setSubEndpoint(sub.endpoint);
      setStatus("subscribed");
      toast.success("Watch alerts enabled for this device!");
    } catch (err) {
      setStatus("idle");
      toast.error("Could not enable notifications.");
    }
  };

  const unsubscribe = async () => {
    setStatus("loading");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        await fetch("/api/push-subscription", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
      }
      setSubEndpoint(null);
      setStatus("idle");
      toast.success("Watch notifications turned off.");
    } catch {
      setStatus("idle");
    }
  };

  if (status === "denied") return null;

  if (status === "subscribed") return (
    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 mb-4">
      <div className="flex items-center gap-2">
        <Bell className="w-4 h-4 text-emerald-600 shrink-0" />
        <span className="text-xs text-emerald-800 font-medium">Watch alerts enabled for this device</span>
      </div>
      <button onClick={unsubscribe} className="text-[10px] text-emerald-600 hover:text-emerald-800 font-medium underline">Turn off</button>
    </div>
  );

  return (
    <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 mb-4">
      <div className="flex items-center gap-2">
        <BellOff className="w-4 h-4 text-blue-600 shrink-0" />
        <div>
          <p className="text-xs text-blue-800 font-semibold">Get notified about Watch alerts</p>
          <p className="text-[10px] text-blue-600 mt-0.5">Enable push notifications for this device</p>
        </div>
      </div>
      <button onClick={subscribe} disabled={status === "loading"}
        className="shrink-0 flex items-center gap-1.5 bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
        {status === "loading" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bell className="w-3 h-3" />}
        Enable
      </button>
    </div>
  );
}

// ── Alert card — own component ────────────────────────────────────
function AlertCard({ alert, userId, isAdmin, onFlagged, onRefresh }: { alert: any; userId: string; isAdmin: boolean; onFlagged: () => void; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [flagState, setFlagState] = useState<"idle"|"confirm"|"done">("idle");
  const isUrgent = alert.urgency === "urgent";

  const handleFlag = async () => {
    const supabase = createClient();
    try {
      await supabase.from("content_flags").insert({ reporter_id: userId, target_table: "watch_alerts", target_id: alert.id });
      await supabase.rpc("increment_flag_count", { p_table: "watch_alerts", p_id: alert.id });
      setFlagState("done"); toast.success("Post reported."); onFlagged();
    } catch { toast.error("Already reported"); setFlagState("idle"); }
  };

  return (
    <div className={`bg-white rounded-2xl overflow-hidden border-2 ${!alert.is_visible ? "border-orange-300 bg-orange-50/30" : isUrgent ? "border-red-300 shadow-sm shadow-red-100" : "border-amber-200"}`}>
      <div className={`${isUrgent ? "bg-red-500" : "bg-amber-400"} px-4 py-2.5 flex items-center gap-2`}>
        <span className="text-sm">{isUrgent ? "🚨" : "⚠️"}</span>
        <span className={`text-xs font-bold uppercase tracking-wide ${isUrgent ? "text-white" : "text-amber-900"}`}>
          {isUrgent ? "Urgent Alert" : "General Update"}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span className={`text-[10px] ${isUrgent ? "text-red-100" : "text-amber-800"}`}>{relativeTime(alert.created_at)}</span>
          {flagState === "done" ? <span className="text-[10px] text-white/60">Reported ✓</span>
            : flagState === "confirm" ? <div className="flex items-center gap-1"><button onClick={handleFlag} className="text-[10px] font-semibold px-2 py-0.5 bg-white/20 text-white rounded-lg">Confirm</button><button onClick={() => setFlagState("idle")} className="text-[10px] text-white/60">Cancel</button></div>
            : <button onClick={() => setFlagState("confirm")} className="opacity-40 hover:opacity-100 transition-opacity"><Flag className="w-3 h-3 text-white" /></button>}
        </div>
      </div>
      <div className="p-4">
        {!alert.is_visible && <div className="flex items-center gap-1.5 bg-orange-100 text-orange-700 text-[10px] font-semibold px-2 py-1 rounded-lg mb-2"><EyeOff className="w-3 h-3" />Hidden from residents</div>}
        <h3 className="font-semibold text-slate-900 text-sm leading-snug mb-2">{alert.title}</h3>
        <p className={`text-sm text-slate-600 leading-relaxed ${!expanded ? "line-clamp-3" : ""}`}>{alert.body}</p>
        {alert.body.length > 180 && (
          <button onClick={() => setExpanded(!expanded)} className="text-xs text-emerald-700 font-medium mt-1 hover:underline">
            {expanded ? "Show less" : "Read more"}
          </button>
        )}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${isUrgent ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
            {(alert.profiles?.display_name || "?")[0].toUpperCase()}
          </div>
          <span className="text-xs text-slate-500">
            {alert.profiles?.display_name || "Neighbour"} · <strong className="text-slate-600">{alert.neighbourhood}</strong>
          </span>
        </div>
        {isAdmin && <AdminAlertControls alert={alert} onRefresh={onRefresh} />}
      </div>
    </div>
  );
}

// ── Admin Alert Controls ─────────────────────────────────────────
function AdminAlertControls({ alert, onRefresh }: { alert: any; onRefresh: () => void }) {
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const toggleVisibility = async () => {
    setBusy(true);
    const supabase = createClient();
    await supabase.from("watch_alerts").update({ is_visible: !alert.is_visible }).eq("id", alert.id);
    toast.success(alert.is_visible ? "Alert hidden" : "Alert restored");
    onRefresh();
    setBusy(false);
  };

  const deleteAlert = async () => {
    setBusy(true);
    const supabase = createClient();
    await supabase.from("watch_alerts").delete().eq("id", alert.id);
    toast.success("Alert deleted");
    onRefresh();
    setBusy(false);
  };

  if (confirmDelete) return (
    <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-xl p-2 mt-2">
      <ShieldAlert className="w-3.5 h-3.5 text-red-600 shrink-0" />
      <span className="text-[10px] text-red-700 font-medium flex-1">Delete permanently?</span>
      <button onClick={deleteAlert} disabled={busy} className="text-[10px] font-bold px-2 py-1 bg-red-600 text-white rounded-lg disabled:opacity-50">Yes</button>
      <button onClick={() => setConfirmDelete(false)} className="text-[10px] text-slate-500">No</button>
    </div>
  );

  return (
    <div className="flex gap-1.5 mt-2 pt-2 border-t border-slate-100">
      <button onClick={toggleVisibility} disabled={busy}
        className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-semibold border transition-colors disabled:opacity-50 ${alert.is_visible ? "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100" : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"}`}>
        {alert.is_visible ? <><EyeOff className="w-3 h-3" />Hide</> : <><Eye className="w-3 h-3" />Restore</>}
      </button>
      <button onClick={() => setConfirmDelete(true)} disabled={busy}
        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50">
        <Trash2 className="w-3 h-3" />Delete
      </button>
    </div>
  );
}

// ── Create alert modal ────────────────────────────────────────────
function CreateAlertModal({ user, onClose, onCreated }: { user: any; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ title: "", body: "", urgency: "general" as "urgent" | "general" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    const rl = checkRateLimit(user.id);
    if (!rl.allowed) { setError(`Please wait ${formatResetTime(rl.resetInMs)} before posting again.`); return; }
    const titleMod = moderateContent(form.title);
    const bodyMod = moderateContent(form.body);
    if (!titleMod.safe || !bodyMod.safe) { setError("Your post contains content that isn't allowed."); return; }
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: profile } = await supabase.from("profiles").select("neighbourhood").eq("id", user.id).single();
      await supabase.from("watch_alerts").insert({
        user_id: user.id, title: titleMod.sanitised, body: bodyMod.sanitised,
        urgency: form.urgency, neighbourhood: profile?.neighbourhood || "Lyde Green",
      });
      const urgencyLabel = form.urgency === "urgent" ? "🚨 Urgent Alert" : "⚠️ General Update";
      await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: urgencyLabel,
          body: titleMod.sanitised,
          tag: "watch-alert",
          url: "/watch",
        }),
      }).catch(() => {});
      onCreated(); toast.success("Alert posted!");
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">Post an Alert</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">Alert Type *</label>
            <div className="grid grid-cols-2 gap-3">
              {(["general","urgent"] as const).map(u => (
                <button key={u} onClick={() => setForm(f => ({ ...f, urgency: u }))}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors
                    ${form.urgency === u ? u === "urgent" ? "bg-red-50 border-red-300 text-red-800" : "bg-amber-50 border-amber-300 text-amber-800" : "border-slate-200 hover:bg-slate-50 text-slate-600"}`}>
                  <span className="text-2xl">{u === "urgent" ? "🚨" : "⚠️"}</span>
                  <div className="text-center">
                    <p className="text-sm font-semibold">{u === "urgent" ? "Urgent Alert" : "General Update"}</p>
                    <p className="text-xs opacity-70 mt-0.5">{u === "urgent" ? "Time-sensitive" : "For awareness"}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
          {form.urgency === "urgent" && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-xs text-red-700 leading-relaxed"><strong>Reminder:</strong> For genuine emergencies, always call 999 first.</p>
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Title *</label>
            <input type="text" placeholder="Brief summary of the alert" value={form.title} maxLength={100}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Details *</label>
            <textarea placeholder="Describe what happened and what neighbours should know…" value={form.body} maxLength={2000}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              rows={4} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>}
        </div>
        <div className="p-5 pt-0 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm">Cancel</button>
          <button onClick={handleSubmit} disabled={loading || !form.title.trim() || !form.body.trim()}
            className="flex-1 py-3 rounded-xl bg-emerald-700 text-white font-semibold text-sm hover:bg-emerald-800 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Posting…</> : "Post Alert"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WatchPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [urgencyFilter, setUrgencyFilter] = useState<"all"|"urgent"|"general">("all");
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
        loadAlerts(admin);
      } else {
        loadAlerts(false);
      }
    });
  }, []);

  useEffect(() => {
    loadAlerts(isAdmin);
  }, [urgencyFilter]);

  const loadAlerts = async (adminMode = false) => {
    setLoading(true);
    const supabase = createClient();
    let query = supabase.from("watch_alerts")
      .select("*, profiles:user_id(display_name, neighbourhood)")
      .order("created_at", { ascending: false });
    if (!adminMode) query = query.eq("is_visible", true);
    if (urgencyFilter !== "all") query = query.eq("urgency", urgencyFilter);
    const { data } = await query;
    setAlerts(data || []); setLoading(false);
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 pt-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div><h1 className="text-xl font-bold text-slate-900">Neighbour Watch</h1><p className="text-sm text-slate-500">Safety alerts & community updates</p></div>
          <button onClick={() => user ? setShowCreate(true) : toast.error("Sign in to post")}
            className="flex items-center gap-2 bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-800 transition-colors">
            <Plus className="w-4 h-4" /> Alert
          </button>
        </div>

        {user && <NotificationBanner userId={user.id} />}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 flex gap-3 items-start">
          <span className="text-xl flex-shrink-0">🚨</span>
          <div><p className="text-sm font-semibold text-amber-800">Emergency? Call 999 first</p><p className="text-xs text-amber-700 mt-0.5 leading-relaxed">This board is for community awareness only.</p></div>
        </div>

        <div className="flex gap-2 mb-4">
          {[{k:"all",l:"All Alerts",e:"👁️"},{k:"urgent",l:"Urgent",e:"🔴"},{k:"general",l:"General",e:"🟡"}].map(f => (
            <button key={f.k} onClick={() => setUrgencyFilter(f.k as typeof urgencyFilter)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                ${urgencyFilter === f.k ? "bg-emerald-700 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-emerald-300"}`}>
              {f.e} {f.l}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(2)].map((_, i) => <div key={i} className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden animate-pulse"><div className="h-9 bg-slate-100" /><div className="p-4 space-y-2"><div className="h-4 bg-slate-100 rounded w-2/3" /><div className="h-3 bg-slate-100 rounded w-full" /></div></div>)}</div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-16"><div className="text-4xl mb-3">🏡</div><p className="text-slate-500 font-medium">All quiet in the neighbourhood</p></div>
        ) : (
          <div className="space-y-3">
            {alerts.map(alert => <AlertCard key={alert.id} alert={alert} userId={user?.id} isAdmin={isAdmin} onFlagged={() => loadAlerts(isAdmin)} onRefresh={() => loadAlerts(isAdmin)} />)}
          </div>
        )}
      </div>
      {showCreate && <CreateAlertModal user={user} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); loadAlerts(); }} />}
    </AppShell>
  );
}
