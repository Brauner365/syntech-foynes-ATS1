# Foynes Engineering ATS — Deployment Guide
**Syntech Recruitment × Foynes Engineering Ltd**
*Go-live: 22 June 2026*

---

## ⚡ Deploy in 15 Minutes

### Step 1 — Expose the `foynes` schema in Supabase (2 min)

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Open your project (`kdorepgtvgwumdggjzqm`)
3. **Settings → API**
4. Scroll to **"Exposed schemas"**
5. Add `foynes` to the list alongside `public`
6. Click **Save**

This lets the Supabase JS client query the `foynes` schema directly.

---

### Step 2 — Create Brendan O'Connor's login (3 min)

1. In Supabase Dashboard → **Authentication → Users**
2. Click **"Invite user"**
3. Email: `brendan.oconnor@foynesengineering.ie`
4. Once the invite email is sent and he accepts (or you set a password):
   - Copy his UUID from the Users list
   - Run this SQL in the **SQL Editor**:
   ```sql
   INSERT INTO foynes.profiles (id, full_name, email, role)
   VALUES (
     'PASTE-BRENDAN-UUID-HERE',
     'Brendan O''Connor',
     'brendan.oconnor@foynesengineering.ie',
     'client'
   );
   ```

Alternatively, set a temporary password directly:
- In Supabase Auth → Users → find Brendan → "Send password reset" or set manually

---

### Step 3 — Deploy to Vercel (5 min)

1. **Push to GitHub:**
   ```bash
   cd foynes-ats
   git init
   git add .
   git commit -m "Initial Foynes ATS"
   gh repo create syntech-foynes-ats --private --push
   ```

2. **Import to Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import `syntech-foynes-ats` from GitHub
   - Framework: **Next.js** (auto-detected)
   - Add environment variables (copy from `.env.local`):
     ```
     NEXT_PUBLIC_SUPABASE_URL
     NEXT_PUBLIC_SUPABASE_ANON_KEY
     NEXT_PUBLIC_APP_URL         → https://syntech-foynes-ats.vercel.app
     RESEND_API_KEY              → (your Resend key)
     RESEND_FROM_EMAIL           → notifications@syntechrecruitment.co.uk
     POC_EMAIL                   → brendan.oconnor@foynesengineering.ie
     ```
   - Click **Deploy**

3. **Update `NEXT_PUBLIC_APP_URL`** in Vercel env vars once you know the final URL.

---

### Step 4 — Set up Resend (3 min)

1. Go to [resend.com](https://resend.com) — log in with your existing account
2. **API Keys → Create API Key** → name it `foynes-ats`
3. Paste the key into Vercel env as `RESEND_API_KEY`
4. Make sure `notifications@syntechrecruitment.co.uk` is a verified sender domain

---

## 🔐 User Accounts

| Name | Email | Role | Access |
|------|-------|------|--------|
| Stephen | stephen@syntechrecruitment.co.uk | Recruiter | Full access |
| Charlene Roux | charlene@syntechrecruitment.co.uk | Recruiter | Full access |
| Brendan O'Connor | brendan.oconnor@foynesengineering.ie | Client | Review CVs, move to interview/reject/placed, comment |

**To add more hiring managers later:**
1. Invite them in Supabase Auth
2. Insert into `foynes.profiles` with `role = 'client'`

---

## 📋 What's Live

### Recruiter (Syntech) side:
- ✅ Dashboard with live KPIs (heads required, CVs in pipeline, at interview, placed)
- ✅ All Vacancies list — 11 roles, 56 heads seeded
- ✅ Individual vacancy page with Kanban pipeline (Submitted → Reviewing → Interview → Offer → Placed / Rejected)
- ✅ Add Candidate form — name, contact, trade, certifications, CV upload, right-to-work, submit to vacancy
- ✅ Full candidate database across all roles
- ✅ Metrics page — fill rate, conversion rates, bar charts, per-role breakdown
- ✅ Email notifications via Resend on every stage change + new submission
- ✅ Activity log — every action recorded with timestamp + actor

### Client (Brendan / Foynes) side:
- ✅ Same dashboard — role-aware (no candidate database access)
- ✅ Roles view — see all active vacancies
- ✅ Individual role — see candidate cards, click to open detail
- ✅ Move candidates to Interview / Placed / Rejected with notes
- ✅ Comment on candidates / ask questions — Charlene gets notified
- ✅ Metrics page — same charts and fill rate data

---

## 🗂 Vacancies Seeded

| Ref | Role | Location | Qty | Opened |
|-----|------|----------|-----|--------|
| 100225 | Coded Carbon Steel Pipe Welder | Limerick | 3 | 18 Jun |
| 100226 | Heavy Industrial Fitter | Limerick | 3 | 18 Jun |
| 100227 | Carbon Steel Pipefitter | Limerick | 3 | 18 Jun |
| 100228 | Plater | Tarbert | 5 | 18 Jun |
| 100231 | General Operative | Dublin | 5 | 18 Jun |
| 100233 | Stainless Steel Fabricator | Limerick | 5 | 19 Jun |
| 100235 | Coded Welder | Tarbert | 5 | 19 Jun |
| 100236 | Stainless Steel Fabricator | Cavan | 5 | 19 Jun |
| 100238 | Plater | Dublin | 10 | 19 Jun |
| 100239 | Stick Welder (SMAW) | TBC | 10 | 19 Jun |
| 100240 | Storage Tank Supervisor | Dublin | 2 | 19 Jun |
| **Total** | | | **56** | |

---

## 📧 Email Triggers

| Event | Recipient |
|-------|-----------|
| New CV submitted to vacancy | Brendan O'Connor |
| Candidate moved to Interview | Brendan + Charlene |
| Candidate Rejected | Charlene |
| Candidate Placed | Charlene |
| New comment from Foynes | Charlene |
| New comment from Syntech | Brendan |

---

## 🔮 To Add Later
- More hiring managers per department (just add to `foynes.profiles` with `role = 'client'`)
- Daily summary email (Supabase Edge Function + cron)
- Interview scheduling (add date/time field to pipeline)
- Candidate availability calendar
- Offer letter generation
- Mobile-responsive improvements

