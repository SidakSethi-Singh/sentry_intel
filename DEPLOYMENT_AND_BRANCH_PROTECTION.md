# 🔐 SENTRY INTEL — Deployment & GitHub Branch Protection Checklist (SI-05 & SI-06)

> **Lead Responsible:** Sidak Sethi-Singh (Team Lead)  
> **Status:** Operational Guide & Verification Checklist  
> **Target Branch:** `main` (Protected) | **Feature/Working Branch:** `sidak/p0-completion`

---

## 1. GitHub Branch Protection Setup (Task SI-06)

Direct pushes to `main` have occurred previously during development. To prevent teammates from overwriting verified code or breaking production builds before submission, branch protection must be enabled via GitHub Repository Rulesets.

### Exact Configuration Steps (GitHub Web UI):
1. Navigate to: `https://github.com/SidakSethi-Singh/sentry_intel`
2. Click **Settings** (top repository navigation bar).
3. In the left-hand sidebar under *Code and automation*, click **Rules** $\rightarrow$ **Rulesets**.
4. Click **New ruleset** $\rightarrow$ **New branch ruleset**.
5. Configure the ruleset with the following settings:
   - **Ruleset Name:** `Protect Production (main)`
   - **Enforcement Status:** Set to **Active**.
   - **Target branches:** Click **Add target** $\rightarrow$ choose **Include default branch** (which targets `main`).
6. Under **Branch rules**, enable:
   - ✅ **Restrict deletions** (prevents deletion of `main`).
   - ✅ **Block force pushes** (prevents `git push --force` or history overwriting).
   - ✅ **Require a pull request before merging**:
     - *Required approvals:* Set to `1` (or `0` if solo merging, but requiring a PR stops direct command-line push errors).
     - *Dismiss stale pull request approvals when new commits are pushed:* Enabled.
7. Click **Create** or **Save changes** at the bottom of the page.

### The Proof Test (Verification):
Once the ruleset is saved, verify it from the terminal:
```bash
git checkout main
git commit --allow-empty -m "test: direct push verification"
git push origin main
```
**Expected Rejection Output:**
```
remote: error: GH006: Protected branch update failed: Changes must be made through a pull request.
To https://github.com/SidakSethi-Singh/sentry_intel.git
 ! [remote rejected] main -> main (protected branch hook declined)
error: failed to push some refs to 'https://github.com/SidakSethi-Singh/sentry_intel.git'
```
*(If rejected, branch protection is verified. Reset the local test commit with `git reset --hard HEAD~1`)*.

---

## 2. Production Deployment & Vercel Configuration (Task SI-05)

### Deployment Architecture & Environment Variables
In production (Vercel), environment variable **NAMES ONLY** configured in the Project Settings:

| Environment Variable Name | Purpose in System | Integration Status in Audited Codebase |
| :--- | :--- | :--- |
| `OPENAI_API_KEY` | Secondary LLM fallback (`gpt-4o-mini`) | **Wired** (`lib/summarize.ts`, `lib/ask.ts`) |
| `GROK_API_KEY` / `GROQ_API_KEY` | Ultra-fast primary LLM inference (`gpt-oss-120b`) | **Wired** (`lib/summarize.ts`, `lib/ask.ts`) |
| `PATHWAY_URL` | Optional REST endpoint for Pathway hybrid RAG | Planned for SI-29/30 (Keyword engine acts as fallback) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Wired in `lib/supabase.ts` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client anon public key | Wired in `lib/supabase.ts` |
| `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_SECRET_KEY` | Server-side Supabase write access | Wired in `lib/supabase.ts` |
| `XAI_API_KEY` | Placeholder from `.env.example` | **NOT wired** (No code path) |
| `ANTHROPIC_API_KEY` | Placeholder from `.env.example` | **NOT wired** (No code path) |
| `GEMINI_API_KEY` | Placeholder from `.env.example` | **NOT wired** (No code path) |

> ⚠️ **Zero-Leak Rule:** Never enter real API keys, secrets, or service tokens into this document, `.env.example`, or git commits.

---

## 3. Production Cold-Load & Serving Store Verification Checklist

### A. How to Confirm Whether Prod Serves Local JSON or Supabase
- **Check Server Logs / Config:**
  - If `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are **NOT** provided or set to empty, the application uses `useLocalStore() = true` and serves the 50 cached alert entries from `data/sample-summaries.json`.
  - If Supabase environment variables **ARE** provided, queries route through `lib/supabase.ts`.
- **The SI-12 Gap Warning:**
  - In the current database migration (`supabase/migrations/20261029021500_init_sentry_intel.sql`), the `alerts` table only stores base columns (`id`, `article_id`, `severity`, `score`, `summary`, `sources`, `timeline_events`, `created_at`).
  - Extended fields (`score_justification`, `corroboration_count`, `corroboration_badge`, `entities`, `location`, `category`, `recommended_actions`, `official_links`, `confidence`) are currently in `data/sample-summaries.json` (Local Mode).
  - **Operational Rule for Demo:** If production is connected to Supabase before Task SI-12 migration lands, note the SI-12 gap honestly in the demo script or use local JSON mode for the demo so the full trust and response playbooks are 100% visible.

### B. Cold-Load Verification Checklist (Fresh Incognito Browser)
Test against the deployed production URL:
- [ ] **1. Dashboard Shell:** Open the production URL in a fresh incognito window. Header, data transparency notice, and monitoring status badge load within $<2$ seconds without console errors.
- [ ] **2. Threat Feed Loading:** Feed displays alerts with severity badges (`HIGH`, `MEDIUM`, `LOW`), confidence indicators, and timestamps.
- [ ] **3. Morning Brief Generation:** Clicking `"⚡ Generate Morning Brief"` generates an executive summary without throwing a network 500 error.
- [ ] **4. Detail Dossier Modal:** Clicking an alert card opens the detailed dossier. Timeline events, sources, and metadata render properly.
- [ ] **5. Ask Sentry Querying (once UI wired):** Submitting a test question returns an answer grounded with `[alert-inc-...]` citations.
- [ ] **6. Ingestion Health:** `POST /api/ingest` responds with `{ success: true, count: ... }` or graceful empty fallback without hanging past 10 seconds.

---

## 4. Fallback Contingency: If No Live Link Exists on Demo Day

If Vercel deployment encounters DNS/network failures or is inaccessible at pitch time:
1. **Never Fake a Link:** State plainly to judges:  
   *"Our production URL is hosted on Vercel, but for mission-critical reliability and to avoid conference Wi-Fi latency, we are demonstrating directly against our local build which mirrors production."*
2. **Recorded Fallback Video:** Keep a pre-recorded, unedited 2-minute video file (`demo_recording_backup.mp4`) showing the cold-load checklist executed locally.
3. **Local Offline Run:** Run `npm run dev` locally. The local JSON store runs with 100% offline uptime even with the machine in Airplane Mode.
