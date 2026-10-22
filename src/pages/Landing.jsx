import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';
import { 
  ShieldIcon, MoneyIcon, GlobeIcon, PubSubIcon, DatabaseIcon, 
  RocketIcon, LinkIcon, BrainIcon, UserIcon, PhoneIcon,
  AlertIcon, CheckIcon, PlayIcon, SettingsIcon,
  AnalyticsIcon, ScaleIcon, RadarIcon, RobotIcon, ResetIcon, EyeIcon
} from '../components/Icons';

// ── Impact Stats ──────────────────────────────────────────────────────────────
const STATS = [
  { value: '₹10,319 Cr', label: 'Lost to cyber fraud in India', sub: 'FY 2023-24, MHA Data', icon: 'money', color: '#ef4444' },
  { value: '13.4 Lakh',  label: 'UPI fraud cases in one year', sub: '85% YoY growth', icon: 'phone', color: '#f59e0b' },
  { value: '3.4 Billion',label: 'Phishing emails sent daily', sub: 'Globally, 2024', icon: 'link', color: '#a855f7' },
  { value: '1930',       label: 'National Cybercrime Helpline', sub: 'Report fraud instantly', icon: 'shield', color: '#22d3ee' },
];

// ── 5-Layer Defense Stack ─────────────────────────────────────────────────────
const DEFENSE_LAYERS = [
  {
    layer: 'LAYER 01',
    name: 'Deterministic OSINT & SSRF Shield',
    icon: RadarIcon,
    color: '#22d3ee',
    tag: 'Live Infrastructure Forensics',
    desc: 'Sub-second DNS A/CNAME lookups, ICANN RDAP domain registration age, loop-protected redirect unshortening, and RFC 1918 private IP blocking.'
  },
  {
    layer: 'LAYER 02',
    name: 'Mathematical Policy Engine',
    icon: ScaleIcon,
    color: '#f59e0b',
    tag: 'Deterministic & Deduplicated',
    desc: 'Calculates baseline risk with strict category caps and signature deduplication. Enforces UNKNOWN != CLEAN — missing reputation data never implies safety.'
  },
  {
    layer: 'LAYER 03',
    name: 'Parallel Specialist Swarm',
    icon: RobotIcon,
    color: '#c084fc',
    tag: 'Pub/Sub Fan-Out Workers',
    desc: 'Three independent specialists (Link, Psychological Urgency, Financial Auditor) execute concurrently with bounded prompt-injection sanitization.'
  },
  {
    layer: 'LAYER 04',
    name: 'Cognitive Judge Adjudication',
    icon: BrainIcon,
    color: '#f43f5e',
    tag: 'Anti-Hallucination Guardrails',
    desc: 'Synthesizes telemetry, reconciles specialist divergences, and generates plain-English explanations. The judge cannot override the deterministic policy verdict.'
  },
  {
    layer: 'LAYER 05',
    name: 'Auditable Evidence Graph',
    icon: ShieldIcon,
    color: '#22c55e',
    tag: '100% Traceable Facts',
    desc: 'Audits executive assertions against verified evidence items, flags unsupported claims, and constructs an interactive, filterable node graph.'
  }
];

// ── Agents ────────────────────────────────────────────────────────────────────
const AGENTS = [
  { icon: 'link', name: 'Link & Domain Investigator', color: '#22d3ee', desc: 'Detects lookalike domains, suspicious redirects, and credential harvesting URLs hidden in messages.', tags: ['Domain Spoofing', 'URL Entropy', 'SSL Mismatch'] },
  { icon: 'brain', name: 'Psychological Urgency Cop',  color: '#a855f7', desc: 'Analyses panic-inducing language, false authority claims, and manufactured time pressure tactics.', tags: ['Urgency Language', 'Authority Spoof', 'Fear Tactics'] },
  { icon: 'money', name: 'Financial Pattern Auditor',  color: '#f59e0b', desc: 'Identifies irregular UPI payment prompts, lottery fund hooks, fake prize claims, and tax evasion lures.', tags: ['UPI Fraud', 'Lottery Scam', 'Advance Fee'] },
];

// ── Stat Card Component ───────────────────────────────────────────────────────
function StatCard({ stat }) {
  const IconComponent = {
    money: MoneyIcon,
    phone: PhoneIcon,
    link: LinkIcon,
    shield: ShieldIcon
  }[stat.icon];

  return (
    <div className="lnd-stat-card" style={{ '--accent': stat.color }}>
      <span className="lnd-stat-icon" style={{ color: stat.color }}>
        {IconComponent && <IconComponent size={28} />}
      </span>
      <div className="lnd-stat-value" style={{ color: stat.color }}>{stat.value}</div>
      <div className="lnd-stat-label">{stat.label}</div>
      <div className="lnd-stat-sub">{stat.sub}</div>
    </div>
  );
}

// ── Main Landing Page ─────────────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate();
  const [statsVisible, setStatsVisible] = useState(false);
  const [terminalKey, setTerminalKey] = useState(0);
  const statsRef = useRef(null);

  useEffect(() => {
    // 1. Stats observer
    const statsObserver = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.2 }
    );
    if (statsRef.current) statsObserver.observe(statsRef.current);

    // 2. Scroll Reveal observer
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-active');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    const elements = document.querySelectorAll('.scroll-reveal');
    elements.forEach((el) => revealObserver.observe(el));

    return () => {
      statsObserver.disconnect();
      revealObserver.disconnect();
    };
  }, []);

  return (
    <div className="lnd-root">
      {/* Grid and Glow spots background */}
      <div className="lnd-grid-bg" />
      <div className="lnd-glow-spot-1" />
      <div className="lnd-glow-spot-2" />
      <div className="lnd-glow-spot-3" />
      <div className="scanline-overlay" />

      {/* ── NAV ── */}
      <nav className="lnd-nav">
        <div className="lnd-nav-inner">
          <div className="lnd-nav-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ cursor: 'pointer' }}>
            <span className="lnd-nav-icon" style={{ display: 'flex', alignItems: 'center' }}>
              <ShieldIcon size={24} color="var(--cyan)" />
            </span>
            <span className="lnd-nav-title">SCAM SWARM</span>
          </div>
          <div className="lnd-nav-links">
            <a href="#stats" className="lnd-nav-link">The Crisis</a>
            <a href="#defense" className="lnd-nav-link">5-Layer Defense</a>
            <a href="#agents" className="lnd-nav-link">AI Specialists</a>
            <a href="#benchmark" className="lnd-nav-link">Benchmark</a>
            <a href="#architecture" className="lnd-nav-link">GCP Stack</a>
            <button className="lnd-nav-cta" onClick={() => navigate('/analyze')}>
              Launch Console →
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="lnd-hero">
        <div className="lnd-hero-inner">
          <div className="lnd-hero-content scroll-reveal">
            <div className="lnd-hero-badge">
              <span className="lnd-badge-dot" />
              Multi-Agent AI · 5-Layer Defense · Real-Time Forensics
            </div>

            <h1 className="lnd-hero-title">
              <span className="lnd-title-line">Fight Fraud</span>
              <span className="lnd-title-line accent">With a Swarm.</span>
            </h1>

            <p className="lnd-hero-sub">
              Scam Swarm deploys three specialized AI agents in parallel to dissect suspicious messages,
              phishing emails, and UPI fraud attempts — delivering a composite threat verdict in under 2 seconds.
            </p>

            <div className="lnd-hero-cta-row">
              <button className="lnd-cta-primary" onClick={() => navigate('/analyze')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RocketIcon size={20} /> Deploy the Swarm →
              </button>
              <button
                className="lnd-cta-secondary"
                onClick={() => navigate('/analyze', { state: { openEval: true } })}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <AnalyticsIcon size={16} color="var(--cyan)" /> Evaluation Lab
              </button>
            </div>

            {/* Quick-try attack samples */}
            <div className="lnd-hero-presets">
              <span className="lnd-presets-title">TEST WITH REAL-WORLD ATTACKS:</span>
              <div className="lnd-presets-list">
                <button className="lnd-preset-pill" onClick={() => navigate('/analyze', { state: { preset: 'upi' } })}>
                  <MoneyIcon size={13} color="var(--amber)" /> Fake UPI SMS
                </button>
                <button className="lnd-preset-pill" onClick={() => navigate('/analyze', { state: { preset: 'phishing' } })}>
                  <LinkIcon size={13} color="var(--cyan)" /> Phishing Email
                </button>
                <button className="lnd-preset-pill" onClick={() => navigate('/analyze', { state: { preset: 'lottery' } })}>
                  <AlertIcon size={13} color="var(--red)" /> Lottery Prize Lure
                </button>
                <button className="lnd-preset-pill" onClick={() => navigate('/analyze', { state: { preset: 'safe' } })}>
                  <CheckIcon size={13} color="var(--green)" /> Legitimate Notice
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Replayable Terminal */}
          <div className="lnd-terminal scroll-reveal">
            <div className="lnd-terminal-bar">
              <span className="lnd-dot red" /><span className="lnd-dot amber" /><span className="lnd-dot green" />
              <span className="lnd-terminal-title">scam-swarm · live investigation</span>
              <button
                className="lnd-terminal-replay"
                onClick={() => setTerminalKey(k => k + 1)}
                title="Replay simulated investigation steps"
              >
                <ResetIcon size={12} /> Replay ↺
              </button>
            </div>
            <div key={terminalKey} className="lnd-terminal-body">
              <div className="lnd-terminal-line"><span className="lnd-t-dim">$</span> <span className="lnd-t-cmd">deploy --swarm --input</span> <span className="lnd-t-str">"URGENT: Verify your SBI KYC..."</span></div>
              <div className="lnd-terminal-line lnd-t-delay-1"><PlayIcon size={12} color="var(--cyan)" /> <span className="lnd-t-muted">Agent 01 · Link &amp; Domain Investigator</span> <span className="lnd-t-scanning">SCANNING...</span></div>
              <div className="lnd-terminal-line lnd-t-delay-2"><PlayIcon size={12} color="var(--cyan)" /> <span className="lnd-t-muted">Agent 02 · Psychological Urgency Cop</span> <span className="lnd-t-scanning">SCANNING...</span></div>
              <div className="lnd-terminal-line lnd-t-delay-3"><PlayIcon size={12} color="var(--cyan)" /> <span className="lnd-t-muted">Agent 03 · Financial Pattern Auditor</span> <span className="lnd-t-scanning">SCANNING...</span></div>
              <div className="lnd-terminal-line lnd-t-delay-4"><AlertIcon size={14} color="var(--red)" /> <span className="lnd-t-verdict">CRITICAL THREAT</span> <span className="lnd-t-dim">· Risk Score:</span> <span className="lnd-t-red">94/100</span></div>
              <div className="lnd-terminal-line lnd-t-delay-5"><CheckIcon size={14} color="var(--green)" /> <span className="lnd-t-dim">Analysis complete in</span> <span className="lnd-t-cyan">1.24s</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* ── IMPACT STATS ── */}
      <section className="lnd-stats-section" ref={statsRef} id="stats">
        <div className="lnd-section-inner">
          <div className="lnd-section-tag">THE PROBLEM</div>
          <h2 className="lnd-section-title">Digital Fraud Is a <span className="lnd-accent">National Crisis</span></h2>
          <div className="lnd-stats-grid scroll-reveal">
            {STATS.map((s, i) => <StatCard key={i} stat={s} />)}
          </div>
        </div>
      </section>

      {/* ── 5-LAYER DEFENSE ARCHITECTURE ── */}
      <section className="lnd-defense-section" id="defense">
        <div className="lnd-section-inner">
          <div className="lnd-section-tag">DEFENSE-IN-DEPTH MATRIX</div>
          <h2 className="lnd-section-title">Evidence Before AI Conclusions: <span className="lnd-accent">The 5-Layer Shield</span></h2>
          <p className="lnd-section-sub">
            Anyone can write three LLM prompts. Scam Swarm differentiates itself through a mathematically rigorous, verifiable investigation pipeline.
          </p>
          
          <div className="lnd-defense-grid scroll-reveal">
            {DEFENSE_LAYERS.map((layer, i) => {
              const Icon = layer.icon;
              return (
                <div key={i} className="lnd-defense-card" style={{ '--layer-color': layer.color }}>
                  <div className="lnd-defense-top">
                    <span className="lnd-defense-num">{layer.layer}</span>
                    <span className="lnd-defense-tag">{layer.tag}</span>
                  </div>
                  <div className="lnd-defense-header">
                    <span className="lnd-defense-icon" style={{ color: layer.color }}>
                      <Icon size={24} />
                    </span>
                    <h3 className="lnd-defense-name">{layer.name}</h3>
                  </div>
                  <p className="lnd-defense-desc">{layer.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── AGENTS ── */}
      <section className="lnd-agents-section" id="agents">
        <div className="lnd-section-inner">
          <div className="lnd-section-tag">THE AGENTS</div>
          <h2 className="lnd-section-title">Three Specialists. <span className="lnd-accent">One Verdict.</span></h2>
          <p className="lnd-section-sub">Each agent runs independently via a Pub/Sub fan-out — true parallel execution with distinct system prompts and schemas.</p>
          <div className="lnd-agents-grid scroll-reveal">
            {AGENTS.map((agent, i) => {
              const AgentIcon = {
                link: LinkIcon,
                brain: BrainIcon,
                money: MoneyIcon
              }[agent.icon];
              return (
                <div key={i} className="lnd-agent-card" style={{ '--agent-color': agent.color }}>
                  <div className="lnd-agent-glow" />
                  <div className="lnd-agent-header">
                    <span className="lnd-agent-icon" style={{ color: agent.color, display: 'flex', alignItems: 'center' }}>
                      {AgentIcon && <AgentIcon size={32} />}
                    </span>
                    <h3 className="lnd-agent-name" style={{ color: agent.color }}>{agent.name}</h3>
                  </div>
                  <p className="lnd-agent-desc">{agent.desc}</p>
                  <div className="lnd-agent-tags">
                    {agent.tags.map((t, j) => (
                      <span key={j} className="lnd-tag" style={{ borderColor: `${agent.color}40`, color: agent.color, background: `${agent.color}10` }}>{t}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── EMPIRICAL BENCHMARK PROOF ── */}
      <section className="lnd-benchmark-section" id="benchmark">
        <div className="lnd-section-inner">
          <div className="lnd-section-tag">EVALUATION LAB · EMPIRICAL PROOF</div>
          <h2 className="lnd-section-title">Tested Against 40 <span className="lnd-accent">Ground-Truth Attacks</span></h2>
          <p className="lnd-section-sub">
            Rigorous evaluation against phishing, brand spoofing, advance-fee UPI schemes, and legitimate banking 2FA alerts. Measured under NIST AI Risk and OWASP standards.
          </p>

          <div className="lnd-bench-grid scroll-reveal">
            <div className="lnd-bench-card highlight">
              <div className="lnd-bench-pill">TIER 3 · SCAM SWARM</div>
              <div className="lnd-bench-val">100%</div>
              <div className="lnd-bench-title">Evidence Traceability</div>
              <p className="lnd-bench-desc">Every verdict is mathematically grounded in verified OSINT, RDAP registration age, or NPCI telemetry.</p>
            </div>

            <div className="lnd-bench-card">
              <div className="lnd-bench-pill neutral">TIER 1 · HEURISTICS</div>
              <div className="lnd-bench-val">60%</div>
              <div className="lnd-bench-title">Evidence Coverage</div>
              <p className="lnd-bench-desc">Static keyword matching suffers from false positives on authentic office memos and misses zero-day disposable domains.</p>
            </div>

            <div className="lnd-bench-card">
              <div className="lnd-bench-pill neutral">MULTI-PROVIDER FAILOVER</div>
              <div className="lnd-bench-val">&lt; 2.0s</div>
              <div className="lnd-bench-title">Composite Scan Latency</div>
              <p className="lnd-bench-desc">Autonomous failover routes from Gemini to Groq high-speed models, ensuring zero downtime even under API rate limits.</p>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '36px' }}>
            <button
              className="lnd-cta-secondary"
              onClick={() => navigate('/analyze', { state: { openEval: true } })}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <AnalyticsIcon size={16} color="var(--cyan)" />
              Inspect Full 40-Sample Evaluation Lab →
            </button>
          </div>
        </div>
      </section>

      {/* ── GCP ARCHITECTURE ── */}
      <section className="lnd-arch-section" id="architecture">
        <div className="lnd-section-inner">
          <div className="lnd-section-tag">PRODUCTION ARCHITECTURE</div>
          <h2 className="lnd-section-title">Built on <span className="lnd-accent">Google Cloud</span></h2>
          <div className="lnd-arch-diagram scroll-reveal">
            <div className="lnd-arch-flow">
              <div className="lnd-arch-node input-node">
                <UserIcon size={22} color="var(--text-secondary)" />
                <span>User Input</span>
              </div>
              <div className="lnd-arch-connector"><div className="lnd-conn-line animated-line" /><span className="lnd-conn-label">HTTPS</span></div>
              <div className="lnd-arch-node" style={{ borderColor: '#f59e0b50' }}>
                <GlobeIcon size={22} color="#f59e0b" />
                <span>Firebase Hosting</span><span className="lnd-arch-sub">React SPA</span>
              </div>
              <div className="lnd-arch-connector"><div className="lnd-conn-line animated-line" /><span className="lnd-conn-label">REST</span></div>
              <div className="lnd-arch-node highlight-node">
                <SettingsIcon size={22} color="#22d3ee" />
                <span>Cloud Functions</span><span className="lnd-arch-sub">Orchestrator</span>
              </div>
            </div>

            <div className="lnd-arch-pubsub-row">
              <div className="lnd-pubsub-line" />
              <div className="lnd-arch-node pubsub-center">
                <PubSubIcon size={22} color="#a855f7" />
                <span>Cloud Pub/Sub</span><span className="lnd-arch-sub">Fan-Out → 3 Topics</span>
              </div>
              <div className="lnd-pubsub-line" />
            </div>

            <div className="lnd-arch-agents-row">
              {AGENTS.map((a, i) => {
                const AgentIcon = {
                  link: LinkIcon,
                  brain: BrainIcon,
                  money: MoneyIcon
                }[a.icon];
                return (
                  <div key={i} className="lnd-arch-node agent-node" style={{ borderColor: `${a.color}40`, background: `${a.color}08` }}>
                    {AgentIcon && <AgentIcon size={22} color={a.color} />}
                    <span style={{ color: a.color }}>CF: {a.name.split(' ').slice(0, 2).join(' ')}</span>
                    <span className="lnd-arch-sub">Agent Worker</span>
                  </div>
                );
              })}
            </div>

            <div className="lnd-arch-pubsub-row">
              <div className="lnd-pubsub-line" />
              <div className="lnd-arch-node firestore-node">
                <DatabaseIcon size={22} color="#22c55e" />
                <span>Firestore</span><span className="lnd-arch-sub">Results + Audit Log</span>
              </div>
              <div className="lnd-pubsub-line" />
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="lnd-final-cta scroll-reveal">
        <div className="lnd-section-inner">
          <div className="lnd-cta-glow" />
          <h2 className="lnd-cta-title">Ready to deploy the swarm?</h2>
          <p className="lnd-cta-sub" style={{ marginBottom: '28px' }}>Paste any suspicious message, email, or UPI handle and get a full forensic report in seconds.</p>
          <button className="lnd-cta-primary large" onClick={() => navigate('/analyze')} style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0 auto 30px' }}>
            <RocketIcon size={24} /> Launch Scam Swarm →
          </button>
          <div className="lnd-helpline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <AlertIcon size={18} color="var(--red)" />
            <span>Cybercrime Helpline India: <strong style={{ color: '#ef4444' }}>1930</strong> · Report at <a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer" style={{ color: '#22d3ee' }}>cybercrime.gov.in</a></span>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lnd-footer">
        <div className="lnd-footer-inner">
          <div className="lnd-footer-brand" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldIcon size={20} color="var(--cyan)" />
            <span className="lnd-nav-title" style={{ fontSize: '14px' }}>SCAM SWARM</span>
          </div>
          <div className="lnd-footer-links">
            <a href="https://github.com/immanuel-thomas-j/Scam-Swarm-Immanuel" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cyan)', textDecoration: 'none' }}>GitHub Repo</a>
            <span className="lnd-sep">//</span>
            <a href="https://youtu.be/s5-9-mTKe9o" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cyan)', textDecoration: 'none' }}>YouTube Demo</a>
            <span className="lnd-sep">//</span>
            <span>GCP · Firebase · Cloud Functions · Pub/Sub</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
