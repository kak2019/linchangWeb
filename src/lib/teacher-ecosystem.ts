import { timingSafeEqual } from "node:crypto";
import { getPrisma } from "@/lib/db";

export const TEACHER_WORK_PAGE_SIZE = 12;

export type PublicTeacherWork = {
  id: string;
  jobId: string;
  title: string;
  summary: string | null;
  coverUrl: string | null;
  playUrl: string;
  quizUrl: string | null;
  subject: string | null;
  grade: string | null;
  tags: string[];
  featured: boolean;
  publishedAt: string;
  author: {
    name: string;
    avatarUrl: string | null;
  };
};

function safeTokenEqual(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

export function internalServiceAuthStatus(request: Request): "ok" | "missing-config" | "unauthorized" {
  const expected = process.env.TEACHER_ECOSYSTEM_SERVICE_TOKEN?.trim();
  if (!expected) return "missing-config";
  const authorization = request.headers.get("authorization") || "";
  const actual = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  return actual && safeTokenEqual(actual, expected) ? "ok" : "unauthorized";
}

function displayName(user: { nickname: string | null; email: string | null }) {
  const nickname = user.nickname?.trim();
  if (nickname) return nickname;
  const emailName = user.email?.split("@")[0]?.trim();
  return emailName || "NarrativeOS 教师";
}

export function serializeTeacherWork(work: {
  id: string;
  jobId: string;
  title: string;
  summary: string | null;
  coverUrl: string | null;
  playUrl: string;
  quizUrl: string | null;
  subject: string | null;
  grade: string | null;
  tags: unknown;
  featured: boolean;
  publishedAt: Date;
  author: { nickname: string | null; email: string | null; avatarUrl: string | null };
}): PublicTeacherWork {
  return {
    id: work.id,
    jobId: work.jobId,
    title: work.title,
    summary: work.summary,
    coverUrl: work.coverUrl,
    playUrl: work.playUrl,
    quizUrl: work.quizUrl,
    subject: work.subject,
    grade: work.grade,
    tags: Array.isArray(work.tags) ? work.tags.filter((tag): tag is string => typeof tag === "string") : [],
    featured: work.featured,
    publishedAt: work.publishedAt.toISOString(),
    author: {
      name: displayName(work.author),
      avatarUrl: work.author.avatarUrl,
    },
  };
}

export async function listPublishedTeacherWorks(query: string, page: number, pageSize = TEACHER_WORK_PAGE_SIZE) {
  const prisma = getPrisma();
  const normalizedQuery = query.trim().slice(0, 80);
  const safePage = Math.max(1, page);
  const where = {
    status: "PUBLISHED" as const,
    ...(normalizedQuery
      ? {
          title: {
            contains: normalizedQuery,
          },
        }
      : {}),
  };

  const [total, works] = await prisma.$transaction([
    prisma.teacherWork.count({ where }),
    prisma.teacherWork.findMany({
      where,
      include: {
        author: {
          select: { nickname: true, email: true, avatarUrl: true },
        },
      },
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
      skip: (safePage - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    query: normalizedQuery,
    page: safePage,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    works: works.map(serializeTeacherWork),
  };
}
