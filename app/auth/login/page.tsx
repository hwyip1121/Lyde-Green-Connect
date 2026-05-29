"use client";
// ================================================================
// BS16 Hub — Login Page
// app/auth/login/page.tsx
// ================================================================
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push("/notices");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-5 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center">
          <span className="text-white text-xs font-bold">B</span>
        </div>
        <span className="font-bold text-slate-900 text-lg tracking-tight">BS16 Hub</span>
      </header>

      <div className="flex-1 flex items-center justify-center px-5">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h1 className="text-xl font-bold text-slate-900 mb-1">Welcome back</h1>
            <p className="text-sm text-slate-500 mb-6">Sign in to your BS16 Hub account</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {[["email","Email","you@example.com","email"],["password","Password","••••••••","password"]].map(([k,label,ph,type]) => (
                <div key={k} className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 block">{label}</label>
                  <input type={type} placeholder={ph} value={(form as any)[k]}
                    onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              ))}
              {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3"><p className="text-sm text-red-700">{error}</p></div>}
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl bg-emerald-700 text-white font-semibold text-sm hover:bg-emerald-800 disabled:opacity-70 flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</> : "Sign In"}
              </button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-5">
              Don't have an account? <Link href="/auth/register" className="text-emerald-700 font-medium">Join BS16 Hub</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
