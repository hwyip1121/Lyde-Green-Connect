"use client";
// ================================================================
// Lyde Green Connect — Home Page (logged-in residents)
// app/home/page.tsx
// ================================================================
import { useState, useEffect } from "react";
import Link from "next/link";
import AppShell from "@/components/bs16/AppShell";
import { createClient } from "@/lib/supabase";
import {
  Pin, Eye, ShoppingBag, ArrowLeftRight,
  CalendarDays, BarChart2, MessageCircle, ChevronRight
} from "lucide-react";

const FEATURES = [
  {
    href: "/notices",
    icon: Pin,
    color: "bg-purple-100 text-purple-700",
    stripe: "bg-purple-400",
    title: "Notice Board",
    desc: "Local events, lost & found, and neighbourhood news — all in one place.",
  },
  {
    href: "/watch",
    icon: Eye,
    color: "bg-red-100 text-red-700",
    stripe: "bg-red-400",
    title: "Neighbourhood Watch",
    desc: "Stay informed about local alerts and keep an eye out for your neighbours.",
  },
  {
    href: "/market",
    icon: ShoppingBag,
    color: "bg-emerald-100 text-emerald-700",
    stripe: "bg-emerald-400",
    title: "Community Exchange",
    desc: "Gift, swap and sell with neighbours. No strangers, no delivery hassle.",
  },
  {
    href: "/swap",
    icon: ArrowLeftRight,
    color: "bg-cyan-100 text-cyan-700",
    stripe: "bg-cyan-400",
    title: "Skill Swap",
    desc: "Exchange your time and skills with neighbours. No money — just community.",
  },
  {
    href: "/events",
    icon: CalendarDays,
    color: "bg-amber-100 text-amber-700",
    stripe: "bg-amber-400",
    title: "Community Events",
    desc: "See what's on in Lyde Green — from coffee mornings to community clean-ups.",
  },
  {
    href: "/polls",
    icon: BarChart2,
    color: "bg-violet-100 text-violet-700",
    stripe: "bg-violet-400",
    title: "Resident Voice",
    desc: "Have your say on what matters. Poll results go straight to the community team.",
  },
  {
    href: "/inbox",
    icon: MessageCircle,
    color: "bg-blue-100 text-blue-700",
    stripe: "bg-blue-400",
    title: "Inbox",
    desc: "Private messages with your neighbours — safe, direct, and local.",
  },
];

export default function HomePage() {
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", user.id).single();
      setDisplayName(profile?.display_name || null);
    };
    init();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 pt-4 pb-8">

        {/* Welcome hero */}
        <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 rounded-2xl p-6 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-12 translate-x-12 pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 bg-white/10 text-emerald-100 text-xs font-semibold px-3 py-1 rounded-full mb-3">
              🌳 Lyde Green · Bristol
            </div>
            <h1 className="text-white font-bold text-xl leading-snug mb-1">
              {greeting}{displayName ? `, ${displayName}` : ""}! 👋
            </h1>
            <p className="text-emerald-100 text-sm leading-relaxed">
              Welcome to your private community space. Everything here is just for verified Lyde Green residents — no ads, no algorithm, no noise.
            </p>
          </div>
        </div>

        {/* Mission */}
        <div className="mb-6">
          <h2 className="text-base font-bold text-slate-900 mb-2">Our Mission</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Lyde Green Connect exists because we believe strong communities start with neighbours who know and trust each other. We're building a quiet, verified space where residents can share, support, and speak up — together.
          </p>
          <p className="text-sm text-slate-600 leading-relaxed mt-2">
            No big tech. No selling your data. Just Lyde Green, looking after itself.
          </p>
        </div>

        {/* Feature cards */}
        <h2 className="text-base font-bold text-slate-900 mb-3">What's inside</h2>
        <div className="space-y-3">
          {FEATURES.map(({ href, icon: Icon, color, stripe, title, desc }) => (
            <Link key={href} href={href}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex items-center gap-4 p-4 hover:border-emerald-300 hover:shadow-sm transition-all group">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-slate-900 leading-snug">{title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-0.5 line-clamp-2">{desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition-colors shrink-0" />
            </Link>
          ))}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-400 mt-8">
          Lyde Green Connect is built by a neighbour, for neighbours. 🌱
        </p>

      </div>
    </AppShell>
  );
}
