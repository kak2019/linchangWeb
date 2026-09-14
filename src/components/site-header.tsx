"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { useLenis } from "lenis/react";
import { usePathname } from "next/navigation";
import { navLinks, WORKBENCH_URL } from "@/lib/content";
import { useI18n } from "@/components/i18n-provider";
import { useAuthSession } from "@/components/auth-session";
import { localizedPath, loginPath, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import BrandLogo from "@/components/brand-logo";
import WeChatCommunity from "@/components/wechat-community";

type WorkbenchAuthMode = "sso" | "invite" | "sso_or_invite";

export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [workbenchAuthMode, setWorkbenchAuthMode] = useState<WorkbenchAuthMode | null>(null);
  const authMenuRef = useRef<HTMLDivElement>(null);
  const lenis = useLenis();
  const pathname = usePathname();
  const { locale, messages, switchLocale } = useI18n();
  const { user, loading, logout } = useAuthSession();
  const onHome =
    pathname === "/" ||
    pathname === "/en" ||
    pathname === "/en/" ||
    pathname === "/zh-hant" ||
    pathname === "/zh-hant/";
  const homeHref = localizedPath(locale);
  const signInHref = loginPath(locale);
  const onAuthPage = /(^|\/)login\/?$/.test(pathname);
  const accountLabel = (user?.email || user?.nickname || "").trim().charAt(0);
  const showPortalAuth = workbenchAuthMode === "sso" || workbenchAuthMode === "sso_or_invite";
  const languageOptions: Array<{ locale: Locale; label: string; title: string }> = [
    { locale: "zh-CN", label: "简", title: "简体中文" },
    { locale: "en", label: "EN", title: "English" },
    { locale: "zh-Hant", label: "繁", title: "繁體中文" },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!authOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!authMenuRef.current?.contains(event.target as Node)) {
        setAuthOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAuthOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [authOpen]);

  useEffect(() => {
    let active = true;
    const authConfigUrl = `${WORKBENCH_URL.replace(/\/$/, "")}/api/forge/auth/config`;
    void fetch(authConfigUrl, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        const payload = (await response.json()) as { mode?: unknown };
        return payload.mode === "sso" || payload.mode === "invite" || payload.mode === "sso_or_invite"
          ? payload.mode
          : null;
      })
      .then((mode) => {
        if (active) setWorkbenchAuthMode(mode);
      })
      .catch(() => {
        if (active) setWorkbenchAuthMode(null);
      });
    return () => {
      active = false;
    };
  }, []);

  const goToSection = (
    event: MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    if (!onHome) {
      setOpen(false);
      return;
    }

    event.preventDefault();
    setOpen(false);

    if (href === "#top") {
      if (lenis) lenis.scrollTo(0, { duration: 1.3 });
      else window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const target = document.querySelector<HTMLElement>(href);
    if (!target) return;
    const currentScroll = lenis?.scroll ?? window.scrollY;
    const targetTop = target.getBoundingClientRect().top + currentScroll;
    const topOffset = href === "#about" ? 148 : 82;
    const destination = Math.max(0, targetTop - topOffset);

    if (lenis) lenis.scrollTo(destination, { duration: 1.3 });
    else window.scrollTo({ top: destination, behavior: "smooth" });
  };

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-[60] transition-[height,box-shadow,background-color] duration-300",
        scrolled
          ? "glass-paper h-16 shadow-[0_10px_36px_rgba(53,42,30,0.12)]"
          : "h-[72px] bg-paper/80 backdrop-blur-md",
      )}
    >
      <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-5 md:px-[4.5vw]">
        <a
          href={onHome ? "#top" : homeHref}
          onClick={(event) => goToSection(event, "#top")}
          className="group flex items-center gap-3"
          aria-label={messages.ui.header.backToTop}
        >
          <BrandLogo className="transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-105" />
          <span className="flex flex-col gap-0.5">
            <strong className="font-serif text-[15px] font-semibold leading-none text-ink">
              {messages.ui.header.brand}
            </strong>
            <small className="text-[9px] tracking-[0.2em] text-ink-muted">
              NARRATIVEOS
            </small>
          </span>
        </a>

        <nav className="hidden items-center gap-4 xl:gap-7 lg:flex" aria-label={messages.ui.header.mainNav}>
          {navLinks.map((link, index) => (
            <a
              key={link.href}
              href={onHome ? link.href : `${homeHref}${link.href}`}
              onClick={(event) => goToSection(event, link.href)}
              className="group relative py-2 text-xs text-ink-soft transition-colors hover:text-cinnabar"
            >
              {messages.ui.header.nav[index]}
              <span
                className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-cinnabar transition-transform duration-300 group-hover:scale-x-100"
                aria-hidden
              />
            </a>
          ))}
          <WeChatCommunity />
          <div className="flex items-center gap-0.5 rounded-full border border-line p-0.5" role="group" aria-label={messages.ui.header.language}>
            {languageOptions.map((option) => (
              <button
                key={option.locale}
                type="button"
                title={option.title}
                aria-label={option.title}
                aria-pressed={locale === option.locale}
                onClick={() => {
                  setAuthOpen(false);
                  switchLocale(option.locale);
                }}
                className={cn(
                  "rounded-full px-2 py-1 text-[9px] tracking-wide transition-colors",
                  locale === option.locale ? "bg-ink text-paper-soft" : "text-ink-muted hover:text-ink",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          {showPortalAuth && !loading &&
            (user ? (
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-line text-[12px] text-ink">
                  {accountLabel}
                </span>
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="text-xs text-ink-soft transition-colors hover:text-cinnabar"
                >
                  {messages.ui.header.logout}
                </button>
              </div>
            ) : (
              <div className="relative shrink-0" ref={authMenuRef}>
                <button
                  type="button"
                  aria-expanded={authOpen}
                  aria-haspopup="menu"
                  onClick={() => setAuthOpen((value) => !value)}
                  className="inline-flex items-center gap-1 text-xs text-ink-soft transition-colors hover:text-cinnabar"
                >
                  {messages.ui.header.login}
                  <svg
                    viewBox="0 0 12 12"
                    className={cn(
                      "h-2.5 w-2.5 transition-transform duration-200",
                      authOpen && "rotate-180",
                    )}
                    aria-hidden
                  >
                    <path
                      d="M2.5 4.25 6 7.75l3.5-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <div
                  role="menu"
                  className={cn(
                    "absolute right-0 top-[calc(100%+10px)] z-[70] min-w-[8.5rem] rounded-md border border-line bg-paper py-1 shadow-[0_12px_32px_rgba(53,42,30,0.14)] transition-all duration-150",
                    authOpen
                      ? "visible translate-y-0 opacity-100"
                      : "invisible -translate-y-1 opacity-0",
                  )}
                >
                  <a
                    role="menuitem"
                    href={signInHref}
                    onClick={() => setAuthOpen(false)}
                    className="block px-3 py-2 text-xs text-ink-soft transition-colors hover:bg-paper-soft hover:text-cinnabar"
                  >
                    {messages.ui.header.login}
                  </a>
                  <a
                    role="menuitem"
                    href={`${signInHref}?mode=register`}
                    onClick={() => setAuthOpen(false)}
                    className="block px-3 py-2 text-xs text-ink-soft transition-colors hover:bg-paper-soft hover:text-cinnabar"
                  >
                    {messages.ui.header.register}
                  </a>
                </div>
              </div>
            ))}
          {!onAuthPage && (
            <a
              href={WORKBENCH_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-line px-4 py-2.5 text-xs text-ink transition-all hover:-translate-y-0.5 hover:border-cinnabar/50 hover:text-cinnabar"
            >
              {messages.ui.header.enterWorkbench}
              <span aria-hidden className="text-cinnabar">→</span>
            </a>
          )}
        </nav>

        <div className="flex items-center gap-2 lg:hidden">
          <WeChatCommunity compact />
          <button
            type="button"
            className="flex h-11 w-11 flex-col items-center justify-center gap-[7px]"
            aria-label={open ? messages.ui.header.closeNav : messages.ui.header.openNav}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            <span
              className={cn(
                "h-px w-6 bg-ink transition-all duration-300",
                open && "translate-y-1 rotate-45",
              )}
            />
            <span
              className={cn(
                "h-px w-6 bg-ink transition-all duration-300",
                open && "-translate-y-1 -rotate-45",
              )}
            />
          </button>
        </div>
      </div>

      {/* 移动端抽屉 */}
      <div
        className={cn(
          "absolute inset-x-0 top-full max-h-[calc(100svh-72px)] origin-top overflow-y-auto border-b border-line bg-paper px-5 pb-7 pt-2 shadow-[0_24px_50px_rgba(53,42,30,0.14)] transition-all duration-300 lg:hidden",
          open
            ? "visible translate-y-0 opacity-100"
            : "invisible -translate-y-3 opacity-0",
        )}
      >
        <nav className="flex flex-col" aria-label={messages.ui.header.mobileNav}>
          {navLinks.map((link, index) => (
            <a
              key={link.href}
              href={onHome ? link.href : `${homeHref}${link.href}`}
              onClick={(event) => goToSection(event, link.href)}
              className="flex items-center justify-between border-b border-line/70 py-3.5 font-serif text-[15px] text-ink"
            >
              {messages.ui.header.nav[index]}
              <span className="text-[10px] text-gold" aria-hidden>
                {String(navLinks.indexOf(link) + 1).padStart(2, "0")}
              </span>
            </a>
          ))}
          {showPortalAuth && !loading &&
            (user ? (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  void logout();
                }}
                className="flex items-center justify-between border-b border-line/70 py-3.5 text-[15px] text-ink"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-sm">
                  {accountLabel}
                </span>
                <span className="text-[11px] text-ink-muted">{messages.ui.header.logout}</span>
              </button>
            ) : (
              <>
              <a
                href={signInHref}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between border-b border-line/70 py-3.5 font-serif text-[15px] text-ink"
              >
                {messages.ui.header.login}
                <span className="text-[10px] text-gold" aria-hidden>
                  →
                </span>
              </a>
              <a
                href={`${signInHref}?mode=register`}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between border-b border-line/70 py-3.5 font-serif text-[15px] text-ink"
              >
                {messages.ui.header.register}
                <span className="text-[10px] text-gold" aria-hidden>
                  →
                </span>
              </a>
              </>
            ))}
          {!onAuthPage && (
            <a
              href={WORKBENCH_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="mt-6 inline-flex items-center justify-between rounded-md bg-cinnabar px-5 py-3.5 text-sm text-paper-soft shadow-[0_12px_28px_rgba(112,34,46,0.25)]"
            >
              {messages.ui.header.enterWorkbench}
              <span aria-hidden>→</span>
            </a>
          )}
          <div className="mt-4 flex items-center justify-between border-t border-line/70 pt-4" role="group" aria-label={messages.ui.header.language}>
            <span className="text-[10px] tracking-[0.16em] text-ink-muted">{messages.ui.header.language}</span>
            <div className="flex items-center gap-1">
              {languageOptions.map((option) => (
                <button
                  key={option.locale}
                  type="button"
                  title={option.title}
                  aria-label={option.title}
                  aria-pressed={locale === option.locale}
                  onClick={() => switchLocale(option.locale)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-[10px] transition-colors",
                    locale === option.locale ? "border-ink bg-ink text-paper-soft" : "border-line text-ink-muted hover:text-ink",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
