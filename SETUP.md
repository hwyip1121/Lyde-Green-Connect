# Lyde Green Connect — Setup & Deployment Guide

## Step 1 — Create your free Supabase database (5 mins)

1. Go to **https://supabase.com** and click **Start your project**
2. Sign up with GitHub (free)
3. Click **New project**
   - Name: `bs16-hub`
   - Database password: choose something strong, save it somewhere
   - Region: **West EU (Ireland)** — closest to Bristol
4. Wait ~2 minutes for it to set up
5. Go to **SQL Editor** (left sidebar)
6. Paste the entire contents of `supabase/schema.sql` and click **Run**
7. Go to **Settings → API**
8. Copy your **Project URL** and **anon public** key

---

## Step 2 — Set up environment variables

1. In the project folder, rename `.env.local.example` to `.env.local`
2. Fill in your values:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_ADMIN_EMAIL=your@email.com
```

---

## Step 3 — Push to GitHub

```bash
cd ~/Downloads/bs16-full
git init
git add -A
git commit -m "feat: Lyde Green Connect — complete app"
git branch -M main
git remote add origin https://github.com/hwyip1121/lyde-green-connect.git
git push -u origin main --force
```

---

## Step 4 — Deploy on Vercel (5 mins, free)

1. Go to **https://vercel.com** and sign up with GitHub
2. Click **Add New → Project**
3. Select your **lyde-green-connect** repository
4. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL` → your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → your anon key
   - `NEXT_PUBLIC_ADMIN_EMAIL` → your email
5. Click **Deploy**
6. In ~2 minutes your app is live at `https://bs16-hub.vercel.app` 🎉

---

## Step 5 — Set yourself as admin

1. Open your live app and **register** with the same email you put in `NEXT_PUBLIC_ADMIN_EMAIL`
2. Go to Supabase → **Table Editor → profiles**
3. Find your row and change `role` from `homeowner` to `admin`
4. Now visit `https://your-app.vercel.app/admin/traders` — that's your admin dashboard

---

## How the app works

| URL | What it is |
|-----|-----------|
| `/market` | Local Market — buy, sell, gift items |
| `/notices` | Notice Board — events, lost & found, news |
| `/watch` | Neighbour Watch — urgent & general alerts |
| `/jobs` | Local Jobs — homeowners post, traders contact |
| `/trades` | Phase 2 locked screen |
| `/auth/register` | Registration with BS16 postcode gate |
| `/auth/login` | Sign in |
| `/trader-setup` | Trader profile form (submit for approval) |
| `/admin/traders` | Your admin dashboard (admin only) |

---

## Inviting your first residents

Share this message with the Lyde Green & Emersons Green community:

> 🏡 **Lyde Green Connect is live!**
> Your free hyper-local community app for Lyde Green and Emersons Green.
> Buy, sell, share, stay safe and connect with your neighbours.
> 👉 [your-app.vercel.app]
> (BS16 postcodes only — your privacy is protected)

---

## Custom domain (optional, free on Vercel)

If you buy a domain like `bs16hub.co.uk` (~£10/year):
1. Vercel → your project → **Settings → Domains**
2. Add your domain → follow the DNS instructions
