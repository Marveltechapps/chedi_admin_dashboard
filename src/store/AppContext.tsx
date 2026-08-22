import { createContext, useContext, type ReactNode } from 'react';
import { useAppLogic, type AppLogic } from './useAppLogic';

const AppCtx = createContext<AppLogic | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const logic = useAppLogic();
  return <AppCtx.Provider value={logic}>{children}</AppCtx.Provider>;
}

export function useApp(): AppLogic {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
