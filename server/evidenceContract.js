/**
 * Scam Swarm Standardized Evidence Contract
 * 
 * Enforces a strict, auditable schema across all detectors:
 * - Deterministic Rules
 * - Live OSINT Probes (DNS, RDAP, Redirects)
 * - Threat Intelligence Feeds
 * - Independent Specialist Swarm Observations
 */

export const EvidenceStatus = {
  MALICIOUS: 'MALICIOUS',
  SUSPICIOUS: 'SUSPICIOUS',
  CLEAN: 'CLEAN',
  UNKNOWN: 'UNKNOWN',
  LOOKUP_FAILED: 'LOOKUP_FAILED'
};

export const EvidenceSource = {
  OSINT_DNS: 'OSINT_DNS_RESOLVER',
  OSINT_RDAP: 'ICANN_RDAP_REGISTRY',
  OSINT_REDIRECT: 'HTTP_REDIRECT_TRACER',
  NPCI_REGISTRY: 'NPCI_UPI_HANDLE_REGISTRY',
  BRAND_INTEL: 'BRAND_TYPOSQUATTING_ANALYZER',
  BEHAVIORAL_RULES: 'DETERMINISTIC_URGENCY_ENGINE',
  AGENT_LINK: 'SPECIALIST_LINK_INVESTIGATOR',
  AGENT_PSYCH: 'SPECIALIST_PSYCH_INVESTIGATOR',
  AGENT_FINANCE: 'SPECIALIST_FINANCE_INVESTIGATOR'
};

/**
 * Creates a validated Evidence Item.
 */
export function createEvidenceItem({
  checkId,
  status = EvidenceStatus.UNKNOWN,
  source,
  evidence = [],
  confidence = null,
  limitations = [],
  impact = 0, // Numerical risk contribution (-50 to +100)
  rawData = null
}) {
  return {
    checkId,
    status,
    source,
    observedAt: new Date().toISOString(),
    evidence: Array.isArray(evidence) ? evidence : [evidence],
    confidence: typeof confidence === 'number' ? Math.min(100, Math.max(0, confidence)) : null,
    limitations: Array.isArray(limitations) ? limitations : (limitations ? [limitations] : []),
    impact,
    rawData
  };
}

/**
 * Validate an evidence bundle against the contract.
 */
export function validateEvidenceBundle(items = []) {
  return items.map(item => {
    if (!item.checkId || !item.source) {
      throw new Error(`Invalid evidence item: checkId and source are required. Got: ${JSON.stringify(item)}`);
    }
    return {
      ...item,
      observedAt: item.observedAt || new Date().toISOString()
    };
  });
}
