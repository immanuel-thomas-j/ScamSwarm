import React, { useState } from 'react';
import { 
  ShieldIcon, TargetIcon, AlertIcon, CheckIcon, 
  LinkIcon, BrainIcon, MoneyIcon, SearchIcon, ScaleIcon
} from './Icons';

export default function EvidenceGraph({ evidenceGraph, scoringTrace, contradictions = [], limitations = [], audit = {} }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [filterType, setFilterType] = useState('ALL');

  if (!evidenceGraph || !evidenceGraph.nodes) {
    return null;
  }

  const { nodes, edges } = evidenceGraph;

  // Filter nodes
  const filteredNodes = nodes.filter(n => {
    if (filterType === 'ALL') return true;
    if (filterType === 'MALICIOUS') return n.status === 'MALICIOUS';
    if (filterType === 'CLEAN') return n.status === 'CLEAN';
    if (filterType === 'UNKNOWN') return n.status === 'UNKNOWN' || n.status === 'LOOKUP_FAILED';
    return true;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'MALICIOUS':
      case 'CRITICAL THREAT':
        return 'var(--red, #ef4444)';
      case 'SUSPICIOUS':
        return 'var(--amber, #f59e0b)';
      case 'CLEAN':
      case 'SAFE':
        return 'var(--green, #22c55e)';
      case 'LOOKUP_FAILED':
        return '#f97316';
      case 'UNKNOWN':
      default:
        return 'var(--text-muted, #94a3b8)';
    }
  };

  const getSourceIcon = (type, checkId) => {
    if (checkId?.includes('typosquat') || checkId?.includes('redirect') || checkId?.includes('domain')) {
      return <LinkIcon size={14} color="var(--cyan)" />;
    }
    if (checkId?.includes('upi') || checkId?.includes('finance')) {
      return <MoneyIcon size={14} color="var(--amber)" />;
    }
    if (checkId?.includes('urgency') || checkId?.includes('psych')) {
      return <BrainIcon size={14} color="var(--violet)" />;
    }
    return <TargetIcon size={14} color="var(--cyan)" />;
  };

  return (
    <div className="evidence-graph-container animate-fade-in">
      <div className="evidence-graph-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ScaleIcon size={18} color="var(--cyan)" />
          <h3 style={{ margin: 0, fontSize: '14px', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Auditable Evidence Graph &amp; Verification Chain
          </h3>
        </div>
        
        {audit?.totalFactsAudited > 0 && (
          <span className="audit-badge">
            <CheckIcon size={12} color="var(--green)" />
            {audit.totalFactsAudited} Traceable Findings · 0 Unverified Claims
          </span>
        )}
      </div>

      <p className="evidence-graph-subtitle">
        Every verdict point is mathematically determined by verified detection facts. The LLM explains this evidence but cannot override deterministic findings or invent threat records.
      </p>

      {/* Contradictions & Disagreements Banner */}
      {contradictions.length > 0 && (
        <div className="contradictions-banner">
          <div className="contradiction-header">
            <AlertIcon size={15} color="var(--amber)" />
            <strong>Specialist Disagreement Detected &amp; Reconciled</strong>
          </div>
          {contradictions.map((c, idx) => (
            <div key={idx} className="contradiction-item">
              <div className="contradiction-agents">
                Divergence between: <code>{c.agents.join(' ↔ ')}</code>
              </div>
              <div className="contradiction-desc">{c.disagreement}</div>
              <div className="contradiction-resolution">
                <strong>Policy Resolution:</strong> {c.resolution}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filter Chips */}
      <div className="evidence-filters">
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Filter Evidence:</span>
        {['ALL', 'MALICIOUS', 'CLEAN', 'UNKNOWN'].map((f) => (
          <button
            key={f}
            className={`filter-chip ${filterType === f ? 'active' : ''}`}
            onClick={() => setFilterType(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Evidence Nodes Matrix */}
      <div className="evidence-nodes-grid">
        {filteredNodes
          .filter(n => n.type === 'EVIDENCE_SOURCE')
          .map((node) => {
            const isSelected = selectedNode?.id === node.id;
            const statusColor = getStatusColor(node.status);

            return (
              <div
                key={node.id}
                className={`evidence-node-card ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedNode(node)}
                style={{ borderLeftColor: statusColor }}
              >
                <div className="evidence-card-top">
                  <span className="evidence-source-tag">
                    {getSourceIcon(node.type, node.checkId)}
                    {node.label}
                  </span>
                  <span
                    className="evidence-status-pill"
                    style={{ color: statusColor, borderColor: statusColor }}
                  >
                    {node.status}
                  </span>
                </div>

                <div className="evidence-card-text">
                  {node.evidence?.[0] || 'Evidence recorded'}
                </div>

                <div className="evidence-card-footer">
                  <span className="evidence-time">
                    {node.observedAt ? new Date(node.observedAt).toLocaleTimeString() : 'Observed'}
                  </span>
                  {node.impact !== 0 && (
                    <span
                      className="evidence-impact-tag"
                      style={{ color: node.impact > 0 ? 'var(--red)' : 'var(--green)' }}
                    >
                      {node.impact > 0 ? `+${node.impact} Risk` : `${node.impact} Risk`}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      {/* Deep-Dive Inspection Drawer */}
      {selectedNode && (
        <div className="node-detail-panel animate-slide-up">
          <div className="detail-panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {getSourceIcon(selectedNode.type, selectedNode.checkId)}
              <strong>{selectedNode.label}</strong>
              <span className="evidence-status-pill" style={{ color: getStatusColor(selectedNode.status) }}>
                {selectedNode.status}
              </span>
            </div>
            <button className="close-detail-btn" onClick={() => setSelectedNode(null)}>✕</button>
          </div>

          <div className="detail-panel-body">
            <div className="detail-row">
              <span className="detail-label">Check ID:</span>
              <code>{selectedNode.checkId}</code>
            </div>
            <div className="detail-row">
              <span className="detail-label">Observed Timestamp:</span>
              <span>{selectedNode.observedAt}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Verified Evidence:</span>
              <ul style={{ margin: '4px 0', paddingLeft: '18px' }}>
                {selectedNode.evidence?.map((ev, i) => (
                  <li key={i}>{ev}</li>
                ))}
              </ul>
            </div>

            {selectedNode.limitations?.length > 0 && (
              <div className="detail-row limitation">
                <span className="detail-label" style={{ color: 'var(--amber)' }}>Audit Limitations:</span>
                <span style={{ color: 'var(--amber)' }}>{selectedNode.limitations.join(', ')}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Limitations & Missing Telemetry Notice */}
      {limitations.length > 0 && (
        <div className="limitations-section">
          <div className="limitations-header">
            <AlertIcon size={13} color="var(--text-muted)" />
            <span>Honest Failure Handling &amp; Data Limitations (UNKNOWN != CLEAN):</span>
          </div>
          <ul className="limitations-list">
            {limitations.map((lim, i) => (
              <li key={i}>
                <strong>{lim.checkId}:</strong> {lim.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
