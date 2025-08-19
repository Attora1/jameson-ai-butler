import React from "react";
import { useMode } from "../context/ModeContext.jsx";

// Import your mode pages (or keep placeholders to avoid crashes)
import ChatMode from "../modes/ChatMode.jsx";
import LowSpoonMode from "../modes/LowSpoonMode.jsx";
import FocusMode from "../modes/FocusMode.jsx";
import PartnerSupportMode from "../modes/PartnerSupportMode.jsx";
// Optional crisis:
const CrisisMode = () => <div className="mode crisis">Crisis Mode</div>;

// Fail-safe placeholders if any imports are temporarily missing
const Fallback = ({ name }) => <div className="mode fallback">Missing: {name}</div>;

export default function ModeRouter() {
  const { mode } = useMode();

  switch (mode) {
    case "lowSpoon":
      return LowSpoonMode ? <LowSpoonMode /> : <Fallback name="LowSpoonMode" />;
    case "focus":
      return FocusMode ? <FocusMode /> : <Fallback name="FocusMode" />;
    case "partner":
      return PartnerSupportMode ? <PartnerSupportMode /> : <Fallback name="PartnerSupportMode" />;
    case "crisis":
      return <CrisisMode />;
    case "chat":
    default:
      return ChatMode ? <ChatMode /> : <Fallback name="ChatMode" />;
  }
}
