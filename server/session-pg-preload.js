'use strict';

const expressSession = require('express-session');
const PgStoreFactory = require('connect-pg-simple')(expressSession);
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5
});

const store = new PgStoreFactory({
  pool,
  tableName: 'sngamer_sessions',
  createTableIfMissing: true,
  ttl: 30 * 24 * 60 * 60
});

const patchedSession = function patchedSession(options = {}) {
  const config = { ...options };
  config.store = store;
  config.resave = false;
  config.saveUninitialized = false;
  config.rolling = true;
  config.cookie = {
    ...(options.cookie || {}),
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  };
  return expressSession(config);
};

Object.setPrototypeOf(patchedSession, expressSession);
Object.assign(patchedSession, expressSession);

require.cache[require.resolve('express-session')].exports = patchedSession;

console.log('SNGAMER_SESSION_STORE: PostgreSQL persistent sessions enabled (30 days)');
