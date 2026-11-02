"use client";

import * as Popover from "@radix-ui/react-popover";
import { CloseButton } from "./close-button";
import { useCallback, useEffect, useId, useRef, useState, type AnchorHTMLAttributes, type ComponentType, type ReactNode } from "react";
import { creditBalanceChangedEvent, type AccountClient, type CreditBalance } from "./client";
import { useSession } from "./session";
import { accountMessages, formatMessage, type AccountMessages, type UiLocale } from "./i18n";

export type AccountLinkComponent = ComponentType<AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }>;

function Icon({ kind }: { kind: "person" | "works" | "assets" | "logout" }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind === "person" ? <><circle cx="12" cy="8" r="3.5" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></> : kind === "works" ? <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h4" /></> : kind === "assets" ? <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8" cy="9" r="1.5" /><path d="m3 17 5-5 4 4 4-6 5 7" /></> : <><path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5M9 12h12m-4-4 4 4-4 4" /></>}
  </svg>;
}

export function AdminLink({ client, href, children, LinkComponent = "a", ...props }: {
  client: AccountClient; href: string; children: ReactNode; LinkComponent?: AccountLinkComponent | "a";
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  const check = useCallback(() => client.isAdmin(), [client]);
  const { user: allowed } = useSession(check);
  return allowed ? <LinkComponent href={href} {...props}>{children}</LinkComponent> : null;
}

export function AccountMenu({ client, href, loginHref, plazaHref, settingsHref, onLogout, LinkComponent = "a", className = "", tour, includeAdmin = false, activePlaza = false, locale = "zh-CN", messages = accountMessages[locale] }: {
  client: AccountClient;
  href: (path: string) => string;
  loginHref: () => string;
  plazaHref: () => string;
  settingsHref?: string;
  onLogout: () => void;
  LinkComponent?: AccountLinkComponent | "a";
  className?: string; tour?: string; includeAdmin?: boolean; activePlaza?: boolean;
  locale?: UiLocale; messages?: AccountMessages;
}) {
  const { user, loading, clear } = useSession(client.getCurrentUser);
  const [open, setOpen] = useState(false);
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [subscription, setSubscription] = useState<string | null>(null);
  const [logoutError, setLogoutError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [failedAvatar, setFailedAvatar] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const titleId = useId();
  const refreshAccount = useRef<(force?: boolean) => void>(() => {});

  // Clear account-specific values before painting a newly selected account.
  if ((user?.id ?? null) !== accountId) {
    setAccountId(user?.id ?? null); setBalance(null); setSubscription(null);
  }

  useEffect(() => {
    if (user?.auth_type !== "sso") { refreshAccount.current = () => {}; return; }
    let active = true;
    let inFlight = false;
    let queued = false;
    let balanceAt = 0;
    let subscriptionAt = 0;
    const refresh = (force = false) => {
      if (!active) return;
      if (inFlight) { if (force) queued = true; return; }
      const now = Date.now();
      const needBalance = force || now - balanceAt >= 60_000;
      const needSubscription = force || now - subscriptionAt >= 60_000;
      if (!needBalance && !needSubscription) return;
      inFlight = true;
      if (needBalance) setBalanceLoading(true);
      const balanceRequest = needBalance ? client.getCreditBalance().then(value => {
        if (active && value) { setBalance(value); balanceAt = Date.now(); }
      }) : Promise.resolve();
      const subscriptionRequest = needSubscription ? client.getSubscription().then(value => {
        if (active) { setSubscription(value); subscriptionAt = Date.now(); }
      }) : Promise.resolve();
      void Promise.allSettled([balanceRequest, subscriptionRequest]).then(() => {
        inFlight = false;
        if (!active) return;
        setBalanceLoading(false);
        if (queued) { queued = false; refresh(true); }
      });
    };
    refreshAccount.current = refresh;
    refresh();
    const onChanged = () => refresh(true);
    window.addEventListener(creditBalanceChangedEvent, onChanged);
    return () => { active = false; refreshAccount.current = () => {}; window.removeEventListener(creditBalanceChangedEvent, onChanged); };
  }, [client, user?.id, user?.auth_type]);

  useEffect(() => { if (open) refreshAccount.current(); }, [open]);

  if (!loading && !user) return <a className={`account-trigger ${className}`} href={loginHref()} data-tour={tour}>{messages.login}</a>;
  const name = user?.nickname || user?.email?.split("@")[0] || messages.creator;
  const avatar = user?.avatar_url && user.avatar_url !== failedAvatar
    // eslint-disable-next-line @next/next/no-img-element -- User avatars may come from arbitrary SSO providers.
    ? <img src={user.avatar_url} alt="" referrerPolicy="no-referrer" onError={() => setFailedAvatar(user.avatar_url)} />
    : <span>{Array.from(name)[0]?.toUpperCase()}</span>;
  const status = user?.auth_type === "invite" ? messages.inviteSignedIn : messages.ssoSignedIn;

  async function logout() {
    if (!user || loggingOut) return;
    setLoggingOut(true); setLogoutError("");
    try {
      await client.logout(user);
      clear(); setOpen(false); onLogout();
    } catch { setLogoutError(messages.logoutError); setLoggingOut(false); }
  }

  return <Popover.Root open={open} onOpenChange={value => { setOpen(value); setLogoutError(""); }}>
    <Popover.Trigger asChild>
      <button type="button" className={`account-trigger ${className}`} data-tour={tour} disabled={loading} aria-label={loading ? messages.loading : formatMessage(messages.accountLabel, { name })}>
        <span className="account-trigger-avatar">{loading ? <Icon kind="person" /> : avatar}</span>
        <span>{messages.account}</span><svg className="account-chevron" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" /></svg>
      </button>
    </Popover.Trigger>
    <Popover.Portal><Popover.Content className="account-popover" data-lenis-prevent align="end" sideOffset={12} collisionPadding={16} aria-labelledby={titleId}>
      <div className="account-profile">
        <div className="account-profile-top"><Popover.Close asChild><CloseButton size="sm" aria-label={messages.close} /></Popover.Close></div>
        <div className="account-identity"><span className="account-avatar">{avatar}<span className="account-status-dot" role="img" aria-label={status} title={status} /></span><div><h2 id={titleId}>{name}</h2><p>{user?.email || (user?.auth_type === "invite" ? messages.inviteIdentity : messages.creatorIdentity)}</p></div></div>
        {user?.auth_type === "sso" ? <span className="account-plan-label" aria-label={messages.currentPlan}>{subscription || "…"}</span> : null}
      </div>
      {user?.auth_type === "sso" ? <section className="account-credits" aria-label={messages.credits} aria-busy={balanceLoading}>
        <div><span>{balance && balance.available < 0 ? messages.arrears : messages.available}</span><strong>{balance ? balance.available.toLocaleString(locale) : balanceLoading ? "…" : "—"}</strong></div><LinkComponent className="account-recharge" href={href("/recharge")} onClick={() => setOpen(false)}>{messages.recharge}</LinkComponent>
        {!balance || balance.reserved > 0 ? <p>{!balance && balanceLoading ? messages.creditsLoading : balance ? formatMessage(messages.creditsReserved, { count: balance.reserved.toLocaleString(locale) }) : messages.creditsError}</p> : null}
      </section> : null}
      <nav className="account-actions" aria-label={messages.space}>
        {settingsHref && user?.auth_type === "sso" ? <LinkComponent href={settingsHref} onClick={() => setOpen(false)}><Icon kind="person" /><span>{locale === "en" ? "Account settings" : locale === "zh-Hant" ? "帳號設定" : "账号设置"}</span><b aria-hidden="true">›</b></LinkComponent> : null}
        <LinkComponent href={href("/history")} onClick={() => setOpen(false)}><Icon kind="works" /><span>{messages.works}</span><b aria-hidden="true">›</b></LinkComponent>
        <LinkComponent href={href("/my-assets")} onClick={() => setOpen(false)}><Icon kind="assets" /><span>{messages.myAssets}</span><b aria-hidden="true">›</b></LinkComponent>
        <div className="account-actions-divider" role="separator" />
        <LinkComponent href={href("/assets")} onClick={() => setOpen(false)}><Icon kind="assets" /><span>{messages.assets}</span><b aria-hidden="true">›</b></LinkComponent>
        <a href={plazaHref()} aria-current={activePlaza ? "page" : undefined} onClick={() => setOpen(false)}><Icon kind="assets" /><span>{messages.plaza}</span><b aria-hidden="true">›</b></a>
        {includeAdmin ? <AdminLink client={client} href={href("/admin")} LinkComponent={LinkComponent} onClick={() => setOpen(false)}><Icon kind="person" /><span>{messages.admin}</span><b aria-hidden="true">›</b></AdminLink> : null}
      </nav>
      <div className="account-footer"><div><span>{messages.id}</span><code>{user?.id}</code></div><button className="account-logout" type="button" disabled={loggingOut} onClick={() => void logout()} aria-label={messages.logoutLabel}><Icon kind="logout" /><span>{loggingOut ? messages.loggingOut : messages.logout}</span></button></div>
      {logoutError ? <span className="account-copy-status" role="alert">{logoutError}</span> : null}
    </Popover.Content></Popover.Portal>
  </Popover.Root>;
}
