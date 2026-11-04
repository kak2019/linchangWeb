import type { Metadata } from "next";
import ClassroomRewards from "@/components/classroom-rewards";
import "./reward-studio.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "课堂印记工坊 · A4 奖状、邮票与小红花 | NarrativeOS",
  description: "Flynt 创作的跨学科教师工具：在线制作 A4 奖状、小红花和夸夸邮票，支持批量姓名、黑白打印与高清图片下载。",
  authors: [{ name: "Flynt" }],
};

export default function Page() {
  const date = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Shanghai" }).format(new Date());
  return <ClassroomRewards initialDate={date} />;
}
