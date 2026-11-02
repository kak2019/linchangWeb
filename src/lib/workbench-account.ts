"use client";

import { createAccountClient } from "@narrativeos/ui/client";
import { WORKBENCH_URL } from "@/lib/content";
import { loginPath, teacherEcosystemPath, type Locale } from "@/lib/i18n";

export { clearStoredInviteCode, creditBalanceChangedEvent, jsonAuthHeaders, type AuthUser, type CreditBalance } from "@narrativeos/ui/client";

export function workbenchHref(path: string) { return `${WORKBENCH_URL.replace(/\/$/, "")}${path}`; }
export function ssoLoginUrl(locale: Locale = "zh-CN") {
  return typeof window === "undefined" ? loginPath(locale) : `${loginPath(locale)}?next=${encodeURIComponent(location.href)}`;
}
export function teacherResourcePlazaUrl(locale: Locale = "zh-CN") { return teacherEcosystemPath(locale); }

export const accountClient = createAccountClient({
  sessionUrl: "/api/auth/me",
  apiUrl: path => `/api/workbench-account${path}`,
  portalSessionUrl: "/api/auth/me",
  logoutUrl: () => "/api/auth/logout",
});

export const { getCurrentUser, getCreditBalance } = accountClient;
