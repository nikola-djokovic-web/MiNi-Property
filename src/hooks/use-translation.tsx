'use client';

import { createContext, useContext } from 'react';

type Dictionary = Record<string, any>;

const TranslationContext = createContext<Dictionary>({});

export function useTranslation() {
  return useContext(TranslationContext);
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
