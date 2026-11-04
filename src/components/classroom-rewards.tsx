"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { useLenis } from "lenis/react";
import BrandLogo from "@/components/brand-logo";
import RewardArtwork, { RewardSymbol } from "@/components/reward-artwork";
import { initialRewardSettings, rewardPaper, rewardPresets, rewardSheets, rewardStudents, rewardTemplates, validateRewardSettings, type RewardSettings, type RewardTemplate } from "@/lib/classroom-rewards";

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function ActionIcon({ print = false }: { print?: boolean }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    {print ? <path d="M6 8V3h12v5M6 17H3V8h18v9h-3M6 14h12v7H6zM17 11h1" /> : <path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" />}
  </svg>;
}

export default function ClassroomRewards({ initialDate }: { initialDate: string }) {
  const [settings, setSettings] = useState(() => initialRewardSettings(initialDate));
  const [page, setPage] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [download, setDownload] = useState<{ url: string; filename: string } | null>(null);
  const preview = useRef<HTMLDivElement>(null);
  const assetUrl = useRef<string | null>(null);
  const documentReady = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  const validation = validateRewardSettings(settings);
  const sheets = rewardSheets(settings);
  const activePage = Math.min(page, Math.max(0, sheets.length - 1));
  const paper = rewardPaper(settings.template);
  const template = rewardTemplates.find(item => item.id === settings.template)!;
  const total = sheets.reduce((sum, sheet) => sum + sheet.length, 0);
  const lenis = useLenis();

  useEffect(() => () => { if (assetUrl.current) URL.revokeObjectURL(assetUrl.current); }, []);
  useEffect(() => { lenis?.resize(); }, [lenis, settings.template, sheets.length, validation]);

  function update<K extends keyof RewardSettings>(key: K, value: RewardSettings[K]) {
    setSettings(current => ({ ...current, [key]: value }));
    setPage(0);
    setExportError("");
    setDownload(null);
  }

  function selectTemplate(value: RewardTemplate) {
    setSettings(current => ({ ...current, template: value, copies: value === "certificate" || rewardStudents(current.names).length > 1 ? 1 : 12 }));
    setPage(0); setDownload(null); setExportError("");
  }

  async function exportPng() {
    const svg = preview.current?.querySelector("svg[data-reward-artwork]");
    if (!svg || validation || exporting) return;
    setExporting(true); setExportError("");
    let sourceUrl: string | null = null;
    const canvas = document.createElement("canvas");
    try {
      const clone = svg.cloneNode(true) as SVGElement;
      clone.setAttribute("width", String(paper.pngWidth));
      clone.setAttribute("height", String(paper.pngHeight));
      sourceUrl = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml;charset=utf-8" }));
      const image = new Image();
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve(); image.onerror = () => reject(new Error("image")); image.src = sourceUrl!;
      });
      canvas.width = paper.pngWidth; canvas.height = paper.pngHeight;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("canvas");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("blob")), "image/png"));
      if (assetUrl.current) URL.revokeObjectURL(assetUrl.current);
      const url = URL.createObjectURL(blob);
      assetUrl.current = url;
      const filename = `Flynt-A4-${settings.template}-${activePage + 1}.png`;
      setDownload({ url, filename });
      const link = document.createElement("a");
      link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove();
    } catch {
      setExportError("图片暂时未能生成，请重试；也可以直接打印或保存为 PDF。");
    } finally {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
      canvas.width = 1; canvas.height = 1;
      setExporting(false);
    }
  }

  const pageStyle = { width: `${paper.width}mm`, height: `${paper.height}mm` } satisfies CSSProperties;
  return <div className="rewards-app">
    <header className="rewards-topbar">
      <Link href="/teacher-ecosystem/" className="rewards-brand"><BrandLogo size={34} /><span>临场 <i> / </i> 教师工具</span></Link>
      <div><span className="rewards-byline">由 Flynt 创作</span><Link href="/teacher-ecosystem/">返回资源广场 <span aria-hidden="true">↗</span></Link></div>
    </header>

    <main className="rewards-main">
      <section className="rewards-intro">
        <div><h1>课堂印记<span>工坊</span><i>✳</i></h1>
          <p className="rewards-description">把一句鼓励，变成孩子手里的小小荣誉。</p>
        </div>
      </section>

      <div className="rewards-workspace">
        <section className="rewards-preview-panel" id="reward-preview" aria-label="A4 打印预览">
          <div className="rewards-preview-toolbar"><div><span className="rewards-live-dot" />实时预览 <small>A4 · {paper.orientation === "landscape" ? "横版" : "竖版"}</small></div><a href="#reward-editor">修改内容 <span aria-hidden="true">↓</span></a></div>
          <div className="rewards-preview-stage">
            {validation ? <div className="rewards-validation" role="alert"><RewardSymbol kind="flower" size={70} /><p>{validation}</p></div> : <div ref={preview} className={`rewards-paper rewards-paper-${paper.orientation}`} data-testid="reward-preview"><RewardArtwork settings={settings} labels={sheets[activePage] || []} /></div>}
          </div>
          <div className="rewards-preview-pagination"><span>{total} 份{template.name} · 共 {sheets.length} 页</span><div><button type="button" aria-label="预览上一页" disabled={activePage === 0} onClick={() => { setPage(activePage - 1); setDownload(null); }}>←</button><span>{sheets.length ? activePage + 1 : 0} / {sheets.length}</span><button type="button" aria-label="预览下一页" disabled={activePage >= sheets.length - 1} onClick={() => { setPage(activePage + 1); setDownload(null); }}>→</button></div></div>
          <div className="rewards-actions"><button type="button" className="rewards-download" disabled={Boolean(validation) || exporting} onClick={() => void exportPng()}><ActionIcon />{exporting ? "正在生成图片…" : "下载本页 PNG"}</button><button type="button" className="rewards-print" disabled={Boolean(validation) || exporting} onClick={() => window.print()}><ActionIcon print />打印{ sheets.length > 1 ? `全部 ${sheets.length} 页` : "这份鼓励"}</button></div>
          <div className="rewards-export-status" aria-live="polite">{exportError ? <span role="alert">{exportError}</span> : download ? <a href={download.url} target="_blank" rel="noreferrer">图片已生成 · 打开图片或长按保存 ↗</a> : <span>打印时选择 A4、{paper.orientation === "landscape" ? "横向" : "纵向"}、100% 大小，并关闭页眉页脚。</span>}</div>
        </section>

        <aside className="rewards-editor" id="reward-editor" aria-label="奖励内容设置">
          <section className="rewards-field-section"><div className="rewards-section-title"><span>01</span><h2>选一个鼓励的样子</h2><a href="#reward-preview">返回预览 <span aria-hidden="true">↑</span></a></div>
            <div className="rewards-template-options">{rewardTemplates.map(item => <button type="button" key={item.id} aria-pressed={settings.template === item.id} onClick={() => selectTemplate(item.id)}>
              <RewardSymbol kind={item.id} size={34} /><span><strong>{item.name}</strong><small>{item.detail}</small></span><i aria-hidden="true">{settings.template === item.id ? "✓" : ""}</i>
            </button>)}</div>
          </section>

          <section className="rewards-field-section"><div className="rewards-section-title"><span>02</span><h2>写下这一次闪光</h2></div>
            <div className="rewards-presets" aria-label="鼓励语示例">{rewardPresets.map(preset => <button type="button" key={preset.name} onClick={() => {
              setSettings(current => ({ ...current, title: preset.title, message: preset.message, shortMessage: preset.shortMessage })); setPage(0); setDownload(null);
            }}>{preset.name} <span aria-hidden="true">↗</span></button>)}</div>
            <div className="rewards-field-grid">
              <label className="rewards-field">奖项名称<input value={settings.title} onChange={event => update("title", event.target.value)} maxLength={16} placeholder="给这次努力起个名字" /></label>
              <label className="rewards-field">学生姓名 <small>每行一位，也可用逗号分隔</small><textarea className="rewards-names" value={settings.names} onChange={event => update("names", event.target.value)} maxLength={1500} rows={2} placeholder={"小禾\n安安\n小满"} /><span className="rewards-hint">留空时，写给“闪闪发光的你”。</span></label>
              <label className="rewards-field rewards-field-wide">鼓励语<textarea value={settings.template === "certificate" ? settings.message : settings.shortMessage} onChange={event => update(settings.template === "certificate" ? "message" : "shortMessage", event.target.value)} maxLength={settings.template === "certificate" ? 120 : 40} rows={3} /><span className="rewards-hint">说出具体的努力，让鼓励更有力量。</span></label>
              <label className="rewards-field">班级 / 颁发单位 <small>选填</small><input value={settings.classroom} onChange={event => update("classroom", event.target.value)} maxLength={20} placeholder="如：三年级二班" /></label>
              <label className="rewards-field">颁发老师 <small>选填</small><input value={settings.teacher} onChange={event => update("teacher", event.target.value)} maxLength={16} placeholder="老师姓名" /></label>
              <label className="rewards-field">颁发日期<input type="date" value={settings.date} onChange={event => update("date", event.target.value)} /></label>
              <label className="rewards-field">每人份数<input type="number" min={1} max={12} step={1} value={Number.isNaN(settings.copies) ? "" : settings.copies} onChange={event => update("copies", event.target.valueAsNumber)} /></label>
              {settings.template !== "certificate" && <label className="rewards-field">学习主题<select value={settings.subject} onChange={event => update("subject", event.target.value)}>{["跨学科", "语文", "数学", "英语", "科学", "艺术", "体育", "劳动", "综合实践"].map(subject => <option key={subject}>{subject}</option>)}</select></label>}
            </div>
          </section>

          <section className="rewards-field-section rewards-print-options"><div className="rewards-section-title"><span>03</span><h2>准备带进课堂</h2></div>
            <div className="rewards-color-options" aria-label="打印配色"><button type="button" aria-pressed={settings.color === "color"} onClick={() => update("color", "color")}><i className="rewards-color-dot" />暖色印记</button><button type="button" aria-pressed={settings.color === "mono"} onClick={() => update("color", "mono")}><i className="rewards-mono-dot" />黑白省墨</button></div>
            {settings.template !== "certificate" && <label className="rewards-checkbox"><input type="checkbox" checked={settings.cutLines} onChange={event => update("cutLines", event.target.checked)} />显示裁切虚线</label>}
            <p className="rewards-hint">每批最多 60 份。普通 A4 纸即可；邮票和小红花打印后可裁剪，也可使用 A4 不干胶纸。</p>
          </section>
        </aside>
      </div>
      <footer className="rewards-footer"><span>✳ 不只奖励结果，也看见努力的过程。</span><span>跨学科教师工具 <i>·</i> 作者 Flynt</span></footer>
    </main>
    {documentReady && createPortal(<div className="reward-print-root" aria-hidden="true">
      <style media="print">{`@page { size: A4 ${paper.orientation}; margin: 0; }`}</style>
      {sheets.map((labels, index) => <div className="reward-print-page" key={index} style={pageStyle}><RewardArtwork settings={settings} labels={labels} /></div>)}
    </div>, document.body)}
  </div>;
}
