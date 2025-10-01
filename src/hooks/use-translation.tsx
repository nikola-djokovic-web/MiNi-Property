
'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import type { Dictionary } from '@/dictionaries';

interface TranslationContextType {
  dict: Dictionary;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export function TranslationProvider({ children, dict }: { children: ReactNode, dict: Dictionary }) {
  return (
    <TranslationContext.Provider value={{ dict }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
}
