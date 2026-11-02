import { NextRequest, NextResponse } from "next/server";
import { jsonError, jsonOk, sessionCookieValue } from "@/lib/auth/http";
import { clearSessionCookie, revokeSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

function allowedOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const workbench = new URL(process.env.NEXT_PUBLIC_WORKBENCH_URL || "https://www.narrativeos.cn/narrativeos/");
  if (origin === request.nextUrl.origin || origin === workbench.origin) return true;
  if (process.env.NODE_ENV !== "production" && ["localhost", "127.0.0.1"].includes(workbench.hostname)) {
    return ["localhost", "127.0.0.1"].some(host => origin === `${workbench.protocol}//${host}:${workbench.port}`);
  }
  return false;
}

function cors(request: NextRequest, response: NextResponse) {
  const origin = request.headers.get("origin");
  response.headers.set("Vary", "Origin");
  response.headers.set("Cache-Control", "no-store");
  if (origin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  }
  return response;
}

export async function OPTIONS(request: NextRequest) {
  if (!allowedOrigin(request)) return jsonError("不允许的请求来源", 403);
  return cors(request, new NextResponse(null, { status: 204 }));
}

export async function POST(request: NextRequest) {
  if (!allowedOrigin(request)) return jsonError("不允许的请求来源", 403);
  const token = await sessionCookieValue();
  await revokeSession(token);
  return cors(request, clearSessionCookie(jsonOk()));
}
