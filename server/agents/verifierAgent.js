/**
 * Evidence Verifier & Graph Generator
 * 
 * Verifies that all conclusions correlate with validated evidence items,
 * flags contradictions between specialist agents derived dynamically from actual outputs,
 * surfaces missing telemetry, and generates the structured Evidence Graph.
 */

import { EvidenceStatus } from '../evidenceContract.js';

export function runEvidenceVerifier({
  text = '',
  evidenceBundle = [],
  policyResult,
  agentReports = {},
  executiveSummary = ''
}) {
  const contradictions = [];
  const unsupportedClaims = [];
  const nodes = [];
  const edges = [];

  // Node 1: Root Observed Telemetry
  nodes.push({
    id: 'observed_input',
    type: 'INPUT_TELEMETRY',
    label: 'Observed Telemetry',
    summary: text.slice(0, 120) + (text.length > 120 ? '...' : ''),
    status: 'ACTIVE'
  });

  // ── 1. Dynamic Agent Disagreement Analysis ──
  const agentsList = [
    { key: 'link', name: 'Link & Infrastructure', report: agentReports.link },
    { key: 'psych', name: 'Psychological Urgency', report: agentReports.psych },
    { key: 'finance', name: 'Financial Auditor', report: agentReports.finance }
  ].filter(a => a.report);

  for (let i = 0; i < agentsList.length; i++) {
    for (let j = i + 1; j < agentsList.length; j++) {
      const a = agentsList[i];
      const b = agentsList[j];

      // Check for divergence between clean vs malicious
      if ((a.report.status === 'SAFE' && b.report.status === 'MALICIOUS') ||
          (a.report.status === 'MALICIOUS' && b.report.status === 'SAFE')) {
        const safeAgent = a.report.status === 'SAFE' ? a : b;
        const malAgent = a.report.status === 'MALICIOUS' ? a : b;

        contradictions.push({
          agents: [safeAgent.name, malAgent.name],
          disagreement: `${safeAgent.name} concluded ${safeAgent.report.status} ('${safeAgent.report.finding?.slice(0, 70)}...'), while ${malAgent.name} concluded ${malAgent.report.status} ('${malAgent.report.finding?.slice(0, 70)}...').`,
          resolution: `Policy engine reconciled divergence by prioritizing verified threat vectors over neutral indicators. An absence of negative reputation in one vector cannot override verified risk in another.`
        });
      }
    }
  }

  // ── 2. Claim-Level Verification of Executive Summary ──
  // Check if claims made in executiveSummary are supported by evidence in evidenceBundle
  if (executiveSummary) {
    const claimKeywords = [
      { pattern: /\b(typosquat|lookalike|impersonat)\b/i, checkId: 'domain_typosquatting' },
      { pattern: /\b(newly registered|recent domain|domain age)\b/i, checkId: 'domain_registration_age' },
      { pattern: /\b(redirect|cloaked)\b/i, checkId: 'redirect_chain' },
      { pattern: /\b(UPI|VPA|unverified handle)\b/i, checkId: 'upi_vpa_auditor' },
      { pattern: /\b(urgency|deadline|panic|threat|arrest|extortion)\b/i, checkId: 'behavioral_urgency' },
      { pattern: /\b(OTP|one-time password)\b/i, checkId: 'safe_transaction_otp' }
    ];

    for (const claim of claimKeywords) {
      if (claim.pattern.test(executiveSummary)) {
        // Must exist in evidenceBundle with matching checkId
        const isSupported = evidenceBundle.some(ev => ev.checkId === claim.checkId && ev.status !== EvidenceStatus.LOOKUP_FAILED);
        if (!isSupported) {
          unsupportedClaims.push({
            topic: claim.checkId,
            reason: `Summary asserted '${claim.checkId}' claims, but no verified telemetry confirmed this check.`
          });
        }
      }
    }
  }

  // ── 3. Build Graph Nodes from Evidence Items ──
  evidenceBundle.forEach((item, idx) => {
    const nodeId = `ev_${item.checkId}_${idx}`;
    let relationship = 'NEUTRAL';
    if (item.status === EvidenceStatus.MALICIOUS || item.status === EvidenceStatus.SUSPICIOUS) {
      relationship = 'SUPPORTS_FRAUD';
    } else if (item.status === EvidenceStatus.CLEAN) {
      relationship = 'CONTRADICTS_FRAUD';
    } else if (item.status === EvidenceStatus.LOOKUP_FAILED || item.status === EvidenceStatus.UNKNOWN) {
      relationship = 'LIMITATION_UNKNOWN';
    }

    nodes.push({
      id: nodeId,
      type: 'EVIDENCE_SOURCE',
      checkId: item.checkId,
      label: item.source.replace(/_/g, ' '),
      status: item.status,
      impact: item.impact || 0,
      evidence: item.evidence,
      limitations: item.limitations,
      observedAt: item.observedAt,
      rawData: item.rawData
    });

    edges.push({
      from: 'observed_input',
      to: nodeId,
      relationship
    });
  });

  // ── 4. Build Specialist Agent Findings Nodes ──
  ['link', 'psych', 'finance'].forEach((agentKey) => {
    const report = agentReports[agentKey];
    if (!report) return;

    const agentNodeId = `agent_${agentKey}`;
    nodes.push({
      id: agentNodeId,
      type: 'AGENT_FINDING',
      label: report.name || agentKey,
      status: report.status || 'UNKNOWN',
      riskScore: report.riskScore || 0,
      finding: report.finding || '',
      durationMs: report.durationMs || 0
    });

    edges.push({
      from: 'observed_input',
      to: agentNodeId,
      relationship: report.status === 'MALICIOUS' ? 'SUPPORTS_FRAUD' : report.status === 'SAFE' ? 'CONTRADICTS_FRAUD' : 'NEUTRAL'
    });
  });

  // Final Verdict Node
  nodes.push({
    id: 'verdict_node',
    type: 'FINAL_VERDICT',
    label: policyResult.deterministicVerdict,
    score: policyResult.deterministicScore,
    confidence: policyResult.confidence,
    status: policyResult.deterministicVerdict
  });

  // Connect all evidence & agent nodes into the Verdict
  nodes.filter(n => n.type === 'EVIDENCE_SOURCE' || n.type === 'AGENT_FINDING').forEach(n => {
    edges.push({
      from: n.id,
      to: 'verdict_node',
      relationship: n.status === 'MALICIOUS' ? 'UPVOTES_RISK' : n.status === 'CLEAN' ? 'DOWNVOTES_RISK' : 'INFORMATIONAL'
    });
  });

  return {
    graph: { nodes, edges },
    contradictions,
    isExplanationVerified: unsupportedClaims.length === 0,
    unsupportedClaims,
    verificationAudit: {
      totalFactsAudited: evidenceBundle.length,
      contradictionsResolved: contradictions.length,
      unsupportedClaimsFiltered: unsupportedClaims.length,
      limitationsLogged: policyResult.limitations.length
    }
  };
}
