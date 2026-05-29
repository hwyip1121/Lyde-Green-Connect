"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { validateBS16Postcode, validateUKMobile, NEIGHBOURHOODS, type Neighbourhood } from "@/lib/utils";
import { Check, ChevronRight, ChevronLeft, MapPin, Shield, Loader2 } from "lucide-react";

type Step = "account" | "location" | "confirm" | "verify";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("account");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    displayName: "", email: "", password: "", role: "homeowner" as "homeowner" | "trader",
    phoneNumber: "", postcode: "", neighbourhood: "" as Neighbourhood | "",
  });

  const set = (k: string, v: string) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: "" })); };

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (form.displayName.trim().length < 2) e.displayName = "Please enter your name.";
    if (!form.email.includes("@")) e.email = "Please enter a valid email.";
    if (form.password.length < 8) e.password = "Password must be at least 8 characters.";
    const ph = validateUKMobile(form.phoneNumber);
    if (!ph.valid) e.phoneNumber = ph.error!;
    if (Object.keys(e).length) { setErrors(e); return false; }
    return true;
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    const pc = validateBS16Postcode(form.postcode);
    if (!pc.valid) { e.postcode = pc.error!; setErrors(e); return false; }
    if (!form.neighbourhood) { e.neighbourhood = "Please select your neighbourhood."; setErrors(e); return false; }
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true); setErrors({});
    const supabase = createClient();
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email, password: form.password,
        options: { data: { display_name: form.displayName, role: form.role } },
      });
      if (error) throw error;
      if (data.user) {
        await supabase.from("profiles").upsert({
          id: data.user.id, display_name: form.displayName,
          phone_number: form.phoneNumber, postcode: form.postcode.toUpperCase(),
          neighbourhood: form.neighbourhood, role: form.role, bs16_verified: true,
        });
      }
      setStep("verify");
    } catch (err: any) {
      setErrors({ general: err.message || "Registration failed. Please try again." });
    } finally { setLoading(false); }
  };

  const isExclusionError = errors.postcode?.includes("exclusive");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-5 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center">
          <span className="text-white text-xs font-bold">B</span>
        </div>
        <span className="font-bold text-slate-900 text-lg tracking-tight">BS16 Hub</span>
      </header>

      <div className="flex-1 flex items-start justify-center px-5 pt-8 pb-20">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8">
            {(["account","location","confirm"] as Step[]).map((s, i) => {
              const done = (step === "location" && i === 0) || step === "confirm";
              const active = s === step;
              return (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${active ? "bg-emerald-700 text-white" : done ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-400"}`}>
                    {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <span className={`text-xs hidden sm:block ${active ? "text-slate-900 font-medium" : "text-slate-400"}`}>
                    {s === "account" ? "Account" : s === "location" ? "Location" : "Confirm"}
                  </span>
                  {i < 2 && <div className="flex-1 h-px bg-slate-200" />}
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">

            {step === "account" && (
              <div className="space-y-5">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Create your account</h1>
                  <p className="text-sm text-slate-500 mt-1">Join your local community hub</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-2">I am a…</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[["homeowner","🏠","Homeowner"],["trader","🔧","Tradesperson"]].map(([r, emoji, label]) => (
                      <button key={r} type="button" onClick={() => set("role", r)}
                        className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${form.role === r ? "border-emerald-600 bg-emerald-50 text-emerald-900" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                        <div className="text-2xl mb-1">{emoji}</div>{label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 block">Your Name</label>
                  <input type="text" placeholder="e.g. Sarah M." value={form.displayName}
                    onChange={e => set("displayName", e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.displayName ? "border-red-300 bg-red-50" : "border-slate-200 hover:border-slate-300"}`} />
                  {errors.displayName && <p className="text-xs text-red-600">{errors.displayName}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 block">Email</label>
                  <input type="email" placeholder="you@example.com" value={form.email}
                    onChange={e => set("email", e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.email ? "border-red-300 bg-red-50" : "border-slate-200 hover:border-slate-300"}`} />
                  {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 block">UK Mobile Number</label>
                  <input type="tel" placeholder="07700 900123" value={form.phoneNumber}
                    onChange={e => set("phoneNumber", e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.phoneNumber ? "border-red-300 bg-red-50" : "border-slate-200 hover:border-slate-300"}`} />
                  {errors.phoneNumber
                    ? <p className="text-xs text-red-600">{errors.phoneNumber}</p>
                    : <p className="text-xs text-slate-400">🔒 Only used for account verification · never shown publicly</p>
                  }
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 block">Password</label>
                  <input type="password" placeholder="At least 8 characters" value={form.password}
                    onChange={e => set("password", e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.password ? "border-red-300 bg-red-50" : "border-slate-200 hover:border-slate-300"}`} />
                  {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
                </div>

                <button onClick={() => validateStep1() && setStep("location")}
                  className="w-full py-3 rounded-xl bg-emerald-700 text-white font-semibold text-sm hover:bg-emerald-800 transition-colors flex items-center justify-center gap-2">
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
                <p className="text-center text-sm text-slate-500">Already have an account? <Link href="/auth/login" className="text-emerald-700 font-medium">Sign in</Link></p>
              </div>
            )}

            {step === "location" && (
              <div className="space-y-5">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-emerald-700" /> Verify your location
                  </h1>
                  <p className="text-sm text-slate-500 mt-1">BS16 Hub is exclusively for Lyde Green & Emersons Green residents</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3">
                  <Shield className="w-4 h-4 text-emerald-700 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-emerald-800 leading-relaxed">Your full address is never stored or shown publicly.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 block">Your Postcode * <span className="text-slate-400 font-normal">(must begin with BS16)</span></label>
                  <input type="text" placeholder="e.g. BS16 5UT" value={form.postcode}
                    onChange={e => set("postcode", e.target.value.toUpperCase())} maxLength={8}
                    className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.postcode ? "border-red-300 bg-red-50" : "border-slate-200"}`} />
                  {errors.postcode && !isExclusionError && <p className="text-xs text-red-600">{errors.postcode}</p>}
                </div>
                {isExclusionError && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-sm text-amber-800 leading-relaxed">{errors.postcode}</p>
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 block">Neighbourhood *</label>
                  <div className="grid grid-cols-2 gap-3">
                    {NEIGHBOURHOODS.map(n => (
                      <button key={n} type="button" onClick={() => set("neighbourhood", n)}
                        className={`p-4 rounded-xl border-2 text-sm font-medium transition-all text-left ${form.neighbourhood === n ? "border-emerald-600 bg-emerald-50 text-emerald-900" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}>
                        {n === "Lyde Green" ? "🌳" : "🏘️"} {n}
                      </button>
                    ))}
                  </div>
                  {errors.neighbourhood && <p className="text-xs text-red-600">{errors.neighbourhood}</p>}
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-xs text-blue-800 leading-relaxed"><strong>Privacy:</strong> Your postcode is stored securely and never shown publicly. Only your neighbourhood name appears on your posts.</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep("account")} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm flex items-center justify-center gap-1">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button onClick={() => validateStep2() && setStep("confirm")}
                    className="flex-1 py-3 rounded-xl bg-emerald-700 text-white font-semibold text-sm hover:bg-emerald-800 flex items-center justify-center gap-1">
                    Continue <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {step === "confirm" && (
              <div className="space-y-5">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Almost there!</h1>
                  <p className="text-sm text-slate-500 mt-1">Review your details before joining</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl divide-y divide-slate-200">
                  {[["Name",form.displayName],["Email",form.email],["Mobile",form.phoneNumber],["Postcode",form.postcode.toUpperCase()],["Neighbourhood",form.neighbourhood],["Role",form.role === "trader" ? "Tradesperson" : "Homeowner"]].map(([label, value]) => (
                    <div key={label} className="flex justify-between items-center px-4 py-3">
                      <span className="text-sm text-slate-500">{label}</span>
                      <span className="text-sm font-medium text-slate-900">{value}</span>
                    </div>
                  ))}
                </div>
                {errors.general && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-sm text-red-700">{errors.general}</p>
                  </div>
                )}
                <p className="text-xs text-center text-slate-400 leading-relaxed">By joining, you agree to keep BS16 Hub a respectful, helpful community space.</p>
                <div className="flex gap-3">
                  <button onClick={() => setStep("location")} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm flex items-center justify-center gap-1">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button onClick={handleSubmit} disabled={loading}
                    className="flex-1 py-3 rounded-xl bg-emerald-700 text-white font-semibold text-sm hover:bg-emerald-800 disabled:opacity-70 flex items-center justify-center gap-2">
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Joining…</> : "Join BS16 Hub 🎉"}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
