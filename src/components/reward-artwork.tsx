import { formatRewardDate, rewardPaper, wrapRewardText, type RewardLabel, type RewardSettings, type RewardTemplate } from "@/lib/classroom-rewards";

function palette(mono: boolean) {
  return mono
    ? { ink: "#202020", accent: "#202020", line: "#555555", soft: "#ffffff", petal: "#ffffff" }
    : { ink: "#39332b", accent: "#a43e49", line: "#b89b60", soft: "#fbf5e8", petal: "#f0c6c3" };
}

export function RewardSymbol({ kind, x = 0, y = 0, size = 120, mono = false }: {
  kind: RewardTemplate; x?: number; y?: number; size?: number; mono?: boolean;
}) {
  const p = palette(mono);
  return <svg x={x} y={y} width={size} height={size} viewBox="0 0 120 120" fill="none" aria-hidden="true">
    {kind === "flower" ? <>
      <path d="M60 79v33M60 102c-16 0-24-9-24-17 14 0 24 6 24 17ZM60 107c15-1 24-9 24-17-14 0-24 7-24 17Z" stroke={p.line} strokeWidth="2.2" fill={p.soft} />
      {Array.from({ length: 8 }, (_, i) => <circle key={i} cx={(60 + 24 * Math.cos(i * Math.PI / 4)).toFixed(3)} cy={(49 + 24 * Math.sin(i * Math.PI / 4)).toFixed(3)} r="16" fill={p.petal} stroke={p.accent} strokeWidth="2" />)}
      <circle cx="60" cy="49" r="19" fill="white" stroke={p.accent} strokeWidth="2" />
      <path d="m51 49 6 6 12-13" stroke={p.accent} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    </> : kind === "postage" ? <>
      <ellipse cx="60" cy="60" rx="51" ry="22" transform="rotate(-25 60 60)" stroke={p.line} strokeWidth="1.8" strokeDasharray="3 5" />
      <circle cx="60" cy="59" r="35" fill={p.soft} stroke={p.line} strokeWidth="2" />
      <path d="m60 30 8 18 20 3-15 14 4 21-17-10-18 10 4-21-14-14 20-3Z" fill="white" stroke={p.accent} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M17 25v12m-6-6h12M96 83v12m-6-6h12" stroke={p.accent} strokeWidth="1.8" strokeLinecap="round" />
    </> : <>
      <path d="m36 75-9 34 23-9 10 13 8-36M65 78l12 35 8-15 20 7-13-35" fill={p.soft} stroke={p.line} strokeWidth="2" strokeLinejoin="round" />
      <circle cx="61" cy="49" r="39" fill="white" stroke={p.line} strokeWidth="2.2" />
      <circle cx="61" cy="49" r="31" fill={p.soft} stroke={p.line} strokeWidth="1.2" strokeDasharray="2 4" />
      <path d="m61 27 6 14 16 2-12 11 3 16-13-8-14 8 3-16-11-11 16-2Z" fill="white" stroke={p.accent} strokeWidth="2.3" strokeLinejoin="round" />
    </>}
  </svg>;
}

function Certificate({ label, settings }: { label: RewardLabel; settings: RewardSettings }) {
  const p = palette(settings.color === "mono");
  return <>
    <rect x="48" y="48" width="1092" height="744" rx="3" fill="white" stroke={p.line} strokeWidth="2" />
    <rect x="57" y="57" width="1074" height="726" rx="1" fill="none" stroke={p.line} strokeWidth="0.8" />
    <path d="M48 105V48h57M1083 48h57v57M48 735v57h57M1083 792h57v-57" fill="none" stroke={p.accent} strokeWidth="3" />
    <RewardSymbol kind="postage" x={89} y={87} size={72} mono={settings.color === "mono"} />
    <RewardSymbol kind="certificate" x={1025} y={87} size={72} mono={settings.color === "mono"} />
    <text x="594" y="102" textAnchor="middle" fill={p.line} fontSize="13" letterSpacing="3">CERTIFICATE OF GROWTH</text>
    <text x="594" y="183" textAnchor="middle" fill={p.accent} fontFamily="Noto Serif SC, Songti SC, serif" fontSize="76" letterSpacing="22">奖 状</text>
    <text x="594" y="220" textAnchor="middle" fill={p.ink} fontSize="17" letterSpacing="3">每一份努力，都值得被看见</text>
    {wrapRewardText(`${label.student} 同学`, 21).map((line, i) => <text key={i} x="594" y={285 + i * 36} textAnchor="middle" fill={p.ink} fontSize="32" fontWeight="600">{line}</text>)}
    <path d="M360 328h468" stroke={p.line} strokeWidth="0.9" />
    <text x="594" y="376" textAnchor="middle" fill={p.accent} fontFamily="Noto Serif SC, Songti SC, serif" fontWeight="600" fontSize="38">{settings.title.trim()}</text>
    {wrapRewardText(settings.message, 34).map((line, i) => <text key={i} x="594" y={450 + i * 34} textAnchor="middle" fill={p.ink} fontSize="23">{line}</text>)}
    <RewardSymbol kind="flower" x={97} y={647} size={75} mono={settings.color === "mono"} />
    {settings.classroom && <text x="192" y="687" fill={p.ink} fontSize="20">{settings.classroom}</text>}
    {settings.teacher && <text x="1015" y="687" textAnchor="end" fill={p.ink} fontSize="20">颁发人：{settings.teacher}</text>}
    <text x="1015" y="725" textAnchor="end" fill={p.ink} fontSize="17">{formatRewardDate(settings.date)}</text>
  </>;
}

function SmallReward({ label, settings }: { label: RewardLabel; settings: RewardSettings }) {
  const p = palette(settings.color === "mono");
  const postage = settings.template === "postage";
  return <>
    <rect x="14" y="14" width="372" height="412" rx={postage ? 2 : 24} fill="white" stroke={p.line} strokeWidth={postage ? 5 : 1.8} strokeDasharray={postage ? "1 10" : undefined} strokeLinecap="round" />
    <rect x="25" y="25" width="350" height="390" rx={postage ? 1 : 16} fill="none" stroke={p.line} strokeWidth="0.8" />
    <text x="42" y="50" fill={p.ink} fontSize="12">{settings.subject} · {postage ? "夸夸邮票" : "小红花"}</text>
    <text x="358" y="50" textAnchor="end" fill={p.line} fontSize="11">NO. {String(label.number).padStart(2, "0")}</text>
    <RewardSymbol kind={settings.template} x={143} y={65} size={114} mono={settings.color === "mono"} />
    {wrapRewardText(settings.title, 12).map((line, i) => <text key={i} x="200" y={203 + i * 29} textAnchor="middle" fill={p.accent} fontSize="24" fontWeight="600">{line}</text>)}
    {wrapRewardText(`送给 ${label.student}`, 16).map((line, i) => <text key={i} x="200" y={267 + i * 23} textAnchor="middle" fill={p.ink} fontSize="18">{line}</text>)}
    {wrapRewardText(settings.shortMessage, 21).map((line, i) => <text key={i} x="200" y={324 + i * 19} textAnchor="middle" fill={p.ink} fontSize="14">{line}</text>)}
    <path d="M48 365h304" stroke={p.line} strokeWidth="0.7" />
    <text x="200" y="378" textAnchor="middle" fill={p.ink} fontSize="11">{settings.teacher || settings.classroom}</text>
    <text x="200" y="392" textAnchor="middle" fill={p.ink} fontSize="10">{formatRewardDate(settings.date)}</text>
    <text x="200" y="405" textAnchor="middle" fill={p.line} fontSize="9" letterSpacing="1">每一次努力都值得鼓励</text>
  </>;
}

export default function RewardArtwork({ settings, labels }: { settings: RewardSettings; labels: RewardLabel[] }) {
  const paper = rewardPaper(settings.template);
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${paper.viewWidth} ${paper.viewHeight}`}
    width="100%" height="100%" role="img" aria-label={settings.template === "certificate" ? "A4 奖状" : "A4 奖励贴纸"}
    fontFamily="Noto Sans SC, PingFang SC, Microsoft YaHei, sans-serif" data-reward-artwork>
    <rect width={paper.viewWidth} height={paper.viewHeight} fill="white" />
    {settings.template === "certificate" && labels[0] ? <Certificate label={labels[0]} settings={settings} /> : labels.map((label, index) => {
      const x = 48 + index % 3 * 256;
      const y = 48 + Math.floor(index / 3) * 279;
      return <g key={label.number}>
        {settings.cutLines && <rect x={x} y={y} width="232" height="255" fill="none" stroke="#999" strokeWidth="0.7" strokeDasharray="4 6" />}
        <svg x={x + 2} y={y + 2} width="228" height="251" viewBox="0 0 400 440"><SmallReward label={label} settings={settings} /></svg>
      </g>;
    })}
  </svg>;
}
