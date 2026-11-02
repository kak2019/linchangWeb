import { NextRequest, NextResponse } from "next/server";
import { configErrorResponse } from "@/lib/auth/http";
import { listPublishedTeacherWorks } from "@/lib/teacher-ecosystem";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get("q") || "";
    const requestedPage = Number.parseInt(request.nextUrl.searchParams.get("page") || "1", 10);
    const page = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1;
    const limit = Number(request.nextUrl.searchParams.get("limit") || "12");
    const rawOffset = request.nextUrl.searchParams.get("offset");
    const offset = rawOffset === null ? undefined : Number(rawOffset);
    if (!Number.isInteger(limit) || limit < 1 || limit > 30 || (offset !== undefined && (!Number.isSafeInteger(offset) || offset < 0))) {
      return NextResponse.json({ error: "Invalid pagination" }, { status: 400 });
    }
    return NextResponse.json(await listPublishedTeacherWorks(query, page, limit, offset));
  } catch (error) {
    console.error("[teacher-ecosystem] list works failed", error);
    return configErrorResponse(error);
  }
}
