"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { advanceSoundGate, initialSoundGate, microphoneError, powerToDbfs, soundPower, suggestedSoundThreshold, type SoundGate, type SoundSettings } from "./classroom-sound";

type SoundStatus = "idle" | "requesting" | "running" | "paused" | "error";
type Snapshot = {
  status: SoundStatus;
  db: number | null;
  alarming: boolean;
  overSeconds: number;
  quietSeconds: number;
  calibrationSeconds: number;
  elapsedSeconds: number;
  alerts: number;
  peak: number | null;
  history: number[];
  microphone: string;
  message: string;
};
type Session = {
  context: AudioContext;
  stream: MediaStream | null;
  source: MediaStreamAudioSourceNode | null;
  interval: ReturnType<typeof setInterval> | null;
  gate: SoundGate;
  calibration: { since: number; samples: number[] } | null;
  lastSample: number;
};
const emptySnapshot = (): Snapshot => ({ status: "idle", db: null, alarming: false, overSeconds: 0, quietSeconds: 0, calibrationSeconds: 0, elapsedSeconds: 0, alerts: 0, peak: null, history: [], microphone: "", message: "" });

function releaseSession(session: Session | null) {
  if (!session) return;
  if (session.interval !== null) clearInterval(session.interval);
  session.context.onstatechange = null;
  session.source?.disconnect();
  session.stream?.getTracks().forEach(track => { track.onended = null; track.onmute = null; track.onunmute = null; track.stop(); });
  if (session.context.state !== "closed") void session.context.close().catch(() => {});
}

export function useClassroomSound() {
  const [settings, setSettings] = useState<SoundSettings>({ threshold: -35, holdSeconds: 3 });
  const [snapshot, setSnapshot] = useState(emptySnapshot);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState("");
  const session = useRef<Session | null>(null);
  const generation = useRef(0);
  const currentSettings = useRef(settings);

  const release = useCallback(() => {
    generation.current++;
    const previous = session.current;
    session.current = null;
    releaseSession(previous);
  }, []);

  const stop = useCallback((message = "监听已结束，麦克风已释放。", status: SoundStatus = "idle") => {
    release();
    setSnapshot(current => ({ ...current, status, db: null, alarming: false, overSeconds: 0, quietSeconds: 0, calibrationSeconds: 0, history: [], message }));
  }, [release]);

  useEffect(() => {
    currentSettings.current = settings;
    if (session.current) { session.current.gate = initialSoundGate(); session.current.calibration = null; }
  }, [settings]);

  useEffect(() => {
    const onHidden = () => { if (document.hidden && session.current) stop("页面已进入后台，监听已停止。回到本页后可重新开始。"); };
    const onPageHide = () => { if (session.current) stop("监听已停止。"); };
    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("pagehide", onPageHide);
      release();
    };
  }, [stop, release]);

  async function start() {
    if (session.current) return;
    if (!window.isSecureContext) { stop("麦克风需要 HTTPS 或本机 localhost 地址。平板通过局域网 HTTP 打开时，请改用 HTTPS 地址。", "error"); return; }
    const Constructor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!navigator.mediaDevices?.getUserMedia || !Constructor) { stop("当前浏览器不支持麦克风分析，请使用较新的 Safari 或 Chrome。", "error"); return; }
    const token = ++generation.current;
    setSnapshot({ ...emptySnapshot(), status: "requesting", message: "请在浏览器提示中允许使用麦克风。" });
    let active: Session | null = null;
    try {
      // Create and resume during the click gesture, before Safari's permission await.
      const context = new Constructor();
      active = { context, stream: null, source: null, interval: null, gate: initialSoundGate(), calibration: null, lastSample: 0 };
      session.current = active;
      const resumed = context.resume().then(() => null, error => error);
      const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: {
        deviceId: deviceId ? { exact: deviceId } : undefined,
        echoCancellation: { ideal: false }, noiseSuppression: { ideal: false }, autoGainControl: { ideal: false }, channelCount: { ideal: 1 },
      } });
      if (generation.current !== token) { stream.getTracks().forEach(track => track.stop()); releaseSession(active); return; }
      active.stream = stream;
      const resumeError = await resumed;
      if (generation.current !== token) { releaseSession(active); return; }
      if (resumeError) throw resumeError;
      const analyser = context.createAnalyser();
      analyser.fftSize = 2048;
      const source = context.createMediaStreamSource(stream);
      active.source = source;
      source.connect(analyser); // No speaker connection: avoid microphone feedback.
      const track = stream.getAudioTracks()[0];
      if (!track || track.readyState !== "live") throw new Error("No live microphone");
      const microphone = track.label || "当前麦克风";
      setSnapshot({ ...emptySnapshot(), status: context.state === "running" ? "running" : "paused", microphone });
      void navigator.mediaDevices.enumerateDevices().then(items => {
        if (generation.current === token) setDevices(items.filter(item => item.kind === "audioinput"));
      }).catch(() => {});

      const runtime = active;
      const started = performance.now();
      const samples = new Float32Array(analyser.fftSize);
      let smoothedPower: number | null = null, alerts = 0, peak = -90, lastHistory = 0;
      const history: number[] = [];
      const markPaused = () => {
        if (generation.current !== token) return;
        runtime.gate = initialSoundGate(); runtime.calibration = null; runtime.lastSample = 0;
        setSnapshot(current => ({ ...current, status: "paused", db: null, alarming: false, overSeconds: 0, quietSeconds: 0, calibrationSeconds: 0, message: "音频输入已暂停，点击继续监听；如设备已断开，请重新连接。" }));
      };
      track.onended = () => { if (generation.current === token) stop("麦克风已断开，监听已停止。请检查设备后重新开始。", "error"); };
      track.onmute = markPaused;
      context.onstatechange = () => { if (context.state !== "running") markPaused(); };
      const sample = () => {
        if (generation.current !== token || context.state !== "running" || track.muted || track.readyState !== "live") return;
        const now = performance.now();
        if (!runtime.lastSample || now - runtime.lastSample > 600) {
          runtime.gate = initialSoundGate(); runtime.calibration = null; smoothedPower = null;
        }
        runtime.lastSample = now;
        analyser.getFloatTimeDomainData(samples);
        const power = soundPower(samples);
        smoothedPower = smoothedPower === null ? power : .55 * smoothedPower + .45 * power;
        const db = powerToDbfs(smoothedPower);
        peak = Math.max(peak, db);
        let calibrationSeconds = 0;
        if (runtime.calibration) {
          runtime.calibration.samples.push(db);
          calibrationSeconds = Math.max(0, 5 - (now - runtime.calibration.since) / 1000);
          runtime.gate = initialSoundGate();
          if (!calibrationSeconds) {
            const threshold = suggestedSoundThreshold(runtime.calibration.samples);
            runtime.calibration = null;
            setSettings(current => ({ ...current, threshold }));
            setSnapshot(current => ({ ...current, message: `环境适配完成，提醒阈值已设为 ${threshold} dBFS，可继续手动调整。` }));
          }
        } else {
          const wasAlarming = runtime.gate.alarming;
          runtime.gate = advanceSoundGate(runtime.gate, db, now, currentSettings.current);
          if (!wasAlarming && runtime.gate.alarming) alerts++;
        }
        if (now - lastHistory >= 500) { history.push(db); if (history.length > 60) history.shift(); lastHistory = now; }
        const gate = runtime.gate;
        setSnapshot(current => ({ ...current, status: "running", db, alarming: gate.alarming,
          overSeconds: gate.overSince === null ? 0 : Math.min(currentSettings.current.holdSeconds, (now - gate.overSince) / 1000),
          quietSeconds: gate.quietSince === null ? 0 : Math.min(2, (now - gate.quietSince) / 1000),
          calibrationSeconds, elapsedSeconds: Math.floor((now - started) / 1000), alerts, peak, history: [...history], microphone,
          message: current.status === "paused" ? "监听已恢复。" : current.message,
        }));
      };
      runtime.interval = setInterval(sample, 100);
      sample();
    } catch (error) {
      if (generation.current !== token) { releaseSession(active); return; }
      stop(microphoneError(error), "error");
    }
  }

  async function resume() {
    const active = session.current;
    if (!active) { await start(); return; }
    const token = generation.current;
    try {
      await active.context.resume();
      if (generation.current !== token) return;
      active.gate = initialSoundGate(); active.lastSample = 0;
      if (active.stream?.getAudioTracks()[0]?.muted) return;
      setSnapshot(current => ({ ...current, status: "running", message: "监听已恢复。" }));
    } catch (error) { if (generation.current === token) stop(microphoneError(error), "error"); }
  }

  function calibrate() {
    if (!session.current || snapshot.status !== "running") return;
    session.current.calibration = { since: performance.now(), samples: [] };
    session.current.gate = initialSoundGate();
    setSnapshot(current => ({ ...current, alarming: false, overSeconds: 0, quietSeconds: 0, calibrationSeconds: 5, message: "正在采样 5 秒，请让教室保持安静。这会调整提醒阈值，不是声压级校准。" }));
  }

  function selectDevice(value: string) {
    stop("已更换麦克风，点击开始监听使用新的输入设备。");
    setDeviceId(value);
  }

  return { snapshot, settings, setSettings, devices, deviceId, selectDevice, start, stop, resume, calibrate };
}
