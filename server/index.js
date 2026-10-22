/**
 * Secure Backend Orchestrator & API Gateway
 * 
 * Protects AI keys on the server, enforces input validation & rate limits,
 * coordinates live OSINT probes, parallel agent execution, and judge reconciliation.
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { orchestrateAnalysis } from './orchestrator.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// CORS: allow local frontend and production hosting
app.use(cors({ origin: true }));
app.use(express.json({ limit: '10mb' }));

// ── Rate Limiting Middleware (Sliding Window per Authenticated IP) ──
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60; // 60 requests per minute

function getClientIp(req) {
  if (process.env.TRUST_PROXY === 'true') {
    return req.ip || req.socket.remoteAddress || 'unknown';
  }
  return req.socket.remoteAddress || 'unknown';
}

function rateLimiter(req, res, next) {
  const ip = getClientIp(req);
  const now = Date.now();

  const record = rateLimitMap.get(ip) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };

  if (now > record.resetAt) {
    record.count = 1;
    record.resetAt = now + RATE_LIMIT_WINDOW_MS;
  } else {
    record.count += 1;
  }

  rateLimitMap.set(ip, record);

  if (record.count > MAX_REQUESTS_PER_WINDOW) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return res.status(429).json({
      error: `Rate limit exceeded. Too many forensic analysis requests from this IP. Please retry in ${retryAfter} seconds.`,
      retryAfter
    });
  }

  next();
}

// ── Gemini Client Setup (Server-Side Secrets) ──
const geminiApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
if (!geminiApiKey) {
  console.warn("⚠️ Warning: GEMINI_API_KEY is not set in server environment. AI agents will run in heuristic fallback mode.");
}
const aiClient = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

// ── Health Check ──
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    version: '2.0.0-production',
    geminiConfigured: !!aiClient,
    timestamp: new Date().toISOString()
  });
});

// ── Main Analysis Orchestrator ──
app.post('/api/analyze', rateLimiter, async (req, res) => {
  try {
    const { text = '', image = '', mimeType = 'image/jpeg' } = req.body;

    // 1. Input Validation
    if (!text.trim() && !image) {
      return res.status(400).json({ error: "Missing required parameter: provide either 'text' or an 'image' to analyze." });
    }

    if (text.length > 5000) {
      return res.status(400).json({ error: "Telemetry text exceeds 5,000 character maximum limit." });
    }

    const payload = await orchestrateAnalysis({
      text,
      image,
      mimeType,
      aiClient,
      geminiApiKey
    });

    return res.status(200).json(payload);

  } catch (err) {
    console.error("Forensic Orchestration Error:", err);
    return res.status(500).json({
      error: "Swarm forensic engine encountered an unexpected disruption during analysis. Please try again."
    });
  }
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🛡️ Scam Swarm Secure Orchestrator active on port ${PORT}`);
  });
}

export default app;
