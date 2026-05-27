"use client";
// ================================================================
// BS16 Hub — User Profile Page
// app/profile/page.tsx
// ================================================================
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/bs16/AppShell";
import { createClient } from "@/lib/supabase";
import { validateBS16Postcode, validateUKMobile, NEIGHBOURHOODS, type Neighbourhood, relativeTime } from "@/lib/utils";
import { User, MapPin, Phone, Mail, Lock, Package, Pin, Briefcase, ChevronRight, Loader2, Check, X, LogOut, Edit3 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

type Tab = "profile" | "posts";
type EditSection = "name" | "email" | "phone" | "location" | "password" | null;

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("profile");
  const [editSection, setEditSection] = useState<EditSection>(null);
  const [posts, setPosts] = useState<{ market: any[]; notices: any[]; jobs: any[] }>({ market: [], notices: [], jobs: [] });
  const [postsLoading, setPostsLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }
      setUser(user);
      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(p);
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (tab === "posts" && user) loadPosts();
  }, [tab, user]);

  const loadPosts = async () => {
    setPostsLoading(true);
    const supabase = createClient();
    const [market, notices, jobs] = await Promise.all([
      supabase.from("market_listings").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("notice_posts").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("jobs").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);
    setPosts({ market: market.data || [], notices: notices.data || [], jobs: jobs.data || [] });
    setPostsLoading(false);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) return (
    <AppShell>
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-emerald-700 animate-spin" />
      </div>
    </AppShell>
  );

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 pt-4 pb-6">

        {/* Header card */}
        <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 rounded-2xl p-5 mb-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8 pointer-events-none" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
              {(profile?.display_name || user?.email || "?")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-white font-bold text-lg leading-tight">{profile?.display_name || "Neighbour"}</h1>
              <p className="text-emerald-200 text-sm">{profile?.neighbourhood || "BS16"}</p>
              <span className="inline-block mt-1 text-[10px] bg-white/15 text-white px-2 py-0.5 rounded-full font-medium">
                {profile?.role === "trader" ? "🔧 Tradesperson" : "🏠 Homeowner"}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {(["profile", "posts"] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${tab === t ? "bg-emerald-700 text-white" : "bg-white border border-slate-200 text-slate-600"}`}>
              {t === "profile" ? "👤 My Profile" : "📋 My Posts"}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {tab === "profile" && (
          <div className="space-y-3">
            <ProfileSection
              icon={<User className="w-4 h-4" />}
              label="Display Name"
              value={profile?.display_name}
              onEdit={() => setEditSection("name")}
            />
            <ProfileSection
              icon={<Mail className="w-4 h-4" />}
              label="Email"
              value={user?.email}
              onEdit={() => setEditSection("email")}
            />
            <ProfileSection
              icon={<Phone className="w-4 h-4" />}
              label="Phone Number"
              value={profile?.phone_number}
              onEdit={() => setEditSection("phone")}
              hint="Never shown publicly"
            />
            <ProfileSection
              icon={<MapPin className="w-4 h-4" />}
              label="Location"
              value={`${profile?.neighbourhood} · ${profile?.postcode}`}
              onEdit={() => setEditSection("location")}
            />
            <ProfileSection
              icon={<Lock className="w-4 h-4" />}
              label="Password"
              value="••••••••"
              onEdit={() => setEditSection("password")}
            />

            <button onClick={handleSignOut}
              className="w-full py-3 rounded-xl border border-red-200 text-red-600 font-medium text-sm hover:bg-red-50 transition-colors flex items-center justify-center gap-2 mt-4">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        )}

        {/* Posts Tab */}
        {tab === "posts" && (
          <div className="space-y-4">
            {postsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-emerald-700 animate-spin" /></div>
            ) : (
              <>
                <PostSection
                  icon={<Package className="w-4 h-4" />}
                  title="Market Listings"
                  color="text-emerald-700"
                  items={posts.market}
                  renderItem={(item) => (
                    <div key={item.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{item.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{relativeTime(item.created_at)}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ml-3 ${item.status === "gone" ? "bg-slate-100 text-slate-500" : "bg-emerald-100 text-emerald-700"}`}>
                        {item.status === "gone" ? "Gone" : "Active"}
                      </span>
                    </div>
                  )}
                  emptyText="No market listings yet"
                  linkHref="/market"
                />
                <PostSection
                  icon={<Pin className="w-4 h-4" />}
                  title="Notice Board Posts"
                  color="text-purple-700"
                  items={posts.notices}
                  renderItem={(item) => (
                    <div key={item.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{item.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{item.tag} · {relativeTime(item.created_at)}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ml-3 ${item.is_visible ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-500"}`}>
                        {item.is_visible ? "Visible" : "Hidden"}
                      </span>
                    </div>
                  )}
                  emptyText="No notices posted yet"
                  linkHref="/notices"
                />
                <PostSection
                  icon={<Briefcase className="w-4 h-4" />}
                  title="Job Posts"
                  color="text-blue-700"
                  items={posts.jobs}
                  renderItem={(item) => (
                    <div key={item.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{item.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{item.category} · {relativeTime(item.created_at)}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ml-3 ${item.is_active ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
                        {item.is_active ? "Active" : "Closed"}
                      </span>
                    </div>
                  )}
                  emptyText="No jobs posted yet"
                  linkHref="/jobs"
                />
              </>
            )}
          </div>
        )}
      </div>

      {/* Edit Modals */}
      {editSection === "name" && (
        <EditNameModal
          current={profile?.display_name}
          userId={user.id}
          onClose={() => setEditSection(null)}
          onSaved={(val) => { setProfile((p: any) => ({ ...p, display_name: val })); setEditSection(null); }}
        />
      )}
      {editSection === "email" && (
        <EditEmailModal
          current={user?.email}
          onClose={() => setEditSection(null)}
          onSaved={() => { toast.success("Check your new email for a confirmation link"); setEditSection(null); }}
        />
      )}
      {editSection === "phone" && (
        <EditPhoneModal
          current={profile?.phone_number}
          userId={user.id}
          onClose={() => setEditSection(null)}
          onSaved={(val) => { setProfile((p: any) => ({ ...p, phone_number: val })); setEditSection(null); }}
        />
      )}
      {editSection === "location" && (
        <EditLocationModal
          currentPostcode={profile?.postcode}
          currentNeighbourhood={profile?.neighbourhood}
          userId={user.id}
          onClose={() => setEditSection(null)}
          onSaved={(postcode, neighbourhood) => { setProfile((p: any) => ({ ...p, postcode, neighbourhood })); setEditSection(null); }}
        />
      )}
      {editSection === "password" && (
        <EditPasswordModal
          onClose={() => setEditSection(null)}
          onSaved={() => { toast.success("Password updated!"); setEditSection(null); }}
        />
      )}
    </AppShell>
  );
}

// ── Reusable profile row ─────────────────────────────────────────
function ProfileSection({ icon, label, value, onEdit, hint }: { icon: React.ReactNode; label: string; value: string; onEdit: () => void; hint?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 px-4 py-3.5 flex items-center gap-3">
      <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400 font-medium">{label}</p>
        <p className="text-sm font-semibold text-slate-900 truncate">{value}</p>
        {hint && <p className="text-[10px] text-slate-400 mt-0.5">🔒 {hint}</p>}
      </div>
      <button onClick={onEdit} className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0">
        <Edit3 className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Post section ─────────────────────────────────────────────────
function PostSection({ icon, title, color, items, renderItem, emptyText, linkHref }: any) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className={`flex items-center gap-2 font-semibold text-sm ${color}`}>
          {icon} {title}
          <span className="bg-slate-100 text-slate-500 text-xs px-1.5 py-0.5 rounded-full font-medium">{items.length}</span>
        </div>
        <Link href={linkHref} className="text-xs text-emerald-700 font-medium hover:underline">View all</Link>
      </div>
      <div className="px-4">
        {items.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">{emptyText}</p>
        ) : (
          items.slice(0, 5).map(renderItem)
        )}
      </div>
    </div>
  );
}

// ── Modal base ───────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500"><X className="w-4 h-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Edit Name ────────────────────────────────────────────────────
function EditNameModal({ current, userId, onClose, onSaved }: { current: string; userId: string; onClose: () => void; onSaved: (v: string) => void }) {
  const [value, setValue] = useState(current);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const save = async () => {
    if (value.trim().length < 2) { setError("Name must be at least 2 characters."); return; }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ display_name: value.trim() }).eq("id", userId);
    if (error) { setError(error.message); setLoading(false); return; }
    toast.success("Name updated!"); onSaved(value.trim());
  };
  return (
    <Modal title="Edit Display Name" onClose={onClose}>
      <div className="p-5 space-y-4">
        <input type="text" value={value} onChange={e => setValue(e.target.value)} maxLength={50}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
      <div className="p-5 pt-0 flex gap-3">
        <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm">Cancel</button>
        <button onClick={save} disabled={loading} className="flex-1 py-3 rounded-xl bg-emerald-700 text-white font-semibold text-sm hover:bg-emerald-800 disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save
        </button>
      </div>
    </Modal>
  );
}

// ── Edit Email ───────────────────────────────────────────────────
function EditEmailModal({ current, onClose, onSaved }: { current: string; onClose: () => void; onSaved: () => void }) {
  const [value, setValue] = useState(current);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const save = async () => {
    if (!value.includes("@")) { setError("Please enter a valid email."); return; }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ email: value });
    if (error) { setError(error.message); setLoading(false); return; }
    onSaved();
  };
  return (
    <Modal title="Edit Email" onClose={onClose}>
      <div className="p-5 space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-xs text-amber-800">A confirmation link will be sent to your new email address.</p>
        </div>
        <input type="email" value={value} onChange={e => setValue(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
      <div className="p-5 pt-0 flex gap-3">
        <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm">Cancel</button>
        <button onClick={save} disabled={loading} className="flex-1 py-3 rounded-xl bg-emerald-700 text-white font-semibold text-sm hover:bg-emerald-800 disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save
        </button>
      </div>
    </Modal>
  );
}

// ── Edit Phone ───────────────────────────────────────────────────
function EditPhoneModal({ current, userId, onClose, onSaved }: { current: string; userId: string; onClose: () => void; onSaved: (v: string) => void }) {
  const [value, setValue] = useState(current);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const save = async () => {
    const { validateUKMobile } = await import("@/lib/utils");
    const result = validateUKMobile(value);
    if (!result.valid) { setError(result.error!); return; }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ phone_number: value }).eq("id", userId);
    if (error) { setError(error.message); setLoading(false); return; }
    toast.success("Phone number updated!"); onSaved(value);
  };
  return (
    <Modal title="Edit Phone Number" onClose={onClose}>
      <div className="p-5 space-y-4">
        <p className="text-xs text-slate-400">🔒 Never shown publicly · only used for verification</p>
        <input type="tel" value={value} onChange={e => setValue(e.target.value)} placeholder="07700 900123"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
      <div className="p-5 pt-0 flex gap-3">
        <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm">Cancel</button>
        <button onClick={save} disabled={loading} className="flex-1 py-3 rounded-xl bg-emerald-700 text-white font-semibold text-sm hover:bg-emerald-800 disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save
        </button>
      </div>
    </Modal>
  );
}

// ── Edit Location ────────────────────────────────────────────────
function EditLocationModal({ currentPostcode, currentNeighbourhood, userId, onClose, onSaved }: { currentPostcode: string; currentNeighbourhood: string; userId: string; onClose: () => void; onSaved: (p: string, n: string) => void }) {
  const [postcode, setPostcode] = useState(currentPostcode);
  const [neighbourhood, setNeighbourhood] = useState(currentNeighbourhood);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const save = async () => {
    const { validateBS16Postcode } = await import("@/lib/utils");
    const result = validateBS16Postcode(postcode);
    if (!result.valid) { setError(result.error!); return; }
    if (!neighbourhood) { setError("Please select a neighbourhood."); return; }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ postcode: postcode.toUpperCase(), neighbourhood }).eq("id", userId);
    if (error) { setError(error.message); setLoading(false); return; }
    toast.success("Location updated!"); onSaved(postcode.toUpperCase(), neighbourhood);
  };
  return (
    <Modal title="Edit Location" onClose={onClose}>
      <div className="p-5 space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 block">Postcode</label>
          <input type="text" value={postcode} onChange={e => setPostcode(e.target.value.toUpperCase())} maxLength={8} placeholder="BS16 5UT"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 block">Neighbourhood</label>
          <div className="grid grid-cols-2 gap-3">
            {NEIGHBOURHOODS.map(n => (
              <button key={n} type="button" onClick={() => setNeighbourhood(n)}
                className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${neighbourhood === n ? "border-emerald-600 bg-emerald-50 text-emerald-900" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                {n === "Lyde Green" ? "🌳" : "🏘️"} {n}
              </button>
            ))}
          </div>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
      <div className="p-5 pt-0 flex gap-3">
        <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm">Cancel</button>
        <button onClick={save} disabled={loading} className="flex-1 py-3 rounded-xl bg-emerald-700 text-white font-semibold text-sm hover:bg-emerald-800 disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save
        </button>
      </div>
    </Modal>
  );
}

// ── Edit Password ────────────────────────────────────────────────
function EditPasswordModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ current: "", newPass: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const save = async () => {
    if (form.newPass.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (form.newPass !== form.confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: form.newPass });
    if (error) { setError(error.message); setLoading(false); return; }
    onSaved();
  };
  return (
    <Modal title="Change Password" onClose={onClose}>
      <div className="p-5 space-y-4">
        {[["newPass","New Password","At least 8 characters"],["confirm","Confirm Password","Repeat new password"]].map(([k, label, ph]) => (
          <div key={k} className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 block">{label}</label>
            <input type="password" placeholder={ph} value={(form as any)[k]}
              onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
        ))}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
      <div className="p-5 pt-0 flex gap-3">
        <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm">Cancel</button>
        <button onClick={save} disabled={loading} className="flex-1 py-3 rounded-xl bg-emerald-700 text-white font-semibold text-sm hover:bg-emerald-800 disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save
        </button>
      </div>
    </Modal>
  );
}
