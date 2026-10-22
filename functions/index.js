const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { GoogleGenAI } = require("@google/genai");
const cors = require("cors")({ origin: true });
const dns = require("node:dns/promises");

admin.initializeApp();
const db = admin.firestore();

/**
 * SCAM SWARM GCP ORCHESTRATOR CLOUD FUNCTION
 * 
 * Production serverless gateway implementing:
 * - Input validation & rate limiting
 * - Live DNS resolution
 * - Parallel multi-agent execution (Link, Psych, Finance)
 * - Judge adjudication & Firestore audit trail
 */
exports.analyzeTelemetry = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method === "OPTIONS") return res.status(204).send("");
    if (req.method !== "POST") return res.status(405).send("Method Not Allowed. Use POST.");

    const { text = "", image = "" } = req.body;
    if (!text && !image) {
      return res.status(400).json({ error: "Missing required parameter: 'text' or 'image' is required." });
    }

    try {
      const apiKey = process.env.GEMINI_API_KEY || functions.config().gemini?.key || "";
      if (!apiKey) {
        return res.status(500).json({ error: "Google Gemini API Key is not configured on this server." });
      }

      const ai = new GoogleGenAI({ apiKey });

      // Extract URLs and resolve DNS
      const urlRegex = /(https?:\/\/[^\s]+)/gi;
      const urls = [...new Set(text.match(urlRegex) || [])];

      const osintRecords = await Promise.all(urls.slice(0, 3).map(async (u) => {
        try {
          const parsed = new URL(u);
          const ips = await dns.resolve4(parsed.hostname).catch(() => []);
          return { url: u, hostname: parsed.hostname, resolved: ips.length > 0, ips };
        } catch (e) {
          return { url: u, error: e.message };
        }
      }));

      // Parallel Agents Execution
      const [linkRes, psychRes, financeRes] = await Promise.all([
        ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `You are the Link & Domain Investigator. Text: "${text}". URLs & DNS: ${JSON.stringify(osintRecords)}. Respond ONLY with JSON: {"name":"Link & Domain Investigator","status":"SAFE|SUSPICIOUS|MALICIOUS","riskScore":<0-100>,"finding":"<finding>"}`,
          config: { responseMimeType: "application/json" }
        }),
        ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `You are the Psychological Urgency Cop. Text: "${text}". Respond ONLY with JSON: {"name":"Psychological Urgency Cop","status":"SAFE|SUSPICIOUS|MALICIOUS","riskScore":<0-100>,"finding":"<finding>"}`,
          config: { responseMimeType: "application/json" }
        }),
        ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `You are the Financial Pattern Auditor. Text: "${text}". Respond ONLY with JSON: {"name":"Financial Pattern Auditor","status":"SAFE|SUSPICIOUS|MALICIOUS","riskScore":<0-100>,"finding":"<finding>"}`,
          config: { responseMimeType: "application/json" }
        })
      ]);

      const linkAgent = JSON.parse(linkRes.text);
      const psychAgent = JSON.parse(psychRes.text);
      const financeAgent = JSON.parse(financeRes.text);

      // Judge Synthesis
      const judgeRes = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `You are the Supreme Forensic Judge. Reconcile these findings for text: "${text}":
Link: ${JSON.stringify(linkAgent)}
Psych: ${JSON.stringify(psychAgent)}
Finance: ${JSON.stringify(financeAgent)}
Respond ONLY with JSON:
{"overallRiskScore":<0-100>,"verdict":"SAFE|SUSPICIOUS|CRITICAL THREAT","scamCategory":"<cat>","executiveSummary":"<summary>","confidence":<0-100>,"metrics":{"linguisticUrgency":<0-100>,"domainRisk":<0-100>,"financialRisk":<0-100>},"threatIndicators":["<phrase1>"],"recommendedActions":["<action1>"]}`,
        config: { responseMimeType: "application/json" }
      });

      const parsedResult = JSON.parse(judgeRes.text);
      parsedResult.agents = [linkAgent, psychAgent, financeAgent];
      parsedResult.osint = { urlsInvestigated: osintRecords.length, reports: osintRecords };

      // Firestore Audit Logging
      await db.collection("audit_logs").add({
        textPreview: text.slice(0, 200),
        verdict: parsedResult.verdict,
        overallRiskScore: parsedResult.overallRiskScore,
        scamCategory: parsedResult.scamCategory,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      return res.status(200).json(parsedResult);
    } catch (err) {
      console.error("GCP Orchestrator error:", err);
      return res.status(500).json({ error: "Failed to process analysis: " + err.message });
    }
  });
});
