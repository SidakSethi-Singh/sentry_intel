# 🛡️ SENTRY INTEL

> **Autonomous Multi-Source Defence Intelligence & Early Threat Warning Platform**  
> *Developed for Zinnovatio 4.0 Hackathon — Track: AI for Defence, Aerospace and National Security*  
> **Team:** Last Minute Legends | **Lead:** Sidak Sethi-Singh

---

## ⚡ Executive Overview

**Sentry Intel** is an AI-powered defence intelligence platform that monitors multi-domain security feeds across land borders, maritime choke points, critical national infrastructure, and aerospace frontiers. 

Unlike traditional news scrapers or passive dashboards, Sentry Intel solves the core operational challenges faced by defence and security analysts:
1. **Multi-Source Corroboration & Threat Auditing:** Synthesizes multiple independent wire reports into a single unified incident alert with automated chronological timeline reconstruction, entity recognition, and an auditable **"Why This Score"** justification.
2. **"What To Do" Operational Response Playbooks:** Turns raw threat alerts into immediate, actionable response guidance with strict role separation for defence analysts and civilian safety authorities.
3. **Trust & Accuracy Groundedness Engine:** Entity verification, confidence badging, and citation-grounded answers.

---

## 🚀 Key Features

### 1. 🛡️ Operational Response Playbooks ("What to do")
Every intelligence dashboard answers *"What happened?"* Sentry Intel answers the vital follow-up question: **"What do we do about it?"**
- **Two Distinct Audiences Kept Strictly Separated:**
  - **Intelligence & Security Analyst Actions:** Escalation protocols, radar cross-checking, electronic warfare status verification, and command leadership briefing.
  - **Civilian Public Safety Steps:** Displayed **ONLY** for humanitarian crises, natural disasters (e.g., Cyclone Dana), or civilian cyber fraud (evacuation guidance, safe shelter movement, power line precautions). Never shown for tactical military operations.
- **Priority Categorization:** Badged by operational urgency (`IMMEDIATE`, `HIGH`, `ROUTINE`). Critical alerts feature prominent high-visibility glowing protocol headers at the top of the detail modal.
- **Verified Official Authority Portals:** Direct links to certified authorities (CERT-In, NDMA, IMD, Indian Navy, Ministry of Defence, ReliefWeb).
- **Mandatory Safety Disclaimer:**  
  > *⚠️ Guidance only — always follow your local authorities' instructions.*

### 2. 🔍 Ask Sentry — Context-Grounded RAG Q&A
- Natural-language interrogation engine across all cached intelligence alerts (API backend `/api/ask` operational; UI integration in progress via Task SI-01).
- **Citation-grounded answers:** Answers cite exact Alert IDs (`[alert-inc-...]`), and when no corroborating data exists in the corpus the system states *"No matching alerts found"* rather than guessing. Faithfulness measured at 100% on the 20-incident-alert audit sample (51/51 entities, 30/30 citations, 0 hallucinations).
- Citations map directly to alert dossiers.
- Built-in **AI Morning Brief** generator for command morning briefings (active on dashboard).

### 3. ⚖️ Multi-Source Corroboration & "Why This Score" Justification
- Clusters related wire reports into single incident dossiers (e.g., cross-border UAV incursions, regional grid cyber attacks, Gulf of Aden anti-piracy boardings).
- Automatically calculates a transparent threat score (0–100) and severity rating (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
- Emits an honest, auditable sentence explaining *why* the threat received its rating (e.g., *“HIGH because: cross-border airspace breach + combat scramble / tactical special forces deployment + corroborated by 3 independent sources.”*).

### 4. ⚡ Multi-Provider Architecture & Local Extractive Resilience
- **Tier 1 (Wired):** GroqCloud ultra-fast inference (`openai/gpt-oss-120b` at 500+ tokens/second).
- **Tier 2 (Wired):** OpenAI fallback (`gpt-4o-mini`).
- **Tier 3 (Wired Fallback):** Deterministic, offline-capable extractive NLP summarization & chronological timeline parser that keeps answering locally when APIs fail or rate-limit, because it needs no network calls.
- **Provider Status Note:** Groq and OpenAI are the only wired LLM providers. Placeholders in `.env.example` for Gemini, Grok (xAI), or Anthropic have no active code paths in this release.
- **Retrieval Engine & Pathway Status:** Intelligence retrieval currently operates via an in-memory keyword, entity, and location matching engine with recency boosting. Pathway streaming hybrid retrieval (TantivyBM25 + dense vectors, SI-29/30) is currently in progress as a sidecar; the keyword engine remains the automatic zero-downtime fallback.

---

## 🎯 Trust & Accuracy Pack

### 1. 📊 Demo Data & Evaluation Transparency
> **Honesty Notice:**  
> The 50 cached threat alerts in this repository represent a curated **evaluation and demo dataset** created for hackathon demonstration and stress-testing. They represent realistic, illustrative defence and national security incidents — **not a live classified feed or real-time military network**.  
> The Sentry Intel pipeline architecture is designed with modular ingest endpoints (`/api/alerts`, `/api/ask`, `/api/ingest`) to support live wire ingestion from open-source news APIs and RSS feeds in production.

### 2. 🏷️ Confidence Badges
Every alert derives a transparent confidence tier:
- **`High Confidence` (●)**: Corroborated by 2 or more independent sources with agreeing tactical details.
- **`Medium Confidence` (◐)**: Derived from a single credible, authoritative source (e.g., PIB Defence, CERT-In, IMD, ANI Desk) with complete chronological details.
- **`Low Confidence` (○)**: Initial wire bulletin with thin or unconfirmed operational details.

### 3. 🧪 Faithfulness & Groundedness Audit (`scripts/verify-faithfulness.ts`)
To measure faithfulness and prevent hallucinations, Sentry Intel includes an automated audit test suite that validates every cached summary against its underlying source articles.

```bash
npm run verify-faithfulness
```

#### Latest Automated Audit Verification Results:
| Metric | Result | Status |
| :--- | :--- | :--- |
| **Unique Incident Alerts Evaluated** | **20** | ✅ Analyzed |
| **Named Entities Checked (Actors, Locations, Assets)** | **51** | ✅ Evaluated |
| **Entities Strictly Grounded in Source Text** | **51 / 51** | **100% PASS** |
| **Article Citations Checked** | **30** | ✅ Evaluated |
| **Article Citations Successfully Resolved** | **30 / 30** | **100% PASS** |
| **Invented / Hallucinated Entities** | **0** | **0.0% (Zero)** |
| **Overall Faithfulness Verdict** | **100% PASS** | 🛡️ **VERIFIED** |

---

## ⚠️ What's Unfinished / Known Limitations

We believe in engineering transparency — knowing boundaries is the foundation of mission-critical systems:

1. **Curated Evaluation Dataset:**  
   The current feed operates on 50 cached alert entries derived from 30 structured defence reports. Automated web-crawlers for behind-paywall or air-gapped military networks are intentionally decoupled in the hackathon demo to ensure reproducible judge evaluation.
2. **Hybrid Scoring Heuristics:**  
   Threat scores (0–100) are computed using an auditable hybrid scoring function combining domain keywords, military asset involvement, civilian risk factors, and source corroboration multipliers. In full production, this would be augmented with an automated ML Bayesian probability model.
3. **Public LLM Provider Rate Limiting:**  
   External LLM APIs (Groq / OpenAI) occasionally experience HTTP 429 rate limits during rapid bulk batching. Sentry Intel handles this gracefully by switching seamlessly to its deterministic extractive fallback engine with zero application downtime.
4. **Offline Map Tiles:**  
   The UI currently provides tactical geospatial location tags; full GIS vector-tile layers (Cesium/MapLibre) are architected for Phase 2 integration.

---

## 🏗️ Architecture & Alert Contract

All extensions to the Alert contract are strictly **additive and backward-compatible**:

```typescript
export interface Alert {
  // Core Contract (Unchanged)
  id: string;
  article_id: string;
  severity: "low" | "medium" | "high" | "critical";
  score: number;
  summary: string;
  sources: { name: string; url: string }[];
  timeline_events: { time: string; event: string }[];
  created_at: string;

  // Corroboration & Audit Additions
  score_justification?: string;
  corroboration_count?: number;
  corroboration_badge?: string;
  related_article_ids?: string[];
  entities?: { name: string; category: "actor" | "location" | "asset" | "threat" }[];
  location?: string;

  // Response Playbook Additions ("What to do")
  category?: "cyber" | "natural_disaster" | "border_security" | "maritime" | "defence_tech" | "space" | "general";
  recommended_actions?: {
    action: string;
    audience: "analyst" | "civilian";
    priority: "immediate" | "high" | "routine";
  }[];
  official_links?: {
    name: string;
    url: string;
  }[];

  // Trust & Accuracy Pack
  confidence?: "high" | "medium" | "low";
}
```

---

## 🛠️ Local Development & Quickstart

### Prerequisites
- Node.js `v20+` or `v26+`
- npm

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/SidakSethi-Singh/sentry_intel.git
cd sentry_intel
npm install
```

### 2. Configure Environment (Optional for LLM features)
Create `.env` in the root directory:
```env
# Optional: Groq API Key (Fastest inference)
GROQ_API_KEY=your_groq_api_key_here

# Optional: OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here
```
*(Note: If no API keys are provided, Sentry Intel operates automatically via its deterministic local extractive engine).*

### 3. Generate / Update Summaries & Playbooks
```bash
npm run generate-summaries
```

### 4. Run Faithfulness Verification Suite
```bash
npm run verify-faithfulness
```

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Production Build Verification
```bash
npm run build
```

---

## 🛡️ Safety & Responsible AI Disclaimer

> **IMPORTANT:**  
> Sentry Intel does not invent phone numbers, street addresses, or shelter coordinates. All links route exclusively to verified official government, meteorological, and disaster response bodies (such as CERT-In, NDMA, IMD, and the Indian Navy).  
> **Guidance only — always follow your local authorities' instructions.**

---

**Built with pride by Last Minute Legends for Zinnovatio 4.0.**

### Local demo storage

When neither Supabase URL nor service-role key is configured, the server uses a local JSON file at `data/local-db.json`, seeded from the bundled sample data on first use. The file is ignored by Git. Supplying both Supabase credentials selects Supabase; partial configuration is an error. Local storage is intended for a single local demo process: it is not a shared database, does not coordinate concurrent writers, and is unsuitable for serverless deployments or durable production storage. Google News RSS ingestion requires network access and may provide only headlines or snippets; sample data remains the offline fallback.
