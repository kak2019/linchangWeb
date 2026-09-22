import type { Metadata } from "next";
import TeacherEcosystemPage from "@/app/teacher-ecosystem-page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "教师创作生态 | NarrativeOS",
  description: "浏览 NarrativeOS 种子教师创作的叙事课堂作品与讲评练内容。",
};

export default function Page({ searchParams }: PageProps<"/teacher-ecosystem">) {
  return <TeacherEcosystemPage locale="zh-CN" searchParams={searchParams} />;
}
