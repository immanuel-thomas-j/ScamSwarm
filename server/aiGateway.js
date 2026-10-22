/**
 * Resilient Multi-Provider AI Gateway
 * 
 * Provides unified LLM generation with automatic multi-tier failover:
 * Primary: Google Gemini Family (gemini-2.5-flash-lite, gemini-3.5-flash-lite, gemini-3.5-flash, etc.)
 * Secondary: Groq Primary Engine (openai/gpt-oss-20b)
 * Tertiary: Groq High-Speed Secondary Engine (qwen/qwen3.8-27b)
 * Quaternary: Structured forensic rule-based fallback
 */

import { GoogleGenAI } from '@google/genai';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const geminiApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
const groqApiKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY || '';

const geminiClient = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;
const groqClient = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null;

const GEMINI_TEXT_MODELS = [
  'gemini-2.5-flash-lite',
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.5-flash',
  'gemini-flash-latest',
  'gemini-3.7-flash',
  'gemini-2.5-flash'
];

let geminiQuotaCooldownUntil = 0;
let groqCooldownUntil = 0;

/**
 * Generate structured JSON completion with intelligent multi-provider failover.
 * 
 * @param {Object} options
 * @param {string} options.systemPrompt
 * @param {string} options.userPrompt
 * @param {Object} [options.defaultFallback]
 * @returns {Promise<Object>} parsed JSON response
 */
export async function generateSecurityJSON({ systemPrompt = '', userPrompt = '', defaultFallback = {} }) {
  // 1. Attempt Primary: Google Gemini Multi-Model Tiering
  if (geminiClient && Date.now() > geminiQuotaCooldownUntil) {
    const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${userPrompt}` : userPrompt;

    for (const model of GEMINI_TEXT_MODELS) {
      try {
        const response = await geminiClient.models.generateContent({
          model,
          contents: fullPrompt,
          config: { responseMimeType: 'application/json' }
        });

        if (response && response.text) {
          return JSON.parse(response.text);
        }
      } catch (geminiErr) {
        const isQuota = geminiErr.message?.includes('429') || 
                        geminiErr.message?.includes('quota') || 
                        geminiErr.message?.includes('RESOURCE_EXHAUSTED');
        if (isQuota) {
          geminiQuotaCooldownUntil = Date.now() + 60 * 1000;
          console.warn(`[AIGateway] Gemini quota exhausted (429). Activating 60s cooldown; routing to secondary engine.`);
          break; // Stop iterating models; project-wide quota is exhausted
        }
        console.warn(`[AIGateway] Gemini model ${model} skipped (${geminiErr.message?.slice(0, 60)}...). Trying next.`);
      }
    }
  }

  // 2. Attempt Secondary: Groq Primary Engine (llama-3.3-70b-versatile)
  if (groqClient && Date.now() > groqCooldownUntil) {
    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: `${systemPrompt}\nYou MUST return a valid JSON object only.` });
    } else {
      messages.push({ role: 'system', content: 'You are an advanced cybersecurity analysis engine. Return ONLY a valid JSON object.' });
    }
    messages.push({ role: 'user', content: userPrompt });

    try {
      const completion = await groqClient.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages,
        response_format: { type: 'json_object' }
      });

      const content = completion.choices?.[0]?.message?.content;
      if (content) {
        return JSON.parse(content);
      }
    } catch (groqErr1) {
      // 3. Attempt Tertiary: Groq High-Speed Instant Engine (llama-3.1-8b-instant)
      try {
        const completion2 = await groqClient.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages,
          response_format: { type: 'json_object' }
        });

        const content2 = completion2.choices?.[0]?.message?.content;
        if (content2) {
          return JSON.parse(content2);
        }
      } catch (groqErr2) {
        groqCooldownUntil = Date.now() + 60 * 1000;
        console.warn(`[AIGateway] Groq models unavailable or auth failed (${groqErr2.message?.slice(0, 50)}). Activating 60s cooldown; falling back to deterministic heuristics.`);
      }
    }
  }

  // 4. Quaternary: Structured forensic rule-based fallback
  return defaultFallback;
}

export { geminiClient, groqClient };
