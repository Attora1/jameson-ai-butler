// src/state/timeContext.js
// Lightweight, persistent time awareness for AELI (per user).
// Tracks: first seen, session start, last user msg, last AELI msg.

const LS_KEY = 'AELI_TIME_CTX_v1';

function load() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); }
  catch { return {}; }
}
function save(obj) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(obj)); } catch {}
}

function now() { return Date.now(); }

function ensureUser(ctx, userId) {
  if (!ctx[userId]) {
    const t = now();
    ctx[userId] = {
      userId,
      firstSeenAt: t,        // when we first saw this user on this device
      sessionStartedAt: t,   // when this app session booted
      lastUserMsgAt: null,
      lastAeliMsgAt: null,
    };
  }
}

export function initTimeContext(userId = 'defaultUser') {
  const ctx = load();
  ensureUser(ctx, userId);
  // refresh session start each app load
  ctx[userId].sessionStartedAt = ctx[userId].sessionStartedAt || now();
  save(ctx);
  return ctx[userId];
}

export function markUserMessage(userId = 'defaultUser') {
  const ctx = load();
  ensureUser(ctx, userId);
  ctx[userId].lastUserMsgAt = now();
  save(ctx);
}

export function markAeliMessage(userId = 'defaultUser') {
  const ctx = load();
  ensureUser(ctx, userId);
  ctx[userId].lastAeliMsgAt = now();
  save(ctx);
}

function fmt(ms) {
  if (ms == null || ms < 0) return null;
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${sec}s`;
  return `${sec}s`;
}

export function getTimeSnapshot(userId = 'defaultUser') {
  const ctx = load();
  ensureUser(ctx, userId);
  const t = ctx[userId];
  const nowMs = now();
  const uptime = nowMs - t.sessionStartedAt;
  const sinceUser = t.lastUserMsgAt ? nowMs - t.lastUserMsgAt : null;
  const sinceAeli = t.lastAeliMsgAt ? nowMs - t.lastAeliMsgAt : null;

  return {
    userId,
    firstSeenAt: t.firstSeenAt,
    sessionStartedAt: t.sessionStartedAt,
    lastUserMsgAt: t.lastUserMsgAt,
    lastAeliMsgAt: t.lastAeliMsgAt,
    uptimeMs: uptime,
    sinceLastUserMs: sinceUser,
    sinceLastAeliMs: sinceAeli,
    human: {
      uptime: fmt(uptime),
      sinceLastUser: fmt(sinceUser),
      sinceLastAeli: fmt(sinceAeli),
      clock: new Date(nowMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  };
}