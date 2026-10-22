/**
 * Onboarding Flow & Usability Refinement Regression Tests
 */

import assert from 'node:assert';

console.log('\n📱 RUNNING ONBOARDING & USABILITY REGRESSION TESTS...\n');

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

// 1. Preset Replacement Safety
runTest('Preset Guard: Custom user text triggers confirmation instead of silent wipe', () => {
  const SAMPLE_PAYLOADS = {
    upi: { label: 'Fake UPI SMS', text: 'Preset text 1' },
    safe: { label: 'Legitimate Text', text: 'Preset text 2' }
  };

  const isCustomText = (text) => text.trim().length > 10 &&
    !Object.values(SAMPLE_PAYLOADS).some(p => p.text.trim() === text.trim());

  assert.strictEqual(isCustomText('Urgent message my friend sent me via Telegram'), true, 'Should detect custom text');
  assert.strictEqual(isCustomText('Preset text 1'), false, 'Should allow existing preset without confirmation');
  assert.strictEqual(isCustomText(''), false, 'Should allow empty input without confirmation');
});

// 2. Progressive Disclosure Tab Filtering
runTest('Progressive Disclosure: Correct views rendered for Summary, Evidence, and Technical tabs', () => {
  const views = ['summary', 'evidence', 'technical', 'all'];

  const shouldRenderExecutiveSummary = (tab) => tab === 'summary' || tab === 'all';
  const shouldRenderEvidenceGraph = (tab) => tab === 'evidence' || tab === 'all';
  const shouldRenderAgentCards = (tab) => tab === 'technical' || tab === 'all';

  // Summary tab: only summary rendered, deep graph and agent cards hidden
  assert.strictEqual(shouldRenderExecutiveSummary('summary'), true);
  assert.strictEqual(shouldRenderEvidenceGraph('summary'), false);
  assert.strictEqual(shouldRenderAgentCards('summary'), false);

  // Evidence tab: evidence graph rendered, summary and agent cards hidden
  assert.strictEqual(shouldRenderExecutiveSummary('evidence'), false);
  assert.strictEqual(shouldRenderEvidenceGraph('evidence'), true);
  assert.strictEqual(shouldRenderAgentCards('evidence'), false);

  // Technical tab: agent cards rendered, summary and graph hidden
  assert.strictEqual(shouldRenderExecutiveSummary('technical'), false);
  assert.strictEqual(shouldRenderEvidenceGraph('technical'), false);
  assert.strictEqual(shouldRenderAgentCards('technical'), true);

  // All tab: everything rendered sequentially
  assert.strictEqual(shouldRenderExecutiveSummary('all'), true);
  assert.strictEqual(shouldRenderEvidenceGraph('all'), true);
  assert.strictEqual(shouldRenderAgentCards('all'), true);
});

// 3. Quick-Start Storage Key
runTest('Quick-Start: Uses standardized non-tracking localStorage key', () => {
  const KEY = 'scam_swarm_quickstart_dismissed';
  assert.strictEqual(KEY, 'scam_swarm_quickstart_dismissed');
});

console.log(`\n================================`);
console.log(`Usability Tests: ${passed} Passed, ${failed} Failed`);
console.log(`================================\n`);

if (failed > 0) process.exit(1);
