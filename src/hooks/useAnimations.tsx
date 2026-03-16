import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface AnimationsContextType {
  animationsEnabled: boolean;
  toggleAnimations: () => void;
}

const AnimationsContext = createContext<AnimationsContextType>({
  animationsEnabled: true,
  toggleAnimations: () => {},
});

export function AnimationsProvider({ children }: { children: ReactNode }) {
  const [animationsEnabled, setAnimationsEnabled] = useState(() => {
    try {
      return localStorage.getItem("animations-enabled") !== "false";
    } catch {
      return true;
    }
  });

  const toggleAnimations = useCallback(() => {
    setAnimationsEnabled((prev) => {
      const next = !prev;
      try { localStorage.setItem("animations-enabled", String(next)); } catch {}
      return next;
    });
  }, []);

  return (
    <AnimationsContext.Provider value={{ animationsEnabled, toggleAnimations }}>
      {children}
    </AnimationsContext.Provider>
  );
}

export const useAnimations = () => useContext(AnimationsContext);
