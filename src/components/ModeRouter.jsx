import React, { Suspense, lazy } from 'react';
import { useMode } from '../context/useMode.js';

// Lazy-load each mode screen
const ChatMode = lazy(() => import('../modes/ChatMode.jsx'));
const FocusMode = lazy(() => import('../modes/FocusMode.jsx'));
const LowSpoonMode = lazy(() => import('../modes/LowSpoonMode.jsx'));
const PartnerSupportMode = lazy(() => import('../modes/PartnerSupportMode.jsx'));
const CrisisMode = lazy(() => import('../modes/CrisisMode.jsx'));
const LandingDashboard = lazy(() => import('../components/Modes/LandingDashboard.jsx')); // Import LandingDashboard

// Normalize "Low Spoon", "low-spoon", etc. → "lowspoon"
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z]/g, '');

// Map normalized mode → component
const MODE_MAP = {
  chat: ChatMode,
  focus: FocusMode,
  lowspoon: LowSpoonMode,
  partnersupport: PartnerSupportMode,
  crisis: CrisisMode,
  dashboard: LandingDashboard, // Add LandingDashboard to MODE_MAP
};

export default function ModeRouter() {
  const { mode } = useMode();
  const key = norm(mode);
  const Screen = MODE_MAP[key] || ChatMode; // ✅ fallback is Chat, not Dashboard
  return (
    <Suspense fallback={<div className="loading">Loading…</div>}>      <Screen />    </Suspense>
  );
}