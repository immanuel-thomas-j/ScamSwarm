/**
 * Scam Swarm Red-Team Engineering Audit Regression Test Suite
 * 
 * Verifies all security, deterministic policy, SSRF, and verifier invariants.
 */

import assert from 'node:assert';
import { isPrivateIP, isBlockedHost, traceRedirects } from '../server/osint.js';
import { evaluateForensicPolicy } from '../server/policyEngine.js';
import { EvidenceStatus, createEvidenceItem } from '../server/evidenceContract.js';
import { runEvidenceVerifier } from '../server/agents/verifierAgent.js';

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     ${err.message}`);
    failed++;
  }
}

async function runAsyncTest(name, fn) {
  try {
    await fn();
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     ${err.message}`);
    failed++;
  }
}

console.log('\n🔒 RUNNING RED-TEAM AUDIT REGRESSION TESTS...\n');

// ── 1. SSRF & Network Security Invariants ──
console.log('[Suite 1: SSRF & Hostname Filtering]');

runTest('SSRF: Loopback IPv4 (127.0.0.1) is blocked', () => {
  assert.strictEqual(isPrivateIP('127.0.0.1'), true);
  assert.strictEqual(isBlockedHost('127.0.0.1'), true);
});

runTest('SSRF: Loopback IPv6 (::1 and [::1]) is blocked', () => {
  assert.strictEqual(isPrivateIP('::1'), true);
  assert.strictEqual(isBlockedHost('[::1]'), true);
});

runTest('SSRF: Cloud metadata (169.254.169.254) is blocked', () => {
  assert.strictEqual(isPrivateIP('169.254.169.254'), true);
  assert.strictEqual(isBlockedHost('169.254.169.254'), true);
});

runTest('SSRF: Cloud metadata hostnames (metadata.google.internal, instance-data) are blocked', () => {
  assert.strictEqual(isBlockedHost('metadata.google.internal'), true);
  assert.strictEqual(isBlockedHost('instance-data'), true);
  assert.strictEqual(isBlockedHost('server.internal'), true);
  assert.strictEqual(isBlockedHost('service.local'), true);
});

runTest('SSRF: Public domain (google.com) is NOT blocked', () => {
  assert.strictEqual(isBlockedHost('google.com'), false);
  assert.strictEqual(isBlockedHost('sbi.co.in'), false);
});

await runAsyncTest('SSRF: traceRedirects immediately halts on blocked hosts without network request', async () => {
  const result = await traceRedirects('http://127.0.0.1:8080/admin');
  assert.ok(result.chain.length > 0);
  assert.match(result.chain[0].error, /SSRF blocked/);
});

// ── 2. Evidence & Policy Invariants ──
console.log('\n[Suite 2: Evidence & Policy Engine Correctness]');

runTest('Policy: UNKNOWN and LOOKUP_FAILED do not decrease risk score or imply CLEAN', () => {
  const baseline = evaluateForensicPolicy([]);
  const bundleWithUnknowns = [
    createEvidenceItem({
      checkId: 'google_safe_browsing',
      source: 'Google Safe Browsing',
      status: EvidenceStatus.UNKNOWN,
      impact: 0,
      evidence: ['No entry in threat database']
    }),
    createEvidenceItem({
      checkId: 'rdap_age',
      source: 'ICANN RDAP',
      status: EvidenceStatus.LOOKUP_FAILED,
      impact: 0,
      evidence: ['Timeout connecting to registry']
    })
  ];

  const result = evaluateForensicPolicy(bundleWithUnknowns);
  assert.strictEqual(result.deterministicScore, baseline.deterministicScore, 'Score should remain at baseline prior');
  assert.strictEqual(result.limitations.length, 2, 'Must record limitations for unknown/failed telemetry');
  assert.notStrictEqual(result.deterministicVerdict, 'CLEAN', 'Never emit CLEAN from unknowns');
});

runTest('Policy: Duplicate identical evidence items do not inflate risk score', () => {
  const singleItem = [
    createEvidenceItem({
      checkId: 'domain_typosquatting',
      source: 'Typosquatting Engine',
      status: EvidenceStatus.MALICIOUS,
      impact: 50,
      evidence: ['Brand impersonation of hdfcbank']
    })
  ];

  const duplicateItems = [
    ...singleItem,
    createEvidenceItem({
      checkId: 'domain_typosquatting',
      source: 'Typosquatting Engine',
      status: EvidenceStatus.MALICIOUS,
      impact: 50,
      evidence: ['Brand impersonation of hdfcbank']
    })
  ];

  const singleResult = evaluateForensicPolicy(singleItem);
  const duplicateResult = evaluateForensicPolicy(duplicateItems);
  assert.strictEqual(duplicateResult.deterministicScore, singleResult.deterministicScore, 'Duplicate item inflated score');
});

runTest('Policy: Category caps prevent unbounded risk score inflation', () => {
  // Pass 5 distinct typosquats
  const multipleSquats = [1, 2, 3, 4, 5].map(i => createEvidenceItem({
    checkId: 'domain_typosquatting',
    source: `Typosquatting Engine ${i}`,
    status: EvidenceStatus.MALICIOUS,
    impact: 50,
    evidence: [`Impersonation variant ${i}`]
  }));

  const res = evaluateForensicPolicy(multipleSquats);
  // Cap for domain_typosquatting is 50. Baseline is 10. Total should be capped at 60.
  assert.strictEqual(res.deterministicScore, 60, `Expected 60 with category cap, received ${res.deterministicScore}`);
});

runTest('Policy: Malicious indicators override safe OTP discounts (Malicious Override Rule)', () => {
  const phishingWithOtp = [
    createEvidenceItem({
      checkId: 'domain_typosquatting',
      source: 'Typosquatting Engine',
      status: EvidenceStatus.MALICIOUS,
      impact: 50,
      evidence: ['Phishing link detected']
    }),
    createEvidenceItem({
      checkId: 'safe_transaction_otp',
      source: 'SMS Pattern Auditor',
      status: EvidenceStatus.CLEAN,
      impact: -45,
      evidence: ['Never share OTP with anyone']
    })
  ];

  const res = evaluateForensicPolicy(phishingWithOtp);
  // Should NOT deduct 45 points because malicious link is present
  assert.strictEqual(res.deterministicScore >= 60, true, 'OTP discount illegally bypassed phishing indicator');
  assert.strictEqual(res.deterministicVerdict, 'SUSPICIOUS' || 'CRITICAL THREAT');
});

runTest('Policy: Scores strictly remain bounded in [0, 100]', () => {
  // Extreme clean items
  const cleanItems = [1, 2, 3, 4].map(i => createEvidenceItem({
    checkId: 'safe_transaction_otp',
    source: 'Telemetry',
    status: EvidenceStatus.CLEAN,
    impact: -45,
    evidence: ['Benign text']
  }));
  const lowBound = evaluateForensicPolicy(cleanItems);
  assert.ok(lowBound.deterministicScore >= 0, 'Score dropped below 0');

  // Extreme malicious items
  const extremeItems = [
    'domain_typosquatting', 'domain_registration_age', 'redirect_chain', 'upi_vpa_auditor', 'behavioral_urgency'
  ].map(checkId => createEvidenceItem({
    checkId,
    source: 'Auditor',
    status: EvidenceStatus.MALICIOUS,
    impact: 50,
    evidence: ['Severe alert']
  }));
  const highBound = evaluateForensicPolicy(extremeItems);
  assert.ok(highBound.deterministicScore <= 100, 'Score exceeded 100');
});

// ── 3. Verifier Claim Checking & Contradictions ──
console.log('\n[Suite 3: Verifier Claim Checking & Contradictions]');

runTest('Verifier: Accurately flags unsupported claims not backed by evidence', () => {
  const evidenceBundle = [
    createEvidenceItem({
      checkId: 'domain_typosquatting',
      source: 'OSINT',
      status: EvidenceStatus.MALICIOUS,
      evidence: ['Lookalike link']
    })
  ];
  const policyResult = evaluateForensicPolicy(evidenceBundle);
  
  // Summary makes unverified claims about UPI and Digital Arrest urgency
  const executiveSummary = 'Target attempted a UPI VPA payment extortion with digital arrest threats.';
  const audit = runEvidenceVerifier({
    text: 'Suspicious text',
    evidenceBundle,
    policyResult,
    agentReports: {},
    executiveSummary
  });

  assert.strictEqual(audit.isExplanationVerified, false, 'Should be flagged as unverified');
  assert.ok(audit.unsupportedClaims.length > 0, 'Should identify unsupported claim topics');
  const topics = audit.unsupportedClaims.map(c => c.topic);
  assert.ok(topics.includes('upi_vpa_auditor') || topics.includes('behavioral_urgency'));
});

runTest('Verifier: Dynamically identifies agent disagreement across outputs', () => {
  const policyResult = evaluateForensicPolicy([]);
  const agentReports = {
    link: { name: 'Link Agent', status: 'MALICIOUS', finding: 'Disposable typosquatted phishing domain detected.' },
    psych: { name: 'Psych Agent', status: 'SAFE', finding: 'No artificial urgency or emotional manipulation observed.' },
    finance: { name: 'Finance Agent', status: 'SAFE', finding: 'No financial transaction requests detected.' }
  };

  const audit = runEvidenceVerifier({
    text: 'Visit https://hfdc-verify.com',
    evidenceBundle: [],
    policyResult,
    agentReports,
    executiveSummary: 'Neutral analysis.'
  });

  assert.ok(audit.contradictions.length > 0, 'Should detect divergence between Link (MALICIOUS) and Psych/Finance (SAFE)');
  assert.strictEqual(audit.contradictions[0].agents.includes('Link & Infrastructure'), true);
});

// ── Summary ──
console.log(`\n================================`);
console.log(`Audit Regression Results: ${passed} Passed, ${failed} Failed`);
console.log(`================================\n`);

if (failed > 0) {
  process.exit(1);
}
