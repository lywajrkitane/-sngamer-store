'use strict';

const express = require('express');
const originalListen = express.application.listen;
const buckets = new Map();
const WINDOW_MS = 60_000;
const MAX_API = 180;
const MAX_AUTH = 30;
const MAX_PAYTECH_CREATE = 12;

function clientIp(req) {
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function allowRate(key, limit) {
  const now = Date.now();
  let entry = buckets.get(key);
  if (!entry || now - entry.start >= WINDOW_MS) {
    entry = { start: now, count: 0 };
    buckets.set(key, entry);
  }
  entry.count += 1;
  if (buckets.size > 5000) {
    for (const [storedKey, storedEntry] of buckets) {
      if (now - storedEntry.start >= WINDOW_MS) buckets.delete(storedKey);
    }
  }
  return entry.count <= limit;
}

function sameOrigin(req) {
  const origin = String(req.headers.origin || '').trim();
  if (!origin) return true;
  try {
    const originUrl = new URL(origin);
    const host = String(req.get('host') || '').toLowerCase();
    return originUrl.host.toLowerCase() === host;
  } catch (_) {
    return false;
  }
}

function securityMiddleware(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');

  const proto = String(req.headers['x-forwarded-proto'] || req.protocol || '').split(',')[0].trim();
  if (proto === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store');

    const ip = clientIp(req);
    const authRoute = /^\/api\/(admin\/login|customer\/(login|register)|login|register)/.test(req.path);
    const paytechCreate = req.path === '/api/paytech/create';
    const limit = paytechCreate ? MAX_PAYTECH_CREATE : authRoute ? MAX_AUTH : MAX_API;

    if (!allowRate(`${ip}:${authRoute ? 'auth' : paytechCreate ? 'paytech' : 'api'}`, limit)) {
      return res.status(429).json({ error: 'Trop de requêtes. Réessaie dans un moment.' });
    }

    const mutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
    const webhook = req.path === '/api/paytech/ipn' || req.path === '/api/paytech/refund-ipn';
    if (mutating && !webhook && !sameOrigin(req)) {
      return res.status(403).json({ error: 'Origine de requête non autorisée.' });
    }
  }

  next();
}

express.application.listen = function securityPatchedListen(...args) {
  const app = this;

  if (process.env.NODE_ENV === 'production') {
    const secret = String(process.env.SESSION_SECRET || '').trim();
    if (!secret || secret === 'sngamer-development-secret' || secret.length < 32) {
      console.error('SECURITY_BOOT_ERROR: SESSION_SECRET must be configured in production (minimum 32 characters).');
      process.exit(1);
      return;
    }
  }

  const stack = app._router && app._router.stack;
  if (stack && !stack.some(layer => layer && layer.handle === securityMiddleware)) {
    const router = express.Router();
    router.use(securityMiddleware);
    stack.unshift(...(router.stack || []));
  }

  return originalListen.apply(app, args);
};

console.log('SNGAMER_SECURITY: security headers, API rate limits, same-origin checks and production session-secret guard enabled');
