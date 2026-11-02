import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { generateSessionId, sha256 } from "@/lib/auth/crypto";
import { sessionCookieValue, jsonError } from "@/lib/auth/http";
import { readSessionUser } from "@/lib/auth/session";
import { AuthError, requireSameOrigin } from "@/lib/auth/security";
import { safeAuthNext } from "@/lib/auth/redirect";
import { WORKBENCH_URL } from "@/lib/content";
import { wechatConfig } from "@/lib/auth/wechat";

export const dynamic = "force-dynamic";
async function start(request: Request, bind: boolean) {
  try {
    if (bind) requireSameOrigin(request);
    const config = wechatConfig();
    const user = await readSessionUser(await sessionCookieValue());
    if (bind && !user) return jsonError("请先登录再绑定微信", 401);
    if (!bind && user) return NextResponse.redirect(new URL("/account", config.origin));
    const id = generateSessionId();
    const browser = generateSessionId();
    const nextUrl = bind ? new URL("/account", config.origin).href : safeAuthNext(new URL(request.url).searchParams.get("next"), config.origin, WORKBENCH_URL);
    const prisma = getPrisma();
    await prisma.oAuthAttempt.deleteMany({where:{expiresAt:{lt:new Date()}}});
    await prisma.oAuthAttempt.create({data:{id, browserHash:sha256(browser), userId:bind ? user!.id : null, nextUrl, expiresAt:new Date(Date.now()+600000)}});
    const url = new URL("https://open.weixin.qq.com/connect/qrconnect");
    url.search = new URLSearchParams({appid:config.appid, redirect_uri:config.redirect, response_type:"code", scope:"snsapi_login", state:id}).toString();
    url.hash = "wechat_redirect";
    const response = NextResponse.redirect(url, 303);
    response.cookies.set("nos_wechat_state", browser, {httpOnly:true, secure:new URL(config.origin).protocol === "https:", sameSite:"lax", path:"/api/auth/wechat", maxAge:600});
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && ["P2021", "P2022"].includes(String(error.code))) {
      return jsonError("微信登录数据库结构尚未更新，请管理员执行数据库迁移", 503);
    }
    return jsonError(error instanceof AuthError ? error.message : "无法发起微信授权，请稍后重试", error instanceof AuthError ? error.status : 500);
  }
}
export async function GET(request: Request) { return start(request, false); }
export async function POST(request: Request) { return start(request, true); }
