import type { Metadata } from "next";
import ClassroomSoundMeter from "@/components/classroom-sound-meter";
import "./sound-meter.css";

export const metadata: Metadata = {
  title: "静一静 · 自习音量灯 | NarrativeOS",
  description: "通过麦克风显示课堂相对音量，自定阈值和连续超标时长，持续超标时亮红提醒，安静后自动恢复。",
};

export default function Page() {
  return <ClassroomSoundMeter />;
}
