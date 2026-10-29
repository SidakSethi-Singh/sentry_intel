# 🎯 SENTRY INTEL — Comprehensive Hackathon Demo Script & Judge Defense (SI-07 & SI-31)

> **Event:** Zinnovatio 4.0 — *Track: AI for Defence, Aerospace and National Security*  
> **Team:** Last Minute Legends | **Presenter:** Sidak Sethi-Singh (Lead)  
> **Format Note:** The exact video/presentation time limit for the hackathon is **UNCONFIRMED** at this time. This document provides both a **Core ~2-Minute Version** and an **Extended ~5-Minute Version**.

---

## ⚠️ Non-Negotiable Presentation Honesty Rules
1. **Never claim "100% accurate" or "100% grounded" without the exact scope:** Always say: *"100% faithfulness on our 20-incident-alert audit sample (51/51 named entities grounded, 30/30 citations resolved, 0 hallucinations)."*
2. **Never claim a complaint was filed:** When showing the India reporting guidance, state plainly that it is **guidance on verified official channels**, not an active automated filing with police/CERT-In.
3. **Never claim unintegrated models or fake benchmarks:** Do not claim Gemini or Grok (xAI) are wired. Never claim unverified benchmark standards or specifications that do not exist in the repository.
4. **Never present demo data as live military radar:** Keep the demo-data honesty notice visible.

---

## ⏱️ Version A: Core ~2-Minute Demo Script (9-Step Sequence)

> **If Running Short on Time (Emergency Cut Rule):** Cut the deep detail in **Step 7 (India Guidance Flow)** first. **NEVER** cut **Step 9 (Provenance & Honesty Close)**, as judge credibility depends on it.

### Step 1: Ingestion of a New Incident (0:00 - 0:15)
- **What to Click / Show:** Show the dashboard top bar, click `"⚡ Ingest Latest Reports"` or trigger `POST /api/ingest` in the background with a fresh sample item.
- **Word-for-Word Speaker Line:**  
  *"Judges, intelligence analysts drown in wire reports, but commanders don't just ask 'what happened?' — they ask: 'What do we do about it, and why should we trust your AI?' Here, a fresh intelligence bulletin enters Sentry Intel's ingestion pipeline."*

### Step 2: Normalization & Classification (0:15 - 0:25)
- **What to Click / Show:** Point to the newly ingested card appearing in the Threat Alert Feed, highlighting its category pill (`Border Security` or `Cyber`).
- **Word-for-Word Speaker Line:**  
  *"The system normalizes the wire, extracts temporal timestamps, identifies named military assets and locations, and classifies the threat domain automatically."*

### Step 3: Scoring Explained via Justification (0:25 - 0:40)
- **What to Click / Show:** Click the alert card to open the Detail Dossier Modal. Point to the **"Why This Score"** box.
- **Word-for-Word Speaker Line:**  
  *"Most AI tools give a black-box score like '85'. In national security, black-box scores are untrustworthy. Sentry Intel displays an auditable justification: here it explains: '+25 airspace breach indicator + 15 Sukhoi scramble deployment + 12 reported by 3 independent sources'. Every point is inspectable."*

### Step 4: Corroboration Badge & Related Articles (0:40 - 0:50)
- **What to Click / Show:** Point to the **"Corroborated by 3 sources"** badge and the linked related wire articles.
- **Word-for-Word Speaker Line:**  
  *"Notice the corroboration badge. Sentry Intel clusters separate wire reports on the same incident, elevating confidence only when independent sources agree."*

### Step 5: Ask Sentry Grounded RAG with Cited Answer (0:50 - 1:05)
- **What to Click / Show:** In the Ask Sentry console, click the quick chip: *"What happened near Ladakh this week?"* Point to the answer and the clickable citation pill `[alert-inc-ladakh-talks]`.
- **Word-for-Word Speaker Line:**  
  *"Analysts can interrogate the corpus using Ask Sentry. It synthesizes answers strictly grounded in retrieved alerts and explicitly cites exact Alert IDs. If an analyst asks an off-corpus question, it honestly states 'No matching alerts found' rather than hallucinating."*

### Step 6: Role-Separated Response Playbook Actions & Official Links (1:05 - 1:25)
- **What to Click / Show:** In the Detail Modal, scroll to **"Tactical Response Playbook ('What To Do')"**. Highlight the **Analyst Actions** and contrast with **Civilian Safety Steps**.
- **Word-for-Word Speaker Line:**  
  *"Here is our operational core: the Response Playbook. We strictly separate audiences. Defence analysts receive tactical directives: secondary radar locks, EW countermeasure status checks, and command briefs. For natural disasters or civilian cyber threats, civilian safety steps appear with verified links to CERT-In, NDMA, and IMD. We never tell civilians how to fight, and we never tell soldiers to take shelter."*

### Step 7: India Incident Guidance Flow (Honest Framing) (1:25 - 1:35)
- **What to Click / Show:** Point to the verified authority contacts (e.g., National Cyber Crime Reporting Portal, 1930 helpline guidelines, CERT-In advisories).
- **Word-for-Word Speaker Line:**  
  *"For financial cyber fraud and civilian incidents, the playbook provides direct operational guidance for reporting through India's verified channels like the 1930 helpline and cybercrime.gov.in. We provide clear, structured reporting guidance — we never falsely claim an official police complaint was automatically filed."*

### Step 8: Benchmark Design & Real Faithfulness Numbers (1:35 - 1:50)
- **What to Click / Show:** Show the terminal audit output or benchmark summary slide.
- **Word-for-Word Speaker Line:**  
  *"We don't rely on hype or unverified labels. We built an automated faithfulness audit: across our 20-incident evaluation dataset, 51 out of 51 named entities were strictly grounded in source text, 30 out of 30 citations resolved, with zero invented entities."*

### Step 9: Provenance & Honesty Close (1:50 - 2:00)
- **What to Click / Show:** Point to the source wire links, timestamps, confidence indicator, and the prominent Demo Data Honesty banner.
- **Word-for-Word Speaker Line:**  
  *"Every alert provides direct links to the original wire reports, fetch timestamps, and our clear demo-data evaluation notice. Sentry Intel turns noisy headlines into auditable, action-ready intelligence. Thank you."*

---

## 🕒 Version B: Extended ~5-Minute Presentation Walkthrough

When presenting in a longer format or during an in-depth booth demonstration:

- **0:00 - 0:45 | Context & Problem Statement:**  
  Expand on the information overload in modern defence and aerospace operations (drones, spoofing, grey-zone maritime activity, cyber grid attacks). Explain how existing LLM tools fail military operations due to hallucination risks and cloud-dependency.
- **0:45 - 1:30 | Technical Architecture & Resilience:**  
  Walk through the triple-redundant architecture: GroqCloud inference for sub-second analysis, OpenAI failover, and the offline deterministic extractive engine that runs even under complete network air-gaps.
- **1:30 - 2:30 | Detailed Triage & Corroboration Walkthrough:**  
  Demonstrate 2 contrasting alerts:
  1. A high-severity military incident (e.g., UAV breach near Punjab border) showing analyst-only tactical playbooks.
  2. A disaster/humanitarian incident (e.g., Cyclone Dana) showing civilian evacuation guidance alongside military logistics coordination.
- **2:30 - 3:30 | RAG Deep Dive & Live Querying:**  
  Execute multiple natural-language queries in Ask Sentry. Show how the engine refuses to speculate when asked a trick question outside the intelligence corpus.
- **3:30 - 4:15 | Faithfulness Audit & Methodological Integrity:**  
  Show the execution of `npm run verify-faithfulness` live in terminal. Explain the entity-matching methodology that ensures named actors, geographic coordinates, and military hardware designations cannot be invented by the LLM.
- **4:15 - 5:00 | Roadmap, Deployment & Closing:**  
  Highlight next milestones: live scheduled collectors, Pathway streaming index integration, and automated analyst PDF briefing exports. Close on the provenance and data transparency banner.

---

## ⚡ Task SI-31: Pathway Live-Update Demo Beat (Sidak's Demo Plan)

> **Status:** ⏳ **IN PROGRESS / UNVERIFIED**  
> *Note:* This demo beat depends on the completion and verification of Tasks SI-29 and SI-30 (Dhruv & Pranav). **Do NOT claim this beat is live until SI-29/30 pass their live spike tests.**

### The Target Live-Update Beat Sequence (If SI-29/30 Verified):
1. **Show Initial State:** Search Ask Sentry for a brand-new incident topic: *"What is the status of the new coastal surveillance radar trial?"*  
   *Result:* Ask Sentry returns *"No matching alerts found."*
2. **Stream Ingest:** Add a new structured advisory document into the Pathway index directory/endpoint.
3. **Immediate Re-query (No Server Restart):** Without rebuilding or restarting Next.js, immediately repeat the exact query in Ask Sentry.
4. **Instant Resolution:** Ask Sentry retrieves the new document via Pathway's live streaming index and synthesizes the cited answer in real time.

### Fallback Procedure (If Pathway Service Is Down or Not Live on Demo Day):
- **Do not attempt a live network call that may fail.**
- **Explain the Architecture:** State that Sentry Intel is architected for Pathway streaming retrieval (TantivyBM25 + dense vectors), currently backed by the verified in-process keyword and entity engine.
- **Play Pre-Recorded Fallback Clip:** If requested by judges, show a 15-second backup video clip of the live-update beat in a controlled environment.
- **Run Live on Keyword Engine:** Perform the live Q&A using the verified local retrieval engine, which runs locally without API calls, so it still answers when providers fail or the network drops.

---

## 🛡️ Judge Defense & FAQ Battlecard

### Q1: "How do you handle API downtime or internet cutoffs during military operations?"
> **Answer:** *"Sentry Intel uses a **triple-redundant failover architecture**. Our primary tier is ultra-fast GroqCloud; secondary is OpenAI; but if an operational unit is air-gapped or experiencing API rate limits, our **Tier 3 deterministic extractive NLP engine** executes entirely locally without external network dependencies, continuing to answer queries without crashing."*

### Q2: "Can adversaries inject malicious prompts through ingested news wires (Prompt Injection)?"
> **Answer:** *"All ingested wire text is treated strictly as **untrusted data**. HTML tags and scripts are sanitized before prompting, system instructions remain strictly isolated server-side, and our verification pass ensures every cited statement maps directly to verifiable source text."*

### Q3: "Is this a civilian cybercrime app or a national security platform?"
> **Answer:** *"Sentry Intel is fundamentally a **Defence & National Security OSINT platform** focused on border surveillance, naval choke points, aerospace violations, and critical infrastructure cyber defense. We bridge civilian public safety strictly where defence operations intersect civil defense (such as disaster relief and national infrastructure advisories)."*

### Q4: "Why does an alert receive a specific threat score? How is it calculated?"
> **Answer:** *"Scores are not arbitrary LLM guesses. They are computed through an auditable formula combining verified operational indicators: critical breach signals (+25), special forces or fighter scrambles (+15), and multi-source corroboration factors (+8 for 2 sources, +12 for 3+ sources). The exact breakdown is displayed on every alert."*

### Q5: "Why did you choose Pathway, and what happens if the Pathway service goes down?"
> **Answer:** *"Pathway provides live, streaming indexing with hybrid TantivyBM25 full-text and dense vector retrieval, allowing new advisories to become searchable instantly without batch reindexing. However, because national security systems require zero single points of failure, our Next.js API implements an **automatic fallback**: if the Pathway sidecar times out after 5 seconds or fails, Sentry Intel seamlessly answers using our local keyword and entity retrieval engine."*

### Q6: "Is your system 100% accurate?"
> **Answer:** *"In AI and intelligence, claiming blanket 100% accuracy is dishonest. What we have mathematically verified is **100% faithfulness on our 20-incident-alert audit sample**: all 51 named entities and all 30 article citations were strictly grounded in source wire text with zero hallucinations. We prove our bounds rather than exaggerating them."*
