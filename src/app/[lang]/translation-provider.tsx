"use client";

import { createContext, useContext } from "react";
import type { Dictionary } from "@/dictionaries";

const TranslationContext = createContext<Dictionary>({} as Dictionary);

export function useTranslation() {
  const dict = useContext(TranslationContext);
  return { dict };
}

export function TranslationProvider({
  dict,
  children,
}: {
  dict: Dictionary;
  children: React.ReactNode;
}) {
  return (
    <TranslationContext.Provider value={dict}>
      {children}
    </TranslationContext.Provider>
  );
}
