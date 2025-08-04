import { useState, useCallback } from 'react';

const FACTS_KEY = 'AELI_FACTS';

function loadFacts() {
  try {
    const facts = localStorage.getItem(FACTS_KEY);
    return facts ? JSON.parse(facts) : [];
  } catch (e) {
    console.error("Failed to load facts from localStorage", e);
    return [];
  }
}

function saveFacts(facts) {
  try {
    localStorage.setItem(FACTS_KEY, JSON.stringify(facts));
  } catch (e) {
    console.error("Failed to save facts to localStorage", e);
  }
}

export function useFacts() {
  const [facts, setFacts] = useState(loadFacts());

  const addFact = useCallback((fact) => {
    const newFacts = [...facts, fact];
    setFacts(newFacts);
    saveFacts(newFacts);
  }, [facts]);

  const clearFacts = useCallback(() => {
    setFacts([]);
    saveFacts([]);
  }, []);

  return { facts, addFact, clearFacts };
}
