"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { WORKBENCH_URL } from "@/lib/content";
import { useI18n } from "@/components/i18n-provider";
import { useAuthSession } from "@/components/auth-session";
import { localizedPath, loginPath } from "@/lib/i18n";
import { WeChatIcon } from "@/components/wechat-community";
import { cn } from "@/lib/utils";
import { safeAuthNext } from "@/lib/auth/redirect";

type Mode = "login" | "register";
type LoginMethod = "password" | "code";

const inputClass =
  "h-12 rounded-md border border-line bg-white px-4 text-sm text-ink outline-none transition-colors focus:border-cinnabar/60";

export default function LoginForm() {
  const { locale, messages } = useI18n();
  const copy = messages.ui.auth;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuthSession();
  // Resolve at navigation time so SSR never guesses the browser's portal origin.
  const nextUrl = () => safeAuthNext(searchParams.get("next"), window.location.origin, WORKBENCH_URL);
  const [mode, setMode] = useState<Mode>(
    searchParams.get("mode") === "register" ? "register" : "login",
  );
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(searchParams.get("error") || "");

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((current) => current - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const switchMode = (nextMode: Mode) => {
    setMode(nextMode);
    setError("");
    setMessage("");
    setCode("");
    const params = new URLSearchParams(searchParams.toString());
    if (nextMode === "register") params.set("mode", "register");
    else params.delete("mode");
    const query = params.toString();
    router.replace(`${loginPath(locale)}${query ? `?${query}` : ""}`);
  };

  const sendCode = async () => {
    setError("");
    setMessage("");
    setSending(true);
    try {
      const response = await fetch("/api/auth/email/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        cooldown?: number;
      };
      if (!response.ok) {
        setError(data.error || copy.errorSend);
        return;
      }
      setMessage(copy.sent);
      setCooldown(data.cooldown ?? 60);
    } catch {
      setError(copy.errorSend);
    } finally {
      setSending(false);
    }
  };

  const finishAuth = async (response: Response, fallback: string) => {
    const data = (await response.json()) as { ok?: boolean; error?: string };
    if (!response.ok) {
      setError(data.error || fallback);
      return false;
    }
    await refresh();
    router.push(nextUrl());
    return true;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (mode === "register") {
      if (password.length < 8) {
        setError(copy.errorPassword);
        return;
      }
      if (password !== confirmPassword) {
        setError(copy.errorPasswordMismatch);
        return;
      }
    }

    setSubmitting(true);
    try {
      if (mode === "register") {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password, code }),
        });
        await finishAuth(response, copy.errorVerify);
        return;
      }

      if (loginMethod === "password") {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        });
        await finishAuth(response, copy.errorCredentials);
        return;
      }

      const response = await fetch("/api/auth/email/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, code }),
      });
      await finishAuth(response, copy.errorVerify);
    } catch {
      setError(mode === "register" ? copy.errorVerify : copy.errorCredentials);
    } finally {
      setSubmitting(false);
    }
  };

  const showCode = mode === "register" || loginMethod === "code";
  const showPassword = mode === "register" || loginMethod === "password";

  return (
    <form onSubmit={submit} className="flex w-full flex-col gap-4">
      <div className="grid grid-cols-2 rounded-full border border-line p-1">
        <button
          type="button"
          onClick={() => switchMode("login")}
          className={cn(
            "h-9 rounded-full text-xs transition-colors",
            mode === "login" ? "bg-ink text-paper-soft" : "text-ink-muted hover:text-ink",
          )}
        >
          {copy.tabLogin}
        </button>
        <button
          type="button"
          onClick={() => switchMode("register")}
          className={cn(
            "h-9 rounded-full text-xs transition-colors",
            mode === "register" ? "bg-ink text-paper-soft" : "text-ink-muted hover:text-ink",
          )}
        >
          {copy.tabRegister}
        </button>
      </div>

      <div>
        <h2 className="font-serif text-xl font-semibold text-ink">
          {mode === "register" ? copy.registerTitle : copy.title}
        </h2>
        <p className="mt-1 text-[12px] leading-[1.8] text-ink-muted">
          {mode === "register" ? copy.registerDescription : copy.description}
        </p>
      </div>

      {mode === "login" && (
        <div className="flex gap-3 text-[11px]">
          <button
            type="button"
            onClick={() => setLoginMethod("password")}
            className={cn(
              "transition-colors",
              loginMethod === "password" ? "text-cinnabar" : "text-ink-muted hover:text-ink",
            )}
          >
            {copy.passwordLogin}
          </button>
          <button
            type="button"
            onClick={() => setLoginMethod("code")}
            className={cn(
              "transition-colors",
              loginMethod === "code" ? "text-cinnabar" : "text-ink-muted hover:text-ink",
            )}
          >
            {copy.codeLogin}
          </button>
        </div>
      )}

      <label className="flex flex-col gap-2 text-left text-[12px] text-ink-soft">
        {copy.email}
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={copy.emailPlaceholder}
          className={inputClass}
        />
      </label>

      {showCode && (
        <>
          <button
            type="button"
            onClick={() => void sendCode()}
            disabled={sending || cooldown > 0}
            className="inline-flex h-11 items-center justify-center rounded-md border border-line px-4 text-xs text-ink transition-colors hover:border-cinnabar/50 hover:text-cinnabar disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending
              ? copy.sending
              : cooldown > 0
                ? `${cooldown}${copy.resendIn}`
                : copy.sendCode}
          </button>
          <label className="flex flex-col gap-2 text-left text-[12px] text-ink-soft">
            {copy.code}
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              required
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder={copy.codePlaceholder}
              className={`${inputClass} tracking-[0.4em]`}
            />
          </label>
        </>
      )}

      {showPassword && (
        <label className="flex flex-col gap-2 text-left text-[12px] text-ink-soft">
          {copy.password}
          <input
            type="password"
            required
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={copy.passwordPlaceholder}
            className={inputClass}
          />
        </label>
      )}

      {mode === "register" && (
        <label className="flex flex-col gap-2 text-left text-[12px] text-ink-soft">
          {copy.confirmPassword}
          <input
            type="password"
            required
            autoComplete="new-password"
            minLength={8}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder={copy.passwordPlaceholder}
            className={inputClass}
          />
        </label>
      )}

      {message && <p className="text-[12px] text-gold">{message}</p>}
      {error && <p className="text-[12px] text-cinnabar">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex h-12 items-center justify-center rounded-md bg-cinnabar text-sm text-paper-soft shadow-[0_12px_28px_rgba(112,34,46,0.25)] transition-all hover:bg-cinnabar-deep disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting
          ? mode === "register"
            ? copy.registering
            : copy.verifying
          : mode === "register"
            ? copy.register
            : copy.verify}
      </button>

      <a
        href={`/api/auth/wechat/start?next=${encodeURIComponent(searchParams.get("next") || WORKBENCH_URL)}`}
        onClick={(event) => {
          event.currentTarget.href = `/api/auth/wechat/start?next=${encodeURIComponent(nextUrl())}`;
        }}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-line text-sm text-ink transition-colors hover:bg-paper"
      >
        <WeChatIcon className="h-4 w-4" />
        {copy.wechat}
      </a>

      <a
        href={localizedPath(locale)}
        className="text-center text-[12px] text-ink-muted transition-colors hover:text-cinnabar"
      >
        {copy.backHome}
      </a>
    </form>
  );
}
