"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLenis } from "lenis/react";
import BrandLogo from "@/components/brand-logo";
import { soundPosition } from "@/lib/classroom-sound";
import { useClassroomSound } from "@/lib/use-classroom-sound";

function MicrophoneIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="8" y="2" width="8" height="13" rx="4" /><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v4m-4 0h8" strokeLinecap="round" /></svg>;
}

function SoundGauge({ db, threshold }: { db: number | null; threshold: number }) {
  const position = db === null ? 0 : soundPosition(db);
  const angle = Math.PI * (1 - soundPosition(threshold) / 100);
  // JS engines may differ in the final bit of trigonometric results. SVG pixels
  // do not need that precision, and rounded strings hydrate identically.
  const coordinate = (value: number) => value.toFixed(3);
  return <div className="sound-gauge">
    <svg viewBox="0 0 380 245" fill="none" aria-hidden="true">
      {Array.from({ length: 19 }, (_, index) => {
        const angle = Math.PI * (1 - index / 18);
        return <path key={index} d={`M${coordinate(190 + 161 * Math.cos(angle))} ${coordinate(190 - 161 * Math.sin(angle))}L${coordinate(190 + 168 * Math.cos(angle))} ${coordinate(190 - 168 * Math.sin(angle))}`} stroke="currentColor" opacity={index % 3 ? .2 : .45} />;
      })}
      <path d="M45 190A145 145 0 0 1 335 190" className="sound-gauge-track" strokeWidth="12" strokeLinecap="round" />
      <path d="M45 190A145 145 0 0 1 335 190" className="sound-gauge-fill" strokeWidth="12" strokeLinecap="round" pathLength="100" strokeDasharray={`${position} 100`} opacity={db === null ? 0 : 1} />
      <circle cx={coordinate(190 + 145 * Math.cos(angle))} cy={coordinate(190 - 145 * Math.sin(angle))} r="7" className="sound-threshold-dot" strokeWidth="3" />
      <text x="45" y="220" textAnchor="middle" fill="currentColor" opacity=".5" fontSize="11">−90</text><text x="335" y="220" textAnchor="middle" fill="currentColor" opacity=".5" fontSize="11">0</text>
    </svg>
    <div className="sound-reading"><span>当前麦克风电平</span><strong>{db === null ? "—" : db.toFixed(1)}</strong><small>dBFS <i>·</i> 未校准</small></div>
  </div>;
}

function SoundHistory({ history, threshold }: { history: number[]; threshold: number }) {
  const points = history.map((db, index) => `${600 - (history.length - 1 - index) * 600 / 59},${72 - soundPosition(db) * .64}`).join(" ");
  const thresholdY = 72 - soundPosition(threshold) * .64;
  return <div className="sound-history"><div><span>最近 30 秒</span><span><i />提醒阈值</span></div><svg viewBox="0 0 600 80" preserveAspectRatio="none" aria-label={history.length ? "最近的麦克风电平变化" : "开启监听后显示音量变化"} role="img"><path d="M0 23H600M0 47H600M0 72H600" className="sound-history-grid" /><path d={`M0 ${thresholdY}H600`} className="sound-history-threshold" />{history.length > 1 && <polyline points={points} className="sound-history-line" />}</svg></div>;
}

export default function ClassroomSoundMeter() {
  const { snapshot, settings, setSettings, devices, deviceId, selectDevice, start, stop, resume, calibrate } = useClassroomSound();
  const [flash, setFlash] = useState(true);
  const [preview, setPreview] = useState(false);
  const [presentation, setPresentation] = useState(false);
  const lenis = useLenis();
  const running = snapshot.status === "running";
  const active = running || snapshot.status === "requesting" || snapshot.status === "paused";
  const calibrating = snapshot.calibrationSeconds > 0;
  const alarming = snapshot.alarming || preview;
  const pending = !alarming && running && !calibrating && snapshot.db !== null && snapshot.db >= settings.threshold;
  const title = preview ? "这是红色提醒的样子" : calibrating ? "采样中，请保持安静" : snapshot.alarming ? "轻一点，安静一点" : pending ? "声音有点大，再轻一点" : running ? "安静，保持就好" : snapshot.status === "requesting" ? "等一个麦克风的许可" : snapshot.status === "paused" ? "监听暂停了" : "给安静一点看得见的提醒";
  const progress = snapshot.alarming ? snapshot.quietSeconds / 2 : snapshot.overSeconds / settings.holdSeconds;
  const time = `${String(Math.floor(snapshot.elapsedSeconds / 60)).padStart(2, "0")}:${String(snapshot.elapsedSeconds % 60).padStart(2, "0")}`;
  const badge = preview ? "效果预览" : calibrating ? "环境采样" : snapshot.status === "requesting" ? "等待授权" : snapshot.status === "paused" ? "输入暂停" : alarming ? "请保持安静" : running ? "正在监听" : "麦克风未开启";

  useEffect(() => { lenis?.resize(); }, [lenis, presentation, snapshot.status, snapshot.message]);
  useEffect(() => {
    if (!preview) return;
    const timeout = setTimeout(() => setPreview(false), 4500);
    return () => clearTimeout(timeout);
  }, [preview]);
  useEffect(() => {
    if (!presentation) return;
    lenis?.scrollTo(0, { immediate: true }); window.scrollTo(0, 0);
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setPresentation(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [presentation, lenis]);

  return <div className={`sound-app${alarming ? " is-alert" : pending ? " is-pending" : ""}${presentation ? " is-presentation" : ""}`}>
    {alarming && <div className={`sound-alert-wash${flash ? " is-pulsing" : ""}`} aria-hidden="true" />}
    <header className="sound-topbar"><Link href="/teacher-ecosystem/" className="sound-brand"><BrandLogo size={32} /><span>临场 <i>/</i> 教师工具</span></Link><Link href="/teacher-ecosystem/">返回资源广场 <span aria-hidden="true">↗</span></Link></header>
    <main className="sound-main">
      <section className="sound-intro"><div><span className="sound-eyebrow">A LITTLE QUIETER, A LITTLE MORE FOCUSED</span><h1>静一静 <span>自习音量灯</span><i aria-hidden="true">✳</i></h1><p>把提醒交给一盏灯，把注意力留给自己。</p></div><span>麦克风监听 / 持续超标提醒</span></section>
      <div className="sound-workspace">
        <section className="sound-meter-card" aria-label="自习音量显示仪">
          <div className="sound-meter-toolbar"><span className={`sound-status-badge${active ? " is-active" : ""}`}><i />{badge}</span><button type="button" aria-pressed={presentation} onClick={() => setPresentation(value => !value)}><span aria-hidden="true">⛶</span>{presentation ? "退出投屏" : "投屏模式"}</button></div>
          <SoundGauge db={snapshot.db} threshold={settings.threshold} />
          <div className="sound-status-copy"><h2 aria-live="polite" aria-atomic="true">{title}</h2><p>{preview ? "仅展示提醒效果，没有开启麦克风。" : calibrating ? `还需 ${Math.ceil(snapshot.calibrationSeconds)} 秒，正在了解这个教室的底噪。` : snapshot.alarming ? snapshot.quietSeconds > 0 ? `已经安静 ${snapshot.quietSeconds.toFixed(1)} / 2 秒，即将恢复。` : "声音降下来并保持 2 秒，红色提醒会自动结束。" : pending ? `连续超标 ${snapshot.overSeconds.toFixed(1)} / ${settings.holdSeconds} 秒` : running ? `高于 ${settings.threshold} dBFS 并持续 ${settings.holdSeconds} 秒，才会亮起红色提醒。` : snapshot.status === "paused" ? "恢复麦克风输入后，再一起继续。" : "开启监听后，音量会实时显示在这里。"}</p></div>
          <div className="sound-hold-progress" role="progressbar" aria-label={snapshot.alarming ? "安静恢复进度" : "连续超标计时"} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}><span style={{ width: `${progress * 100}%` }} /></div>
          <div className="sound-main-actions">{snapshot.status === "paused" ? <button type="button" className="sound-start" onClick={() => { setPreview(false); void resume(); }}><MicrophoneIcon />继续监听</button> : !active ? <button type="button" className="sound-start" onClick={() => { setPreview(false); void start(); }}><MicrophoneIcon />开始监听</button> : null}{active && <button type="button" className="sound-stop" onClick={() => { setPreview(false); stop(); }}><span aria-hidden="true">■</span>{snapshot.status === "requesting" ? "取消等待" : "结束监听"}</button>}</div>
          {snapshot.message && <p className={`sound-message${snapshot.status === "error" ? " is-error" : ""}`} role={snapshot.status === "error" ? "alert" : "status"}>{snapshot.message}</p>}
          <div className="sound-session-stats"><div><span>本次时长</span><strong>{time}</strong></div><div><span>提醒次数</span><strong>{snapshot.alerts}<small>次</small></strong></div><div><span>本次最高电平</span><strong>{snapshot.peak === null ? "—" : snapshot.peak.toFixed(1)}<small>dBFS</small></strong></div></div>
          <SoundHistory history={snapshot.history} threshold={settings.threshold} />
          <p className="sound-local-note"><span aria-hidden="true">◈</span>只分析音量，不录音、不上传。</p>
        </section>

        <aside className="sound-settings" aria-label="音量提醒设置">
          <section><div className="sound-section-heading"><span>01</span><h2>提醒怎么亮起</h2></div>
            <label className="sound-setting-label" htmlFor="sound-threshold">提醒阈值 <output>{settings.threshold} <small>dBFS</small></output></label><input id="sound-threshold" className="sound-range" type="range" min={-75} max={-8} step={1} value={settings.threshold} disabled={calibrating} onChange={event => setSettings(current => ({ ...current, threshold: Number(event.target.value) }))} />
            <div className="sound-range-labels"><span>更灵敏</span><span>更宽松</span></div><div className="sound-presets" role="group" aria-label="阈值预设">{[{ value: -45, label: "灵敏" }, { value: -35, label: "适中" }, { value: -25, label: "宽松" }].map(item => <button type="button" key={item.value} aria-pressed={settings.threshold === item.value} disabled={calibrating} onClick={() => setSettings(current => ({ ...current, threshold: item.value }))}>{item.label}<small>{item.value} dBFS</small></button>)}</div>
            <p className="sound-hint">数字越接近 0，需要更大的声音才会触发。</p>
            <label className="sound-setting-label sound-duration-label" htmlFor="sound-duration">连续超标时长 <output>{settings.holdSeconds} <small>秒</small></output></label><input id="sound-duration" className="sound-range" type="range" min={1} max={10} step={1} value={settings.holdSeconds} disabled={calibrating} onChange={event => setSettings(current => ({ ...current, holdSeconds: Number(event.target.value) }))} /><div className="sound-range-labels"><span>1 秒</span><span>10 秒</span></div>
            <p className="sound-recovery"><span aria-hidden="true">↳</span>短暂超标会重新计时；安静保持 2 秒后自动恢复。</p>
          </section>
          <section><div className="sound-section-heading"><span>02</span><h2>适应这个教室</h2></div>
            <label className="sound-device-label">输入麦克风<select value={deviceId} disabled={snapshot.status === "requesting" || calibrating} onChange={event => selectDevice(event.target.value)}><option value="">系统默认麦克风</option>{devices.filter(device => device.deviceId !== "default" && device.deviceId !== "communications").map((device, index) => <option key={device.deviceId} value={device.deviceId}>{device.label || `麦克风 ${index + 1}`}</option>)}</select></label>
            <button type="button" className="sound-adapt" disabled={!running || calibrating} onClick={calibrate}>{calibrating ? `正在采样 · ${Math.ceil(snapshot.calibrationSeconds)} 秒` : "采样环境，自动设定阈值"}<span aria-hidden="true">↗</span></button><p className="sound-hint">先开启监听，让教室安静下来，再采样 5 秒。更换位置或麦克风后可重新采样。</p>
          </section>
          <section><div className="sound-section-heading"><span>03</span><h2>用温柔一点的方式提醒</h2></div><label className="sound-flash-option"><input type="checkbox" checked={flash} onChange={event => setFlash(event.target.checked)} />红色缓慢闪烁<span>关闭后常亮</span></label><button type="button" className="sound-preview" disabled={active} onClick={() => setPreview(value => !value)}>{preview ? "结束提醒预览" : "预览红色提醒"}<span aria-hidden="true">↗</span></button><p className="sound-hint">保持本页在前台。切到后台、关闭页面或结束监听时，会释放麦克风。</p></section>
        </aside>
      </div>
      <footer className="sound-footer"><div><p>安静不是没有声音，是给专注留一点空间。</p><span>检测环境音量，无法区分说话、风扇或敲击声。</span></div><details><summary>读数说明</summary><p>dBFS 是麦克风的相对数字电平，不是环境声压级 dB SPL。环境采样只调整提醒阈值；如需真实分贝读数，需要相应测量设备和校准。</p><p>麦克风需要 HTTPS 或本机 localhost。平板访问局域网 HTTP 地址时，浏览器通常不允许开启麦克风。</p><a href="https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia" target="_blank" rel="noreferrer">麦克风权限说明 ↗</a></details></footer>
    </main>
  </div>;
}
