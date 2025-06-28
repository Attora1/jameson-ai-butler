import React, { useState } from 'react';
import ModeLayout from '../Modes/ModeLayout.jsx';
import TetherCanvas from '../TetherCanvas.jsx';

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
          subtitle="Here to support you, together."
          leftColumn={<p>This is your safe, shared space to co-regulate.</p>}
          rightColumn={<>
            <p>"You don't have to carry it alone. We'll find calm together."</p>
            <button className="tether-button" onClick={() => setShowTether(true)}>Begin Tether Activity</button>
          </>}
        />
      )}
    </>
  );
}
