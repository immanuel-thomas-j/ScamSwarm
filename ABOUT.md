# About the Project: Scam Swarm

## Inspiration

With the rapid digitization of payment ecosystems—most notably India’s UPI framework—financial cyber fraud has escalated into a national crisis. In the financial year 2023–24, Indian citizens lost over **₹10,319 Crores** to digital banking scams. 

Scammers exploit two primary vectors: **human psychology** (false urgency, suspension panic, lottery hooks) and **insecure web infrastructure** (lookalike domains, disposable domains, and illicit UPI Virtual Payment Addresses). Traditional firewalls are static and blind to language context, while single LLM prompts are too slow, monolithic, and prone to hallucinations. We were inspired to build a hybrid threat intelligence system: combining high-speed deterministic heuristics with a coordinated, parallel team of specialized AI agents.

## What it does

**Scam Swarm** is a Security Operations Center (SOC) dashboard that evaluates suspicious communications (SMS, phishing emails, UPI request links) and produces a threat verdict in under 2 seconds. 

1. **Ingestion & Local Diagnostics**: The input telemetry is immediately scanned by a deterministic browser-side heuristics engine for typosquatting, insecure protocols (`http://`), and blacklisted UPI Virtual Payment Addresses (VPAs).
2. **Parallel Agent Deployment**: The app spawns a **Swarm Pipeline** of three specialized sub-agents:
   - **Link & Domain Investigator** (Inspects URL entropy, brand-spoofing indicators, and TLD risks).
   - **Psychological Urgency Cop** (Triages panic language, false authority flags, and time-pressure hooks).
   - **Financial Pattern Auditor** (Analyzes illicit lottery prompts, UPI transaction traps, and KYC threats).
3. **Verdict Aggregation**: Generates a unified risk score, interactive SVG risk gauges, highlighted threat spans, and a checklist of recommended actions (e.g., calling the 1930 Cybercrime Helpline).
4. **Structured Exports**: Allows researchers to export clean report logs in plain text or Markdown.

## How we built it

The project is built on a modern, high-performance web and cloud architecture:
* **Frontend SPA**: React 19 paired with Vite 8 for sub-millisecond hot reloading and optimized CSS building.
* **Core GenAI Orchestration**: Integrated the new `@google/genai` (v2.9.0) SDK to leverage **Gemini 2.5 Flash** for deep semantic analysis under strict JSON-schema modes.
* **Dual Engine Support**: Built a switchable backend adapter supporting **LLaMA 3.3-70B** via the Groq SDK to benchmark latency and cost differences.
* **Production GCP Stack**: Built a serverless Firebase/GCP architecture incorporating **Firebase Hosting**, **Cloud Functions** for backend routing, **Cloud Pub/Sub** for fanning out parallel agent requests, and **Cloud Firestore** for archiving scan audit logs.

To represent the risk score mathematically, we implemented a weighted linear combination that integrates local deterministic heuristic violations with the AI's semantic evaluations:

$$ R_{composite} = \min\left(100, \sum_{i=1}^{n} w_i \cdot H_i + w_{AI} \cdot S_{AI}\right) $$

Where:
* \\( H_i \in \{0, 1\} \\) represents deterministic heuristic flags (e.g., blacklisted UPI handle, insecure HTTP link).
* \\( w_i \\) represents the severity weight of heuristic threat indicator \\( i \\).
* \\( S_{AI} \in [0, 100] \\) is the semantic risk score returned by the Gemini orchestrator.
* \\( w_{AI} \\) is the semantic confidence scaling factor.

## Challenges we ran into

* **API Versioning & Deprecations**: Migrating to the latest `@google/genai` SDK threw `404 NOT FOUND` errors because older model endpoints like `gemini-1.5-flash` were deprecated on the target API version. We solved this by running diagnostic API queries and upgrading to `gemini-2.5-flash`.
* **JSON Schema Enforcement**: Relying on models to output JSON regularly resulted in broken brackets or markdown formatting codeblocks. We fixed this by enforcing strict API configuration options (`responseMimeType: 'application/json'`) and writing a clean regex fallback extractor.
* **CSS Grid Track Stretching**: Long, single-line JSON string responses inside the Raw Inspector stretched the entire Grid layout horizontally on desktops. We resolved this by overriding default track behavior with `minmax(0, 1fr)` and enforcing container `min-width: 0` constraints.
* **Secure Clipboard Access**: The standard `navigator.clipboard` API fails under insecure contexts (e.g. raw IP hosting for local demos). We wrote a customized fallback utility that dynamically creates and destroys textareas to execute copy actions globally.

## Accomplishments that we're proud of

* **Sub-2-Second Pipeline**: Achieving parallel execution speeds. The parallel speedup is mathematically represented by:
  $$ S_{speedup} = \frac{T_{sequential}}{T_{parallel}} \approx \frac{\sum t_{agent}}{\max(t_{agent}) + \delta} $$
  where \\( \delta \\) represents the Pub/Sub orchestrator overhead.
* **Immersive Cybersecurity UI**: A fully responsive, glassmorphic, cyberpunk-themed SOC layout with SVG gauges, agent state trackers, and real-world Indian cyber-fraud stats.
* **100% Mobile Responsive**: Seamless grid-to-waterfall transitions across all screen sizes, including a vertical stack adapter for the GCP infrastructure diagram.

## What we learned

* **Structured Outputs are Critical**: For reliable agentic pipelines, enforcing strict JSON schemas is far superior to prompt-engineering the model to "output JSON".
* **Heuristics + LLM Synergy**: Pure LLM approaches are too slow and expensive for trivial checks. Pre-filtering inputs with regular expressions and string whitelists, then appending those results into the prompt metadata, yields the most efficient and robust security pipeline.

## What's next for Scam Swarm

1. **WhatsApp & SMS Webhook Integration**: Deploy Scam Swarm as a background receiver daemon where users can forward suspicious messages directly to a phone number.
2. **Browser Extension**: A Chrome extension that scans active DOM pages for typosquatted domains and suspicious payment forms.
3. **Fine-Tuned Small Language Models**: Fine-tune a lightweight model on localized Indian regional language fraud databases to detect scams in Hindi, Tamil, and Bengali with lower compute footprints.
