/**
 * Scam Swarm Automated Detection Evaluation & Regression Harness
 * 
 * Benchmarks the multi-agent detection engine against a labeled ground-truth dataset.
 * Computes:
 * - Precision, Recall, F1-Score, Accuracy, False Positive Rate (FPR)
 * - Latency distribution (Min, Mean, Median p50, p95, Max)
 * - Per-category classification breakdown
 * - Generates comprehensive EVALUATION_REPORT.md
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { orchestrateAnalysis } from '../server/orchestrator.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATASET_PATH = path.join(__dirname, 'dataset.json');
const REPORT_PATH = path.join(__dirname, '..', 'EVALUATION_REPORT.md');

// Parse CLI flags
const args = process.argv.slice(2);
let limit = null;
let useServer = false;
let serverUrl = 'http://localhost:5001/api/analyze';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--limit' || args[i] === '-n') {
    limit = parseInt(args[i + 1], 10);
  } else if (args[i] === '--server') {
    useServer = true;
    if (args[i + 1] && !args[i + 1].startsWith('-')) {
      serverUrl = args[i + 1];
    }
  }
}

async function runEvaluation() {
  console.log('\n================================================================');
  console.log('  🛡️ SCAM SWARM DETECTION EVALUATION & BENCHMARK HARNESS');
  console.log('================================================================\n');

  if (!fs.existsSync(DATASET_PATH)) {
    console.error(`Error: Dataset not found at ${DATASET_PATH}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(DATASET_PATH, 'utf-8');
  let dataset = JSON.parse(rawData);

  if (limit && limit > 0 && limit < dataset.length) {
    console.log(`[Config] Testing subset of ${limit} samples (out of ${dataset.length})...`);
    dataset = dataset.slice(0, limit);
  } else {
    console.log(`[Config] Testing full dataset of ${dataset.length} labeled test cases...`);
  }

  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
  const aiClient = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

  console.log(`[Config] Gemini AI: ${aiClient ? 'Online (Authenticated API)' : 'Offline (Fallback Heuristics)'}`);
  console.log(`[Config] Execution Mode: ${useServer ? `HTTP Gateway (${serverUrl})` : 'Direct Engine Pipeline'}\n`);

  const results = [];
  let tp = 0; // True Positive: Predicted Scam, Ground Truth Scam
  let fp = 0; // False Positive: Predicted Scam, Ground Truth Legit
  let tn = 0; // True Negative: Predicted Legit, Ground Truth Legit
  let fn = 0; // False Negative: Predicted Legit, Ground Truth Scam

  const latencies = [];
  const categoryStats = {};

  const startTime = Date.now();

  for (let i = 0; i < dataset.length; i++) {
    const item = dataset[i];
    process.stdout.write(`[${i + 1}/${dataset.length}] Testing [${item.id}] ${item.category}... `);

    const testStart = Date.now();
    let verdict = 'SAFE';
    let riskScore = 0;
    let confidence = 0;
    let scamCategory = 'None';
    let error = null;

    try {
      let analysis;
      if (useServer) {
        const res = await fetch(serverUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: item.input })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
        analysis = await res.json();
      } else {
        analysis = await orchestrateAnalysis({
          text: item.input,
          aiClient,
          geminiApiKey
        });
      }

      verdict = analysis.verdict || 'SAFE';
      riskScore = analysis.overallRiskScore || 0;
      confidence = analysis.confidence || 0;
      scamCategory = analysis.scamCategory || 'None';
    } catch (err) {
      error = err.message;
      console.log(`⚠️ Execution error: ${err.message}`);
    }

    const duration = Date.now() - testStart;
    latencies.push(duration);

    // Classification decision:
    // Any verdict of CRITICAL THREAT or SUSPICIOUS or riskScore >= 50 is classified as SCAM
    const predictedScam = verdict === 'CRITICAL THREAT' || verdict === 'SUSPICIOUS' || riskScore >= 50;
    const isActualScam = item.groundTruth === 'SCAM';

    let outcome = '';
    if (isActualScam && predictedScam) {
      tp++;
      outcome = 'TP (True Positive)';
    } else if (!isActualScam && !predictedScam) {
      tn++;
      outcome = 'TN (True Negative)';
    } else if (!isActualScam && predictedScam) {
      fp++;
      outcome = 'FP (False Positive)';
    } else if (isActualScam && !predictedScam) {
      fn++;
      outcome = 'FN (False Negative)';
    }

    const symbol = (outcome.startsWith('T')) ? '✅' : '❌';
    console.log(`${symbol} ${outcome} [Score: ${riskScore}, Verdict: ${verdict}] (${duration}ms)`);

    results.push({
      ...item,
      predictedVerdict: verdict,
      predictedScore: riskScore,
      predictedCategory: scamCategory,
      outcome,
      durationMs: duration,
      error
    });

    if (!categoryStats[item.category]) {
      categoryStats[item.category] = { total: 0, correct: 0 };
    }
    categoryStats[item.category].total++;
    if (outcome.startsWith('T')) {
      categoryStats[item.category].correct++;
    }

    // Gentle throttling to respect API rate limits
    if (i < dataset.length - 1) {
      await new Promise(r => setTimeout(r, 600));
    }
  }

  const totalEvaluated = results.length;
  const precision = (tp + fp > 0) ? (tp / (tp + fp)) : 0;
  const recall = (tp + fn > 0) ? (tp / (tp + fn)) : 0;
  const f1Score = (precision + recall > 0) ? (2 * (precision * recall) / (precision + recall)) : 0;
  const accuracy = (totalEvaluated > 0) ? ((tp + tn) / totalEvaluated) : 0;
  const falsePositiveRate = (fp + tn > 0) ? (fp / (fp + tn)) : 0;

  // Latency percentiles
  latencies.sort((a, b) => a - b);
  const minLatency = latencies[0] || 0;
  const maxLatency = latencies[latencies.length - 1] || 0;
  const avgLatency = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length || 0);
  const p50Latency = latencies[Math.floor(latencies.length * 0.50)] || 0;
  const p95Latency = latencies[Math.floor(latencies.length * 0.95)] || 0;

  console.log('\n================================================================');
  console.log('  📊 BENCHMARK METRICS SUMMARY');
  console.log('================================================================');
  console.log(`  Total Evaluated:      ${totalEvaluated}`);
  console.log(`  True Positives (TP):  ${tp}`);
  console.log(`  True Negatives (TN):  ${tn}`);
  console.log(`  False Positives (FP): ${fp}`);
  console.log(`  False Negatives (FN): ${fn}`);
  console.log('  --------------------------------------------------------------');
  console.log(`  Accuracy:             ${(accuracy * 100).toFixed(2)}%`);
  console.log(`  Precision:            ${(precision * 100).toFixed(2)}%`);
  console.log(`  Recall:               ${(recall * 100).toFixed(2)}%`);
  console.log(`  F1-Score:             ${(f1Score * 100).toFixed(2)}%`);
  console.log(`  False Positive Rate:  ${(falsePositiveRate * 100).toFixed(2)}%`);
  console.log('  --------------------------------------------------------------');
  console.log(`  Avg Latency:          ${avgLatency} ms`);
  console.log(`  Median (p50):         ${p50Latency} ms`);
  console.log(`  95th Percentile:      ${p95Latency} ms`);
  console.log(`  Min / Max:            ${minLatency} ms / ${maxLatency} ms`);
  console.log('================================================================\n');

  // Generate EVALUATION_REPORT.md
  generateMarkdownReport({
    totalEvaluated,
    tp,
    tn,
    fp,
    fn,
    accuracy,
    precision,
    recall,
    f1Score,
    falsePositiveRate,
    avgLatency,
    p50Latency,
    p95Latency,
    minLatency,
    maxLatency,
    categoryStats,
    results,
    durationMs: Date.now() - startTime
  });

  console.log(`📄 Comprehensive report saved to: ${REPORT_PATH}\n`);
}

function generateMarkdownReport(data) {
  const dateStr = new Date().toISOString();

  let markdown = `# 🛡️ Scam Swarm — Detection Evaluation & Regression Benchmark

> **Execution Timestamp:** ${dateStr}  
> **Total Test Cases:** ${data.totalEvaluated} labeled samples  
> **Target Framework:** Multi-Agent Defense-in-Depth (Link, Psych, Finance, Judge)

---

## 1. Executive Performance Summary

| Metric | Measured Value | Target Benchmark | Status |
| :--- | :--- | :--- | :--- |
| **Accuracy** | **${(data.accuracy * 100).toFixed(2)}%** | ≥ 90.0% | ${data.accuracy >= 0.90 ? '✅ Passed' : '⚠️ Under Target'} |
| **Precision** | **${(data.precision * 100).toFixed(2)}%** | ≥ 90.0% | ${data.precision >= 0.90 ? '✅ Passed' : '⚠️ Under Target'} |
| **Recall (Sensitivity)** | **${(data.recall * 100).toFixed(2)}%** | ≥ 92.0% | ${data.recall >= 0.92 ? '✅ Passed' : '⚠️ Under Target'} |
| **F1-Score** | **${(data.f1Score * 100).toFixed(2)}%** | ≥ 90.0% | ${data.f1Score >= 0.90 ? '✅ Passed' : '⚠️ Under Target'} |
| **False Positive Rate (FPR)** | **${(data.falsePositiveRate * 100).toFixed(2)}%** | ≤ 5.0% | ${data.falsePositiveRate <= 0.05 ? '✅ Passed' : '⚠️ Flagged'} |

---

## 2. Confusion Matrix

\`\`\`
                     ACTUAL FRAUD (SCAM)       ACTUAL LEGITIMATE
PREDICTED FRAUD        TP = ${String(data.tp).padEnd(4)}                 FP = ${String(data.fp).padEnd(4)}
PREDICTED LEGIT        FN = ${String(data.fn).padEnd(4)}                 TN = ${String(data.tn).padEnd(4)}
\`\`\`

- **True Positives (TP = ${data.tp}):** Malicious attacks, UPI extortion, and phishing links accurately intercepted.
- **True Negatives (TN = ${data.tn}):** Legitimate 2FA OTPs, bank statements, airline itineraries, and clean business communications correctly allowed.
- **False Positives (FP = ${data.fp}):** Benign messages flagged unnecessarily.
- **False Negatives (FN = ${data.fn}):** High-risk attacks missed.

---

## 3. Telemetry & Latency Profile

| Percentile / Metric | Latency (Milliseconds) |
| :--- | :--- |
| **Minimum Latency** | ${data.minLatency} ms |
| **Average (Mean)** | ${data.avgLatency} ms |
| **Median (p50)** | ${data.p50Latency} ms |
| **95th Percentile (p95)** | ${data.p95Latency} ms |
| **Maximum Latency** | ${data.maxLatency} ms |

---

## 4. Performance by Category

| Category | Tested Samples | Passed | Accuracy |
| :--- | :---: | :---: | :---: |
`;

  for (const [cat, stats] of Object.entries(data.categoryStats)) {
    const pct = ((stats.correct / stats.total) * 100).toFixed(1);
    markdown += `| ${cat} | ${stats.total} | ${stats.correct} | ${pct}% |\n`;
  }

  markdown += `\n---

## 5. Granular Sample Audit Trail

| ID | Category | Ground Truth | Verdict | Score | Outcome | Latency |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
`;

  for (const r of data.results) {
    const mark = r.outcome.startsWith('T') ? '✅' : '❌';
    markdown += `| \`${r.id}\` | ${r.category} | ${r.groundTruth} | **${r.predictedVerdict}** | ${r.predictedScore}/100 | ${mark} ${r.outcome.split(' ')[0]} | ${r.durationMs}ms |\n`;
  }

  markdown += `\n---
*Automated report generated by Scam Swarm Evaluation Suite.*
`;

  fs.writeFileSync(REPORT_PATH, markdown, 'utf-8');
}

runEvaluation().catch(err => {
  console.error("Evaluation Harness Fatal Error:", err);
  process.exit(1);
});
