"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { authChangedEvent } from "@narrativeos/ui/client";
import type { AuthUser } from "@/lib/auth/config";
import { WorkbenchPageHeader } from "@/components/teacher-plaza-header";
import { WORKBENCH_URL } from "@/lib/content";
import { safeAccountReturn } from "@/lib/account-return";

const inputClass = "mt-2 w-full rounded-md border border-line bg-white p-3 text-ink";
const buttonClass = "rounded-md bg-cinnabar px-5 py-3 text-paper disabled:opacity-50";
export default function AccountSettings({initialMessage, initialAccount}: {initialMessage:string; initialAccount:{user:AuthUser; hasPassword:boolean}}) {
  const router = useRouter();
  const [account, setAccount] = useState(initialAccount);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState(initialMessage);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [returnHref, setReturnHref] = useState(WORKBENCH_URL);
  const [returnLabel, setReturnLabel] = useState('返回创作工作台');
  useEffect(() => {
    const valid = (value: string | null) => safeAccountReturn(value, location.origin, WORKBENCH_URL);
    let stored: string | null = null;
    try { stored = sessionStorage.getItem('account-settings-return'); } catch { /* Storage is optional. */ }
    const source = valid(new URLSearchParams(location.search).get('returnTo')) || valid(document.referrer) || valid(stored);
    const target = source || WORKBENCH_URL;
    setReturnHref(target); setReturnLabel(source ? '返回上一页面' : '返回创作工作台');
    try { sessionStorage.setItem('account-settings-return', target); } catch { /* Storage is optional. */ }
  }, []);
  const load = useCallback(async () => {
    const response = await fetch("/api/auth/account", {cache:"no-store"});
    if (response.status === 401) { router.replace(`/login?next=${encodeURIComponent(location.pathname + location.search)}`); return; }
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "无法读取账号信息");
    setAccount(data);
  }, [router]);
  useEffect(() => { if (!cooldown) return; const id = setTimeout(() => setCooldown(cooldown-1), 1000); return () => clearTimeout(id); }, [cooldown]);
  const action = account?.user.email ? "set-password" : "bind-email";
  async function post(path:string, body:object) {
    const response = await fetch(path, {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body)});
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "操作失败");
    return data;
  }
  async function sendCode() {
    setBusy(true); setMessage("");
    try {
      const data = await post("/api/auth/email/send-code", {email, purpose:action});
      setCooldown(data.cooldown || 60); setMessage("验证码已发送，请查收邮箱");
    } catch (error) { setMessage(error instanceof Error ? error.message : "发送失败"); }
    finally { setBusy(false); }
  }
  async function submit(event:FormEvent) {
    event.preventDefault();
    if (action === "set-password" && password !== confirm) { setMessage("两次密码不一致"); return; }
    setBusy(true); setMessage("");
    try {
      await post("/api/auth/account", {action, email, code, password});
      setCode(""); setPassword(""); setConfirm("");
      await load(); window.dispatchEvent(new Event(authChangedEvent));
      setMessage(action === "bind-email" ? "邮箱绑定成功。现在可以使用邮箱验证码登录，也可以继续设置密码。" : "密码设置成功。其他登录会话已退出。");
    } catch (error) { setMessage(error instanceof Error ? error.message : "操作失败"); }
    finally { setBusy(false); }
  }
  return <><WorkbenchPageHeader title="临场 · 账号设置" subtitle="ACCOUNT SETTINGS" returnLink={<a className="plaza-return-link" href={returnHref}><span aria-hidden="true">←</span><span>{returnLabel}</span></a>} />
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-10 text-ink">
    <h1 className="font-display text-3xl">账号设置</h1>
    <p className="mt-3 text-ink-muted">管理登录方式。绑定后，作品和账户权益继续属于同一个账号。</p>
    <p role="status" className="my-6 text-cinnabar">{message}</p>
    {!account ? <p>正在读取账号信息…</p> : <>
      <p className="mb-6 break-all text-xs text-ink-muted">账号 ID：{account.user.id}</p>
      <section className="rounded-xl border border-line bg-white/70 p-6">
        <h2 className="text-lg font-semibold">微信</h2>
        {account.user.providers.includes("wechat") ? <p className="mt-3">已绑定，可以扫码登录</p> : <>
          <p className="my-3 text-sm text-ink-muted">请绑定你自己的微信。已用于其他账号的微信不能绑定。</p>
          <form method="post" action="/api/auth/wechat/start"><button className={buttonClass}>绑定微信</button></form>
        </>}
      </section>
      <section className="mt-6 rounded-xl border border-line bg-white/70 p-6">
        <h2 className="text-lg font-semibold">邮箱与密码</h2>
        <p className="my-3">{account.user.email || "尚未绑定邮箱"}</p>
        {account.hasPassword ? <p className="text-sm text-ink-muted">已设置密码，可使用邮箱密码或邮箱验证码登录。</p> : <form onSubmit={submit} className="space-y-4">
          {account.user.email ? <p className="text-sm text-ink-muted">邮箱验证码已可用于登录。设置密码是可选的；设置前需再次验证邮箱。</p> : <label className="block">邮箱<input className={inputClass} type="email" required value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" /></label>}
          <button className="rounded-md border border-line px-4 py-2 disabled:opacity-50" type="button" onClick={sendCode} disabled={busy || cooldown > 0}>{cooldown ? `${cooldown} 秒后重发` : "发送验证码"}</button>
          <label className="block">邮箱验证码<input className={inputClass} required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" value={code} onChange={event => setCode(event.target.value)} /></label>
          {account.user.email ? <>
            <label className="block">密码（8–72 个字符）<input type="password" className={inputClass} minLength={8} maxLength={72} required autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} /></label>
            <label className="block">确认密码<input type="password" className={inputClass} required autoComplete="new-password" value={confirm} onChange={event => setConfirm(event.target.value)} /></label>
          </> : null}
          <button className={buttonClass} disabled={busy}>{busy ? "正在处理…" : account.user.email ? "设置密码" : "验证并绑定邮箱"}</button>
        </form>}
      </section>
    </>}
  </main></>;
}
