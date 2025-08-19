import { createContext, useContext, useReducer, useMemo } from "react";

const ModeContext = createContext(null);

const initial = {
  mode: "chat",        // "chat" | "lowSpoon" | "focus" | "partner" | "crisis"
  lastMode: null,      // for temporary jumps (e.g., crisis → back)
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_MODE":
      return { ...state, lastMode: state.mode, mode: action.mode };
    case "RETURN_TO_LAST":
      return state.lastMode ? { ...state, mode: state.lastMode, lastMode: null } : state;
    default:
      return state;
  }
}

export function ModeProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initial);

  const api = useMemo(() => ({
    mode: state.mode,
    lastMode: state.lastMode,
    setMode: (mode) => dispatch({ type: "SET_MODE", mode }),
    returnToLast: () => dispatch({ type: "RETURN_TO_LAST" }),
  }), [state.mode, state.lastMode]);

  return <ModeContext.Provider value={api}>{children}</ModeContext.Provider>;
}

export function useMode() {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error("useMode must be used inside <ModeProvider>");
  return ctx;
}
