import Link from "next/link";
import { listPublishedTeacherWorks } from "@/lib/teacher-ecosystem";
import { localizedPath, teacherEcosystemPath, type Locale } from "@/lib/i18n";

const copyByLocale = {
  "zh-CN": {
    eyebrow: "TEACHER CREATOR COMMUNITY",
    title: "教师创作生态",
    description: "来自一线教师的叙事课堂作品。寻找灵感，打开作品，并把优秀实践带回自己的课堂。",
    search: "搜索作品标题",
    searchButton: "搜索",
    clear: "清除搜索",
    back: "返回 NarrativeOS",
    empty: "暂时没有匹配的作品",
    emptyHint: "换一个标题关键词试试，或稍后再来看看教师们的新作品。",
    works: "个公开作品",
    author: "创作者",
    enter: "开始体验",
    practice: "讲评练",
    previous: "上一页",
    next: "下一页",
  },
  en: {
    eyebrow: "TEACHER CREATOR COMMUNITY",
    title: "Teacher creations",
    description: "Narrative classroom experiences made by teachers. Find an idea, open a work, and bring strong practice back to your classroom.",
    search: "Search by title",
    searchButton: "Search",
    clear: "Clear",
    back: "Back to NarrativeOS",
    empty: "No matching works yet",
    emptyHint: "Try another title keyword or return later for new teacher creations.",
    works: "public works",
    author: "Creator",
    enter: "Open experience",
    practice: "Review & practice",
    previous: "Previous",
    next: "Next",
  },
  "zh-Hant": {
    eyebrow: "TEACHER CREATOR COMMUNITY",
    title: "教師創作生態",
    description: "來自一線教師的敘事課堂作品。尋找靈感，打開作品，並把優秀實踐帶回自己的課堂。",
    search: "搜尋作品標題",
    searchButton: "搜尋",
    clear: "清除搜尋",
    back: "返回 NarrativeOS",
    empty: "暫時沒有符合的作品",
    emptyHint: "換一個標題關鍵詞試試，或稍後再來看看教師們的新作品。",
    works: "個公開作品",
    author: "創作者",
    enter: "開始體驗",
    practice: "講評練",
    previous: "上一頁",
    next: "下一頁",
  },
} as const;

function pageHref(locale: Locale, query: string, page: number) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (page > 1) params.set("page", String(page));
  const suffix = params.toString();
  return `${teacherEcosystemPath(locale)}${suffix ? `?${suffix}` : ""}`;
}

export default async function TeacherEcosystemPage({
  locale,
  searchParams,
}: {
  locale: Locale;
  searchParams: Promise<{ q?: string | string[]; page?: string | string[] }>;
}) {
  const copy = copyByLocale[locale];
  const values = await searchParams;
  const query = typeof values.q === "string" ? values.q : "";
  const requestedPage = typeof values.page === "string" ? Number.parseInt(values.page, 10) : 1;
  const page = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1;
  let result;
  let loadFailed = false;
  try {
    result = await listPublishedTeacherWorks(query, page);
  } catch (error) {
    console.error("[teacher-ecosystem] page load failed", error);
    loadFailed = true;
    result = { query: query.trim(), page, pageSize: 12, total: 0, totalPages: 1, works: [] };
  }

  return (
    <main className="ecosystem-page">
      <header className="ecosystem-nav">
        <Link className="ecosystem-brand" href={localizedPath(locale)}>
          <span className="seal-mark" aria-hidden="true">临</span>
          <span><strong>NarrativeOS</strong><small>{copy.eyebrow}</small></span>
        </Link>
        <Link className="ecosystem-back" href={localizedPath(locale)}>← {copy.back}</Link>
      </header>

      <section className="ecosystem-hero">
        <p>{copy.eyebrow}</p>
        <h1>{copy.title}</h1>
        <span>{copy.description}</span>
        <form className="ecosystem-search" action={teacherEcosystemPath(locale)} method="get" role="search">
          <label htmlFor="teacher-work-query">{copy.search}</label>
          <div>
            <input id="teacher-work-query" name="q" defaultValue={result.query} placeholder={copy.search} maxLength={80} />
            <button type="submit">{copy.searchButton}</button>
          </div>
        </form>
        <div className="ecosystem-result-meta">
          <span>{result.total} {copy.works}</span>
          {result.query ? <Link href={teacherEcosystemPath(locale)}>{copy.clear}</Link> : null}
        </div>
      </section>

      <section className="ecosystem-gallery" aria-live="polite">
        {result.works.map((work, index) => (
          <article className="ecosystem-card" key={work.id}>
            <a className="ecosystem-cover" href={work.playUrl} target="_blank" rel="noreferrer">
              <span
                className="ecosystem-cover-image"
                style={work.coverUrl ? { backgroundImage: `url(${JSON.stringify(work.coverUrl)})` } : undefined}
                aria-hidden="true"
              />
              <span className="ecosystem-card-index">{String((result.page - 1) * result.pageSize + index + 1).padStart(2, "0")}</span>
              {work.featured ? <em>FEATURED</em> : null}
            </a>
            <div className="ecosystem-card-copy">
              <div className="ecosystem-tags">
                {work.subject ? <span>{work.subject}</span> : null}
                {work.grade ? <span>{work.grade}</span> : null}
                {work.tags.slice(0, 2).map((tag) => <span key={tag}>{tag}</span>)}
              </div>
              <h2>{work.title}</h2>
              <p>{work.summary || copy.description}</p>
              <div className="ecosystem-author">
                <span>{copy.author}</span>
                <strong>{work.author.name}</strong>
              </div>
              <div className="ecosystem-actions">
                <a href={work.playUrl} target="_blank" rel="noreferrer">{copy.enter} ↗</a>
                {work.quizUrl ? <a className="secondary" href={work.quizUrl} target="_blank" rel="noreferrer">{copy.practice}</a> : null}
              </div>
            </div>
          </article>
        ))}
      </section>

      {!result.works.length ? (
        <section className="ecosystem-empty">
          <span aria-hidden="true">◇</span>
          <h2>{loadFailed ? "作品列表暂时无法加载" : copy.empty}</h2>
          <p>{loadFailed ? "请稍后刷新页面重试。" : copy.emptyHint}</p>
        </section>
      ) : null}

      {result.totalPages > 1 ? (
        <nav className="ecosystem-pagination" aria-label="Pagination">
          {result.page > 1 ? <Link href={pageHref(locale, result.query, result.page - 1)}>← {copy.previous}</Link> : <span />}
          <strong>{result.page} / {result.totalPages}</strong>
          {result.page < result.totalPages ? <Link href={pageHref(locale, result.query, result.page + 1)}>{copy.next} →</Link> : <span />}
        </nav>
      ) : null}
    </main>
  );
}
