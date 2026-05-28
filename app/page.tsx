"use client";
// ================================================================
// BS16 Hub — Landing Page
// app/page.tsx
// ================================================================
import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingBag, Pin, Briefcase, Wrench, ChevronRight, X, Smartphone } from "lucide-react";

// ── Add to Home Screen Banner ────────────────────────────────────
function AddToHomeBanner() {
  const [showHow, setShowHow] = useState(false);

  return (
    <>
      <div className="mx-4 mt-4 bg-emerald-700 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm">
        <Smartphone className="w-5 h-5 text-emerald-200 flex-shrink-0" />
        <p className="text-sm text-white flex-1 leading-snug">
          📱 Get the best experience — add BS16 Hub to your home screen!
        </p>
        <button
          onClick={() => setShowHow(true)}
          className="shrink-0 bg-white text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-emerald-50 transition-colors"
        >
          How?
        </button>
      </div>

      {showHow && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">Add to Home Screen</h2>
              <button onClick={() => setShowHow(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🍎</span>
                  <span className="font-semibold text-slate-800 text-sm">iPhone (Safari only)</span>
                </div>
                <ol className="space-y-2">
                  {[
                    "Open bs-16-hub.vercel.app in Safari",
                    "Tap the Share button (□ with arrow) at the bottom",
                    'Scroll down and tap "Add to Home Screen"',
                    'Tap "Add" in the top right',
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                      <span className="text-sm text-slate-600">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="border-t border-slate-100" />
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🤖</span>
                  <span className="font-semibold text-slate-800 text-sm">Android (Chrome)</span>
                </div>
                <ol className="space-y-2">
                  {[
                    "Open bs-16-hub.vercel.app in Chrome",
                    "Tap the ⋮ menu in the top right",
                    'Tap "Add to Home screen"',
                    'Tap "Add"',
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                      <span className="text-sm text-slate-600">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
            <div className="p-5 pt-0">
              <button onClick={() => setShowHow(false)} className="w-full py-3 rounded-xl bg-emerald-700 text-white font-semibold text-sm hover:bg-emerald-800">
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const FEATURES = [
  { icon: <ShoppingBag className="w-6 h-6" />, color: "bg-emerald-100 text-emerald-700", title: "Local Market", desc: "Buy, sell and gift items with your neighbours. No delivery, no strangers — just your community." },
  { icon: <Pin className="w-6 h-6" />, color: "bg-purple-100 text-purple-700", title: "Notice Board", desc: "Share local events, lost pets, and neighbourhood news with Lyde Green & Emersons Green." },
  { icon: <Briefcase className="w-6 h-6" />, color: "bg-blue-100 text-blue-700", title: "Local Jobs", desc: "Post small jobs for trusted local tradespeople — plumbing, gardening, maintenance and more." },
  { icon: <Wrench className="w-6 h-6" />, color: "bg-amber-100 text-amber-700", title: "Trusted Traders", desc: "Find verified local tradespeople in BS16 — all manually reviewed before joining the platform.", badge: "Phase 2" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-emerald-700 flex items-center justify-center">
            <span className="text-white text-[11px] font-bold">B</span>
          </div>
          <span className="font-bold text-slate-900 tracking-tight">BS16 Hub</span>
          <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium">Beta</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/auth/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors">Sign in</Link>
          <Link href="/auth/register" className="text-sm font-semibold text-white bg-emerald-700 px-3 py-1.5 rounded-xl hover:bg-emerald-800 transition-colors">Join free</Link>
        </div>
      </header>

      <AddToHomeBanner />

      <section className="px-4 pt-10 pb-8 max-w-2xl mx-auto w-full text-center">
        <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-emerald-200 mb-5">
          🏡 Lyde Green & Emersons Green · Bristol BS16
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
          Your neighbourhood,<br />
          <span className="text-emerald-700">closer together</span>
        </h1>
        <p className="text-slate-500 text-base leading-relaxed mb-8 max-w-md mx-auto">
          BS16 Hub is a hyper-local community platform for residents of Lyde Green and Emersons Green. Buy, sell, share, and support your neighbours — all in one place.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/auth/register" className="flex items-center justify-center gap-2 bg-emerald-700 text-white font-semibold px-6 py-3.5 rounded-2xl hover:bg-emerald-800 transition-colors text-sm shadow-sm">
            Join your community <ChevronRight className="w-4 h-4" />
          </Link>
          <Link href="/auth/login" className="flex items-center justify-center gap-2 bg-white text-slate-700 font-semibold px-6 py-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-colors text-sm">
            Sign in
          </Link>
        </div>
      </section>

      <section className="px-4 pb-8 max-w-2xl mx-auto w-full">
        <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-12 translate-x-12 pointer-events-none" />
          <div className="relative z-10">
            <span className="text-2xl mb-3 block">🌱</span>
            <h2 className="text-xl font-bold mb-2">Our Mission</h2>
            <p className="text-emerald-100 text-sm leading-relaxed">
              We believe strong communities start with neighbours who know and trust each other. BS16 Hub exists to make it easy to connect, share resources, and support local businesses — right here in BS16.
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 pb-8 max-w-2xl mx-auto w-full">
        <h2 className="text-lg font-bold text-slate-900 mb-4">What's on BS16 Hub</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FEATURES.map(({ icon, color, title, desc, badge }) => (
            <div key={title} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
                {badge && <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">{badge}</span>}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-1">{title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pb-8 max-w-2xl mx-auto w-full">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="text-sm font-bold text-slate-900 mb-4 text-center">Serving our community</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[["🏘️","2","Neighbourhoods"],["📮","BS16","Postcode area"],["🔒","Verified","Residents only"]].map(([emoji,val,label]) => (
              <div key={label}>
                <div className="text-2xl mb-1">{emoji}</div>
                <div className="font-bold text-slate-900 text-sm">{val}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-10 max-w-2xl mx-auto w-full">
        <div className="bg-slate-900 rounded-2xl p-6 text-center">
          <h2 className="text-white font-bold text-lg mb-2">Ready to join?</h2>
          <p className="text-slate-400 text-sm mb-5">Free for all BS16 residents. Takes 30 seconds to sign up.</p>
          <Link href="/auth/register" className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm">
            Create your free account <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-4 py-5 text-center">
        <p className="text-xs text-slate-400">© 2025 BS16 Hub · Lyde Green & Emersons Green · Bristol</p>
      </footer>
    </div>
  );
}
