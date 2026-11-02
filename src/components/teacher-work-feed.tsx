"use client";
import { CollectionCard } from "@narrativeos/ui/collection-card";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLenis } from "lenis/react";
import type { PublicTeacherWork } from "@/lib/teacher-ecosystem";
import { teacherEcosystemPath, type Locale } from "@/lib/i18n";
import type { TeacherPlazaMessages } from '@/lib/messages/teacher-plaza';
type Copy = Pick<TeacherPlazaMessages, 'works' | 'clear' | 'empty' | 'emptyHint' | 'description' | 'author' | 'enter' | 'practice' | 'feed'>;
type Batch = { works: PublicTeacherWork[]; total: number; nextOffset: number; hasMore: boolean };
export default function TeacherWorkFeed({ query, locale, copy }: { query: string; locale: Locale; copy: Copy }) {
  const lenis = useLenis();
  const [works, setWorks] = useState<PublicTeacherWork[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const gallery = useRef<HTMLElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const offset = useRef(0);
  const busy = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const text = copy.feed;
  const load = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setLoading(true); setError(false);
    const request = new AbortController();
    controller.current = request;
    const columns = gallery.current ? getComputedStyle(gallery.current).gridTemplateColumns.split(" ").filter(Boolean).length : 1;
    const limit = Math.max(1, columns) * (offset.current === 0 ? 2 : 3);
    try {
      const params = new URLSearchParams({ q: query, offset: String(offset.current), limit: String(limit) });
      const response = await fetch(`/api/teacher-ecosystem/works?${params}`, { signal: request.signal });
      if (!response.ok) throw new Error("Work list unavailable");
      const batch = await response.json() as Batch;
      if (request.signal.aborted) return;
      offset.current = batch.nextOffset;
      setWorks(current => {
        const ids = new Set(current.map(work => work.id));
        return [...current, ...batch.works.filter(work => !ids.has(work.id))];
      });
      setTotal(batch.total); setHasMore(batch.hasMore && batch.works.length > 0);
    } catch { if (!request.signal.aborted) setError(true); }
    finally {
      if (controller.current === request) {
        busy.current = false;
        if (!request.signal.aborted) setLoading(false);
      }
    }
  }, [query]);
  useEffect(() => {
    void load();
    return () => { controller.current?.abort(); busy.current = false; };
  }, [load]);
  useEffect(() => {
    // The root element has a fixed height, so appended cards do not trigger
    // Lenis's ResizeObserver. Refresh its scroll range after the DOM changes.
    lenis?.resize();
  }, [lenis, works.length, loading, error, hasMore]);
  useEffect(() => {
    if (loading || error || !hasMore || !sentinel.current || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) void load();
    });
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [loading, error, hasMore, load]);
  return <>
    <div className="ecosystem-result-meta ecosystem-feed-meta">
      {total !== null ? <span>{total} {copy.works}</span> : null}
      {query ? <Link href={teacherEcosystemPath(locale)}>{copy.clear}</Link> : null}
    </div>
      <section ref={gallery} className="ecosystem-gallery" aria-busy={loading}>
        {works.map((work, index) => (
          <CollectionCard className="ecosystem-card" key={work.id}>
            <a className="ecosystem-cover" href={work.playUrl} target="_blank" rel="noreferrer">
              {work.coverUrl ? <img className="ecosystem-cover-image" src={work.coverUrl} alt="" loading="lazy" decoding="async" /> : <span className="ecosystem-cover-image" aria-hidden="true" />}
              <span className="ecosystem-card-index">{String(index + 1).padStart(2, "0")}</span>
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
          </CollectionCard>
        ))}
      </section>

    {!loading && !error && !works.length ? <section className="ecosystem-empty"><span aria-hidden="true">◇</span><h2>{copy.empty}</h2><p>{copy.emptyHint}</p></section> : null}
    <div ref={sentinel} className="ecosystem-feed-status" role="status" aria-live="polite">
      {loading ? text.loading : error ? <><span>{text.error}</span><button type="button" onClick={() => void load()}>{text.retry}</button></> : hasMore ? <button type="button" onClick={() => void load()}>{text.more}</button> : works.length ? text.end : null}
    </div>
  </>;
}
