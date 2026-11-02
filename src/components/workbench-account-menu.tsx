"use client";

import { AccountMenu } from "@narrativeos/ui";
import { accountClient, ssoLoginUrl, teacherResourcePlazaUrl, workbenchHref } from "@/lib/workbench-account";
import { getMessages, type Locale } from "@/lib/i18n";

export function WorkbenchAccountMenu({ locale = "zh-CN", className, tour }: {
  locale?: Locale; className?: string; tour?: string;
}) {
  const settingsHref = typeof window === 'undefined' ? '/account' : `/account?returnTo=${encodeURIComponent(window.location.href)}`;
  return <AccountMenu client={accountClient} href={workbenchHref}
    loginHref={() => ssoLoginUrl(locale)} plazaHref={() => teacherResourcePlazaUrl(locale)} settingsHref={settingsHref}
    onLogout={() => window.location.reload()} includeAdmin
    locale={locale} messages={getMessages(locale).ui.account} className={className} tour={tour} />;
}
