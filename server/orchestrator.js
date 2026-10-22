/**
 * Scam Swarm Orchestrator Engine (5-Layer Architecture)
 * 
 * Implements the rigorous enterprise security contract:
 * 1. Detection Layer: Deterministic facts & OSINT lookups
 * 2. Policy Layer: Mathematical scoring policy (reproducible, explainable, UNKNOWN != CLEAN)
 * 3. AI Layer: LLM explains and summarizes the policy decision without hallucinating facts
 * 4. Verification Layer: Audits claims, flags agent disagreements, constructs the Evidence Graph
 * 5. Presentation Layer: Telemetry, timings, limitations, and actionable guidance
 */

import { investigateUrlTelemetry } from './osint.js';
import { evaluateUPIHandle } from './threatIntel.js';
import { createEvidenceItem, EvidenceStatus, EvidenceSource } from './evidenceContract.js';
import { evaluateForensicPolicy } from './policyEngine.js';
import { runLinkAgent } from './agents/linkAgent.js';
import { runPsychAgent } from './agents/psychAgent.js';
import { runFinanceAgent } from './agents/financeAgent.js';
import { runJudgeAgent } from './agents/judgeAgent.js';
import { runEvidenceVerifier } from './agents/verifierAgent.js';
import { analyzeImageTelemetry } from './vision.js';

export async function orchestrateAnalysis({
  text = '',
  image = '',
  mimeType = 'image/jpeg',
  aiClient = null,
  geminiApiKey = ''
}) {
  const globalStartTime = Date.now();

  let combinedText = text.trim();
  let visionReport = null;

  // 1. Multimodal Vision Stage (if screenshot / QR image provided)
  if (image && aiClient) {
    visionReport = await analyzeImageTelemetry({
      aiClient,
      imageBase64: image,
      mimeType
    });
    if (visionReport.extractedText) {
      combinedText = `${combinedText}\n[Extracted from Image]: ${visionReport.extractedText}`.trim();
    }
  }

  // 2. Static Feature Extraction
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const extractedUrls = [...new Set(combinedText.match(urlRegex) || [])];

  const upiRegex = /[a-zA-Z0-9.\-_]+@[a-zA-Z]{3,}/gi;
  const extractedUpis = [...new Set(combinedText.match(upiRegex) || [])];

  const urgencyWordsList = [
    { word: 'urgent', label: 'High Urgency Trigger' },
    { word: 'immediately', label: 'Immediate Action Hook' },
    { word: 'blocked', label: 'Suspension Alert' },
    { word: 'suspended', label: 'Account Termination Threat' },
    { word: 'terminated', label: 'Permanent Penalty Warning' },
    { word: 'verify', label: 'Credential Harvesting Hook' },
    { word: 'kyc', label: 'KYC Document Trap' },
    { word: 'lottery', label: 'Lottery Prize Lure' },
    { word: 'lakh', label: 'High-Value Financial Hook' },
    { word: 'bonus', label: 'Cash Reward Bait' },
    { word: 'winner', label: 'Fake Winner Hook' },
    { word: 'refund', label: 'Tax/Order Refund Trap' },
    { word: 'digital arrest', label: 'Digital Arrest Extortion' },
    { word: 'police', label: 'Law Enforcement Spoof' },
    { word: 'cbi', label: 'Federal Agency Impersonation' },
    { word: 'customs', label: 'Customs Duty Lure' }
  ];

  const matchedKeywords = urgencyWordsList.filter(kw =>
    new RegExp(`\\b${kw.word}\\b`, 'i').test(combinedText)
  );

  // 3. LAYER 1: Detection Layer (Live OSINT & Threat Feeds)
  const osintStartTime = Date.now();
  const [osintReports, upiReports] = await Promise.all([
    Promise.all(extractedUrls.slice(0, 3).map(url => investigateUrlTelemetry(url, geminiApiKey))),
    Promise.all(extractedUpis.slice(0, 3).map(upi => Promise.resolve(evaluateUPIHandle(upi))))
  ]);
  const osintDurationMs = Date.now() - osintStartTime;

  // Build Standardized Evidence Bundle from Detection Layer
  const evidenceBundle = [];

  // (a) URL & Domain Evidence Items
  for (const rep of osintReports) {
    if (rep.error) {
      evidenceBundle.push(createEvidenceItem({
        checkId: 'url_inspection_error',
        status: EvidenceStatus.LOOKUP_FAILED,
        source: EvidenceSource.OSINT_DNS,
        evidence: [`Target ${rep.url} inspection halted: ${rep.error}`],
        limitations: ['Network or DNS lookup failed; cannot confirm domain safety.']
      }));
      continue;
    }

    // RDAP Domain Age
    if (rep.rdap?.domainAgeDays !== null) {
      const isNew = rep.rdap.domainAgeDays <= 30;
      evidenceBundle.push(createEvidenceItem({
        checkId: 'domain_registration_age',
        status: isNew ? EvidenceStatus.MALICIOUS : EvidenceStatus.CLEAN,
        source: EvidenceSource.OSINT_RDAP,
        evidence: [`Domain ${rep.hostname} was registered ${rep.rdap.domainAgeDays} days ago (${rep.rdap.registrationDate || 'Recent'}).`],
        impact: isNew ? 35 : -15,
        rawData: rep.rdap
      }));
    } else {
      evidenceBundle.push(createEvidenceItem({
        checkId: 'domain_registration_age',
        status: EvidenceStatus.UNKNOWN,
        source: EvidenceSource.OSINT_RDAP,
        evidence: [`No ICANN RDAP record found for ${rep.hostname}.`],
        limitations: ['Domain registry metadata unavailable.']
      }));
    }

    // Brand Typosquatting
    if (rep.brandMatch?.isTyposquat) {
      evidenceBundle.push(createEvidenceItem({
        checkId: 'domain_typosquatting',
        status: EvidenceStatus.MALICIOUS,
        source: EvidenceSource.BRAND_INTEL,
        evidence: [`Domain ${rep.hostname} closely impersonates trusted brand '${rep.brandMatch.brand}' (Levenshtein distance: ${rep.brandMatch.distance}).`],
        impact: 50,
        rawData: rep.brandMatch
      }));
    }

    // Redirect Cloaking
    if (rep.redirects?.length > 1) {
      evidenceBundle.push(createEvidenceItem({
        checkId: 'redirect_chain',
        status: EvidenceStatus.MALICIOUS,
        source: EvidenceSource.OSINT_REDIRECT,
        evidence: [`URL cloaked behind ${rep.redirects.length} redirect hops terminating at ${rep.finalUrl}.`],
        impact: 30,
        rawData: rep.redirects
      }));
    }
  }

  // (b) Financial UPI Evidence Items
  for (const upi of upiReports) {
    const isWhitelisted = upi.isKnownBank;
    evidenceBundle.push(createEvidenceItem({
      checkId: 'upi_vpa_auditor',
      status: isWhitelisted ? EvidenceStatus.CLEAN : EvidenceStatus.MALICIOUS,
      source: EvidenceSource.NPCI_REGISTRY,
      evidence: [upi.isKnownBank ? `Handle @${upi.handle} belongs to NPCI verified PSP ${upi.bankName}.` : `Handle @${upi.handle} is an unverified private payment target.`],
      impact: isWhitelisted ? -25 : 45,
      rawData: upi
    }));
  }

  // (c) Behavioral Urgency & OTP Patterns
  const isOtpSafe = /\b(OTP|one-time password)\b/i.test(combinedText) && /\b(do not share|never share)\b/i.test(combinedText) && extractedUrls.length === 0;
  if (isOtpSafe) {
    evidenceBundle.push(createEvidenceItem({
      checkId: 'safe_transaction_otp',
      status: EvidenceStatus.CLEAN,
      source: EvidenceSource.BEHAVIORAL_RULES,
      evidence: ['Authentic 2FA transaction OTP containing explicit anti-phishing warning and zero external links.'],
      impact: -45
    }));
  } else if (matchedKeywords.length > 0) {
    const criticalWords = ['blocked', 'suspended', 'immediately', 'urgent', 'digital arrest', 'customs'];
    const hasCritical = matchedKeywords.some(k => criticalWords.includes(k.word.toLowerCase()));
    evidenceBundle.push(createEvidenceItem({
      checkId: 'behavioral_urgency',
      status: hasCritical ? EvidenceStatus.MALICIOUS : EvidenceStatus.SUSPICIOUS,
      source: EvidenceSource.BEHAVIORAL_RULES,
      evidence: [`Detected ${matchedKeywords.length} panic/urgency triggers: ${matchedKeywords.map(k => k.word).join(', ')}.`],
      impact: hasCritical ? 35 : 20,
      rawData: matchedKeywords
    }));
  }

  // 4. LAYER 2: Specialist Swarm Execution (Parallel)
  const swarmStartTime = Date.now();
  const [linkAgentResult, psychAgentResult, financeAgentResult] = await Promise.all([
    runLinkAgent({ text: combinedText, osintReports }),
    runPsychAgent({ text: combinedText, heuristicKeywords: matchedKeywords }),
    runFinanceAgent({ text: combinedText, upiEvaluations: upiReports })
  ]);
  const swarmDurationMs = Date.now() - swarmStartTime;

  // Add agent findings to evidence bundle
  evidenceBundle.push(createEvidenceItem({
    checkId: 'agent_link_finding',
    status: linkAgentResult.status === 'MALICIOUS' ? EvidenceStatus.MALICIOUS : linkAgentResult.status === 'SAFE' ? EvidenceStatus.CLEAN : EvidenceStatus.SUSPICIOUS,
    source: EvidenceSource.AGENT_LINK,
    evidence: [linkAgentResult.finding],
    impact: linkAgentResult.riskScore ? Math.round(linkAgentResult.riskScore * 0.25) : 0
  }));

  evidenceBundle.push(createEvidenceItem({
    checkId: 'agent_psych_finding',
    status: psychAgentResult.status === 'MALICIOUS' ? EvidenceStatus.MALICIOUS : psychAgentResult.status === 'SAFE' ? EvidenceStatus.CLEAN : EvidenceStatus.SUSPICIOUS,
    source: EvidenceSource.AGENT_PSYCH,
    evidence: [psychAgentResult.finding],
    impact: psychAgentResult.riskScore ? Math.round(psychAgentResult.riskScore * 0.25) : 0
  }));

  evidenceBundle.push(createEvidenceItem({
    checkId: 'agent_finance_finding',
    status: financeAgentResult.status === 'MALICIOUS' ? EvidenceStatus.MALICIOUS : financeAgentResult.status === 'SAFE' ? EvidenceStatus.CLEAN : EvidenceStatus.SUSPICIOUS,
    source: EvidenceSource.AGENT_FINANCE,
    evidence: [financeAgentResult.finding],
    impact: financeAgentResult.riskScore ? Math.round(financeAgentResult.riskScore * 0.25) : 0
  }));

  // 5. LAYER 3: Deterministic Policy Evaluation
  const policyResult = evaluateForensicPolicy(evidenceBundle);

  // 6. LAYER 4: AI Adjudication & Explanation
  const judgeStartTime = Date.now();
  const judgeReport = await runJudgeAgent({
    text: combinedText,
    agentReports: {
      link: linkAgentResult,
      psych: psychAgentResult,
      finance: financeAgentResult
    },
    osintReports,
    upiReports,
    policyVerdict: policyResult.deterministicVerdict,
    policyScore: policyResult.deterministicScore
  });
  const judgeDurationMs = Date.now() - judgeStartTime;

  // Ensure policy verdict is preserved (LLM explains, does not override facts)
  const finalScore = policyResult.deterministicScore;
  const finalVerdict = policyResult.deterministicVerdict;

  // 7. LAYER 5: Verification & Evidence Graph
  const verificationResult = runEvidenceVerifier({
    text: combinedText,
    evidenceBundle,
    policyResult,
    agentReports: {
      link: linkAgentResult,
      psych: psychAgentResult,
      finance: financeAgentResult
    },
    executiveSummary: judgeReport.executiveSummary || ''
  });

  const totalDurationMs = Date.now() - globalStartTime;

  return {
    overallRiskScore: finalScore,
    verdict: finalVerdict,
    confidence: policyResult.confidence,
    scamCategory: judgeReport.scamCategory || (finalScore >= 70 ? 'Phishing & Impersonation Attack' : 'Heuristic Security Triage'),
    executiveSummary: judgeReport.executiveSummary,
    threatIndicators: judgeReport.threatIndicators || matchedKeywords.map(k => k.word),
    metrics: {
      linguisticUrgency: psychAgentResult.riskScore || 0,
      domainRisk: linkAgentResult.riskScore || 0,
      financialRisk: financeAgentResult.riskScore || 0
    },
    recommendedActions: judgeReport.recommendedActions || (finalVerdict === 'CRITICAL THREAT'
      ? ['Do not click links or send funds', 'Report immediately to 1930 Cybercrime Helpline', 'Block sender']
      : ['No action required']),
    
    // Enterprise Evidence Contract & Graph
    evidenceGraph: verificationResult.graph,
    evidenceBundle,
    scoringTrace: policyResult.scoringTrace,
    supportingEvidence: policyResult.supportingEvidence,
    contradictingEvidence: policyResult.contradictingEvidence,
    limitations: policyResult.limitations,
    contradictions: verificationResult.contradictions,
    verificationAudit: verificationResult.verificationAudit,

    agents: [
      linkAgentResult,
      psychAgentResult,
      financeAgentResult
    ],
    osint: {
      durationMs: osintDurationMs,
      urlsInvestigated: osintReports.length,
      reports: osintReports
    },
    financialIntel: {
      upisAudited: upiReports.length,
      reports: upiReports
    },
    vision: visionReport,
    executionTimings: {
      totalMs: totalDurationMs,
      osintMs: osintDurationMs,
      swarmMs: swarmDurationMs,
      judgeMs: judgeDurationMs,
      agentLatencies: {
        link: linkAgentResult.durationMs,
        psych: psychAgentResult.durationMs,
        finance: financeAgentResult.durationMs
      }
    },
    timestamp: new Date().toISOString()
  };
}
