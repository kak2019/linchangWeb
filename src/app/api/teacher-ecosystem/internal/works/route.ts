import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { configErrorResponse, jsonError } from "@/lib/auth/http";
import { getPrisma } from "@/lib/db";
import { internalServiceAuthStatus, serializeTeacherWork } from "@/lib/teacher-ecosystem";

export const dynamic = "force-dynamic";

type PublicationPayload = {
  ownerUserId?: unknown;
  authorName?: unknown;
  jobId?: unknown;
  title?: unknown;
  summary?: unknown;
  coverUrl?: unknown;
  playUrl?: unknown;
  quizUrl?: unknown;
  subject?: unknown;
  grade?: unknown;
  tags?: unknown;
};

function authError(request: Request) {
  const status = internalServiceAuthStatus(request);
  if (status === "ok") return null;
  if (status === "missing-config") return jsonError("未配置教师生态服务密钥", 503);
  return jsonError("服务身份校验失败", 401);
}

function requiredText(value: unknown, label: string, maxLength: number) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) throw new Error(`${label}不能为空`);
  if (text.length > maxLength) throw new Error(`${label}不能超过 ${maxLength} 个字符`);
  return text;
}

function optionalText(value: unknown, maxLength: number) {
  if (value === null || value === undefined) return null;
  const text = typeof value === "string" ? value.trim() : "";
  return text ? text.slice(0, maxLength) : null;
}

function httpUrl(value: unknown, label: string, required: true): string;
function httpUrl(value: unknown, label: string, required: false): string | null;
function httpUrl(value: unknown, label: string, required: boolean) {
  const text = optionalText(value, 1024);
  if (!text && !required) return null;
  if (!text) throw new Error(`${label}不能为空`);
  const url = new URL(text);
  if (!new Set(["http:", "https:"]).has(url.protocol)) throw new Error(`${label}必须是 HTTP(S) 地址`);
  return url.toString();
}

function normalizePayload(payload: PublicationPayload) {
  const jobId = requiredText(payload.jobId, "任务 ID", 32);
  if (!/^[a-f0-9]{32}$/.test(jobId)) throw new Error("任务 ID 格式无效");
  return {
    ownerUserId: requiredText(payload.ownerUserId, "用户 ID", 191),
    authorName: optionalText(payload.authorName, 80),
    jobId,
    title: requiredText(payload.title, "作品标题", 160),
    summary: optionalText(payload.summary, 2000),
    coverUrl: httpUrl(payload.coverUrl, "封面地址", false),
    playUrl: httpUrl(payload.playUrl, "游戏地址", true),
    quizUrl: httpUrl(payload.quizUrl, "讲评练地址", false),
    subject: optionalText(payload.subject, 80),
    grade: optionalText(payload.grade, 80),
    tags: Array.isArray(payload.tags)
      ? payload.tags.filter((tag): tag is string => typeof tag === "string").map((tag) => tag.trim()).filter(Boolean).slice(0, 8)
      : [],
  };
}

const authorSelect = { nickname: true, email: true, avatarUrl: true } as const;

export async function GET(request: NextRequest) {
  const denied = authError(request);
  if (denied) return denied;
  try {
    const jobId = request.nextUrl.searchParams.get("jobId")?.trim() || "";
    if (!/^[a-f0-9]{32}$/.test(jobId)) return jsonError("任务 ID 格式无效", 400);
    const work = await getPrisma().teacherWork.findUnique({
      where: { jobId },
      include: { author: { select: authorSelect } },
    });
    if (!work) return NextResponse.json({ published: false });
    return NextResponse.json({
      published: work.status === "PUBLISHED",
      work: serializeTeacherWork(work),
    });
  } catch (error) {
    console.error("[teacher-ecosystem] get publication failed", error);
    return configErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const denied = authError(request);
  if (denied) return denied;
  try {
    const payload = normalizePayload((await request.json()) as PublicationPayload);
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { id: payload.ownerUserId } });
    if (!user) return jsonError("发布账号不存在", 404);

    const work = await prisma.$transaction(async (transaction) => {
      await transaction.teacherProfile.upsert({
        where: { userId: payload.ownerUserId },
        update: payload.authorName ? { displayName: payload.authorName } : {},
        create: {
          userId: payload.ownerUserId,
          displayName: payload.authorName || user.nickname || user.email?.split("@")[0] || "NarrativeOS 教师",
          isSeed: true,
        },
      });
      return transaction.teacherWork.upsert({
        where: { jobId: payload.jobId },
        update: {
          authorId: payload.ownerUserId,
          title: payload.title,
          summary: payload.summary,
          coverUrl: payload.coverUrl,
          playUrl: payload.playUrl,
          quizUrl: payload.quizUrl,
          subject: payload.subject,
          grade: payload.grade,
          tags: payload.tags as Prisma.InputJsonValue,
          status: "PUBLISHED",
          publishedAt: new Date(),
          unpublishedAt: null,
        },
        create: {
          jobId: payload.jobId,
          authorId: payload.ownerUserId,
          title: payload.title,
          summary: payload.summary,
          coverUrl: payload.coverUrl,
          playUrl: payload.playUrl,
          quizUrl: payload.quizUrl,
          subject: payload.subject,
          grade: payload.grade,
          tags: payload.tags as Prisma.InputJsonValue,
          status: "PUBLISHED",
        },
        include: { author: { select: authorSelect } },
      });
    });

    return NextResponse.json({ published: true, work: serializeTeacherWork(work) });
  } catch (error) {
    if (error instanceof SyntaxError || (error instanceof Error && /不能为空|不能超过|格式无效|必须是/.test(error.message))) {
      return jsonError(error instanceof Error ? error.message : "请求内容无效", 400);
    }
    console.error("[teacher-ecosystem] publish work failed", error);
    return configErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  const denied = authError(request);
  if (denied) return denied;
  try {
    const body = (await request.json()) as PublicationPayload;
    const ownerUserId = requiredText(body.ownerUserId, "用户 ID", 191);
    const jobId = requiredText(body.jobId, "任务 ID", 32);
    const result = await getPrisma().teacherWork.updateMany({
      where: { jobId, authorId: ownerUserId },
      data: { status: "ARCHIVED", unpublishedAt: new Date() },
    });
    if (!result.count) return jsonError("未找到可取消发布的作品", 404);
    return NextResponse.json({ published: false });
  } catch (error) {
    if (error instanceof SyntaxError || (error instanceof Error && /不能为空|不能超过/.test(error.message))) {
      return jsonError(error instanceof Error ? error.message : "请求内容无效", 400);
    }
    console.error("[teacher-ecosystem] unpublish work failed", error);
    return configErrorResponse(error);
  }
}
