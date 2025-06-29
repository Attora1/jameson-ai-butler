import React, { useState } from 'react';
import ModeLayout from '../Modes/ModeLayout.jsx';
import TetherCanvas from '../Modes/TetherCanvas.jsx';
import PartnerSupportHeader from './PartnerSupportHeader.jsx'; // adjust path if needed
import CoRegulationTimer from './CoRegulationTimer';

import '../../styles/modes-css/PartnerSupport.css';

export default function PartnerSupport({ settings }) {
  const [showTether, setShowTether] = useState(false);

  return (
    <>
      {showTether ? (
        <TetherCanvas onComplete={() => setShowTether(false)} />
      ) : (
        <ModeLayout
          className="partner_support-theme"
          heading="Partner Support Mode"
          subtitle="Your safe, shared space to co-regulate."
          headerRight={<PartnerSupportHeader />}
          leftColumn={<CoRegulationTimer />}
          rightColumn={
            <>
              <p>"You don't have to carry it alone."</p>
              <button className="tether-button" onClick={() => setShowTether(true)}>
                Begin Tether Activity
              </button>
            </>
          }
        />
      )}
    </>
  );
}
