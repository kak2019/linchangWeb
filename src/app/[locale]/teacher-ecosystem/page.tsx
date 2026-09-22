import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TeacherEcosystemPage from "@/app/teacher-ecosystem-page";
import { isLocalePath, routeToLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[locale]/teacher-ecosystem">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocalePath(locale)) return {};
  return locale === "en"
    ? { title: "Teacher creations | NarrativeOS", description: "Explore narrative classroom works made by NarrativeOS teachers." }
    : { title: "教師創作生態 | NarrativeOS", description: "瀏覽 NarrativeOS 種子教師創作的敘事課堂作品與講評練內容。" };
}

export default async function Page({ params, searchParams }: PageProps<"/[locale]/teacher-ecosystem">) {
  const { locale } = await params;
  if (!isLocalePath(locale)) notFound();
  return <TeacherEcosystemPage locale={routeToLocale(locale)} searchParams={searchParams} />;
}
