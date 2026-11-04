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
    const result = await listPublishedTeacherWorks(query, page, limit, offset);
    // Next's listening address may be 0.0.0.0 behind a proxy or in local dev.
    // Resource links must use the address through which the visitor arrived.
    const host = request.headers.get("x-forwarded-host")?.split(",")[0].trim() || request.headers.get("host");
    const protocol = request.headers.get("x-forwarded-proto")?.split(",")[0].trim();
    const scheme = protocol === "http" || protocol === "https" ? `${protocol}:` : request.nextUrl.protocol;
    const publicUrl = new URL(host ? `${scheme}//${host}` : request.nextUrl.origin);
    const absolute = (value: string) => value.startsWith("/") ? new URL(value, publicUrl.origin).href : value;
    return NextResponse.json({ ...result, works: result.works.map(work => ({
      ...work,
      playUrl: absolute(work.playUrl),
      coverUrl: work.coverUrl ? absolute(work.coverUrl) : null,
      quizUrl: work.quizUrl ? absolute(work.quizUrl) : null,
    })) });
  } catch (error) {
    console.error("[teacher-ecosystem] list works failed", error);
    return configErrorResponse(error);
  }
}
