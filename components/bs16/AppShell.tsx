"use client";
// ================================================================
// BS16 Hub — App Shell Layout
// components/bs16/AppShell.tsx
// ================================================================
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, Pin, Eye, Wrench, Briefcase, Smartphone, X, MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";

const NAV = [
  { href: "/market",  label: "Market",  Icon: ShoppingBag },
  { href: "/notices", label: "Notices", Icon: Pin         },
  { href: "/watch",   label: "Watch",   Icon: Eye         },
  { href: "/jobs",    label: "Jobs",    Icon: Briefcase   },
  { href: "/trades",  label: "Trades",  Icon: Wrench, locked: true },
  { href: "/inbox",   label: "Inbox",   Icon: MessageCircle },
];


function AddToHomeBanner() {
  const [showHow, setShowHow] = useState(false);
  return (
    <>
      <div className="mx-4 mt-3 bg-emerald-700 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm">
        <Smartphone className="w-5 h-5 text-emerald-200 flex-shrink-0" />
        <p className="text-sm text-white flex-1 leading-snug">📱 Add BS16 Hub to your home screen!</p>
        <button onClick={() => setShowHow(true)}
          className="shrink-0 bg-white text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-emerald-50 transition-colors">
          How?
        </button>
      </div>
      {showHow && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">Add to Home Screen</h2>
              <button onClick={() => setShowHow(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-3"><span className="text-lg">🍎</span><span className="font-semibold text-slate-800 text-sm">iPhone (Safari only)</span></div>
                <ol className="space-y-2">
                  {["Open bs-16-hub.vercel.app in Safari","Tap the Share button (□ with arrow) at the bottom","Scroll down and tap \"Add to Home Screen\"","Tap \"Add\" in the top right"].map((s, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                      <span className="text-sm text-slate-600">{s}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="border-t border-slate-100" />
              <div>
                <div className="flex items-center gap-2 mb-3"><span className="text-lg">🤖</span><span className="font-semibold text-slate-800 text-sm">Android (Chrome)</span></div>
                <ol className="space-y-2">
                  {["Open bs-16-hub.vercel.app in Chrome","Tap the ⋮ menu in the top right","Tap \"Add to Home screen\"","Tap \"Add\""].map((s, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                      <span className="text-sm text-slate-600">{s}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
            <div className="p-5 pt-0">
              <button onClick={() => setShowHow(false)} className="w-full py-3 rounded-xl bg-emerald-700 text-white font-semibold text-sm hover:bg-emerald-800">Got it!</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      const { createClient } = await import("@/lib/supabase");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("is_read", false);
      setUnreadCount(count || 0);
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [path]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Mobile header */}
      <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-emerald-700 flex items-center justify-center">
            <span className="text-white text-[11px] font-bold">B</span>
          </div>
          <span className="font-bold text-slate-900 tracking-tight">BS16 Hub</span>
          <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium">Beta</span>
        </div>
        <Link href="/profile" className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-sm">👤</Link>
      </header>

      {/* Desktop top nav */}
      <nav className="hidden md:flex bg-white border-b border-slate-200 px-6 py-3 items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center">
            <span className="text-white text-xs font-bold">B</span>
          </div>
          <span className="font-bold text-slate-900 text-lg tracking-tight">BS16 Hub</span>
          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Beta</span>
        </div>
        <div className="flex items-center gap-1">
          {NAV.map(({ href, label, Icon, locked }) =>
            locked ? (
              <div key={href} className="flex items-center gap-1.5 px-3 py-2 text-slate-300 cursor-not-allowed text-sm select-none">
                <Icon className="w-4 h-4" /> {label}
                <span className="text-[9px] bg-slate-100 text-slate-400 px-1 rounded">Phase 2</span>
              </div>
            ) : (
              <Link key={href} href={href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${path.startsWith(href) ? "bg-emerald-50 text-emerald-700" : "text-slate-500 hover:bg-slate-50"}`}>
                <div className="relative">
                  <Icon className="w-4 h-4" />
                  {href === "/inbox" && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center text-[8px] text-white font-bold">{unreadCount > 9 ? "9+" : unreadCount}</span>
                  )}
                </div>
                {label}
              </Link>
            )
          )}
        </div>
        <Link href="/profile" className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-sm hover:bg-slate-200 transition-colors">👤</Link>
      </nav>

      {/* Page content */}
      <main className="flex-1 pb-20 md:pb-6">
        <AddToHomeBanner />
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 safe-area-pb">
        <div className="flex items-stretch h-16">
          {NAV.map(({ href, label, Icon, locked }) => {
            const active = path.startsWith(href);
            if (locked) return (
              <div key={href} className="flex-1 flex flex-col items-center justify-center gap-1 opacity-30 cursor-not-allowed">
                <div className="relative">
                  <Icon className="w-5 h-5 text-slate-400" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-slate-300 rounded-full flex items-center justify-center text-[7px] text-white font-bold">2</span>
                </div>
                <span className="text-[9px] text-slate-400">Phase 2</span>
              </div>
            );
            return (
              <Link key={href} href={href}
                className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors relative
                  ${active ? "text-emerald-700" : "text-slate-400"}`}>
                {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-emerald-600 rounded-b-full" />}
                <div className="relative">
                  <Icon className={`w-5 h-5 ${active ? "stroke-[2.2px]" : "stroke-[1.7px]"}`} />
                  {href === "/inbox" && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] text-white font-bold">{unreadCount > 9 ? "9+" : unreadCount}</span>
                  )}
                </div>
                <span className={`text-[10px] font-medium ${active ? "text-emerald-700" : "text-slate-400"}`}>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
