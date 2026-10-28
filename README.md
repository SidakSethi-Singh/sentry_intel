# 🛡️ SENTRY INTEL

> **Autonomous Multi-Source Defence Intelligence & Early Threat Warning Platform**  
> *Developed for Zinnovatio 4.0 Hackathon — Track: AI for Defence, Aerospace and National Security*  
> **Team:** Last Minute Legends | **Lead:** Sidak Sethi-Singh

---

## ⚡ Executive Overview

**Sentry Intel** is an AI-powered defence intelligence platform that monitors multi-domain security feeds across land borders, maritime choke points, critical national infrastructure, and aerospace frontiers. 

Unlike traditional news scrapers or passive dashboards, Sentry Intel solves the two most critical operational challenges faced by defence and security analysts:
1. **Multi-Source Corroboration & Threat Auditing:** Synthesizes multiple independent wire reports into a single unified incident alert with automated chronological timeline reconstruction, entity recognition, and an auditable **"Why This Score"** justification.
2. **"What To Do" Operational Response Playbooks:** Turns raw threat alerts into immediate, actionable response guidance with strict role separation for defence analysts and civilian safety authorities.

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
- Interactive natural-language interrogation engine across all cached intelligence alerts.
- **Zero Hallucination Guarantee:** Employs keyword, entity, and location retrieval with recency boosting. Synthesizes concise answers strictly citing exact Alert IDs (`[alert-inc-...]`). If no corroborating data exists, it plainly states *"No matching alerts found"* rather than guessing.
- Clickable citation tags open full tactical alert dossiers directly in the UI.
- Built-in **AI Morning Brief** generator for command morning briefings.

### 3. ⚖️ Multi-Source Corroboration & "Why This Score" Justification
- Clusters related wire reports into single incident dossiers (e.g., cross-border UAV incursions, regional grid cyber attacks, Gulf of Aden anti-piracy boardings).
- Automatically calculates a transparent threat score (0–100) and severity rating (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
- Emits an honest, auditable sentence explaining *why* the threat received its rating (e.g., *“HIGH because: cross-border airspace breach + combat scramble / tactical special forces deployment + corroborated by 3 independent sources.”*).

### 4. ⚡ Triple-Redundant Zero-Crash Architecture
- **Tier 1:** GroqCloud ultra-fast inference (`openai/gpt-oss-120b` at 500+ tokens/second).
- **Tier 2:** OpenAI fallback (`gpt-4o-mini`).
- **Tier 3:** Deterministic, offline-capable extractive NLP summarization & chronological timeline parser that guarantees zero-crash uptime even under complete network failure or API rate limits.

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
*(Note: If no API keys are provided, Sentry Intel operates automatically via its deterministic zero-crash extractive engine).*

### 3. Generate / Update Summaries & Playbooks
```bash
npm run generate-summaries
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Production Build Verification
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
