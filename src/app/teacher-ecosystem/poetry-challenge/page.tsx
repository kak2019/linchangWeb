import type { Metadata } from "next";
import PoetryChallenge from "@/components/poetry-challenge";
import "./poetry-challenge.css";

export const metadata: Metadata = {
  title: "诗词接龙 · 上下句闯关 | NarrativeOS",
  description: "接上句、接下句，十关一轮的诗词挑战。入门选择、进阶默写、名篇挑战三档难度，支持首字提示、积分与错题重练。",
};

export default function Page() {
  return <PoetryChallenge />;
}
