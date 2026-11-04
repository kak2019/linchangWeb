import type { Metadata } from "next";
import RecitationStudio from "@/components/recitation-studio";
import "./recitation.css";

export const metadata: Metadata = {
  title: "拾句 · 随机留白背诵 | NarrativeOS",
  description: "随机隐藏文章中的字，每一轮换一批留白。内置《滕王阁序》与经典古诗，支持分段背诵、自选课文、单字提示与专注阅读。",
};

export default function Page() {
  return <RecitationStudio />;
}
