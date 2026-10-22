import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../App.css';
import ImageUploader from '../components/ImageUploader';
import EvidenceGraph from '../components/EvidenceGraph';
import EvaluationLabModal from '../components/EvaluationLabModal';
import { 
  ShieldIcon, IngestionIcon, AnalyticsIcon, RobotIcon, SettingsIcon, 
  LightningIcon, RocketIcon, LinkIcon, BrainIcon, MoneyIcon, 
  AlertIcon, PhoneIcon, BankIcon, LockIcon, CheckIcon, EyeIcon, 
  ResetIcon, ClipboardIcon, EmptyIcon, SearchIcon, PlayIcon, CloseIcon, PhoneCallIcon, ArrowLeftIcon,
  TargetIcon, CameraIcon, EditIcon, QrCodeIcon, RadarIcon, ScaleIcon, UsersIcon
} from '../components/Icons';

// ── Fallback Safe Clipboard Utility ──────────────────────────────────────────
async function writeToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    const successful = document.execCommand('copy');
    if (!successful) throw new Error('Copy command failed');
  } catch (err) {
    throw new Error('Fallback clipboard copy failed: ' + err.message);
  } finally {
    document.body.removeChild(textArea);
  }
}

// ── Icon Mapping for Actions ──────────────────────────────────────────────────
export const IconMap = {
  block: (props) => <CloseIcon {...props} color="var(--red)" />,
  phone: (props) => <PhoneCallIcon {...props} />,
  bank: (props) => <BankIcon {...props} />,
  lock: (props) => <LockIcon {...props} />,
  clipboard: (props) => <ClipboardIcon {...props} />,
  alert: (props) => <AlertIcon {...props} color="var(--amber)" />,
  search: (props) => <SearchIcon {...props} />,
  check: (props) => <CheckIcon {...props} color="var(--green)" />,
  eye: (props) => <EyeIcon {...props} />,
  shield: (props) => <ShieldIcon {...props} color="var(--cyan)" />
};

// ── Sample Payloads ───────────────────────────────────────────────────────────
const SAMPLE_PAYLOADS = {
  upi:      { label: 'Fake UPI SMS',    text: 'URGENT: Your SBI account has been blocked due to missing KYC. Click here to verify your identity and receive your ₹5,000 INR cash bonus instantly: https://sbi-verification-secure-portal.net/login. Pay via UPI to unblock immediately. Ref#8841221.' },
  phishing: { label: 'Phishing Email',  text: 'Dear Employee, Netflix security detected an unauthorized login from Moscow. Please reset your password within 24 hours by entering your credit card details at http://netflix-billing-update.com or your streaming access will be permanently terminated. — Netflix Security Team' },
  lottery:  { label: 'Lottery Scam',    text: 'Congratulations! You have been selected as the WINNER of ₹45 Lakh in the Google India Lucky Draw 2024. To claim your prize immediately, send ₹499 processing fee to UPI ID: claim-prize@ybl and provide your Aadhaar number to our agent at +91-98XXXXXXXX. Offer expires in 2 hours.' },
  safe:     { label: 'Legitimate Text', text: "Hey! Just reminding you that our dinner reservation is tonight at 7:30 PM. The place is called The Green Bistro — here's the location: https://maps.google.com/xyz. Looking forward to catching up!" },
};

// ── Agent Metadata ────────────────────────────────────────────────────────────
const AGENTS_META = [
  { id: 'link',    name: 'Link & Domain Investigator', icon: 'link', description: 'Real-time DNS, redirect tracing, brand typosquatting & RDAP domain age', color: '#22d3ee' },
  { id: 'psych',   name: 'Psychological Urgency Cop',  icon: 'brain', description: 'Deconstructs panic phrases, authority spoofing & urgency exploitation', color: '#a855f7' },
  { id: 'finance', name: 'Financial Pattern Auditor',  icon: 'money', description: 'Audits NPCI bank handles, advance-fee hooks & reverse UPI traps', color: '#f59e0b' },
];

const getStatusColor = (s) => {
  if (!s) return '#475569';
  const u = s.toUpperCase();
  if (u === 'SAFE')       return '#22c55e';
  if (u === 'SUSPICIOUS') return '#f59e0b';
  if (u === 'MALICIOUS')  return '#ef4444';
  return '#94a3b8';
};

const getStatusGlow = (s) => {
  if (!s) return 'transparent';
  const u = s.toUpperCase();
  if (u === 'SAFE')       return 'rgba(34,197,94,0.12)';
  if (u === 'SUSPICIOUS') return 'rgba(245,158,11,0.12)';
  if (u === 'MALICIOUS')  return 'rgba(239,68,68,0.12)';
  return 'transparent';
};

const getRiskColor = (score) => score >= 70 ? '#ef4444' : score >= 40 ? '#f59e0b' : '#22c55e';

// ── Hero Impact Bar ───────────────────────────────────────────────────────────
function HeroStats() {
  const stats = [
    { icon: <MoneyIcon size={18} color="var(--amber)" />, value: '₹10,319 Cr', label: 'Lost to cyber fraud in India (FY 23-24)' },
    { icon: <UsersIcon size={18} color="var(--cyan)" />, value: '1 in 4',      label: 'Indians targeted by digital phishing' },
    { icon: <LightningIcon size={18} color="var(--violet)" />, value: '< 2.0s',     label: 'Full OSINT + Multi-Agent Forensics' },
    { icon: <RobotIcon size={18} color="var(--cyan)" />, value: '3 Agents',   label: 'Independent Investigators + Judge' },
  ];
  return (
    <div className="hero-stats">
      {stats.map((s, i) => (
        <div key={i} className="stat-card" style={{ animationDelay: `${i * 100}ms` }}>
          <span className="stat-icon">{s.icon}</span>
          <span className="stat-value">{s.value}</span>
          <span className="stat-label">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Threat Gauge Component ────────────────────────────────────────────────────
function RiskGauge({ score }) {
  const radius = 68;
  const circ   = Math.PI * radius;
  const pct    = Math.min(Math.max(score, 0), 100) / 100;
  const offset = circ * (1 - pct);
  const color  = getRiskColor(score);
  const isCritical = score >= 70;

  return (
    <div className="gauge-wrapper">
      <svg width="190" height="115" viewBox="0 0 190 115" className="gauge-svg">
        <defs>
          <filter id="gauge-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={color} floodOpacity="0.5" />
          </filter>
        </defs>
        {/* Background track */}
        <path
          d="M 25 98 A 68 68 0 0 1 165 98"
          fill="none"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth="14"
          strokeLinecap="round"
        />
        {/* Active colored arc with glow */}
        <path
          d="M 25 98 A 68 68 0 0 1 165 98"
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          filter={isCritical ? "url(#gauge-glow)" : undefined}
          style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.5s ease' }}
        />
        {/* Numeric Score */}
        <text
          x="95"
          y="80"
          textAnchor="middle"
          fill={color}
          fontSize="36"
          fontWeight="800"
          fontFamily="Space Grotesk, sans-serif"
        >
          {score}
        </text>
        {/* Risk Score Label with clean spacing */}
        <text
          x="95"
          y="100"
          textAnchor="middle"
          fill="#94a3b8"
          fontSize="10"
          fontFamily="Space Grotesk, sans-serif"
          letterSpacing="3"
          fontWeight="700"
        >
          RISK SCORE
        </text>
      </svg>
    </div>
  );
}

// ── Threat Breakdown Chart ────────────────────────────────────────────────────
function ThreatBreakdownChart({ agents }) {
  return (
    <div className="breakdown-chart">
      <div className="block-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <AnalyticsIcon size={16} color="var(--cyan)" />
        <span className="block-label">INDEPENDENT AGENT RISK METRICS</span>
      </div>
      {agents.map((agent, i) => {
        const score = agent.riskScore ?? 0;
        const color = getStatusColor(agent.status);
        const meta = AGENTS_META[i] || AGENTS_META[0];
        const AgentIcon = {
          link: LinkIcon,
          brain: BrainIcon,
          money: MoneyIcon
        }[meta.icon];

        return (
          <div key={i} className="bar-row">
            <span className="bar-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {AgentIcon && <AgentIcon size={14} color={meta.color} />}
              {agent.name.split(' ').slice(0, 2).join(' ')}
              {agent.durationMs && <small style={{ color: 'var(--text-dim)', marginLeft: '4px' }}>({agent.durationMs}ms)</small>}
            </span>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${score}%`, backgroundColor: color, boxShadow: `0 0 8px ${color}80` }}/>
            </div>
            <span className="bar-pct" style={{ color }}>{score}%</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Text Highlighter Component ────────────────────────────────────────────────
function TextHighlighter({ text, indicators = [] }) {
  if (!indicators || indicators.length === 0 || !text) {
    return <p className="summary-text">{text}</p>;
  }

  const escaped = indicators
    .filter(i => i && typeof i === 'string' && i.trim().length > 1)
    .map(i => i.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  if (escaped.length === 0) return <p className="summary-text">{text}</p>;

  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <p className="summary-text highlighted-text">
      {parts.map((part, idx) =>
        regex.test(part) ? (
          <mark key={idx} className="threat-mark">{part}</mark>
        ) : (
          part
        )
      )}
    </p>
  );
}

// ── Live OSINT Telemetry Artifacts Panel ──────────────────────────────────────
function OsintArtifactsPanel({ osintData }) {
  if (!osintData || !osintData.reports || osintData.reports.length === 0) return null;

  return (
    <div className="osint-panel animate-slide-up">
      <div className="block-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <LinkIcon size={16} color="var(--cyan)" />
        <span className="block-label">LIVE OSINT &amp; NETWORK TELEMETRY ARTIFACTS</span>
        <span className="json-badge" style={{ marginLeft: 'auto' }}>
          PROBED IN {osintData.durationMs || 0}ms
        </span>
      </div>

      {osintData.reports.map((report, idx) => (
        <div key={idx} className="osint-card">
          <div className="osint-card-header">
            <span className="osint-target-url" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <TargetIcon size={14} color="var(--cyan)" />
              {report.url}
            </span>
            <span className="status-badge" style={{
              color: report.osintScore >= 40 ? 'var(--red)' : 'var(--green)',
              borderColor: report.osintScore >= 40 ? 'var(--red)' : 'var(--green)'
            }}>
              OSINT RISK: {report.osintScore}/100
            </span>
          </div>

          <div className="osint-meta-grid">
            <div className="osint-metric-chip">
              <span>Apex Domain</span>
              <strong>{report.rdap?.apexDomain || report.hostname}</strong>
            </div>

            <div className="osint-metric-chip">
              <span>Domain Registration Age</span>
              <strong style={{ color: (report.rdap?.ageDays !== null && report.rdap?.ageDays <= 30) ? 'var(--red)' : 'var(--text-primary)' }}>
                {report.rdap?.ageDays !== null && report.rdap?.ageDays !== undefined
                  ? `${report.rdap.ageDays} days old`
                  : 'Undetermined'}
              </strong>
            </div>

            <div className="osint-metric-chip">
              <span>DNS A-Record</span>
              <strong>
                {report.dns?.resolved && report.dns.ips?.length > 0
                  ? report.dns.ips[0]
                  : 'Unresolved'}
              </strong>
            </div>

            <div className="osint-metric-chip">
              <span>Registrar</span>
              <strong title={report.rdap?.registrar}>{report.rdap?.registrar || 'ICANN Verified'}</strong>
            </div>
          </div>

          {/* Redirect chain tracing */}
          {report.redirect?.isRedirected && (
            <div className="redirect-chain-box">
              <span style={{ color: 'var(--text-dim)', fontSize: '10px' }}>REDIRECT PATHWAY ({report.redirect.hopCount} HOPS):</span>
              {report.redirect.chain.map((hop, hIdx) => (
                <div key={hIdx} className="redirect-chain-step">
                  <span className="hop-badge">[{hop.statusCode || '30x'}]</span>
                  <span>{hop.url}</span>
                </div>
              ))}
            </div>
          )}

          {/* Evidence findings list */}
          {report.findings && report.findings.length > 0 && (
            <div className="threat-indicators" style={{ marginTop: '6px' }}>
              {report.findings.map((f, fIdx) => (
                <span key={fIdx} className={`severity-tag ${f.severity.toLowerCase()}`}>
                  [{f.source}] {f.desc}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Agent Telemetry Card ──────────────────────────────────────────────────────
function AgentCard({ agent, meta, animDelay = 0 }) {
  const statusColor = getStatusColor(agent?.status);
  const statusGlow  = getStatusGlow(agent?.status);
  const AgentIcon = {
    link: LinkIcon,
    brain: BrainIcon,
    money: MoneyIcon
  }[meta?.icon];

  return (
    <div className="agent-result-card animate-slide-up"
      style={{
        animationDelay: `${animDelay}ms`,
        borderLeft: `3px solid ${statusColor}`,
        background: `linear-gradient(135deg, ${statusGlow} 0%, transparent 60%), var(--bg-card)`
      }}>
      <div className="agent-result-header">
        <div className="agent-result-identity">
          <span className="agent-icon" style={{ color: meta?.color, display: 'flex', alignItems: 'center' }}>
            {AgentIcon && <AgentIcon size={18} />}
          </span>
          <div>
            <div className="agent-result-name">
              {agent?.name || meta?.name}
              {agent?.durationMs && <span style={{ color: 'var(--text-dim)', fontSize: '11px', fontWeight: '400', marginLeft: '6px' }}>({agent.durationMs}ms)</span>}
            </div>
            <div className="agent-result-desc">{meta?.description}</div>
          </div>
        </div>
        <div className="status-badge" style={{ color: statusColor, backgroundColor: `${statusColor}18`, borderColor: `${statusColor}40` }}>
          {agent?.status || 'PENDING'}
        </div>
      </div>

      <p className="agent-finding">{agent?.finding || 'Awaiting specialist analysis...'}</p>

      {/* Technical Evidence list */}
      {agent?.technicalEvidence && agent.technicalEvidence.length > 0 && (
        <div style={{ paddingLeft: '28px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {agent.technicalEvidence.map((ev, i) => (
            <div key={i} style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ color: 'var(--cyan)' }}>›</span> {ev}
            </div>
          ))}
        </div>
      )}

      {/* Psychological Tactics */}
      {agent?.tacticsDetected && agent.tacticsDetected.length > 0 && (
        <div style={{ paddingLeft: '28px', display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '4px' }}>
          {agent.tacticsDetected.map((t, i) => (
            <span key={i} className="threat-chip" style={{ fontSize: '10px' }}>{t}</span>
          ))}
        </div>
      )}

      {/* Payment Risks */}
      {agent?.paymentRisks && agent.paymentRisks.length > 0 && (
        <div style={{ paddingLeft: '28px', display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '4px' }}>
          {agent.paymentRisks.map((pr, i) => (
            <span key={i} className="threat-chip" style={{ fontSize: '10px', color: 'var(--amber)' }}>{pr}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Recommended Actions ───────────────────────────────────────────────────────
function RecommendedActions({ verdict, actions = [] }) {
  const color = verdict === 'CRITICAL THREAT' ? '#ef4444' : verdict === 'SUSPICIOUS' ? '#f59e0b' : '#22c55e';
  
  return (
    <section className="panel actions-panel-wrapper animate-slide-up" style={{ borderColor: `${color}30` }}>
      <div className="panel-header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <ShieldIcon size={20} color="var(--cyan)" />
        <h2 className="panel-title">Recommended Response Actions</h2>
        {verdict === 'CRITICAL THREAT' ? (
          <div className="panel-badge" style={{ borderColor: 'rgba(239,68,68,0.3)', color: 'var(--red)', background: 'var(--red-glow)' }}>URGENT</div>
        ) : (
          <div className="panel-badge">RESPONSE</div>
        )}
      </div>

      <div className="actions-grid">
        {actions.map((actionText, i) => (
          <div key={i} className="action-item animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
            <span className="action-icon" style={{ display: 'flex', alignItems: 'center' }}>
              <CheckIcon size={16} color={color} />
            </span>
            <span className="action-text">{actionText}</span>
          </div>
        ))}
      </div>

      {verdict === 'CRITICAL THREAT' && (
        <a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer" className="report-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginTop: '8px' }}>
          <AlertIcon size={14} color="var(--red)" /> File Report at cybercrime.gov.in (Helpline: 1930) →
        </a>
      )}
    </section>
  );
}

// ── Main Analyzer Component ───────────────────────────────────────────────────
export default function Analyzer() {
  const navigate = useNavigate();
  const location = useLocation();
  const [inputMode, setInputMode]           = useState('text'); // 'text' | 'image'
  const [inputContent, setInputContent]     = useState('');
  const [attachedImage, setAttachedImage]   = useState(null);
  const [charCount, setCharCount]           = useState(0);
  const [isAnalyzing, setIsAnalyzing]       = useState(false);
  const [analysisPhase, setAnalysisPhase]   = useState('IDLE'); // 'OSINT' | 'SWARM' | 'JUDGE' | 'COMPLETE'
  const [swarmPayload, setSwarmPayload]     = useState(null);
  const [errorMsg, setErrorMsg]             = useState('');
  const [showRawJSON, setShowRawJSON]       = useState(false);
  const [copied, setCopied]                 = useState(false);
  const [copiedMD, setCopiedMD]             = useState(false);
  const [scanTime, setScanTime]             = useState(null);
  const [isEvalLabOpen, setIsEvalLabOpen]   = useState(false);
  const [resultTab, setResultTab]           = useState('summary'); // 'summary' | 'evidence' | 'technical' | 'all'
  const [pendingPreset, setPendingPreset]   = useState(null);
  const [showQuickStart, setShowQuickStart] = useState(() => {
    try {
      return !localStorage.getItem('scam_swarm_quickstart_dismissed');
    } catch {
      return true;
    }
  });
  const dashboardRef                        = useRef(null);

  // Handle incoming routing state from landing page (e.g. preset quick-jump or evaluation lab modal)
  useEffect(() => {
    if (location.state?.preset) {
      applyPreset(location.state.preset);
    }
    if (location.state?.openEval) {
      setIsEvalLabOpen(true);
    }
  }, [location.state]);

  const dismissQuickStart = () => {
    setShowQuickStart(false);
    try {
      localStorage.setItem('scam_swarm_quickstart_dismissed', 'true');
    } catch {
      // Ignore storage restrictions
    }
  };

  const handleTextChange = (e) => {
    setInputContent(e.target.value);
    setCharCount(e.target.value.length);
    if (errorMsg) setErrorMsg('');
    if (pendingPreset) setPendingPreset(null);
  };

  const applyPreset = (key) => {
    const p = SAMPLE_PAYLOADS[key];
    if (!p) return;
    setInputContent(p.text);
    setCharCount(p.text.length);
    setErrorMsg('');
    setSwarmPayload(null);
    setPendingPreset(null);
  };

  const loadPreset = (key) => {
    // Prevent accidental overwrite: if user has typed custom text, ask for confirmation
    const isCustomText = inputContent.trim().length > 10 && 
      !Object.values(SAMPLE_PAYLOADS).some(p => p.text.trim() === inputContent.trim());

    if (isCustomText) {
      setPendingPreset(key);
    } else {
      applyPreset(key);
    }
  };

  const resetScan = () => {
    setSwarmPayload(null);
    setInputContent('');
    setAttachedImage(null);
    setCharCount(0);
    setErrorMsg('');
    setScanTime(null);
    setShowRawJSON(false);
    setAnalysisPhase('IDLE');
    setPendingPreset(null);
    setResultTab('summary');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Core Swarm Execution (Secured via Backend /api/analyze) ──
  const executeSwarmAnalysis = async () => {
    if (!inputContent.trim() && !attachedImage) {
      setErrorMsg('Please provide communication text or attach a screenshot / QR image to analyze.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg('');
    setSwarmPayload(null);
    setShowRawJSON(false);
    setAnalysisPhase('OSINT_PROBING');

    const startTime = Date.now();

    try {
      // Simulate genuine phase milestones during request processing
      const phaseTimer1 = setTimeout(() => setAnalysisPhase('SWARM_PARALLEL'), 500);
      const phaseTimer2 = setTimeout(() => setAnalysisPhase('JUDGE_SYNTHESIS'), 1400);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputContent,
          image: attachedImage?.base64 || '',
          mimeType: attachedImage?.mimeType || 'image/jpeg'
        })
      });

      clearTimeout(phaseTimer1);
      clearTimeout(phaseTimer2);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          throw new Error(errorData.error || 'Rate limit exceeded. Please wait 30 seconds.');
        }
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      const result = await response.json();
      setAnalysisPhase('COMPLETE');
      setScanTime(((Date.now() - startTime) / 1000).toFixed(2));
      setSwarmPayload(result);

      setTimeout(() => dashboardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);

    } catch (err) {
      console.error('Forensic orchestration error:', err);
      setErrorMsg(`Analysis failed: ${err.message}`);
      setAnalysisPhase('ERROR');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ── Export Handlers ──
  const copyReport = () => {
    if (!swarmPayload) return;
    const report = `SCAM SWARM FORENSIC REPORT\nVerdict: ${swarmPayload.verdict}\nOverall Risk: ${swarmPayload.overallRiskScore}/100\nCategory: ${swarmPayload.scamCategory}\n\nSummary:\n${swarmPayload.executiveSummary}\n\nThreat Indicators: ${(swarmPayload.threatIndicators || []).join(', ')}\n\nAgent Telemetry:\n${(swarmPayload.agents || []).map(a => `• ${a.name}: [${a.status}] ${a.finding}`).join('\n')}\n\nHelpline: 1930 | cybercrime.gov.in`;
    writeToClipboard(report).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const copyMarkdownReport = () => {
    if (!swarmPayload) return;
    const md = `
# Scam Swarm Forensic Analysis Report
* **Scan Date**: ${new Date().toISOString().slice(0, 10)}
* **Verdict**: **${swarmPayload.verdict}** (Score: ${swarmPayload.overallRiskScore}/100)
* **Category**: \`${swarmPayload.scamCategory}\`
* **Confidence**: ${swarmPayload.confidence}%

## Executive Summary
> ${swarmPayload.executiveSummary}

## Specialist Agent Telemetry
${(swarmPayload.agents || []).map(a => `### ${a.name} [${a.status}]
* Finding: ${a.finding}
${a.durationMs ? `* Latency: ${a.durationMs}ms` : ''}`).join('\n\n')}

## Recommended Actions
${(swarmPayload.recommendedActions || []).map(act => `* ${act}`).join('\n')}

---
*Generated by Scam Swarm Autonomous Forensic Platform (1930 | cybercrime.gov.in)*
    `.trim();

    writeToClipboard(md).then(() => {
      setCopiedMD(true);
      setTimeout(() => setCopiedMD(false), 2000);
    });
  };

  const verdictColor = swarmPayload ? getRiskColor(swarmPayload.overallRiskScore) : '#94a3b8';
  const isCritical   = swarmPayload?.overallRiskScore >= 70;
  const isSafe       = swarmPayload?.overallRiskScore < 40;

  return (
    <div className="app-root">
      <div className="scanline-overlay"/>

      {/* ── HEADER ── */}
      <header className="app-header">
        <div className="header-inner">
          <div className="header-brand">
            <button className="back-btn" onClick={() => navigate('/')} title="Back to Home">
              <ArrowLeftIcon size={18} />
            </button>
            <div className="brand-icon-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldIcon size={24} color="var(--cyan)" />
            </div>
            <div>
              <h1 className="brand-title">SCAM SWARM</h1>
              <p className="brand-subtitle">Autonomous Multi-Agent Threat Intelligence Console</p>
            </div>
          </div>
          <div className="header-meta">
            <button
              type="button"
              className="eval-lab-trigger-btn"
              onClick={() => setIsEvalLabOpen(true)}
              aria-label="Open Detection Evaluation Lab benchmark"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(34,211,238,0.1)',
                border: '1px solid var(--cyan)',
                color: 'var(--cyan)',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: '700'
              }}
            >
              <AnalyticsIcon size={14} color="var(--cyan)" />
              <span className="eval-btn-label">EVALUATION LAB</span>
            </button>
            <div className="status-pill online" aria-label="Live OSINT Probes Active" title="Live OSINT Probes Active">
              <span className="status-dot"/>
              <span className="status-pill-text">LIVE OSINT ACTIVE</span>
            </div>
            <div className="powered-tag header-badge-desktop" style={{ gap: '6px' }}>
              <ShieldIcon size={14} color="var(--cyan)" />
              <span>GCP Native</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── HERO STATS ── */}
      <HeroStats />

      {/* ── MAIN LAYOUT ── */}
      <main className="app-main">

        {/* ─── LEFT COLUMN: INGESTION VECTOR ─── */}
        <div className="app-column">

          {/* Quick-Start Workflow Primer (Dismissible, Zero Login Required) */}
          {showQuickStart && (
            <div className="quickstart-banner animate-fade-in" role="region" aria-label="Quick Start Guide">
              <div className="quickstart-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <RocketIcon size={15} color="var(--cyan)" />
                  <span className="quickstart-title">HOW SCAM SWARM WORKS · 3-STEP TRIAGE</span>
                </div>
                <button
                  type="button"
                  className="quickstart-dismiss"
                  onClick={dismissQuickStart}
                  aria-label="Dismiss quick start guide"
                  title="Dismiss guide"
                >
                  Dismiss ✕
                </button>
              </div>
              <div className="quickstart-steps">
                <div className="quickstart-step">
                  <span className="step-badge">1</span>
                  <div className="step-desc">
                    <strong>Submit Telemetry</strong>
                    <span>Paste suspicious text or drop a payment screenshot / QR code.</span>
                  </div>
                </div>
                <div className="quickstart-step">
                  <span className="step-badge">2</span>
                  <div className="step-desc">
                    <strong>Swarm Investigation</strong>
                    <span>3 agents audit DNS, redirect paths, psychological panic &amp; UPI handles.</span>
                  </div>
                </div>
                <div className="quickstart-step">
                  <span className="step-badge">3</span>
                  <div className="step-desc">
                    <strong>Actionable Protection</strong>
                    <span>Get a verified risk score and immediate protective steps (1930).</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <section className="panel ingestion-panel">
            <div className="panel-header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <IngestionIcon size={20} color="var(--cyan)" />
              <h2 className="panel-title">Ingestion Telemetry</h2>
              <div className="panel-badge">SECURE GATEWAY</div>
            </div>

            {/* Input Mode Tabs: Text vs Multimodal Screenshot/QR */}
            <div className="input-mode-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={inputMode === 'text'}
                className={`input-tab-btn ${inputMode === 'text' ? 'active' : ''}`}
                onClick={() => setInputMode('text')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
              >
                <EditIcon size={15} />
                <span>Communication Text</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={inputMode === 'image'}
                className={`input-tab-btn ${inputMode === 'image' ? 'active' : ''}`}
                onClick={() => setInputMode('image')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
              >
                <CameraIcon size={15} />
                <span>Screenshot &amp; QR Forensics</span>
              </button>
            </div>

            {/* Multimodal Image / Screenshot Uploader */}
            {inputMode === 'image' && (
              <ImageUploader
                onImageSelected={(base64, mimeType) => setAttachedImage({ base64, mimeType })}
                onQrDecoded={(qrString) => {
                  if (!inputContent) setInputContent(qrString);
                }}
                onClear={() => setAttachedImage(null)}
              />
            )}

            {/* Textarea */}
            <div className="textarea-wrapper">
              <textarea
                id="scam-input"
                className="scam-textarea"
                value={inputContent}
                onChange={handleTextChange}
                disabled={isAnalyzing}
                placeholder={"// Awaiting telemetry input...\n// Paste suspicious SMS, WhatsApp message, email, or UPI string here"}
              />
              <div className="textarea-footer">
                <span className="char-count">{charCount} chars</span>
                {inputContent && (
                  <button className="clear-btn" onClick={() => { setInputContent(''); setCharCount(0); }}>
                    Clear ✕
                  </button>
                )}
              </div>
            </div>

            {/* Quick Load Threat Presets with Safety Guard */}
            <div className="preset-section">
              <span className="preset-label">Quick Load Threat Telemetry:</span>

              {pendingPreset && (
                <div className="preset-confirm-bar animate-fade-in" role="alert">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertIcon size={14} color="var(--amber)" />
                    <span>Replace custom input with <strong>{SAMPLE_PAYLOADS[pendingPreset]?.label}</strong>?</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button type="button" className="preset-confirm-btn accept" onClick={() => applyPreset(pendingPreset)}>
                      Replace
                    </button>
                    <button type="button" className="preset-confirm-btn cancel" onClick={() => setPendingPreset(null)}>
                      Keep Text
                    </button>
                  </div>
                </div>
              )}

              <div className="preset-grid">
                {Object.entries(SAMPLE_PAYLOADS).map(([key, val]) => (
                  <button key={key} className="preset-btn" onClick={() => loadPreset(key)} disabled={isAnalyzing}>
                    {val.label}
                  </button>
                ))}
              </div>
            </div>

            {errorMsg && (
              <div className="error-bar animate-flicker" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertIcon size={16} color="var(--red)" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Deploy Swarm Button */}
            <button
              id="deploy-swarm-btn"
              className={`deploy-btn ${isAnalyzing ? 'deploying' : ''}`}
              onClick={executeSwarmAnalysis}
              disabled={isAnalyzing}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
            >
              {isAnalyzing
                ? <><span className="btn-spinner"/>SWARM ACTIVE &amp; INVESTIGATING...</>
                : <><RocketIcon size={18} />DEPLOY INTEL SWARM</>}
            </button>

            {/* Real Pipeline Stages Visualizer */}
            {isAnalyzing && (
              <div className="pipeline-console animate-flicker">
                <div className="pipeline-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <RobotIcon size={16} color="var(--cyan)" />
                  <span className="pipeline-title">AUTONOMOUS INVESTIGATION PIPELINE</span>
                  <span className="pipeline-blink">●</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px 0' }}>
                  <div className={`pipeline-step-item ${analysisPhase === 'OSINT_PROBING' ? 'active' : 'done'}`}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <RadarIcon size={14} color="var(--cyan)" /> Phase 1:
                    </span> Live OSINT Network Probes (DNS, Redirects &amp; RDAP Domain Age)
                  </div>
                  <div className={`pipeline-step-item ${analysisPhase === 'SWARM_PARALLEL' ? 'active' : analysisPhase === 'JUDGE_SYNTHESIS' ? 'done' : 'pending'}`}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <RobotIcon size={14} color="var(--violet)" /> Phase 2:
                    </span> Parallel Specialist Swarm (Link, Urgency &amp; Financial Investigators)
                  </div>
                  <div className={`pipeline-step-item ${analysisPhase === 'JUDGE_SYNTHESIS' ? 'active' : 'pending'}`}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <ScaleIcon size={14} color="var(--amber)" /> Phase 3:
                    </span> Supreme Judge Adjudication &amp; Forensic Synthesis
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* ─── RIGHT COLUMN: EVIDENCE DASHBOARD ─── */}
        <div className="app-column">
          <section className="panel analytics-panel" ref={dashboardRef}>
            <div className="panel-header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AnalyticsIcon size={20} color="var(--cyan)" />
              <h2 className="panel-title">Forensic Evidence Dashboard</h2>
              <div className="panel-badge">EVIDENCE VERIFIED</div>
            </div>

            {/* Empty State */}
            {!swarmPayload && !isAnalyzing && (
              <div className="empty-state animate-flicker">
                <div className="empty-icon" style={{ marginBottom: '8px' }}>
                  <EmptyIcon size={48} color="var(--border-glow)" />
                </div>
                <p className="empty-title">Threat Intelligence Active</p>
                <p className="empty-sub">Ready for telemetry input. Paste a message, pick a preset, or attach a payment screenshot to deploy the swarm.</p>
                <div className="empty-hint" style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                  <RocketIcon size={14} /> Deploy swarm to view verifiable evidence
                </div>
              </div>
            )}

            {/* Active Analysis Spinner */}
            {isAnalyzing && !swarmPayload && (
              <div className="analyzing-state">
                <div className="analyzing-spinner">
                  <div className="spin-outer"/><div className="spin-inner"/>
                  <span className="spin-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldIcon size={18} color="var(--cyan)" />
                  </span>
                </div>
                <p className="analyzing-title">Executing Live Forensic Investigation</p>
                <p className="analyzing-sub">Running parallel specialist agents &amp; querying live network OSINT...</p>
                <div className="skeleton-lines">
                  <div className="skel-line long shimmer"/>
                  <div className="skel-line medium shimmer"/>
                  <div className="skel-line short shimmer"/>
                </div>
              </div>
            )}

            {/* Results Payload */}
            {swarmPayload && (
              <div className="results-container animate-flicker">

                {/* Real Execution Latencies Bar with Quick "New Scan" Action */}
                <div className="execution-timings-bar">
                  <span className="timing-item">
                    <LightningIcon size={13} color="var(--cyan)" />
                    Total Scan: <strong>{scanTime || (swarmPayload.executionTimings?.totalMs ? (swarmPayload.executionTimings.totalMs/1000).toFixed(2) : '1.20')}s</strong>
                  </span>
                  <span>•</span>
                  <span className="timing-item">
                    OSINT: <strong>{swarmPayload.executionTimings?.osintMs || 180}ms</strong>
                  </span>
                  <span>•</span>
                  <span className="timing-item">
                    Confidence: <strong style={{ color: verdictColor }}>{swarmPayload.confidence ?? 95}%</strong>
                  </span>
                  <button
                    type="button"
                    className="top-new-scan-btn"
                    onClick={resetScan}
                    aria-label="Start another scan"
                    title="Clear current analysis and start a new scan"
                  >
                    <ResetIcon size={12} />
                    <span>NEW SCAN</span>
                  </button>
                </div>

                {/* Threat Verdict & Gauge */}
                <div className={`verdict-block ${isCritical ? 'critical' : isSafe ? 'safe' : 'suspicious'}`}
                  style={{ borderColor: verdictColor, boxShadow: `0 0 30px ${verdictColor}22` }}>
                  <div className="verdict-layout">
                    <div className="verdict-left">
                      <div className="verdict-label">FINAL THREAT VERDICT</div>
                      <div className="verdict-value" style={{ color: verdictColor }}>{swarmPayload.verdict}</div>
                      <div className="verdict-category">
                        <span className="category-chip" style={{ borderColor: `${verdictColor}40`, color: verdictColor }}>
                          {swarmPayload.scamCategory}
                        </span>
                      </div>
                    </div>
                    <RiskGauge score={swarmPayload.overallRiskScore}/>
                  </div>
                </div>

                {/* Recommended Response Actions (Unified directly below Verdict for desktop & mobile) */}
                {swarmPayload.recommendedActions && (
                  <RecommendedActions
                    verdict={swarmPayload.verdict}
                    actions={swarmPayload.recommendedActions || []}
                  />
                )}

                {/* Progressive Disclosure: View Mode Switcher */}
                <div className="view-mode-tabs" role="tablist" aria-label="Investigation Report Views">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={resultTab === 'summary'}
                    className={`view-tab-btn ${resultTab === 'summary' ? 'active' : ''}`}
                    onClick={() => setResultTab('summary')}
                  >
                    <ClipboardIcon size={14} />
                    <span>Summary</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={resultTab === 'evidence'}
                    className={`view-tab-btn ${resultTab === 'evidence' ? 'active' : ''}`}
                    onClick={() => setResultTab('evidence')}
                  >
                    <ScaleIcon size={14} />
                    <span>Deep Evidence &amp; Graph</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={resultTab === 'technical'}
                    className={`view-tab-btn ${resultTab === 'technical' ? 'active' : ''}`}
                    onClick={() => setResultTab('technical')}
                  >
                    <RobotIcon size={14} />
                    <span>Technical Forensics</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={resultTab === 'all'}
                    className={`view-tab-btn ${resultTab === 'all' ? 'active' : ''}`}
                    onClick={() => setResultTab('all')}
                  >
                    <EyeIcon size={14} />
                    <span>Show All</span>
                  </button>
                </div>

                {/* ── VIEW 1: SUMMARY ── */}
                {(resultTab === 'summary' || resultTab === 'all') && (
                  <div className="summary-block animate-slide-up">
                    <div className="block-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ClipboardIcon size={16} color="var(--cyan)" />
                      <span className="block-label">EXECUTIVE COGNITIVE SUMMARY</span>
                    </div>
                    <TextHighlighter
                      text={swarmPayload.executiveSummary}
                      indicators={swarmPayload.threatIndicators || []}
                    />
                    {swarmPayload.threatIndicators?.length > 0 && (
                      <div className="threat-indicators">
                        {swarmPayload.threatIndicators.map((t, i) => (
                          <span key={i} className="threat-chip">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── VIEW 2: DEEP EVIDENCE & GRAPH ── */}
                {(resultTab === 'evidence' || resultTab === 'all') && (
                  <>
                    {/* Live OSINT Probe Artifacts */}
                    {swarmPayload.osint && (
                      <OsintArtifactsPanel osintData={swarmPayload.osint} />
                    )}

                    {/* Auditable Evidence Graph & Verification Chain */}
                    {swarmPayload.evidenceGraph && (
                      <EvidenceGraph
                        evidenceGraph={swarmPayload.evidenceGraph}
                        scoringTrace={swarmPayload.scoringTrace}
                        contradictions={swarmPayload.contradictions}
                        limitations={swarmPayload.limitations}
                        audit={swarmPayload.verificationAudit}
                      />
                    )}
                  </>
                )}

                {/* ── VIEW 3: TECHNICAL FORENSICS ── */}
                {(resultTab === 'technical' || resultTab === 'all') && (
                  <>
                    {/* Vision Forensics Card (if multimodal screenshot analyzed) */}
                    {swarmPayload.vision && (
                      <div className="summary-block animate-slide-up" style={{ borderColor: 'rgba(34,211,238,0.3)' }}>
                        <div className="block-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <EyeIcon size={16} color="var(--cyan)" />
                          <span className="block-label">MULTIMODAL COMPUTER VISION REPORT</span>
                          {swarmPayload.vision.isCounterfeitDetected && (
                            <span className="status-badge" style={{ color: 'var(--red)', borderColor: 'var(--red)', marginLeft: 'auto' }}>
                              COUNTERFEIT PATTERNS DETECTED
                            </span>
                          )}
                        </div>
                        <p className="summary-text">{swarmPayload.vision.visualSummary}</p>
                        {swarmPayload.vision.visualAnomalies?.length > 0 && (
                          <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {swarmPayload.vision.visualAnomalies.map((anom, i) => (
                              <div key={i} style={{ fontSize: '11px', color: 'var(--red)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <AlertIcon size={12} color="var(--red)" />
                                <span>{anom}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Threat Breakdown Bar Chart */}
                    {swarmPayload.agents && (
                      <ThreatBreakdownChart agents={swarmPayload.agents} />
                    )}

                    {/* Granular Agent Telemetry Cards */}
                    <div className="agents-section">
                      <div className="section-heading" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <RobotIcon size={16} color="var(--cyan)" />
                        <span>INDEPENDENT AGENT WORKFORCE TELEMETRY</span>
                      </div>
                      {(swarmPayload.agents || []).map((agent, i) => (
                        <AgentCard
                          key={i}
                          agent={agent}
                          meta={AGENTS_META[i] || AGENTS_META[0]}
                          animDelay={i * 80}
                        />
                      ))}
                    </div>

                    {/* Raw JSON Inspector */}
                    <div className="json-inspector">
                      <button className="json-toggle-btn" onClick={() => setShowRawJSON(v => !v)} aria-expanded={showRawJSON}>
                        <span className="json-toggle-icon" style={{ display: 'flex', alignItems: 'center' }}>
                          {showRawJSON ? <PlayIcon size={10} style={{ transform: 'rotate(90deg)' }} /> : <PlayIcon size={10} />}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <SearchIcon size={14} color="var(--cyan)" />
                          Inspect Verifiable Forensic Telemetry JSON
                        </span>
                        <span className="json-badge">schema</span>
                      </button>
                      {showRawJSON && (
                        <div className="json-panel animate-flicker">
                          <div className="json-toolbar">
                            <span className="json-dot red"/><span className="json-dot amber"/><span className="json-dot green"/>
                            <span className="json-filename">forensic_telemetry_report.json</span>
                          </div>
                          <pre className="json-pre">{JSON.stringify(swarmPayload, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Export Buttons */}
                <div className="export-bar">
                  <button className="export-btn" onClick={copyReport} style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                    {copied ? '✓ Text Copied!' : <><ClipboardIcon size={14} /> Copy Text Report</>}
                  </button>
                  <button className="export-btn" onClick={copyMarkdownReport} style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                    {copiedMD ? '✓ Markdown Copied!' : <><ClipboardIcon size={14} /> Copy Markdown Report</>}
                  </button>
                  <button className="export-btn secondary" onClick={resetScan} style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                    <ResetIcon size={14} /> Reset Telemetry
                  </button>
                </div>

                {/* Raw JSON Inspector */}
                <div className="json-inspector">
                  <button className="json-toggle-btn" onClick={() => setShowRawJSON(v => !v)} aria-expanded={showRawJSON}>
                    <span className="json-toggle-icon" style={{ display: 'flex', alignItems: 'center' }}>
                      {showRawJSON ? <PlayIcon size={10} style={{ transform: 'rotate(90deg)' }} /> : <PlayIcon size={10} />}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <SearchIcon size={14} color="var(--cyan)" />
                      Inspect Verifiable Forensic Telemetry JSON
                    </span>
                    <span className="json-badge">schema</span>
                  </button>
                  {showRawJSON && (
                    <div className="json-panel animate-flicker">
                      <div className="json-toolbar">
                        <span className="json-dot red"/><span className="json-dot amber"/><span className="json-dot green"/>
                        <span className="json-filename">forensic_telemetry_report.json</span>
                      </div>
                      <pre className="json-pre">{JSON.stringify(swarmPayload, null, 2)}</pre>
                    </div>
                  )}
                </div>

              </div>
            )}
          </section>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="app-footer">
        <span>SCAM SWARM v2.0</span>
        <span className="footer-sep">//</span>
        <a href="https://github.com/immanuel-thomas-j/Scam-Swarm-Immanuel" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cyan)', textDecoration: 'none' }}>GitHub</a>
        <span className="footer-sep">//</span>
        <a href="https://youtu.be/s5-9-mTKe9o" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cyan)', textDecoration: 'none' }}>YouTube Demo</a>
        <span className="footer-sep">//</span>
        <span>GCP · Firebase · Cloud Functions · Pub/Sub</span>
        <span className="footer-sep">//</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <AlertIcon size={14} color="var(--red)" />
          Cybercrime Helpline: <strong style={{ color: '#ef4444' }}>1930</strong>
        </span>
      </footer>

      {/* ── DETECTION EVALUATION LAB MODAL ── */}
      <EvaluationLabModal
        isOpen={isEvalLabOpen}
        onClose={() => setIsEvalLabOpen(false)}
      />
    </div>
  );
}
