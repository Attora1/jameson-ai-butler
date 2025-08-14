import { createContext, useContext, useMemo, useState } from 'react';
import { SPOON_MAX, DEFAULT_SPOONS, clampSpoons } from '../constants/spoons';

export const SpoonContext = createContext();

export function SpoonProvider({ children }) {
  // Previously defaulted to 12; now we allow "unset"
  const [spoons, setSpoons] = useState(DEFAULT_SPOONS);

  const value = useMemo(() => ({
    spoons,
    spoonMax: SPOON_MAX,
    isUnset: spoons === undefined,
    // Accepts numbers or undefined (to explicitly clear/unset)
    setSpoons: (n) => {
      if (n === undefined) return setSpoons(undefined);
      return setSpoons(clampSpoons(n));
    },
    // Optional helpers (handy for buttons/shortcuts)
    increment: (delta = 1) => {
      const base = typeof spoons === 'number' ? spoons : 0;
      setSpoons(clampSpoons(base + delta));
    },
    clear: () => setSpoons(undefined),
  }), [spoons]);

  return (
    <SpoonContext.Provider value={value}>
      {children}
    </SpoonContext.Provider>
  );
}

export const useSpoons = () => useContext(SpoonContext);