"use client";

import Link from "next/link";
import PlazaSubjectIcon from "./plaza-subject-icon";
import PlazaLearningIllustration from "./plaza-learning-illustration";
import { useRouter } from "next/navigation";
import { filterParams, multiFilterKeys, type MultiFilterKey } from "@/lib/teacher-plaza-filters";
import { CloseButton } from "@narrativeos/ui/close-button";
import { useEffect, useRef, useState } from "react";
import type { PublicTeacherWork, TeacherWorkFilters } from "@/lib/teacher-ecosystem";
import { getMessages, teacherEcosystemPath, type Locale } from "@/lib/i18n";
import { copyByLocale, plazaLabels } from "@/lib/teacher-plaza-copy";

import { curricula, stages, gradeOptions, subjectsForStage, taxonomyLabel } from "@/lib/teacher-plaza-taxonomy";

type Result = { query: string; page: number; pageSize: number; total: number; totalPages: number; works: PublicTeacherWork[] };
type Props = { locale: Locale; result: Result; facets: { subjects: string[]; grades: string[]; tags: string[] }; filters: TeacherWorkFilters; loadFailed: boolean };

function workTags(work: PublicTeacherWork) {
  return [...new Set([work.subject, work.grade, ...work.tags].filter((tag): tag is string => Boolean(tag)))];
}

function Cover({ work, label, priority = false }: { work: PublicTeacherWork; label: string; priority?: boolean }) {
  const [failed, setFailed] = useState(false);
  return <div className="plaza-cover">{work.coverUrl && !failed ?
    // Published covers are served by the game host, not the portal image optimizer.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={work.coverUrl} alt="" onError={() => setFailed(true)} loading={priority ? "eager" : "lazy"} decoding="async" /> :
    <div className="plaza-cover-empty"><PlazaSubjectIcon subject={work.subject || undefined} /><strong>{work.title}</strong><small>{work.subject || label}</small></div>}</div>;
}

function Author({ work }: { work: PublicTeacherWork }) {
  const [failed, setFailed] = useState(false);
  return <span className="plaza-author" title={work.author.name}>
    {work.author.avatarUrl && !failed ?
      // eslint-disable-next-line @next/next/no-img-element
      <img src={work.author.avatarUrl} alt="" onError={() => setFailed(true)} loading="lazy" /> :
      <span className="plaza-avatar-fallback" aria-hidden="true">{Array.from(work.author.name)[0]}</span>}
    <span>{work.author.name}</span>
  </span>;
}

export default function TeacherPlaza({ locale, result, facets, filters, loadFailed }: Props) {
  const copy = copyByLocale[locale];
  const labels = plazaLabels[locale];
  const printableLabel = getMessages(locale).ui.plaza.printable;
  const [selected, setSelected] = useState<PublicTeacherWork | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const pick = result.works.find(work => work.featured);
  const base = teacherEcosystemPath(locale);
  const taxonomyCopy = locale === "en" ? { curriculum:"Curriculum", stage:"Stage", hint:"Some older works have no curriculum label yet. Broaden the filters to find more resources.", clear:"Clear filters", empty:"No works in this category yet" } : locale === "zh-Hant" ? { curriculum:"課程體系", stage:"適用學段", hint:"部分舊作品尚未標註課程體系；可放寬條件查看更多資源。", clear:"清除篩選", empty:"這個分類暫時還沒有作品" } : { curriculum:"课程体系", stage:"适用学段", hint:"部分旧作品尚未标注课程体系；可放宽条件查看更多资源。", clear:"清除筛选", empty:"这个分类暂时还没有作品" };
  const router = useRouter();
  const [shareStatus, setShareStatus] = useState("");
  const [tagSearch, setTagSearch] = useState("");
  const sortOptions = [
    ["featured", labels.featured], ["latest", labels.latest],
    ["oldest", locale === "en" ? "Oldest" : locale === "zh-Hant" ? "最早發布" : "最早发布"],
    ["title", locale === "en" ? "Title" : locale === "zh-Hant" ? "標題排序" : "标题排序"],
  ] as const;
  const stageValues = stages;
  const subjects = [...new Set([...(filters.stage?.length ? filters.stage.flatMap(subjectsForStage) : subjectsForStage()), ...facets.subjects])];
  const grades = [...new Set(filters.stage?.length ? filters.stage.flatMap(stage => gradeOptions[stage] || []) : Object.values(gradeOptions).flat())];
  const hasFilters = multiFilterKeys.some(key => filters[key]?.length) || Boolean(result.query || filters.resource || filters.author || filters.after || filters.before || filters.featuredOnly);
  function href(changes: Record<string, string | string[] | number> = {}) {
    const { q = result.query, page = result.page, ...rest } = changes;
    const params = filterParams({ ...filters, ...rest }, String(q), Number(page));
    return `${base}${params.size ? `?${params}` : ""}#resources`;
  }
  function toggle(key: MultiFilterKey, value: string) {
    const current = filters[key] || [];
    return href({ [key]: current.includes(value) ? current.filter(v => v !== value) : [...current, value], page: 1 });
  }
  function open(work: PublicTeacherWork) { opener.current = document.activeElement as HTMLElement; setSelected(work); }
  useEffect(() => {
    if (!selected || !dialog.current) return;
    dialog.current.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = overflow; };
  }, [selected]);
  function close() { dialog.current?.close(); setSelected(null); opener.current?.focus(); }
  const filterRow = (key: MultiFilterKey, values: string[]) => <div className="plaza-filter-row">
    <span>{key === "tag" ? (locale === "en" ? "Tags" : "作品标签") : key === "curriculum" || key === "stage" ? taxonomyCopy[key] : labels[key]}</span><div>
      <Link href={href({ [key]: [], page: 1 })} aria-current={!filters[key]?.length ? "true" : undefined}>{labels.all}</Link>
      {[...new Set([...values, ...(filters[key] || [])])].map(value => <Link key={value} href={toggle(key,value)} title={value} aria-current={filters[key]?.includes(value) ? "true" : undefined}><span aria-hidden="true">{filters[key]?.includes(value) ? "✓ " : ""}</span>{taxonomyLabel(value, locale)}</Link>)}
    </div>
  </div>;
  const visibleTags = facets.tags.filter(tag => tag.toLocaleLowerCase().includes(tagSearch.trim().toLocaleLowerCase()));
  const advancedLabel = locale === "en" ? "More filters" : "更多筛选";
  const hiddenInputs = [...filterParams(filters, "").entries()].filter(([key]) => !["author","after","before"].includes(key));
  const sidebar = !loadFailed && <aside className="plaza-sidebar" aria-label={labels.subject} data-lenis-prevent>
    <div className="plaza-sidebar-heading"><span className="plaza-sidebar-doodle" aria-hidden="true">✦</span><h2>{labels.subject}</h2><p>{locale === 'en' ? 'Find your next discovery' : locale === 'zh-Hant' ? '下一堂課，從好奇出發' : '下一堂课，从好奇出发'}</p></div>
    <nav><Link href={href({ subject: [], page: 1 })} aria-current={!filters.subject?.length ? "true" : undefined}><PlazaSubjectIcon /><span>{labels.all}</span></Link>
    {subjects.map(subject => <Link key={subject} href={toggle("subject",subject)} title={taxonomyLabel(subject, locale)} aria-current={filters.subject?.includes(subject) ? "true" : undefined}><PlazaSubjectIcon subject={subject} /><span>{taxonomyLabel(subject, locale)}</span><span className="plaza-subject-check" aria-hidden="true">{filters.subject?.includes(subject) ? '✓' : ''}</span></Link>)}</nav>
  </aside>;
  return <div className="plaza-content">{sidebar}
    <section className="plaza-intro"><div className="plaza-hero-copy"><p className="plaza-kicker">{labels.plaza}</p><h1>{labels.title}</h1><p>{copy.description}</p><span className="plaza-hero-note">{labels.formats}</span></div><PlazaLearningIllustration />
      <form className="plaza-search" action={base} method="get" role="search">
        {[...filterParams(filters, "").entries()].map(([key,value],index) => <input key={index} type="hidden" name={key} value={value} />)}
        <label className="plaza-sr-only" htmlFor="plaza-query">{locale === "en" ? "Search title, description or creator" : "搜索标题、作品简介或作者"}</label>
        <input key={result.query} id="plaza-query" name="q" defaultValue={result.query} placeholder={locale === "en" ? "Title, description or creator" : "搜索标题、作品简介或作者"} maxLength={80} /><button type="submit">{copy.searchButton}</button>
      </form>
    </section>
    {pick && !loadFailed && <section className="plaza-spotlight"><div><p className="plaza-kicker">01 / {labels.pick}</p><h2>{pick.title}</h2>{pick.summary && <p className="plaza-spot-summary">{pick.summary}</p>}<button className="plaza-primary" onClick={() => open(pick)}>{labels.preview} ↗</button><span className="plaza-spot-meta">{[pick.subject, pick.grade].filter(Boolean).join(" · ")}</span></div><Cover key={pick.id} work={pick} label={labels.noCover} /></section>}
    <section id="resources" className="plaza-resources" aria-labelledby="plaza-heading"><div className="plaza-section-heading"><div><h2 id="plaza-heading">{labels.browse}</h2></div><p>{labels.hint}</p></div>
      {!loadFailed && <details className="plaza-filters"><summary className="plaza-filter-toggle"><span>{locale === "en" ? "Filter resources" : locale === "zh-Hant" ? "篩選資源" : "筛选资源"}</span><small>{locale === "en" ? "Curriculum · Stage · Grade · Tags" : locale === "zh-Hant" ? "課程體系 · 學段 · 年級 · 標籤" : "课程体系 · 学段 · 年级 · 标签"}</small><span className="plaza-filter-chevron" aria-hidden="true">⌄</span></summary><div className="plaza-filter-options">{filterRow("curriculum", [...curricula,"未标注"])}{filterRow("stage", stageValues)}{filterRow("subject", subjects)}{(grades.length > 0 || filters.grade?.length) && filterRow("grade", grades)}<details className="plaza-advanced"><summary>{advancedLabel}<span>{locale === "en" ? "Type · Tags · Author · Date" : "资源类型 · 标签 · 作者 · 发布时间"}</span></summary>
        <div className="plaza-filter-row"><span>{locale === "en" ? "Resource" : "资源类型"}</span><div>{[["",labels.all],["quiz",locale === "en" ? "With practice" : "附讲评练"],["story-only",locale === "en" ? "Story only" : "仅叙事作品"],["printable",printableLabel]].map(([value,label])=><Link key={value} href={href({resource:value,page:1})} aria-current={(filters.resource||"")===value?"true":undefined}>{label}</Link>)}<Link href={href({featuredOnly:filters.featuredOnly?"":"1",page:1})} aria-current={filters.featuredOnly?"true":undefined}>{locale === "en" ? "Featured only" : "只看精选"}</Link></div></div>
        <label className="plaza-tag-search">{locale === "en" ? "Find tags" : "查找标签"}<input value={tagSearch} onChange={e=>setTagSearch(e.target.value)} placeholder={locale === "en" ? "Filter tag options" : "输入关键词，缩小标签选项"}/></label>
        {filterRow("tag", visibleTags)}
        <div className="plaza-filter-row"><span>{locale === "en" ? "Tag rule" : "标签匹配"}</span><div>{[["any",locale === "en" ? "Match any" : "符合任一标签"],["all",locale === "en" ? "Match all" : "同时符合全部标签"]].map(([value,label])=><Link key={value} href={href({tagMode:value,page:1})} aria-current={(filters.tagMode||"any")===value?"true":undefined}>{label}</Link>)}</div></div>
        <form className="plaza-range" action={base} method="get">{hiddenInputs.map(([key,value],i)=><input key={i} type="hidden" name={key} value={value}/>)}{result.query&&<input type="hidden" name="q" value={result.query}/>}
          <label>{locale === "en" ? "Creator" : "作者昵称"}<input name="author" key={filters.author||"author"} defaultValue={filters.author} maxLength={100} placeholder={locale === "en" ? "Creator name" : "输入作者昵称"}/></label>
          <label>{locale === "en" ? "From" : "发布起始日期"}<input type="date" name="after" key={filters.after||"after"} defaultValue={filters.after}/></label>
          <label>{locale === "en" ? "Until" : "发布结束日期"}<input type="date" name="before" key={filters.before||"before"} defaultValue={filters.before}/></label><button type="submit" className="plaza-primary">{locale === "en" ? "Apply" : "应用筛选"}</button>
        </form>
      </details><div className="plaza-filter-tools"><small>{locale === "en" ? "Within a category: OR. Across categories: AND." : "同类多选满足任一，跨类条件同时满足。"}</small><button onClick={async()=>{try{await navigator.clipboard.writeText(window.location.href);setShareStatus(locale==='en'?'Link copied':'筛选链接已复制');}catch{setShareStatus(locale==='en'?'Copy the address bar URL':'可复制浏览器地址栏分享筛选');}}}>{locale === "en" ? "Share filters" : "分享筛选"}</button><span role="status">{shareStatus}</span><label>{locale === "en" ? "Per page" : "每页"}<select value={filters.pageSize||12} onChange={e=>router.push(href({pageSize:Number(e.target.value),page:1}))}>{[12,24,30].map(n=><option key={n} value={n}>{n}</option>)}</select></label></div></div></details>}
      {hasFilters && <div className="plaza-active-filters"><strong>{locale === "en" ? "Selected" : "已选条件"}</strong>{multiFilterKeys.flatMap(key=>(filters[key]||[]).map(value=><Link key={`${key}:${value}`} href={href({[key]:(filters[key]||[]).filter(v=>v!==value),page:1})}>{taxonomyLabel(value,locale)} ×</Link>))}{([['q',result.query],['author',filters.author],['after',filters.after],['before',filters.before],['resource',filters.resource==='quiz'?'附讲评练':filters.resource==='story-only'?'仅叙事作品':filters.resource==='printable'?printableLabel:''],['featuredOnly',filters.featuredOnly?'只看精选':'']] as const).filter(([,value])=>value).map(([key,value])=><Link key={key} href={href({[key]:"",page:1})}>{key==='after'?"自 ":key==='before'?"至 ":""}{value} ×</Link>)}<Link href={base}>{taxonomyCopy.clear}</Link></div>}

      <div className="plaza-workspace">

        <div className="plaza-results"><div className="plaza-result-bar"><span role="status" aria-live="polite"><strong>{result.total}</strong> {copy.works}</span>{hasFilters && <Link href={base}>{taxonomyCopy.clear}</Link>}<div className="plaza-sort">{sortOptions.map(([value,label]) => <Link key={value} href={href({sort:value,page:1})} aria-current={(filters.sort || "featured") === value ? "true" : undefined}>{label}</Link>)}</div><select className="plaza-sort-mobile" aria-label={locale === "en" ? "Sort resources" : "资源排序"} value={filters.sort || "featured"} onChange={event => router.push(href({sort:event.target.value,page:1}))}>{sortOptions.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></div>
          <div className="plaza-grid">{result.works.map(work => {
            const tags = workTags(work).slice(0, work.quizUrl ? 4 : 5);
            return <article className="plaza-card" key={work.id}>
              <div className="plaza-paper">
                <div className="plaza-card-visual"><button className="plaza-cover-button" aria-label={`${labels.preview}: ${work.title}`} onClick={() => open(work)}><Cover work={work} label={labels.noCover} /><span className="plaza-cover-preview" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>{labels.preview}</span></button>
                  <div className="plaza-cover-tags">{tags.map(tag => <span key={tag} title={tag}>{taxonomyLabel(tag,locale)}</span>)}{work.quizUrl && <span>{copy.practice}</span>}</div>
                </div>
                <div className="plaza-card-heading"><h3><button onClick={() => open(work)} title={work.title}>{work.title}</button></h3>{work.featured && <span className="plaza-featured">{labels.pick}</span>}</div>
                <div className="plaza-card-caption"><Author work={work} /><a href={work.playUrl} target="_blank" rel="noopener noreferrer">{copy.enter} <span aria-hidden="true">↗</span></a></div>
              </div>
            </article>;
          })}</div>
          {!result.works.length && <div className="plaza-empty" role={loadFailed ? "alert" : "status"}><span aria-hidden="true">◇</span><h3>{loadFailed ? labels.error : hasFilters ? taxonomyCopy.empty : copy.empty}</h3><p>{loadFailed ? labels.errorHint : hasFilters ? taxonomyCopy.hint : copy.emptyHint}</p>{loadFailed ? <a href={href()}>{labels.retry}</a> : hasFilters ? <Link href={base}>{taxonomyCopy.clear}</Link> : null}</div>}
          {result.totalPages > 1 && <nav className="plaza-pagination" aria-label={labels.collection}>{result.page > 1 ? <Link href={href({ page: result.page - 1 })}>← {copy.previous}</Link> : <span />}<span>{result.page} / {result.totalPages}</span>{result.page < result.totalPages ? <Link href={href({ page: result.page + 1 })}>{copy.next} →</Link> : <span />}</nav>}
        </div>
      </div>
    </section><footer className="plaza-footer"><p>{labels.footer}</p><small>NarrativeOS</small></footer>
    <dialog ref={dialog} className="plaza-dialog" aria-labelledby="plaza-detail-title" onCancel={event => { event.preventDefault(); close(); }} onClick={event => { if (event.target === event.currentTarget) close(); }}>
      {selected && <section className="plaza-drawer" data-lenis-prevent>
        <CloseButton className="plaza-close" aria-label={labels.close} onClick={close} autoFocus />
        <div className="plaza-detail-art"><Cover key={selected.id} work={selected} label={labels.noCover} priority /></div>
        <div className="plaza-detail-body"><p className="plaza-kicker">{labels.collection}</p><h2 id="plaza-detail-title">{selected.title}</h2>
          <Author key={selected.id} work={selected} />
          <div className="plaza-tags">{workTags(selected).map(tag => <span key={tag}>{taxonomyLabel(tag,locale)}</span>)}</div>
          {selected.summary && <><h3>{labels.about}</h3><p className="plaza-detail-summary">{selected.summary}</p></>}
          <p className="plaza-detail-date">{labels.published} <time dateTime={selected.publishedAt}>{new Date(selected.publishedAt).toLocaleDateString(locale, { timeZone: "Asia/Shanghai" })}</time></p>
          <div className="plaza-detail-actions"><a className="plaza-primary" href={selected.playUrl} target="_blank" rel="noreferrer">{copy.enter} <span aria-hidden="true">↗</span></a>{selected.quizUrl && <a href={selected.quizUrl} target="_blank" rel="noreferrer">{copy.practice} <span aria-hidden="true">↗</span></a>}</div>
        </div>
      </section>}

    </dialog>
  </div>;
}
