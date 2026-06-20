"use client";
// ================================================================
// Lyde Green Connect — Community Events Page
// app/events/page.tsx
// ================================================================
import { useState, useEffect } from "react";
import AppShell from "@/components/bs16/AppShell";
import { createClient } from "@/lib/supabase";
import { moderateContent, checkRateLimit, formatResetTime, relativeTime } from "@/lib/utils";
import { Plus, Calendar, X, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

type EventCategory = "Community" | "Sport" | "Kids" | "Social" | "Market" | "Other";

const EVENT_CATEGORIES: EventCategory[] = ["Community","Sport","Kids","Social","Market","Other"];

const CAT_CONFIG: Record<EventCategory, { emoji: string; stripe: string; bg: string; text: string; border: string }> = {
  "Community": { emoji: "🏡", stripe: "bg-emerald-400", bg: "bg-emerald-50",  text: "text-emerald-700", border: "border-emerald-200" },
  "Sport":     { emoji: "⚽", stripe: "bg-blue-400",    bg: "bg-blue-50",     text: "text-blue-700",    border: "border-blue-200"    },
  "Kids":      { emoji: "🧒", stripe: "bg-pink-400",    bg: "bg-pink-50",     text: "text-pink-700",    border: "border-pink-200"    },
  "Social":    { emoji: "🎉", stripe: "bg-purple-400",  bg: "bg-purple-50",   text: "text-purple-700",  border: "border-purple-200"  },
  "Market":    { emoji: "🛍️", stripe: "bg-amber-400",   bg: "bg-amber-50",    text: "text-amber-700",   border: "border-amber-200"   },
  "Other":     { emoji: "📌", stripe: "bg-slate-400",   bg: "bg-slate-50",    text: "text-slate-700",   border: "border-slate-200"   },
};

function formatEventDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function formatEventTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function EventCard({ event }: { event: any }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = CAT_CONFIG[event.category as EventCategory];
  const isPast = new Date(event.event_date) < new Date();

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 overflow-hidden ${isPast ? "opacity-60" : ""}`}>
      <div className={`h-1 ${cfg.stripe}`} />
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
            {cfg.emoji} {event.category}
          </span>
          <span className="text-[10px] text-slate-400">{relativeTime(event.created_at)}</span>
        </div>

        <h3 className="font-semibold text-slate-900 text-sm leading-snug mb-2">{event.title}</h3>

        <div className="space-y-1 mb-3">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span>📅</span>
            <span className="font-medium">{formatEventDate(event.event_date)}</span>
            <span className="text-slate-400">·</span>
            <span>{formatEventTime(event.event_date)}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span>📍</span>
            <span>{event.location}</span>
          </div>
        </div>

        {event.description && (
          <>
            <p className={`text-sm text-slate-600 leading-relaxed ${!expanded ? "line-clamp-2" : ""}`}>
              {event.description}
            </p>
            {event.description.length > 120 && (
              <button onClick={() => setExpanded(!expanded)} className="text-xs text-emerald-700 font-medium mt-1 hover:underline">
                {expanded ? "Show less" : "Read more"}
              </button>
            )}
          </>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-[9px] font-bold text-emerald-700">
              {(event.profiles?.display_name || "?")[0].toUpperCase()}
            </div>
            <span className="text-xs text-slate-500">{event.profiles?.display_name || "Neighbour"}</span>
          </div>
          {event.external_url && (
            <a href={event.external_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-emerald-700 font-medium hover:underline">
              More info <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function CreateEventModal({ user, onClose, onCreated }: { user: any; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ title: "", description: "", category: "" as EventCategory | "", date: "", time: "", location: "", external_url: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!form.category) { setError("Please select a category."); return; }
    if (!form.date || !form.time) { setError("Please set a date and time."); return; }
    if (!form.location.trim()) { setError("Please add a location."); return; }
    const rl = checkRateLimit(user.id);
    if (!rl.allowed) { setError(`Please wait ${formatResetTime(rl.resetInMs)} before posting again.`); return; }
    const titleMod = moderateContent(form.title);
    if (!titleMod.safe) { setError("Your title contains content that isn't allowed."); return; }
    setLoading(true);
    try {
      const supabase = createClient();
      const eventDate = new Date(`${form.date}T${form.time}`).toISOString();
      await supabase.from("events").insert({
        user_id: user.id,
        title: titleMod.sanitised,
        description: form.description.trim() || null,
        category: form.category,
        event_date: eventDate,
        location: form.location.trim(),
        external_url: form.external_url.trim() || null,
      });
      onCreated(); toast.success("Event posted!");
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="font-bold text-slate-900">Add Event</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">Category *</label>
            <div className="grid grid-cols-3 gap-2">
              {EVENT_CATEGORIES.map(cat => {
                const cfg = CAT_CONFIG[cat];
                return (
                  <button key={cat} onClick={() => setForm(f => ({ ...f, category: cat }))}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-medium transition-colors
                      ${form.category === cat ? `${cfg.bg} ${cfg.text} border-2 ${cfg.border}` : "border-slate-200 hover:bg-slate-50 text-slate-600"}`}>
                    <span className="text-lg">{cfg.emoji}</span>{cat}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Title *</label>
            <input type="text" placeholder="e.g. Summer Community BBQ" value={form.title} maxLength={100}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Date *</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Time *</label>
              <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Location *</label>
            <input type="text" placeholder="e.g. Lyde Green Community Centre" value={form.location} maxLength={200}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Description <span className="text-slate-400 font-normal">(optional)</span></label>
            <textarea placeholder="What's happening? Who should come?" value={form.description} maxLength={1000}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Link <span className="text-slate-400 font-normal">(optional — Facebook, Eventbrite, etc.)</span></label>
            <input type="url" placeholder="https://..." value={form.external_url} maxLength={500}
              onChange={e => setForm(f => ({ ...f, external_url: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>}
        </div>
        <div className="p-5 pt-0 flex gap-3 sticky bottom-0 bg-white border-t border-slate-100">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm">Cancel</button>
          <button onClick={handleSubmit} disabled={loading || !form.title.trim() || !form.date || !form.time || !form.location.trim()}
            className="flex-1 py-3 rounded-xl bg-emerald-700 text-white font-semibold text-sm hover:bg-emerald-800 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Posting…</> : "Post Event"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<EventCategory | "All">("All");
  const [showCreate, setShowCreate] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    loadEvents();
  }, [activeCategory]);

  const loadEvents = async () => {
    setLoading(true);
    const supabase = createClient();
    let query = supabase.from("events")
      .select("*, profiles:user_id(display_name)")
      .eq("is_visible", true)
      .order("event_date", { ascending: true });
    if (activeCategory !== "All") query = query.eq("category", activeCategory);
    const { data } = await query;
    setEvents(data || []); setLoading(false);
  };

  const now = new Date();
  const upcoming = events.filter(e => new Date(e.event_date) >= now);
  const past = events.filter(e => new Date(e.event_date) < now);

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 pt-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Community Events</h1>
            <p className="text-sm text-slate-500">What's on in Lyde Green</p>
          </div>
          <button onClick={() => user ? setShowCreate(true) : toast.error("Sign in to post")}
            className="flex items-center gap-2 bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-800 transition-colors">
            <Plus className="w-4 h-4" /> Add Event
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
          {(["All", ...EVENT_CATEGORIES] as const).map(cat => {
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
        ) : events.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No events yet</p>
            <p className="text-slate-400 text-sm mt-1">Be the first to add something to the calendar!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {upcoming.length > 0 && (
              <div>
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Upcoming</h2>
                <div className="space-y-3">
                  {upcoming.map(event => <EventCard key={event.id} event={event} />)}
                </div>
              </div>
            )}
            {past.length > 0 && (
              <div>
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Past Events</h2>
                <div className="space-y-3">
                  {past.map(event => <EventCard key={event.id} event={event} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {showCreate && <CreateEventModal user={user} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); loadEvents(); }} />}
    </AppShell>
  );
}
