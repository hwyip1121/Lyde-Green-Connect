"use client";
// ================================================================
// BS16 Hub — App Shell Layout
// components/bs16/AppShell.tsx
// ================================================================
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, Pin, Eye, Wrench, Briefcase } from "lucide-react";

const NAV = [
  { href: "/market",  label: "Market",  Icon: ShoppingBag },
  { href: "/notices", label: "Notices", Icon: Pin         },
  { href: "/watch",   label: "Watch",   Icon: Eye         },
  { href: "/jobs",    label: "Jobs",    Icon: Briefcase   },
  { href: "/trades",  label: "Trades",  Icon: Wrench, locked: true },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();

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
                <Icon className="w-4 h-4" /> {label}
              </Link>
            )
          )}
        </div>
        <Link href="/profile" className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-sm hover:bg-slate-200 transition-colors">👤</Link>
      </nav>

      {/* Page content */}
      <main className="flex-1 pb-20 md:pb-6">{children}</main>

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
                <Icon className={`w-5 h-5 ${active ? "stroke-[2.2px]" : "stroke-[1.7px]"}`} />
                <span className={`text-[10px] font-medium ${active ? "text-emerald-700" : "text-slate-400"}`}>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
