"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { authChangedEvent, getPortalSession, logoutSession } from "@narrativeos/ui/client";
import { useSession } from "@narrativeos/ui/session";
import type { AuthUser } from "@/lib/auth/types";

type AuthSessionValue = {
  user: AuthUser | null; loading: boolean; refresh: () => Promise<void>; logout: () => Promise<void>;
};
const AuthSessionContext = createContext<AuthSessionValue | null>(null);
const loadSession = () => getPortalSession<AuthUser>();

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const { user, loading, refresh, clear } = useSession(loadSession);
  const logout = useCallback(async () => {
    await logoutSession("/api/auth/logout");
    clear();
    window.dispatchEvent(new Event(authChangedEvent));
  }, [clear]);
  const value = useMemo(() => ({ user, loading, refresh, logout }), [user, loading, refresh, logout]);
  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext);
  if (!context) throw new Error("useAuthSession must be used within AuthSessionProvider");
  return context;
}
