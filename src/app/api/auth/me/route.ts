import { NextRequest, NextResponse } from "next/server";
import { configErrorResponse, jsonError, sessionCookieValue } from "@/lib/auth/http";
import { readSessionUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await readSessionUser(await sessionCookieValue());
    if (!user && request.nextUrl.searchParams.get("optional") !== "1") {
      return jsonError("未登录", 401);
    }
    // Public navigation can ask for a nullable identity without turning a normal
    // signed-out visit into a failed HTTP request. Protected callers still get 401.
    return NextResponse.json(user, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[auth] me failed", error);
    return configErrorResponse(error);
  }
}
