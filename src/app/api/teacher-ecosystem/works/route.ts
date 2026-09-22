import { NextRequest, NextResponse } from "next/server";
import { configErrorResponse } from "@/lib/auth/http";
import { listPublishedTeacherWorks } from "@/lib/teacher-ecosystem";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get("q") || "";
    const requestedPage = Number.parseInt(request.nextUrl.searchParams.get("page") || "1", 10);
    const page = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1;
    return NextResponse.json(await listPublishedTeacherWorks(query, page));
  } catch (error) {
    console.error("[teacher-ecosystem] list works failed", error);
    return configErrorResponse(error);
  }
}
