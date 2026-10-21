'use strict';

const express = require('express');
const originalListen = express.application.listen;
const buckets = new Map();
const WINDOW_MS = 60_000;
// Keep legitimate multi-tab/admin browsing from tripping the global API limiter.
// Mutating/authenticated operations remain much stricter below.
const MAX_API = 600;
const MAX_AUTH = 30;
const MAX_PAYTECH_CREATE = 12;

// Harden express-session defaults before the application creates its session middleware.
// This keeps the existing authentication flow intact while adding SameSite protection.
try {
  const sessionModule = require('express-session');
  const originalSession = sessionModule;
  const hardenedSession = function hardenedSession(options = {}) {
    const cookie = options.cookie && typeof options.cookie === 'object' ? options.cookie : {};
    return originalSession({
      ...options,
      cookie: {
        ...cookie,
        httpOnly: true,
        sameSite: cookie.sameSite || 'lax',
        secure: cookie.secure ?? (process.env.NODE_ENV === 'production')
      }
    });
  };
  Object.assign(hardenedSession, originalSession);
  require.cache[require.resolve('express-session')].exports = hardenedSession;
} catch (error) {
  console.error('SECURITY_SESSION_PATCH_ERROR:', error);
}

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
    const originHost = originUrl.host.toLowerCase();
    const forwardedHost = String(req.headers['x-forwarded-host'] || '').split(',')[0].trim().toLowerCase();
    const requestHost = String(req.get?.('host') || '').toLowerCase();
    const renderHost = String(process.env.RENDER_EXTERNAL_HOSTNAME || '').trim().toLowerCase();
    const configuredHosts = [requestHost, forwardedHost, renderHost].filter(Boolean);

    if (configuredHosts.includes(originHost)) return true;

    const publicUrl = String(process.env.RENDER_EXTERNAL_URL || process.env.APP_URL || process.env.PUBLIC_URL || '').trim();
    if (publicUrl) {
      try {
        if (new URL(publicUrl).host.toLowerCase() === originHost) return true;
      } catch (_) {}
    }

    return false;
  } catch (_) {
    return false;
  }
}

function sendSecurityJson(res, status, payload) {
  if (typeof res?.status === 'function' && typeof res?.json === 'function') {
    return res.status(status).json(payload);
  }

  if (typeof res?.writeHead === 'function' && typeof res?.end === 'function') {
    res.statusCode = status;
    if (typeof res.setHeader === 'function') {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
    }
    return res.end(JSON.stringify(payload));
  }

  return undefined;
}

function securityMiddleware(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');

  // HTML is the application shell. Do not let browsers serve an older shell first
  // while Render has already deployed a newer version. Static assets keep their
  // normal caching behaviour.
  const acceptsHtml = String(req.headers.accept || '').includes('text/html');
  if (acceptsHtml && !String(req.path || req.url || '').startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  const proto = String(req.headers['x-forwarded-proto'] || req.protocol || '').split(',')[0].trim();
  if (proto === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  const requestPath = String(req.path || req.originalUrl || req.url || '').split('?')[0];
  if (requestPath.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store');

    const ip = clientIp(req);
    const authRoute = /^\/api\/(admin\/login|customer\/(login|register)|login|register)/.test(requestPath);
    const paytechCreate = requestPath === '/api/paytech/create';
    const limit = paytechCreate ? MAX_PAYTECH_CREATE : authRoute ? MAX_AUTH : MAX_API;

    if (!allowRate(`${ip}:${authRoute ? 'auth' : paytechCreate ? 'paytech' : 'api'}`, limit)) {
      return sendSecurityJson(res, 429, { error: 'Trop de requêtes. Réessaie dans un moment.' });
    }

    const mutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
    const webhook = requestPath === '/api/paytech/ipn' || requestPath === '/api/paytech/refund-ipn';
    if (mutating && !webhook && !sameOrigin(req)) {
      return sendSecurityJson(res, 403, { error: 'Origine de requête non autorisée.' });
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

  // Do not expose Express implementation details to clients.
  if (typeof app.disable === 'function') app.disable('x-powered-by');

  const stack = app._router && app._router.stack;
  if (stack && !stack.some(layer => layer && layer.handle === securityMiddleware)) {
    const router = express.Router();
    router.use(securityMiddleware);
    stack.unshift(...(router.stack || []));
  }

  return originalListen.apply(app, args);
};

console.log('SNGAMER_SECURITY: security headers, API rate limits, same-origin checks, hardened sessions, stale-HTML protection and production session-secret guard enabled');
