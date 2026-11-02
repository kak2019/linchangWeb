import { teacherWorkWhere, type TeacherWorkFilters } from "./teacher-plaza-filters";
export type { TeacherWorkFilters } from "./teacher-plaza-filters";
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

export async function listPublishedTeacherWorks(query: string, page: number, pageSize = TEACHER_WORK_PAGE_SIZE, offset?: number) {
  const prisma = getPrisma();
  const normalizedQuery = query.trim().slice(0, 80);
  const safePage = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
  pageSize = Number.isFinite(pageSize) ? Math.min(30, Math.max(1, Math.floor(pageSize))) : TEACHER_WORK_PAGE_SIZE;
  const skip = offset === undefined ? (safePage - 1) * pageSize : Math.max(0, Math.floor(offset));
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
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }, { id: "desc" }],
      skip,
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
    nextOffset: skip + works.length,
    hasMore: skip + works.length < total,
  };
}

export async function listFilteredTeacherWorks(query: string, page: number, pageSize = TEACHER_WORK_PAGE_SIZE, filters: TeacherWorkFilters = {}) {
  const prisma = getPrisma();
  const normalizedQuery = query.trim().slice(0, 80);
  const where = teacherWorkWhere(normalizedQuery, filters);
  pageSize = Math.max(1, Math.min(30, Math.floor(pageSize) || 12));
  const total = await prisma.teacherWork.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(totalPages, Math.max(1, Number.isFinite(page) ? Math.floor(page) : 1));
  const works = await prisma.teacherWork.findMany({
    where,
    include: { author: { select: { nickname: true, email: true, avatarUrl: true } } },
    orderBy: filters.sort === "oldest" ? [{ publishedAt: "asc" }, { id: "asc" }] : filters.sort === "title" ? [{ title: "asc" }, { id: "asc" }] : filters.sort === "latest" ? [{ publishedAt: "desc" }, { id: "desc" }] : [{ featured: "desc" }, { publishedAt: "desc" }, { id: "desc" }],
    skip: (safePage - 1) * pageSize,
    take: pageSize,
  });
  return { query: normalizedQuery, page: safePage, pageSize, total, totalPages, works: works.map(serializeTeacherWork) };
}

export async function teacherWorkFacets() {
  const prisma = getPrisma();
  const [subjects, grades, metadata] = await Promise.all([
    prisma.teacherWork.findMany({ where: { status: "PUBLISHED", subject: { not: null } }, distinct: ["subject"], select: { subject: true }, orderBy: { subject: "asc" } }),
    prisma.teacherWork.findMany({ where: { status: "PUBLISHED", grade: { not: null } }, distinct: ["grade"], select: { grade: true }, orderBy: { grade: "asc" } }),
    prisma.teacherWork.findMany({ where: { status: "PUBLISHED" }, select: { tags: true } }),
  ]);
  return { tags: [...new Set(metadata.flatMap(w => Array.isArray(w.tags) ? w.tags.filter((t): t is string => typeof t === "string") : []))].sort(), subjects: subjects.flatMap(w => w.subject?.trim() ? [w.subject] : []), grades: grades.flatMap(w => w.grade?.trim() ? [w.grade] : []) };
}
