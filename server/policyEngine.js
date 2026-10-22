/**
 * Deterministic Forensic Policy Engine
 * 
 * Reconciles facts into a mathematically reproducible risk verdict.
 * Follows strict security policy rules:
 * - Deterministic facts decide the baseline risk score.
 * - UNKNOWN != CLEAN (Missing reputation data is never treated as proof of safety).
 * - Duplicate evidence cannot inflate risk score (Deduplication & Category Clamping).
 * - Malicious indicators take precedence over benign formatting (Phishers cannot bypass by appending "Do not share OTP").
 * - Every point of the composite risk score is traced to an evidence item.
 */

import { EvidenceStatus } from './evidenceContract.js';

// Maximum allowed risk contribution per detector category to prevent unbounded inflation
const CATEGORY_CAPS = {
  domain_typosquatting: 50,
  domain_registration_age: 35,
  redirect_chain: 30,
  high_risk_tld: 20,
  upi_vpa_auditor: 45,
  behavioral_urgency: 40,
  agent_link_finding: 15,
  agent_psych_finding: 15,
  agent_finance_finding: 15
};

export function evaluateForensicPolicy(evidenceBundle = []) {
  let score = 10; // Baseline prior
  const scoringTrace = [];
  const limitations = [];
  const supportingEvidence = [];
  const contradictingEvidence = [];

  // Track accumulated contribution per checkId to prevent duplicate inflation
  const accumulatedContributions = new Map();
  const processedCheckSignatures = new Set();

  // Pre-scan: Check if any hard malicious indicators exist (to prevent scam bypass via fake OTP text)
  const hasHardMaliciousIndicator = evidenceBundle.some(item => 
    item.status === EvidenceStatus.MALICIOUS &&
    ['domain_typosquatting', 'domain_registration_age', 'redirect_chain', 'upi_vpa_auditor', 'behavioral_urgency'].includes(item.checkId)
  );

  for (const item of evidenceBundle) {
    // 1. Safety check for malformed evidence
    if (!item || !item.checkId || !item.status) {
      limitations.push({
        checkId: item?.checkId || 'malformed_evidence',
        source: item?.source || 'UNKNOWN',
        message: 'Malformed evidence item discarded by policy engine.'
      });
      continue;
    }

    // 2. Exact signature deduplication
    const signature = `${item.checkId}:${item.status}:${item.source}:${(item.evidence?.[0] || '').slice(0, 40)}`;
    if (processedCheckSignatures.has(signature)) {
      continue; // Skip exact duplicate item
    }
    processedCheckSignatures.add(signature);

    // 3. Handle limitations & unknown states (UNKNOWN != CLEAN)
    if (item.status === EvidenceStatus.LOOKUP_FAILED) {
      limitations.push({
        checkId: item.checkId,
        source: item.source,
        message: 'Telemetry lookup failed or timed out. Target was NOT presumed safe.'
      });
      continue;
    }

    if (item.status === EvidenceStatus.UNKNOWN) {
      limitations.push({
        checkId: item.checkId,
        source: item.source,
        message: 'No external threat intelligence record found. Lack of record does not imply benign safety.'
      });
      continue;
    }

    let rawContribution = 0;
    let reason = '';

    // 4. Mathematical evaluation of verified evidence items
    switch (item.checkId) {
      case 'domain_typosquatting':
        if (item.status === EvidenceStatus.MALICIOUS) {
          rawContribution = +50;
          reason = 'Deceptive lookalike typosquatting of protected banking/financial brand.';
        } else if (item.status === EvidenceStatus.SUSPICIOUS) {
          rawContribution = +25;
          reason = 'Phonetic or orthographic similarity to registered trademark.';
        }
        break;

      case 'domain_registration_age':
        if (item.status === EvidenceStatus.MALICIOUS) {
          rawContribution = +35;
          reason = 'Domain registered within last 30 days (typical of disposable phishing infrastructure).';
        } else if (item.status === EvidenceStatus.SUSPICIOUS) {
          rawContribution = +15;
          reason = 'Young domain age (< 90 days).';
        } else if (item.status === EvidenceStatus.CLEAN && !hasHardMaliciousIndicator) {
          rawContribution = -15;
          reason = 'Established long-term domain age (> 1 year).';
        }
        break;

      case 'redirect_chain':
        if (item.status === EvidenceStatus.MALICIOUS) {
          rawContribution = +30;
          reason = 'Cloaked multi-hop redirection concealing final malicious landing page.';
        }
        break;

      case 'high_risk_tld':
        if (item.status === EvidenceStatus.SUSPICIOUS) {
          rawContribution = +15;
          reason = 'High-abuse top level domain (.xyz/.top/.buzz) commonly exploited in zero-reputation campaigns.';
        }
        break;

      case 'upi_vpa_auditor':
        if (item.status === EvidenceStatus.MALICIOUS) {
          rawContribution = +45;
          reason = 'Unregistered or suspicious private UPI handle requesting funds.';
        } else if (item.status === EvidenceStatus.CLEAN && !hasHardMaliciousIndicator) {
          rawContribution = -25;
          reason = 'Handle verified against NPCI official PSP bank whitelist.';
        }
        break;

      case 'behavioral_urgency':
        if (item.status === EvidenceStatus.MALICIOUS) {
          rawContribution = +35;
          reason = 'Critical panic trigger (threat of account freeze, digital arrest, or deadline extortion).';
        } else if (item.status === EvidenceStatus.SUSPICIOUS) {
          rawContribution = +20;
          reason = 'Manufactured urgency language or reward lure.';
        }
        break;

      case 'safe_transaction_otp':
        // Malicious Override: Clean OTP discount ONLY applies if NO hard malicious links/typosquats exist
        if (item.status === EvidenceStatus.CLEAN) {
          if (!hasHardMaliciousIndicator) {
            rawContribution = -45;
            reason = 'Legitimate 2FA banking OTP with explicit anti-phishing disclaimer.';
          } else {
            reason = 'Benign OTP formatting detected, but superseded by malicious threat vector.';
          }
        }
        break;

      case 'agent_link_finding':
        // Damped contribution if deterministic OSINT already flagged typosquatting/age
        if (item.status === EvidenceStatus.MALICIOUS) rawContribution = +15;
        else if (item.status === EvidenceStatus.CLEAN && !hasHardMaliciousIndicator) rawContribution = -10;
        reason = 'Link investigator technical infrastructure evaluation.';
        break;

      case 'agent_psych_finding':
        if (item.status === EvidenceStatus.MALICIOUS) rawContribution = +15;
        else if (item.status === EvidenceStatus.CLEAN && !hasHardMaliciousIndicator) rawContribution = -10;
        reason = 'Psychological urgency cop social engineering triage.';
        break;

      case 'agent_finance_finding':
        if (item.status === EvidenceStatus.MALICIOUS) rawContribution = +15;
        else if (item.status === EvidenceStatus.CLEAN && !hasHardMaliciousIndicator) rawContribution = -10;
        reason = 'Financial auditor payment pattern inspection.';
        break;

      default:
        rawContribution = item.impact || 0;
        reason = item.evidence?.[0] || 'Generic evidence contribution';
        break;
    }

    // 5. Category Clamping: prevent multi-URL or repeated items from exceeding the category ceiling
    const currentCategoryTotal = accumulatedContributions.get(item.checkId) || 0;
    const categoryCap = CATEGORY_CAPS[item.checkId] || 50;
    
    let clampedContribution = rawContribution;
    if (rawContribution > 0) {
      const allowed = Math.max(0, categoryCap - currentCategoryTotal);
      clampedContribution = Math.min(rawContribution, allowed);
    }
    accumulatedContributions.set(item.checkId, currentCategoryTotal + clampedContribution);

    if (clampedContribution !== 0) {
      if (clampedContribution > 0) {
        supportingEvidence.push({ checkId: item.checkId, source: item.source, contribution: clampedContribution, reason });
      } else {
        contradictingEvidence.push({ checkId: item.checkId, source: item.source, contribution: clampedContribution, reason });
      }

      score += clampedContribution;
      scoringTrace.push({
        checkId: item.checkId,
        source: item.source,
        status: item.status,
        contribution: clampedContribution,
        runningScore: Math.min(100, Math.max(0, score)),
        reason
      });
    }
  }

  // 6. Hard bounding: enforce 0 to 100 range
  const finalScore = Math.min(100, Math.max(0, score));

  // 7. Calibrated policy verdict
  let verdict = 'SAFE';
  if (finalScore >= 70) verdict = 'CRITICAL THREAT';
  else if (finalScore >= 40) verdict = 'SUSPICIOUS';

  // 8. Dynamic Confidence Calibration
  const totalChecks = Math.max(1, evidenceBundle.length);
  const unknownCount = limitations.length;
  const verifiedCount = Math.max(0, totalChecks - unknownCount);
  const confidence = Math.min(99, Math.max(50, Math.round((verifiedCount / totalChecks) * 55 + 40)));

  return {
    deterministicScore: finalScore,
    deterministicVerdict: verdict,
    confidence,
    scoringTrace,
    supportingEvidence,
    contradictingEvidence,
    limitations
  };
}
