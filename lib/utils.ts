// ================================================================
// BS16 Hub — Supabase Client
// lib/supabase.ts
// ================================================================
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ================================================================
// BS16 Hub — Core Utilities
// lib/utils.ts
// ================================================================

// ── Postcode validation ──────────────────────────────────────────
export function validateBS16Postcode(raw: string): { valid: boolean; cleaned: string; error?: string } {
  const cleaned = raw.trim().toUpperCase().replace(/\s+/g, " ").trim();
  const noSpaces = cleaned.replace(/\s/g, "");
  if (!cleaned) return { valid: false, cleaned, error: "Please enter your postcode." };
  if (!noSpaces.startsWith("BS16")) return {
    valid: false, cleaned,
    error: "BS16 Hub is currently exclusive to residents of Lyde Green and Emersons Green. We hope to expand to your area soon!",
  };
  if (!/^BS16\s?[0-9][A-Z]{2}$/i.test(cleaned)) return {
    valid: false, cleaned, error: "Please enter a valid BS16 postcode (e.g. BS16 5UT).",
  };
  return { valid: true, cleaned };
}

// ── UK Mobile validation ─────────────────────────────────────────
export function validateUKMobile(raw: string): { valid: boolean; error?: string } {
  const stripped = raw.replace(/[\s\-\(\)]/g, "");
  if (!/^(\+44|44)?07[0-9]{9}$|^07[0-9]{9}$/.test(stripped))
    return { valid: false, error: "Please enter a valid UK mobile number (e.g. 07700 900123)." };
  return { valid: true };
}

// ── Content moderation ───────────────────────────────────────────
const PROFANITY = [
  // Core profanity
  "fuck","fucking","fucked","fucker","fucks",
  "shit","shitting","shitted","shits","bullshit",
  "cunt","cunts","bastard","bastards",
  "wanker","wankers","wanking",
  "twat","twats","bollocks",
  "prick","pricks","dickhead","dickheads",
  "bitch","bitches","arsehole","arseholes","asshole","assholes",
  "cock","cocks","pussy","tit","tits",
  "motherfucker","motherfucking",
  // Slurs (racial, sexual, disability)
  "nigger","nigga","chink","paki","spastic","retard","faggot","dyke",
  // Threats / harassment
  "kill yourself","kys","go die","i will kill","i'll kill",
  // Spam signals
  "buy now","click here","earn money","make money fast","work from home",
  "whatsapp me","telegram me","dm me for",
];

const LINK_RE = /(?:https?:\/\/|www\.)[^\s]+\.[a-z]{2,}/gi;

export function moderateContent(text: string): { safe: boolean; sanitised: string } {
  let out = text.replace(LINK_RE, "[link removed]");
  LINK_RE.lastIndex = 0;
  let unsafe = LINK_RE.test(text);
  LINK_RE.lastIndex = 0;
  for (const w of PROFANITY) {
    const re = new RegExp(`\\b${w.replace(/\s+/g, "\\s+")}\\b`, "gi");
    if (re.test(out)) {
      unsafe = true;
      out = out.replace(re, "*".repeat(w.length));
    }
  }
  return { safe: !unsafe, sanitised: out };
}

// ── Rate limiting ────────────────────────────────────────────────
const rl = new Map<string, { count: number; start: number }>();
export function checkRateLimit(id: string): { allowed: boolean; resetInMs: number } {
  const now = Date.now();
  const entry = rl.get(id);
  const WINDOW = 15 * 60 * 1000;
  if (!entry || now - entry.start > WINDOW) { rl.set(id, { count: 1, start: now }); return { allowed: true, resetInMs: 0 }; }
  if (entry.count >= 2) return { allowed: false, resetInMs: WINDOW - (now - entry.start) };
  entry.count++;
  return { allowed: true, resetInMs: 0 };
}
export const formatResetTime = (ms: number) => { const m = Math.ceil(ms / 60000); return `${m} minute${m !== 1 ? "s" : ""}`; };

// ── Helpers ──────────────────────────────────────────────────────
export function relativeTime(iso: string | Date): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}
export function formatPrice(pence: number | null, isFreeSwap: boolean): string {
  if (isFreeSwap || pence === null || pence === 0) return "Free / Swap";
  return `£${(pence / 100).toFixed(2)}`;
}
export type Neighbourhood = "Lyde Green" | "Emersons Green";
export const NEIGHBOURHOODS: Neighbourhood[] = ["Lyde Green", "Emersons Green"];
export const JOB_CATEGORIES = ["Home Maintenance", "Gardening & Outdoors"] as const;
export type JobCategory = typeof JOB_CATEGORIES[number];
export const NOTICE_TAGS = ["Event", "Lost & Found", "Local News"] as const;
export type NoticeTag = typeof NOTICE_TAGS[number];
