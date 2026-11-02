"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { authChangedEvent } from "./client";

/** The same session lifecycle is used by the portal header and account menu. */
export function useSession<T>(load: () => Promise<T | null>) {
  const [user, setUser] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const generation = useRef({ value: 0 });
  const refresh = useCallback(async () => {
    const state = generation.current;
    const current = ++state.value;
    let value: T | null = null;
    try { value = await load(); } catch { /* Failed sessions render as signed out. */ }
    if (state.value === current) { setUser(value); setLoading(false); }
  }, [load]);
  useEffect(() => {
    const state = generation.current;
    void refresh();
    const onChanged = () => { void refresh(); };
    window.addEventListener(authChangedEvent, onChanged);
    return () => { ++state.value; window.removeEventListener(authChangedEvent, onChanged); };
  }, [refresh]);
  const clear = useCallback(() => { ++generation.current.value; setUser(null); }, []);
  return { user, loading, refresh, clear };
}
