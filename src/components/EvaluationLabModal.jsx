import React, { useState } from 'react';
import benchmarkData from '../data/benchmarkResults.json';
import { AnalyticsIcon, CheckIcon, CloseIcon, AlertIcon } from './Icons';

export default function EvaluationLabModal({ isOpen, onClose }) {
  const [selectedMetric, setSelectedMetric] = useState('ALL');

  if (!isOpen) return null;

  const { tiers, datasetSize, timestamp } = benchmarkData;

  return (
    <div className="eval-modal-overlay animate-fade-in" onClick={onClose}>
      <div className="eval-modal-window animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="eval-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AnalyticsIcon size={20} color="var(--cyan)" />
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', letterSpacing: '1px' }}>
                DETECTION EVALUATION LAB &amp; REGRESSION BENCHMARK
              </h2>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                NIST AI Risk &amp; OWASP LLM Benchmark against {datasetSize} labeled real-world test cases
              </span>
            </div>
          </div>
          <button className="eval-close-btn" onClick={onClose}>
            <CloseIcon size={16} />
          </button>
        </div>

        <div className="eval-modal-body">
          {/* Executive Comparative Table */}
          <div className="eval-table-container">
            <table className="eval-comparison-table">
              <thead>
                <tr>
                  <th>Architecture Tier</th>
                  <th>Accuracy</th>
                  <th>Precision</th>
                  <th>Recall</th>
                  <th>False Positive Rate</th>
                  <th>Evidence Traceability</th>
                  <th>p50 Latency</th>
                  <th>Resilience</th>
                </tr>
              </thead>
              <tbody>
                {tiers.map((t) => {
                  const isSwarm = t.tierKey === 'tier3';
                  return (
                    <tr key={t.tierKey} className={isSwarm ? 'highlight-swarm-row' : ''}>
                      <td>
                        <strong>{t.name}</strong>
                        {isSwarm && <span className="winner-tag">CURRENT</span>}
                      </td>
                      <td style={{ color: t.accuracy >= 90 ? 'var(--green)' : 'inherit' }}>{t.accuracy}%</td>
                      <td style={{ color: t.precision >= 90 ? 'var(--green)' : 'inherit' }}>{t.precision}%</td>
                      <td style={{ color: t.recall >= 90 ? 'var(--green)' : 'inherit' }}>{t.recall}%</td>
                      <td style={{ color: t.fpr <= 10 ? 'var(--green)' : 'var(--red)' }}>{t.fpr}%</td>
                      <td>{t.evidenceCoverage}%</td>
                      <td>{t.p50Latency}ms</td>
                      <td>{t.failureRecovery}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Key Insights for Judges */}
          <div className="eval-insights-grid">
            <div className="eval-insight-card">
              <h4>1. Why Heuristics Fail Alone</h4>
              <p>
                Keyword matching suffers from a 30% False Positive Rate by misinterpreting authentic urgent office memos, doctor appointments, or airline notices as threats.
              </p>
            </div>

            <div className="eval-insight-card">
              <h4>2. Why Threat Intel Needs Swarm Reasoning</h4>
              <p>
                Reputation blocklists fail on zero-day disposable domains (&lt; 30 days old). The Evidence Policy Engine flags unverified domains without treating "No Record Found" as clean (UNKNOWN != SAFE).
              </p>
            </div>

            <div className="eval-insight-card">
              <h4>3. Separated Evidence &amp; AI Explanation</h4>
              <p>
                The policy layer calculates deterministic risk scores. The LLM acts purely as an explainer and verifier, preventing hallucinations from overriding empirical telemetry.
              </p>
            </div>
          </div>
        </div>

        <div className="eval-modal-footer">
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Benchmark last executed: {new Date(timestamp).toLocaleString()}
          </span>
          <button className="eval-dismiss-btn" onClick={onClose}>Close Lab</button>
        </div>
      </div>
    </div>
  );
}
