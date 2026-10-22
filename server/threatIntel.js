/**
 * Centralized Threat Intelligence & Cache Module
 * 
 * Provides verifiable reputation checks, official NPCI UPI handle whitelist,
 * brand typosquatting calculation, malicious TLD weights, and TTL caching.
 */

// 1. Official NPCI Legitimate Bank PSP UPI Handles
export const LEGIT_UPI_HANDLES = new Set([
  'okhdfcbank', 'okaxis', 'okicici', 'oksbi', 'paytm', 'ybl', 'ibl', 'axl',
  'barodampay', 'postbank', 'aubank', 'idfcbank', 'federal', 'jupiteraxis',
  'indus', 'kotak', 'pnb', 'cnrb', 'unionbank', 'boi', 'citi', 'scb',
  'hsbc', 'rbl', 'yesbank', 'airtel', 'fbl', 'freecharge', 'sliceaxis',
  'superyes', 'kmbl', 'payzapp', 'timepay', 'pingpay', 'allbank'
]);

// 2. Legitimate Brand Target Whitelist & Domains
export const LEGIT_BRANDS = [
  { name: 'sbi', officialDomains: ['sbi.co.in', 'onlinesbi.sbi', 'sbi.bank.in'] },
  { name: 'hdfc', officialDomains: ['hdfcbank.com', 'hdfc.com'] },
  { name: 'icici', officialDomains: ['icicibank.com', 'icicidirect.com'] },
  { name: 'axis', officialDomains: ['axisbank.com'] },
  { name: 'kotak', officialDomains: ['kotak.com', 'kotakcherry.com'] },
  { name: 'pnb', officialDomains: ['pnbindia.in'] },
  { name: 'bob', officialDomains: ['bankofbaroda.in'] },
  { name: 'netflix', officialDomains: ['netflix.com'] },
  { name: 'amazon', officialDomains: ['amazon.in', 'amazon.com', 'amazonpay.in'] },
  { name: 'google', officialDomains: ['google.com', 'google.co.in', 'pay.google.com'] },
  { name: 'paytm', officialDomains: ['paytm.com', 'paytmbank.com'] },
  { name: 'phonepe', officialDomains: ['phonepe.com'] },
  { name: 'apple', officialDomains: ['apple.com'] },
  { name: 'microsoft', officialDomains: ['microsoft.com', 'live.com', 'outlook.com'] },
  { name: 'india-post', officialDomains: ['indiapost.gov.in', 'ippbonline.com'] }
];

// 3. High-Risk TLDs frequently abused by phishing kits
export const HIGH_RISK_TLDS = new Map([
  ['.xyz', { weight: 20, reason: 'High incidence in automated disposable phishing campaigns' }],
  ['.top', { weight: 25, reason: 'Frequent bulletproof hosting vector' }],
  ['.click', { weight: 25, reason: 'Commonly paired with deceptive SMS clickbait' }],
  ['.cam', { weight: 20, reason: 'High abuse rating in threat feeds' }],
  ['.work', { weight: 15, reason: 'Abused in fake job offer and recruitment scams' }],
  ['.gq', { weight: 30, reason: 'Free domain abuse vector' }],
  ['.cf', { weight: 30, reason: 'Free domain abuse vector' }],
  ['.ml', { weight: 30, reason: 'Free domain abuse vector' }],
  ['.tk', { weight: 30, reason: 'Free domain abuse vector' }],
  ['.cc', { weight: 15, reason: 'Frequent typosquatting usage' }],
  ['.sbs', { weight: 25, reason: 'Abused in low-cost spam pipelines' }],
  ['.cfd', { weight: 25, reason: 'High spam/phishing registration concentration' }],
  ['.icu', { weight: 20, reason: 'Frequent malware C2 and phishing hub' }],
  ['.vip', { weight: 15, reason: 'Abused in fake lottery and VIP investment schemes' }]
]);

// 4. In-Memory Threat Cache with TTL (Time-To-Live)
class ThreatCache {
  constructor() {
    this.cache = new Map();
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  set(key, data, ttlMs = 1000 * 60 * 60) { // default 1 hour
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
      cachedAt: new Date().toISOString()
    });
  }

  clear() {
    this.cache.clear();
  }
}

export const threatCache = new ThreatCache();

// 5. Levenshtein Distance Calculator for Typosquatting Detection
export function levenshteinDistance(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

// 6. Forensic Brand Typosquatting Evaluator
export function evaluateBrandSpoofing(hostname) {
  const host = hostname.toLowerCase();
  const findings = [];

  for (const brand of LEGIT_BRANDS) {
    const isLegit = brand.officialDomains.some(legit => host === legit || host.endsWith('.' + legit));
    if (isLegit) continue;

    // Check direct substring inclusion
    if (host.includes(brand.name)) {
      findings.push({
        type: 'BRAND_TYPOSQUAT',
        severity: 'CRITICAL',
        targetBrand: brand.name,
        desc: `Hostname '${host}' explicitly embeds brand keyword '${brand.name}' but does NOT belong to official domains (${brand.officialDomains.join(', ')}).`,
        source: 'NPCI & Banking Brand Registry',
        weight: 35
      });
      continue;
    }

    // Check fuzzy typosquatting on domain labels
    const parts = host.split('.');
    for (const part of parts) {
      if (part.length >= 3 && Math.abs(part.length - brand.name.length) <= 2) {
        const dist = levenshteinDistance(part, brand.name);
        if (dist === 1) {
          findings.push({
            type: 'FUZZY_TYPOSQUAT',
            severity: 'HIGH',
            targetBrand: brand.name,
            desc: `Domain segment '${part}' is a 1-character typosquat mutation of trusted brand '${brand.name}'.`,
            source: 'Heuristic Typo Engine',
            weight: 30
          });
        }
      }
    }
  }

  return findings;
}

// 7. UPI VPA Forensic Validator
export function evaluateUPIHandle(vpa) {
  const parts = vpa.toLowerCase().split('@');
  if (parts.length !== 2) {
    return { valid: false, reason: 'Malformed UPI string' };
  }

  const [username, handle] = parts;
  const isLegitHandle = LEGIT_UPI_HANDLES.has(handle);

  const findings = [];
  let riskScore = 0;

  if (!isLegitHandle) {
    findings.push({
      type: 'UNKNOWN_UPI_HANDLE',
      severity: 'HIGH',
      desc: `Handle '@${handle}' is not recognized in the standard NPCI live PSP issuer registry.`,
      source: 'NPCI PSP Registry',
      weight: 25
    });
    riskScore += 25;
  }

  // Deceptive username keywords (impersonating bank or prizes)
  const deceptiveKeywords = ['bonus', 'prize', 'claim', 'kyc', 'support', 'verify', 'refund', 'reward', 'sbi', 'hdfc'];
  const matchedDeceptive = deceptiveKeywords.filter(k => username.includes(k));
  if (matchedDeceptive.length > 0) {
    findings.push({
      type: 'DECEPTIVE_VPA_USERNAME',
      severity: 'CRITICAL',
      desc: `UPI username '${username}' embeds deceptive terms (${matchedDeceptive.join(', ')}) commonly used in advance-fee payment traps.`,
      source: 'Fintech Pattern Auditor',
      weight: 35
    });
    riskScore += 35;
  }

  return {
    vpa,
    username,
    handle,
    isLegitPSP: isLegitHandle,
    riskScore: Math.min(100, riskScore),
    findings
  };
}
