"use client";
// ================================================================
// Lyde Green Connect — Community Polls / Resident Voice
// app/polls/page.tsx
// ================================================================
import { useState, useEffect } from "react";
import AppShell from "@/components/bs16/AppShell";
import { createClient } from "@/lib/supabase";
import { relativeTime } from "@/lib/utils";
import { Plus, Vote, X, Loader2, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";

function formatCloseDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function PollCard({ poll, userId }: { poll: any; userId: string }) {
  const [userVote, setUserVote] = useState<number | null>(null);
  const [votes, setVotes] = useState<any[]>([]);
  const [voting, setVoting] = useState(false);
  const [loading, setLoading] = useState(true);
  const isClosed = new Date(poll.closes_at) < new Date();

  useEffect(() => {
    loadVotes();
  }, []);

  const loadVotes = async () => {
    const supabase = createClient();
    const { data } = await supabase.from("poll_votes").select("*").eq("poll_id", poll.id);
    setVotes(data || []);
    if (userId) {
      const mine = (data || []).find((v: any) => v.user_id === userId);
      if (mine) setUserVote(mine.option_index);
    }
    setLoading(false);
  };

  const handleVote = async (optionIndex: number) => {
    if (!userId) { toast.error("Sign in to vote"); return; }
    if (isClosed) { toast.error("This poll is closed"); return; }
    if (userVote !== null) return;
    setVoting(true);
    try {
      const supabase = createClient();
      await supabase.from("poll_votes").insert({ poll_id: poll.id, user_id: userId, option_index: optionIndex });
      setUserVote(optionIndex);
      setVotes(v => [...v, { poll_id: poll.id, user_id: userId, option_index: optionIndex }]);
      toast.success("Vote recorded!");
    } catch { toast.error("Already voted"); } finally { setVoting(false); }
  };

  const totalVotes = votes.length;
  const hasVoted = userVote !== null;
  const showResults = hasVoted || isClosed;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className={`h-1 ${isClosed ? "bg-slate-300" : "bg-emerald-500"}`} />
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full border ${isClosed ? "bg-slate-50 text-slate-500 border-slate-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
            {isClosed ? <><Clock className="w-3 h-3" /> Closed</> : <><Vote className="w-3 h-3" /> Open</>}
          </span>
          <span className="text-[10px] text-slate-400">
            {isClosed ? `Closed ${formatCloseDate(poll.closes_at)}` : `Closes ${formatCloseDate(poll.closes_at)}`}
          </span>
        </div>

        <h3 className="font-semibold text-slate-900 text-sm leading-snug mb-1">{poll.title}</h3>
        {poll.description && <p className="text-xs text-slate-500 mb-3 leading-relaxed">{poll.description}</p>}

        {loading ? (
          <div className="space-y-2">{poll.options.map((_: any, i: number) => (
            <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse" />
          ))}</div>
        ) : (
          <div className="space-y-2 mt-3">
            {poll.options.map((option: string, i: number) => {
              const count = votes.filter((v: any) => v.option_index === i).length;
              const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
              const isMyVote = userVote === i;

              return (
                <button key={i} onClick={() => !showResults && handleVote(i)}
                  disabled={voting || showResults}
                  className={`w-full text-left rounded-xl border transition-all overflow-hidden relative
                    ${showResults ? "cursor-default" : "hover:border-emerald-400 hover:bg-emerald-50 cursor-pointer"}
                    ${isMyVote ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white"}`}>
                  {showResults && (
                    <div className={`absolute inset-y-0 left-0 transition-all rounded-xl ${isMyVote ? "bg-emerald-100" : "bg-slate-100"}`}
                      style={{ width: `${pct}%` }} />
                  )}
                  <div className="relative px-3 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isMyVote && <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                      <span className={`text-sm ${isMyVote ? "font-semibold text-emerald-800" : "text-slate-700"}`}>{option}</span>
                    </div>
                    {showResults && (
                      <span className="text-xs font-semibold text-slate-500 shrink-0 ml-2">{pct}%</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
          <span className="text-xs text-slate-400">{totalVotes} {totalVotes === 1 ? "vote" : "votes"}</span>
          {!showResults && !isClosed && (
            <span className="text-[10px] text-slate-400">Results shown after voting</span>
          )}
          {hasVoted && !isClosed && (
            <span className="text-[10px] text-emerald-600 font-medium">✓ You voted</span>
          )}
        </div>
      </div>
    </div>
  );
}

function CreatePollModal({ user, onClose, onCreated }: { user: any; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ title: "", description: "", options: ["", ""], closes_at: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const addOption = () => {
    if (form.options.length >= 6) return;
    setForm(f => ({ ...f, options: [...f.options, ""] }));
  };

  const removeOption = (i: number) => {
    if (form.options.length <= 2) return;
    setForm(f => ({ ...f, options: f.options.filter((_, idx) => idx !== i) }));
  };

  const updateOption = (i: number, val: string) => {
    setForm(f => ({ ...f, options: f.options.map((o, idx) => idx === i ? val : o) }));
  };

  const handleSubmit = async () => {
    const validOptions = form.options.map(o => o.trim()).filter(Boolean);
    if (validOptions.length < 2) { setError("Please add at least 2 options."); return; }
    if (!form.closes_at) { setError("Please set a closing date."); return; }
    setLoading(true);
    try {
      const supabase = createClient();
      await supabase.from("polls").insert({
        user_id: user.id,
        title: form.title.trim(),
        description: form.description.trim() || null,
        options: validOptions,
        closes_at: new Date(form.closes_at).toISOString(),
      });
      onCreated(); toast.success("Poll created!");
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="font-bold text-slate-900">Create Poll</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Question *</label>
            <input type="text" placeholder="e.g. Should we push for a pedestrian crossing on Lyde Green Road?"
              value={form.title} maxLength={200}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Description <span className="text-slate-400 font-normal">(optional)</span></label>
            <textarea placeholder="Add context to help residents decide…"
              value={form.description} maxLength={500}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Options * <span className="text-slate-400 font-normal">(2–6)</span></label>
            {form.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="text" placeholder={`Option ${i + 1}`} value={opt} maxLength={100}
                  onChange={e => updateOption(i, e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                {form.options.length > 2 && (
                  <button onClick={() => removeOption(i)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400"><X className="w-4 h-4" /></button>
                )}
              </div>
            ))}
            {form.options.length < 6 && (
              <button onClick={addOption} className="text-xs text-emerald-700 font-medium hover:underline">+ Add option</button>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Closing date *</label>
            <input type="date" min={minDateStr} value={form.closes_at}
              onChange={e => setForm(f => ({ ...f, closes_at: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>}
        </div>
        <div className="p-5 pt-0 flex gap-3 sticky bottom-0 bg-white border-t border-slate-100">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm">Cancel</button>
          <button onClick={handleSubmit} disabled={loading || !form.title.trim()}
            className="flex-1 py-3 rounded-xl bg-emerald-700 text-white font-semibold text-sm hover:bg-emerald-800 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Creating…</> : "Create Poll"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PollsPage() {
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"Open" | "Closed" | "All">("Open");
  const [showCreate, setShowCreate] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
        setIsAdmin(profile?.is_admin || false);
      }
      loadPolls();
    };
    init();
  }, []);

  const loadPolls = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.from("polls").select("*").eq("is_visible", true).order("created_at", { ascending: false });
    setPolls(data || []); setLoading(false);
  };

  const now = new Date();
  const filtered = polls.filter(p => {
    if (filter === "Open") return new Date(p.closes_at) >= now;
    if (filter === "Closed") return new Date(p.closes_at) < now;
    return true;
  });

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 pt-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Resident Voice</h1>
            <p className="text-sm text-slate-500">Have your say on what matters in Lyde Green</p>
          </div>
          {isAdmin && (
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-800 transition-colors">
              <Plus className="w-4 h-4" /> New Poll
            </button>
          )}
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 mb-4 flex items-start gap-3">
          <Vote className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
          <p className="text-xs text-emerald-800 leading-relaxed">
            <strong>Your vote is private.</strong> Results are only shown after you vote. Poll results may be shared with the community and local council.
          </p>
        </div>

        <div className="flex gap-2 mb-4">
          {(["Open", "Closed", "All"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                ${filter === f ? "bg-emerald-700 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-emerald-300"}`}>
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 animate-pulse">
              <div className="h-3 bg-slate-100 rounded w-1/4 mb-3" /><div className="h-4 bg-slate-100 rounded w-3/4 mb-4" />
              <div className="space-y-2">{[...Array(3)].map((_, j) => <div key={j} className="h-10 bg-slate-100 rounded-xl" />)}</div>
            </div>
          ))}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Vote className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No polls yet</p>
            <p className="text-slate-400 text-sm mt-1">{isAdmin ? "Create the first poll for your community." : "Check back soon for polls from the community team."}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(poll => <PollCard key={poll.id} poll={poll} userId={user?.id || ""} />)}
          </div>
        )}
      </div>
      {showCreate && <CreatePollModal user={user} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); loadPolls(); }} />}
    </AppShell>
  );
}
