import React, { createContext, useState, useRef } from 'react';

export const SpoonContext = createContext({
  spoonCount: 12,
  setSpoonCount: () => {},
  prevSpoonRef: { current: 12 },
  setMessages: () => {},
});

export const SpoonProvider = ({ children, setMessages }) => {
  const [spoonCount, setSpoonCountRaw] = useState(12);
  const prevSpoonRef = useRef(12);
  const debounceRef = useRef(null);


  const setSpoonCount = (newCount) => {
    setSpoonCountRaw(newCount);
  
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const prev = prevSpoonRef.current;
  
      if (prev !== newCount && typeof newCount === 'number') {
        if (setMessages) {
          setMessages(prevMsgs => [
            ...prevMsgs,
            {
              isUser: false,
              text: `[AELI] Spoons adjusted from ${prev} to ${newCount}. Let’s take it ${newCount < prev ? 'slow' : 'up a notch'}.`,
            },
          ]);
        }
        prevSpoonRef.current = newCount;
      }
    }, 1500);
  };
  
  

  return (
    <SpoonContext.Provider value={{ spoonCount, setSpoonCount, prevSpoonRef, setMessages }}>
      {children}
    </SpoonContext.Provider>
  );
};
