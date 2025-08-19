import { createContext, useContext } from "react";

export const SpoonContext = createContext();

export const useSpoons = () => useContext(SpoonContext);
