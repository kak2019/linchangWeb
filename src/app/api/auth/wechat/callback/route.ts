import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { sha256, safeEqual } from "@/lib/auth/crypto";
import { sessionCookieValue, jsonError } from "@/lib/auth/http";
import { applySessionCookie, createUserSession, readSessionUser, toAuthUser } from "@/lib/auth/session";
import { AuthError } from "@/lib/auth/security";
import { wechatConfig, getWechatIdentity, resolveWechatUser } from "@/lib/auth/wechat";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  let origin: string;
  try { origin = wechatConfig().origin; } catch { return jsonError("微信登录暂未配置", 503); }
  let binding = false;
  let response: NextResponse;
  try {
    const params = new URL(request.url).searchParams;
    const state = params.get("state");
    const code = params.get("code");
    const browser = (await cookies()).get("nos_wechat_state")?.value;
    if (!state || !browser || params.getAll("state").length !== 1) throw new AuthError("授权校验失败，请从登录页重新扫码");
    const prisma = getPrisma();
    const attempt = await prisma.oAuthAttempt.findUnique({where:{id:state}});
    if (!attempt || !safeEqual(attempt.browserHash, sha256(browser)) || attempt.expiresAt < new Date() || attempt.consumedAt) throw new AuthError("授权已失效，请重新扫码");
    binding = Boolean(attempt.userId);
    const user = await readSessionUser(await sessionCookieValue());
    if (binding && user?.id !== attempt.userId) throw new AuthError("登录账号已变化，请重新登录后绑定");
    if (!binding && user) throw new AuthError("当前已登录，请通过账号设置绑定微信");
    const consumed = await prisma.oAuthAttempt.updateMany({where:{id:state, consumedAt:null, expiresAt:{gt:new Date()}}, data:{consumedAt:new Date()}});
    if (consumed.count !== 1) throw new AuthError("授权已使用，请重新扫码");
    if (!code || params.getAll("code").length !== 1 || params.has("error")) throw new AuthError("微信授权已取消，请重试");
    const identity = await getWechatIdentity(code);
    const account = await resolveWechatUser(identity, attempt.userId);
    const token = await createUserSession(toAuthUser(account));
    response = applySessionCookie(NextResponse.redirect(binding ? new URL("/account?success=wechat", origin) : new URL(attempt.nextUrl), 303), token);
  } catch (error) {
    const url = new URL(binding ? "/account" : "/login", origin);
    url.searchParams.set("error", error instanceof AuthError ? error.message : "微信登录失败，请稍后重试");
    response = NextResponse.redirect(url, 303);
  }
  response.cookies.set("nos_wechat_state", "", {path:"/api/auth/wechat", maxAge:0, httpOnly:true, sameSite:"lax", secure:origin.startsWith("https:")});
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
