"use client";

export type AuthUser = {
  id: string;
  email: string | null;
  nickname: string | null;
  avatar_url: string | null;
  providers: string[];
  auth_type: "sso" | "invite";
};
export type CreditBalance = { available: number; reserved: number; consumed: number; revoked: number };
export const creditBalanceChangedEvent = "narrativeos:credits-changed";
export const authChangedEvent = "forge-auth-changed";
export const inviteStorageKey = "webgal_invite_code";
export const inviteHeaderName = "X-WebGAL-Invite-Code";

// Browser identity belongs to the session, not to each mounted component.
// This source is shared by the portal provider and every account adapter.
const sessions = new Map<string, { generation: number; value?: unknown; pending?: Promise<unknown> }>();
let listening = false;
function sessionValue<T>(key: string, load: () => Promise<T | null>): Promise<T | null> {
  if (typeof window === 'undefined') return load(); // Never share identities across SSR requests.
  if (!listening) {
    window.addEventListener?.(authChangedEvent, () => {
      for (const entry of sessions.values()) { entry.generation++; entry.value = undefined; entry.pending = undefined; }
    });
    listening = true;
  }
  let entry = sessions.get(key);
  if (!entry) { entry = { generation: 0 }; sessions.set(key, entry); }
  if (entry.value !== undefined) return Promise.resolve(entry.value as T);
  if (entry.pending) return entry.pending as Promise<T | null>;
  const target = entry, generation = entry.generation;
  const pending = load().then(value => {
    if (target.generation !== generation) return sessionValue(key, load);
    // A failure/null stays retryable; a known identity lasts until the auth event.
    if (value !== null) target.value = value;
    return value;
  }).finally(() => { if (target.pending === pending) target.pending = undefined; });
  entry.pending = pending;
  return pending;
}

export function getStoredInviteCode() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(inviteStorageKey)?.trim() || "";
}
export function setStoredInviteCode(code: string) {
  window.localStorage.setItem(inviteStorageKey, code.trim());
}
export function clearStoredInviteCode() {
  window.localStorage.removeItem(inviteStorageKey);
}
export function inviteHeaders(): Record<string, string> {
  const code = getStoredInviteCode();
  return code ? { [inviteHeaderName]: encodeURIComponent(code) } : {};
}
export function jsonAuthHeaders(base?: HeadersInit) {
  const headers = new Headers(base);
  headers.set("Content-Type", "application/json");
  for (const [key, value] of Object.entries(inviteHeaders())) headers.set(key, value);
  return headers;
}

export function getPortalSession<T>(url = "/api/auth/me"): Promise<T | null> {
  return sessionValue(`portal:${url}`, async () => { try {
    const response = await fetch(url, { credentials: "include", cache: "no-store" });
    return response.ok ? await response.json() as T : null;
  } catch { return null; } });
}

export async function logoutSession(url: string) {
  const response = await fetch(url, { method: "POST", credentials: "include" });
  if (!response.ok) throw new Error("Logout failed");
}

export function createAccountClient(options: {
  apiUrl: (path: string) => string;
  logoutUrl: () => string;
  portalSessionUrl?: string;
  sessionUrl?: string;
}) {
  async function request<T>(path: string): Promise<T> {
    const response = await fetch(options.apiUrl(path), {
      credentials: "include", cache: "no-store", headers: inviteHeaders(),
    });
    if (!response.ok) throw new Error(`Account request failed (${response.status})`);
    return await response.json() as T;
  }
  return {
    async getCurrentUser(): Promise<AuthUser | null> {
      if (!options.sessionUrl) {
        const current = await sessionValue(`forge:${options.apiUrl('/auth/me')}:${getStoredInviteCode()}`, async () => {
          try { return await request<AuthUser>('/auth/me'); } catch { return null; }
        });
        if (current || !options.portalSessionUrl) return current;
      }
      const user = await getPortalSession<Omit<AuthUser, "avatar_url" | "auth_type"> & { avatarUrl: string | null; auth_type?: AuthUser['auth_type'] }>(options.sessionUrl || options.portalSessionUrl);
      if (user) return { ...user, avatar_url: user.avatarUrl, providers: user.providers || [], auth_type: user.auth_type === 'invite' ? 'invite' : 'sso' };
      // Portal SSO is the primary source. An explicit invitation is a different
      // credential and still resolves through Forge when there is no SSO session.
      if (options.sessionUrl && getStoredInviteCode()) return sessionValue(`forge:${options.apiUrl('/auth/me')}:${getStoredInviteCode()}`, async () => {
        try { return await request<AuthUser>('/auth/me'); } catch { return null; }
      });
      return null;
    },
    async getCreditBalance(): Promise<CreditBalance | null> {
      try { return await request<CreditBalance>("/credits/balance"); } catch { return null; }
    },
    async getSubscription(): Promise<string> {
      const data = await request<{ subscription?: { name?: string } | null }>("/payments/subscription");
      return data.subscription?.name || "Free";
    },
    async isAdmin(): Promise<boolean> {
      try { await request("/admin/me"); return true; } catch { return false; }
    },
    async logout(user: AuthUser) {
      if (user.auth_type === "sso") await logoutSession(options.logoutUrl());
      clearStoredInviteCode();
      window.dispatchEvent(new Event(authChangedEvent));
    },
  };
}

export type AccountClient = ReturnType<typeof createAccountClient>;
