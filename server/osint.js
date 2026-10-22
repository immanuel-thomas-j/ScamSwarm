/**
 * Real-Time URL Investigation & OSINT Engine
 * 
 * Performs:
 * 1. Safe HTTP Redirect Tracing (SSRF-protected, max 5 hops)
 * 2. DNS A & CNAME Resolution
 * 3. ICANN RDAP Domain Registration Age & Expiry Lookup
 * 4. Google Safe Browsing / Public Threat Intelligence Feed Check
 * 5. Caching & Forensic Artifact Generation
 */

import dns from 'node:dns/promises';
import { threatCache, HIGH_RISK_TLDS, evaluateBrandSpoofing } from './threatIntel.js';

// SSRF Protection: Comprehensive private, loopback, link-local, and cloud metadata blocks
const PRIVATE_IP_RANGES = [
  /^127\./,                           // Loopback IPv4
  /^10\./,                            // RFC 1918 Class A
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,   // RFC 1918 Class B
  /^192\.168\./,                      // RFC 1918 Class C
  /^169\.254\./,                      // Link-local / Cloud Metadata
  /^100\.(6[4-9]|[7-9][0-9]|1[01][0-9]|12[0-7])\./, // Carrier-Grade NAT (RFC 6598)
  /^0\./,                             // Zero address
  /^::1$/,                            // Loopback IPv6
  /^[fF][cCdD][0-9a-fA-F]{2}:/,       // Unique Local Address (ULA)
  /^[fF][eE][89a-bA-B][0-9a-fA-F]:/,  // Link-local IPv6
  /^::ffff:(127\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|169\.254\.)/ // IPv4-mapped IPv6
];

export function isPrivateIP(ip) {
  if (!ip) return false;
  const cleanIp = ip.replace(/^\[|\]$/g, '').trim();
  return PRIVATE_IP_RANGES.some(range => range.test(cleanIp));
}

export function isBlockedHost(hostname) {
  if (!hostname) return true;
  const lower = hostname.toLowerCase().replace(/^\[|\]$/g, '').trim();
  if (
    lower === 'localhost' ||
    lower.endsWith('.localhost') ||
    lower.endsWith('.local') ||
    lower.endsWith('.internal') ||
    lower === 'instance-data' ||
    lower === 'metadata' ||
    lower === 'metadata.google.internal' ||
    lower === 'metadata.azure.internal'
  ) {
    return true;
  }
  return isPrivateIP(lower);
}

// Extract base/apex domain from hostname
export function extractApexDomain(hostname) {
  const parts = hostname.toLowerCase().split('.').filter(Boolean);
  if (parts.length <= 2) return hostname.toLowerCase();

  // Handle common two-part ccTLDs (.co.in, .gov.in, .co.uk, .com.au, etc.)
  const secondLevel = parts[parts.length - 2];
  const topLevel = parts[parts.length - 1];
  if (['co', 'gov', 'net', 'org', 'ac', 'edu'].includes(secondLevel) && topLevel.length === 2) {
    return parts.slice(-3).join('.');
  }
  return parts.slice(-2).join('.');
}

/**
 * 1. Safe Redirect Tracer (Unshortens bit.ly, tinyurl, t.co, etc.)
 */
export async function traceRedirects(initialUrl, maxHops = 5) {
  const chain = [];
  const visited = new Set();
  let currentUrl = initialUrl;

  for (let hop = 0; hop < maxHops; hop++) {
    try {
      if (visited.has(currentUrl)) {
        chain.push({ url: currentUrl, error: 'SSRF / Loop blocked: Redirect loop detected' });
        break;
      }
      visited.add(currentUrl);

      const parsed = new URL(currentUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        chain.push({ url: currentUrl, error: 'Unsupported protocol' });
        break;
      }

      if (isBlockedHost(parsed.hostname)) {
        chain.push({ url: currentUrl, error: 'SSRF blocked: Private IP target or forbidden host' });
        break;
      }

      // Pre-resolve DNS to ensure target is not a private IP (SSRF guard)
      try {
        const [addressesV4, addressesV6] = await Promise.all([
          dns.resolve4(parsed.hostname).catch(() => []),
          dns.resolve6(parsed.hostname).catch(() => [])
        ]);
        if (addressesV4.some(isPrivateIP) || addressesV6.some(isPrivateIP)) {
          chain.push({ url: currentUrl, error: 'SSRF blocked: Private IP target' });
          break;
        }
      } catch (err) {
        // DNS failure on this hop
        chain.push({ url: currentUrl, error: `DNS resolution failed: ${err.code || err.message}` });
        break;
      }

      // Fetch with redirect: 'manual' to catch each 3xx hop
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(currentUrl, {
        method: 'HEAD',
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ScamSwarm-OSINT/2.0'
        }
      }).catch(async () => {
        // Fallback to GET with small byte range if HEAD is blocked by web server
        return await fetch(currentUrl, {
          method: 'GET',
          redirect: 'manual',
          signal: controller.signal,
          headers: {
            'Range': 'bytes=0-512',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ScamSwarm-OSINT/2.0'
          }
        });
      });

      clearTimeout(timeout);

      const status = res.status;
      const location = res.headers.get('location');

      chain.push({
        hopNumber: hop + 1,
        url: currentUrl,
        statusCode: status,
        nextLocation: location || null
      });

      if ([301, 302, 303, 307, 308].includes(status) && location) {
        // Resolve relative redirects safely
        currentUrl = new URL(location, currentUrl).href;
      } else {
        // Terminal destination reached
        break;
      }
    } catch (err) {
      chain.push({ url: currentUrl, error: err.message });
      break;
    }
  }

  const finalUrl = chain.length > 0 ? chain[chain.length - 1].url : initialUrl;
  const isRedirected = chain.length > 1;

  return {
    initialUrl,
    finalUrl,
    hopCount: chain.length,
    isRedirected,
    chain
  };
}

/**
 * 2. DNS Resolution
 */
export async function resolveDomainDNS(hostname) {
  if (isBlockedHost(hostname)) {
    return {
      hostname,
      resolved: false,
      ips: [],
      cnames: [],
      error: 'Blocked internal or private hostname'
    };
  }

  const cacheKey = `dns:${hostname}`;
  const cached = threatCache.get(cacheKey);
  if (cached) return cached;

  try {
    const [ipv4, cnames] = await Promise.all([
      dns.resolve4(hostname).catch(() => []),
      dns.resolveCname(hostname).catch(() => [])
    ]);

    const result = {
      hostname,
      resolved: ipv4.length > 0,
      ips: ipv4,
      cnames,
      queriedAt: new Date().toISOString()
    };

    threatCache.set(cacheKey, result, 1000 * 60 * 30); // 30 min cache
    return result;
  } catch (err) {
    return {
      hostname,
      resolved: false,
      ips: [],
      cnames: [],
      error: err.code || err.message
    };
  }
}

/**
 * 3. ICANN RDAP Domain Age & Registration Lookup
 */
export async function lookupDomainRDAP(domain) {
  const apexDomain = extractApexDomain(domain);
  const cacheKey = `rdap:${apexDomain}`;
  const cached = threatCache.get(cacheKey);
  if (cached) return cached;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`https://rdap.org/domain/${encodeURIComponent(apexDomain)}`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/rdap+json, application/json',
        'User-Agent': 'ScamSwarm-RDAP-Lookup/2.0'
      }
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return { apexDomain, found: false, error: `RDAP lookup returned HTTP ${res.status}` };
    }

    const data = await res.json();
    const events = data.events || [];

    const regEvent = events.find(e => e.eventAction === 'registration');
    const expEvent = events.find(e => e.eventAction === 'expiration');

    const registrationDate = regEvent ? regEvent.eventDate : null;
    const expirationDate = expEvent ? expEvent.eventDate : null;

    let ageDays = null;
    if (registrationDate) {
      const regTime = new Date(registrationDate).getTime();
      ageDays = Math.floor((Date.now() - regTime) / (1000 * 60 * 60 * 24));
    }

    const result = {
      apexDomain,
      found: true,
      registrationDate,
      expirationDate,
      ageDays,
      registrar: data.entities?.[0]?.vcardArray?.[1]?.find(v => v[0] === 'fn')?.[3] || 'Unknown Registrar',
      source: 'ICANN RDAP Official Service'
    };

    threatCache.set(cacheKey, result, 1000 * 60 * 60 * 24); // 24 hours cache
    return result;
  } catch (err) {
    return { apexDomain, found: false, error: err.message };
  }
}

/**
 * 4. Google Safe Browsing API v4 Check
 */
export async function checkGoogleSafeBrowsing(url, apiKey) {
  if (!apiKey) {
    return { checked: false, reason: 'No Google Safe Browsing API key provided' };
  }

  const cacheKey = `gsb:${url}`;
  const cached = threatCache.get(cacheKey);
  if (cached) return cached;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client: { clientId: 'scam-swarm', clientVersion: '2.0.0' },
        threatInfo: {
          threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
          platformTypes: ['ANY_PLATFORM'],
          threatEntryTypes: ['URL'],
          threatEntries: [{ url }]
        }
      })
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return { checked: false, error: `Google Safe Browsing returned HTTP ${res.status}` };
    }

    const data = await res.json();
    const matches = data.matches || [];
    const isMalicious = matches.length > 0;

    const result = {
      checked: true,
      isMalicious,
      matches,
      source: 'Google Safe Browsing Threat Feed'
    };

    threatCache.set(cacheKey, result, 1000 * 60 * 30);
    return result;
  } catch (err) {
    return { checked: false, error: err.message };
  }
}

/**
 * 5. Full Real-Time OSINT Probe for a Given URL
 */
export async function investigateUrlTelemetry(urlStr, googleApiKey = null) {
  const findings = [];
  let scoreWeight = 0;

  try {
    const urlObj = new URL(urlStr);
    const hostname = urlObj.hostname.toLowerCase();

    // Protocol check
    if (urlObj.protocol === 'http:') {
      findings.push({
        type: 'INSECURE_PROTOCOL',
        severity: 'HIGH',
        desc: `Link '${hostname}' communicates over unencrypted HTTP protocol.`,
        source: 'Protocol Inspector',
        weight: 20
      });
      scoreWeight += 20;
    }

    // High Risk TLD check
    for (const [tld, info] of HIGH_RISK_TLDS.entries()) {
      if (hostname.endsWith(tld)) {
        findings.push({
          type: 'HIGH_RISK_TLD',
          severity: 'MEDIUM',
          desc: `Domain uses '${tld}' top-level domain: ${info.reason}.`,
          source: 'TLD Reputation Engine',
          weight: info.weight
        });
        scoreWeight += info.weight;
        break;
      }
    }

    // Brand typosquatting check
    const brandFindings = evaluateBrandSpoofing(hostname);
    for (const f of brandFindings) {
      findings.push(f);
      scoreWeight += f.weight;
    }

    // Run parallel live OSINT: Redirect Tracer, DNS Resolution, and RDAP Domain Age
    const [redirectResult, dnsResult, rdapResult, safeBrowsingResult] = await Promise.all([
      traceRedirects(urlStr),
      resolveDomainDNS(hostname),
      lookupDomainRDAP(hostname),
      checkGoogleSafeBrowsing(urlStr, googleApiKey)
    ]);

    // Evaluate redirect chain findings
    if (redirectResult.isRedirected) {
      const finalHost = new URL(redirectResult.finalUrl).hostname;
      findings.push({
        type: 'URL_REDIRECT_CHAIN',
        severity: finalHost !== hostname ? 'HIGH' : 'LOW',
        desc: `Link routes through ${redirectResult.hopCount} hops to final destination: '${redirectResult.finalUrl}'.`,
        source: 'Live Redirect Tracer',
        weight: finalHost !== hostname ? 25 : 5
      });
      if (finalHost !== hostname) scoreWeight += 25;
    }

    // Evaluate DNS resolution
    if (!dnsResult.resolved) {
      findings.push({
        type: 'UNRESOLVED_DNS',
        severity: 'MEDIUM',
        desc: `Hostname '${hostname}' does not resolve to active A-records (possible sinkholed or disposable infrastructure).`,
        source: 'DNS Resolver',
        weight: 15
      });
      scoreWeight += 15;
    }

    // Evaluate Domain Age (RDAP)
    if (rdapResult.found && typeof rdapResult.ageDays === 'number') {
      if (rdapResult.ageDays <= 30) {
        findings.push({
          type: 'NEWLY_REGISTERED_DOMAIN',
          severity: 'CRITICAL',
          desc: `Domain '${rdapResult.apexDomain}' was registered only ${rdapResult.ageDays} day(s) ago (${rdapResult.registrationDate.slice(0, 10)}). ~90% of disposable phishing campaigns operate on domains < 30 days old.`,
          source: 'ICANN RDAP Live Registry',
          weight: 40
        });
        scoreWeight += 40;
      } else if (rdapResult.ageDays <= 90) {
        findings.push({
          type: 'RECENT_DOMAIN',
          severity: 'MEDIUM',
          desc: `Domain '${rdapResult.apexDomain}' is relatively new (${rdapResult.ageDays} days old).`,
          source: 'ICANN RDAP Live Registry',
          weight: 15
        });
        scoreWeight += 15;
      }
    }

    // Evaluate Google Safe Browsing
    if (safeBrowsingResult.isMalicious) {
      findings.push({
        type: 'GOOGLE_SAFE_BROWSING_FLAG',
        severity: 'CRITICAL',
        desc: `Target is blacklisted by Google Safe Browsing threat telemetry. Matches: ${safeBrowsingResult.matches.map(m => m.threatType).join(', ')}.`,
        source: 'Google Safe Browsing API',
        weight: 50
      });
      scoreWeight += 50;
    }

    return {
      url: urlStr,
      hostname,
      osintScore: Math.min(100, scoreWeight),
      redirect: redirectResult,
      dns: dnsResult,
      rdap: rdapResult,
      safeBrowsing: safeBrowsingResult,
      findings
    };
  } catch (err) {
    return {
      url: urlStr,
      error: `Malformed URL probe: ${err.message}`,
      osintScore: 10,
      findings: [{
        type: 'MALFORMED_URL',
        severity: 'LOW',
        desc: `Telemetry link '${urlStr}' is malformed or invalid: ${err.message}`,
        source: 'URL Validator',
        weight: 10
      }]
    };
  }
}
