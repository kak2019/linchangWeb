import { teacherWorkWhere, type TeacherWorkFilters } from "./teacher-plaza-filters";
export type { TeacherWorkFilters } from "./teacher-plaza-filters";
import { timingSafeEqual } from "node:crypto";
import { getPrisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { builtinTeacherWorks, matchingBuiltinTeacherWorks } from "./builtin-teacher-works";

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

function workOrder(sort: TeacherWorkFilters["sort"]): Prisma.TeacherWorkOrderByWithRelationInput[] {
  if (sort === "oldest") return [{ publishedAt: "asc" }, { id: "asc" }];
  if (sort === "title") return [{ title: "asc" }, { id: "asc" }];
  if (sort === "latest") return [{ publishedAt: "desc" }, { id: "desc" }];
  return [{ featured: "desc" }, { publishedAt: "desc" }, { id: "desc" }];
}

function worksBefore(work: PublicTeacherWork, sort: TeacherWorkFilters["sort"]): Prisma.TeacherWorkWhereInput {
  if (sort === "title") return { OR: [{ title: { lt: work.title } }, { title: work.title, id: { lt: work.id } }] };
  const date = new Date(work.publishedAt);
  const chronological: Prisma.TeacherWorkWhereInput = sort === "oldest"
    ? { OR: [{ publishedAt: { lt: date } }, { publishedAt: date, id: { lt: work.id } }] }
    : { OR: [{ publishedAt: { gt: date } }, { publishedAt: date, id: { gt: work.id } }] };
  if (sort === "latest" || sort === "oldest") return chronological;
  return work.featured
    ? { featured: true, ...chronological }
    : { OR: [{ featured: true }, { featured: false, ...chronological }] };
}

function compareBuiltinWorks(a: PublicTeacherWork, b: PublicTeacherWork, sort: TeacherWorkFilters["sort"]) {
  if (sort === "title") return a.title.localeCompare(b.title) || a.id.localeCompare(b.id);
  if (sort === "oldest") return Date.parse(a.publishedAt) - Date.parse(b.publishedAt) || a.id.localeCompare(b.id);
  return (sort === "latest" ? 0 : Number(b.featured) - Number(a.featured)) ||
    Date.parse(b.publishedAt) - Date.parse(a.publishedAt) || b.id.localeCompare(a.id);
}

async function teacherWorkPage(query: string, page: number, pageSize: number, filters: TeacherWorkFilters, offset?: number) {
  const prisma = getPrisma();
  const normalizedQuery = query.trim().slice(0, 80);
  pageSize = Number.isFinite(pageSize) ? Math.min(30, Math.max(1, Math.floor(pageSize))) : TEACHER_WORK_PAGE_SIZE;
  const where = teacherWorkWhere(normalizedQuery, filters);
  const builtins = matchingBuiltinTeacherWorks(normalizedQuery, filters).sort((a, b) => compareBuiltinWorks(a, b, filters.sort));
  const databaseTotal = await prisma.teacherWork.count({ where });
  const total = databaseTotal + builtins.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(totalPages, Math.max(1, Number.isFinite(page) ? Math.floor(page) : 1));
  const skip = offset === undefined ? (safePage - 1) * pageSize : Math.max(0, Math.floor(offset));
  // Count the preceding database rows, then fetch only this page. Built-in
  // resources therefore participate in sorting and pagination without a DB seed.
  const positioned = await Promise.all(builtins.map(async (work, index) => ({
    work,
    position: index + await prisma.teacherWork.count({ where: { AND: [where, worksBefore(work, filters.sort)] } }),
  })));
  const visible = new Map(positioned.filter(item => item.position >= skip && item.position < skip + pageSize)
    .map(item => [item.position, item.work]));
  const preceding = positioned.filter(item => item.position < skip).length;
  const databaseWorks = await prisma.teacherWork.findMany({
    where,
    include: { author: { select: { nickname: true, email: true, avatarUrl: true } } },
    orderBy: workOrder(filters.sort),
    skip: Math.max(0, skip - preceding),
    take: pageSize - visible.size,
  });
  let databaseIndex = 0;
  const works: PublicTeacherWork[] = [];
  for (let position = skip; position < Math.min(total, skip + pageSize); position++) {
    const builtin = visible.get(position);
    if (builtin) works.push(builtin);
    else if (databaseWorks[databaseIndex]) works.push(serializeTeacherWork(databaseWorks[databaseIndex++]));
  }

  return {
    query: normalizedQuery,
    page: safePage,
    pageSize,
    total,
    totalPages,
    works,
    nextOffset: skip + works.length,
    hasMore: skip + works.length < total,
  };
}

export async function listPublishedTeacherWorks(query: string, page: number, pageSize = TEACHER_WORK_PAGE_SIZE, offset?: number) {
  return teacherWorkPage(query, page, pageSize, {}, offset);
}

export async function listFilteredTeacherWorks(query: string, page: number, pageSize = TEACHER_WORK_PAGE_SIZE, filters: TeacherWorkFilters = {}) {
  return teacherWorkPage(query, page, pageSize, filters);
}

export async function teacherWorkFacets() {
  const prisma = getPrisma();
  const [subjects, grades, metadata] = await Promise.all([
    prisma.teacherWork.findMany({ where: { status: "PUBLISHED", subject: { not: null } }, distinct: ["subject"], select: { subject: true }, orderBy: { subject: "asc" } }),
    prisma.teacherWork.findMany({ where: { status: "PUBLISHED", grade: { not: null } }, distinct: ["grade"], select: { grade: true }, orderBy: { grade: "asc" } }),
    prisma.teacherWork.findMany({ where: { status: "PUBLISHED" }, select: { tags: true } }),
  ]);
  return {
    tags: [...new Set([...metadata.flatMap(w => Array.isArray(w.tags) ? w.tags.filter((t): t is string => typeof t === "string") : []), ...builtinTeacherWorks.flatMap(work => work.tags)])].sort(),
    subjects: [...new Set([...subjects.flatMap(w => w.subject?.trim() ? [w.subject] : []), ...builtinTeacherWorks.flatMap(work => work.subject ? [work.subject] : [])])],
    grades: [...new Set([...grades.flatMap(w => w.grade?.trim() ? [w.grade] : []), ...builtinTeacherWorks.flatMap(work => work.grade ? [work.grade] : [])])],
  };
}
