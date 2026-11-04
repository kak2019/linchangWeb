"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { useLenis } from "lenis/react";
import BrandLogo from "@/components/brand-logo";
import { recitationTexts } from "@/lib/recitation-texts";
import { MAX_RECITATION_LENGTH, recitationCharacters, recitationMask, recitationParagraphs, type RecitationText } from "@/lib/recitation";

type Practice = {
  document: RecitationText;
  scope: "paragraph" | "full";
  paragraph: number;
  percentage: number;
  round: number;
  hidden: number[];
  revealed: number[];
  original: boolean;
};
type PracticeChanges = Partial<Pick<Practice, "document" | "scope" | "paragraph" | "percentage">>;

function practiceText(practice: Pick<Practice, "document" | "scope" | "paragraph">) {
  return practice.scope === "full" ? practice.document.text : recitationParagraphs(practice.document.text)[practice.paragraph] || "";
}

function initialPractice(): Practice {
  const first = { document: recitationTexts[0], scope: "paragraph" as const, paragraph: 0, percentage: 25 };
  return { ...first, round: 1, hidden: recitationMask(practiceText(first), first.percentage, 20261103), revealed: [], original: false };
}

function ShuffleIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M3 6h3c5 0 7 12 12 12h3M17 14l4 4-4 4M3 18h3c2 0 4-2 6-6s4-6 6-6h3M17 2l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export default function RecitationStudio() {
  const [practice, setPractice] = useState(initialPractice);
  const [fontSize, setFontSize] = useState(24);
  const [presentation, setPresentation] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState({ title: "", author: "", text: "" });
  const [draftError, setDraftError] = useState("");
  const editor = useRef<HTMLElement>(null);
  const lenis = useLenis();
  const text = practiceText(practice);
  const paragraphs = recitationParagraphs(practice.document.text);
  const canSplit = practice.document.kind === "prose" && paragraphs.length > 1;
  const hidden = new Set(practice.hidden);
  const revealed = new Set(practice.revealed);
  const characterCount = recitationCharacters(text).length;
  const style = { "--recite-font-size": `${fontSize}px` } as CSSProperties;

  useEffect(() => { lenis?.resize(); }, [lenis, practice.document.text, practice.scope, practice.paragraph, practice.percentage, presentation, editorOpen, fontSize]);
  useEffect(() => {
    if (!editorOpen || !editor.current) return;
    if (lenis) {
      lenis.resize();
      lenis.scrollTo(editor.current, { offset: -24 });
    } else editor.current.scrollIntoView({ block: "start" });
  }, [editorOpen, lenis]);
  useEffect(() => {
    if (!presentation) return;
    lenis?.scrollTo(0, { immediate: true });
    window.scrollTo(0, 0);
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setPresentation(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [presentation, lenis]);

  function restart(changes: PracticeChanges = {}, nextRound = false) {
    const seed = Math.floor(Math.random() * 4294967296);
    setPractice(current => {
      const next = { ...current, ...changes };
      const nextText = practiceText(next);
      return {
        ...next,
        round: nextRound ? current.round + 1 : 1,
        hidden: recitationMask(nextText, next.percentage, seed, nextText === practiceText(current) ? current.hidden : []),
        revealed: [], original: false,
      };
    });
  }

  function chooseDocument(document: RecitationText) {
    restart({ document, paragraph: 0, scope: document.kind === "prose" && recitationParagraphs(document.text).length > 1 ? "paragraph" : "full" });
  }

  function toggleHint(index: number) {
    setPractice(current => ({ ...current, revealed: current.revealed.includes(index) ? current.revealed.filter(value => value !== index) : [...current.revealed, index] }));
  }

  function applyCustom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.text.replace(/\r\n?/g, "\n").trim();
    if (!content || !recitationCharacters(content).length) { setDraftError("请粘贴需要背诵的文章，至少包含一个汉字、字母或数字。"); return; }
    if (Array.from(content).length > MAX_RECITATION_LENGTH) { setDraftError(`文章最多 ${MAX_RECITATION_LENGTH.toLocaleString()} 字，请分篇练习。`); return; }
    chooseDocument({ id: "custom", title: draft.title.trim() || "我的背诵篇目", author: draft.author.trim(), kind: "prose", text: content });
    setDraftError(""); setEditorOpen(false);
    lenis?.scrollTo(0, { immediate: true });
    window.scrollTo(0, 0);
  }

  function editCurrent() {
    setDraft({ title: practice.document.title, author: practice.document.author, text: practice.document.text });
    setDraftError(""); setEditorOpen(true);
  }

  return <div className={`recite-app${presentation ? " is-presentation" : ""}`} style={style}>
    <header className="recite-topbar">
      <Link href="/teacher-ecosystem/" className="recite-brand"><BrandLogo size={32} /><span>临场 <i>/</i> 教师工具</span></Link>
      <Link href="/teacher-ecosystem/">返回资源广场 <span aria-hidden="true">↗</span></Link>
    </header>
    <main className="recite-main">
      <section className="recite-intro"><div><span className="recite-kicker">READ · RECALL · REMEMBER</span><h1>拾句 <span>背诵练习</span><i aria-hidden="true">✳</i></h1><p>留一点空白，让记忆自己接上。</p></div><span className="recite-intro-label">随机留白 / 每轮不同</span></section>

      <section className="recite-workspace" aria-label="背诵练习区">
        <div className="recite-library">
          <label>今天背什么<select aria-label="选择背诵篇目" value={practice.document.id} onChange={event => {
            const chosen = recitationTexts.find(item => item.id === event.target.value);
            if (chosen) chooseDocument(chosen);
          }}>{recitationTexts.map(item => <option key={item.id} value={item.id}>{item.title} · {item.author}</option>)}{practice.document.id === "custom" && <option value="custom">{practice.document.title} · 自选课文</option>}</select></label>
          <button type="button" className="recite-custom-link" aria-expanded={editorOpen} aria-controls="recitation-editor" onClick={() => { setDraftError(""); setEditorOpen(open => !open); }}>粘贴自己的文章 <span aria-hidden="true">＋</span></button>
          <button type="button" className="recite-focus" aria-pressed={presentation} onClick={() => setPresentation(value => !value)}><span aria-hidden="true">⛶</span>{presentation ? "退出专注" : "专注阅读"}</button>
        </div>

        <div className="recite-actions">
          <div className="recite-difficulty"><span>隐藏比例</span><div role="group" aria-label="背诵难度">{[{ value: 25, label: "初读" }, { value: 50, label: "熟读" }, { value: 75, label: "挑战" }].map(level => <button type="button" key={level.value} aria-pressed={practice.percentage === level.value} onClick={() => restart({ percentage: level.value })}>{level.label} <small>{level.value}%</small></button>)}</div><label className="recite-slider"><span className="recite-sr-only">自定义隐藏比例</span><input type="range" min={10} max={90} step={5} value={practice.percentage} onChange={event => restart({ percentage: Number(event.target.value) })} /><output>{practice.percentage}%</output></label></div>
          <div className="recite-round-actions"><button type="button" className="recite-original" aria-pressed={practice.original} onClick={() => setPractice(current => ({ ...current, original: !current.original }))}>{practice.original ? "继续留白练习" : "查看原文"}</button><button type="button" className="recite-shuffle" onClick={() => restart({}, true)}><ShuffleIcon />换一轮</button></div>
        </div>

        {canSplit && <div className="recite-scope"><div role="group" aria-label="练习范围"><button type="button" aria-pressed={practice.scope === "paragraph"} onClick={() => restart({ scope: "paragraph" })}>分段练习</button><button type="button" aria-pressed={practice.scope === "full"} onClick={() => restart({ scope: "full" })}>全文连背</button></div>{practice.scope === "paragraph" ? <select aria-label="选择练习段落" value={practice.paragraph} onChange={event => restart({ paragraph: Number(event.target.value) })}>{paragraphs.map((paragraph, index) => <option value={index} key={index}>第 {index + 1} 段 · {Array.from(paragraph).slice(0, 12).join("")}…</option>)}</select> : <span>把 {paragraphs.length} 段连起来，试试完整背诵。</span>}</div>}

        <article className={`recite-paper${practice.document.kind === "poem" ? " is-poem" : ""}`} aria-label="背诵正文">
          <div className="recite-paper-meta"><span>READING NOTES <i aria-hidden="true">/</i> {practice.scope === "paragraph" ? `第 ${practice.paragraph + 1} 段` : "全文"}</span><span className={practice.original ? "recite-original-tag" : ""}>{practice.original ? "正在对照原文" : "试着把留白读出来"}</span></div>
          <header className="recite-paper-heading"><h2>{practice.document.title}</h2>{practice.document.author && <p>{practice.document.author}</p>}</header>
          <div className="recite-reading">{Array.from(text).map((character, index) => !practice.original && hidden.has(index) ? <button type="button" key={index} className={`recite-blank${revealed.has(index) ? " is-revealed" : ""}`} aria-pressed={revealed.has(index)} aria-label={revealed.has(index) ? `${character}，点击收起提示` : `第 ${index + 1} 个字的留白，点击提示`} aria-describedby="recite-help" onClick={() => toggleHint(index)}>{revealed.has(index) ? character : <span aria-hidden="true">·</span>}</button> : character)}</div>
          <div className="recite-paper-bottom"><span id="recite-help">卡住时点一下留白，再次点击可收起提示。</span><span className="recite-seal" aria-hidden="true">拾句</span></div>
        </article>

        <div className="recite-progress">
          <div className="recite-round-status" aria-live="polite" aria-atomic="true"><strong>第 {String(practice.round).padStart(2, "0")} 轮</strong><span>本{practice.scope === "paragraph" ? "段" : "篇"} {characterCount} 字 <i>·</i> 留白 {practice.hidden.length} 字 <i>·</i> 已提示 {practice.revealed.length} 字</span></div>
          <div className="recite-reading-tools"><button type="button" disabled={!practice.revealed.length} onClick={() => setPractice(current => ({ ...current, revealed: [] }))}>收起提示</button><div role="group" aria-label="阅读字号"><button type="button" aria-label="缩小阅读字号" disabled={fontSize <= 18} onClick={() => setFontSize(value => Math.max(18, value - 2))}>A−</button><button type="button" aria-label="放大阅读字号" disabled={fontSize >= 36} onClick={() => setFontSize(value => Math.min(36, value + 2))}>A＋</button></div></div>
        </div>

        {canSplit && practice.scope === "paragraph" && <nav className="recite-paragraph-nav" aria-label="段落切换"><button type="button" disabled={practice.paragraph === 0} onClick={() => restart({ paragraph: practice.paragraph - 1 })}>← 上一段</button><span>{practice.paragraph + 1} / {paragraphs.length}<small>背熟一段，再往前一步。</small></span><button type="button" disabled={practice.paragraph === paragraphs.length - 1} onClick={() => restart({ paragraph: practice.paragraph + 1 })}>下一段 →</button></nav>}
      </section>

      <section className="recite-editor" id="recitation-editor" ref={editor} hidden={!editorOpen} aria-labelledby="recite-editor-heading">
        <div className="recite-editor-heading"><div><span className="recite-kicker">YOUR WORDS, YOUR PACE</span><h2 id="recite-editor-heading">把自己的课文带进来</h2></div><button type="button" onClick={() => setEditorOpen(false)}>收起 ↑</button></div>
        <form onSubmit={applyCustom}>
          <div className="recite-editor-fields"><label>篇目名称 <small>选填</small><input value={draft.title} onChange={event => setDraft(current => ({ ...current, title: event.target.value }))} maxLength={60} placeholder="如：岳阳楼记、英语课文" /></label><label>作者 / 备注 <small>选填</small><input value={draft.author} onChange={event => setDraft(current => ({ ...current, author: event.target.value }))} maxLength={60} placeholder="如：宋 · 范仲淹" /></label></div>
          <label className="recite-content-label">需要背诵的文章<textarea value={draft.text} onChange={event => { setDraft(current => ({ ...current, text: event.target.value })); setDraftError(""); }} rows={8} maxLength={MAX_RECITATION_LENGTH} placeholder="在这里粘贴原文。换行会分成不同段落，标点与原有顺序会保留。" data-lenis-prevent /></label>
          <div className="recite-editor-submit"><span>{draft.text.length.toLocaleString()} / {MAX_RECITATION_LENGTH.toLocaleString()} 字符 · 文章只在本页使用</span><button type="submit">开始留白练习 <span aria-hidden="true">↗</span></button></div>
          {draftError && <p className="recite-error" role="alert">{draftError}</p>}
        </form>
      </section>

      <footer className="recite-footer"><div><p>读一遍，想一想，再读一遍。</p><span>{practice.document.note || "可以从少量留白开始，熟悉之后再增加难度。"}</span></div><div>{practice.document.source && <a href={practice.document.source} target="_blank" rel="noreferrer">选文参考：维基文库 ↗</a>}<button type="button" onClick={editCurrent}>修改这篇原文</button></div></footer>
    </main>
  </div>;
}
