import React from 'react';
import { SpoonProvider } from './context/SpoonContext.jsx';
import { ModeProvider } from "./context/ModeContext.jsx";
import AppContent from './components/AppContent.jsx'; // Import AppContent

function App() {
  return (
    <SpoonProvider>
      <ModeProvider>
        <AppContent />
      </ModeProvider>
    </SpoonProvider>
  );
}

export default App; // Added comment to force change