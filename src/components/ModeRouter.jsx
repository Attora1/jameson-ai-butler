import React from "react";
import { useMode } from "../context/ModeContext.jsx";

// Import your mode pages (or keep placeholders to avoid crashes)
import LandingDashboard from "./Modes/LandingDashboard.jsx"; // For chat mode
import LowSpoon from "./Modes/LowSpoon.jsx";
import Focus from "./Modes/Focus.jsx";
import PartnerSupport from "./Modes/PartnerSupport.jsx";
// Optional crisis:
const CrisisMode = () => <div className="mode crisis">Crisis Mode</div>;

// Fail-safe placeholders if any imports are temporarily missing
const Fallback = ({ name }) => <div className="mode fallback">Missing: {name}</div>;

export default function ModeRouter() {
  const { mode } = useMode();

  switch (mode) {
    case "lowSpoon":
      return LowSpoon ? <LowSpoon /> : <Fallback name="LowSpoonMode" />;
    case "focus":
      return Focus ? <Focus /> : <Fallback name="FocusMode" />;
    case "partner":
      return PartnerSupport ? <PartnerSupport /> : <Fallback name="PartnerSupportMode" />;
    case "crisis":
      return <CrisisMode />;
    case "chat":
    default:
      return LandingDashboard ? <LandingDashboard /> : <Fallback name="ChatMode" />;
  }
}
