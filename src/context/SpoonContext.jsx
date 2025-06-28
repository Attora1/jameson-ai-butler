// SpoonContext.js
import React, { createContext, useState } from 'react';

export const SpoonContext = createContext({
  spoonCount: 12,
  setSpoonCount: () => {},
});

export const SpoonProvider = ({ children }) => {
  const [spoonCount, setSpoonCount] = useState(12);

  return (
    <SpoonContext.Provider value={{ spoonCount, setSpoonCount }}>
      {children}
    </SpoonContext.Provider>
  );
};
