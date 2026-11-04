export type RewardTemplate = "certificate" | "postage" | "flower";
export type RewardColor = "color" | "mono";

export type RewardSettings = {
  template: RewardTemplate;
  color: RewardColor;
  names: string;
  title: string;
  message: string;
  shortMessage: string;
  subject: string;
  classroom: string;
  teacher: string;
  date: string;
  copies: number;
  cutLines: boolean;
};

export type RewardLabel = { student: string; number: number };
export const MAX_REWARD_LABELS = 60;
export const REWARD_AUTHOR = "Flynt";
export const rewardTemplates = [
  { id: "certificate", name: "成长奖状", detail: "A4 横版 · 一人一张" },
  { id: "postage", name: "夸夸邮票", detail: "A4 竖版 · 每页 12 枚" },
  { id: "flower", name: "小红花", detail: "A4 竖版 · 每页 12 朵" },
] as const;

export const rewardPresets = [
  { name: "持续进步", title: "闪闪发光进步奖", message: "在跨学科学习中，认真思考，勇敢表达，用好奇心发现世界。每一次努力，都值得被看见。", shortMessage: "每一次努力，都值得被看见。" },
  { name: "勇敢表达", title: "勇敢表达小达人", message: "愿意举起手，说出自己的想法，也认真倾听不同的声音。谢谢你，让我们的课堂多了一份勇气。", shortMessage: "谢谢你，勇敢说出自己的想法。" },
  { name: "好奇探索", title: "好奇心探索奖", message: "从一个问题出发，把不同学科的知识连在一起。愿你一直带着好奇，发现生活中的小小奥秘。", shortMessage: "带着好奇，继续发现新世界。" },
  { name: "合作互助", title: "温暖合作伙伴奖", message: "在共同完成任务的过程中，主动分享，耐心帮助，让每一个伙伴的想法都被听见。谢谢你的温暖与合作。", shortMessage: "你的分享，让团队闪闪发光。" },
] as const;

export function initialRewardSettings(date: string): RewardSettings {
  return {
    template: "certificate", color: "color", names: "小禾",
    title: rewardPresets[0].title, message: rewardPresets[0].message,
    shortMessage: rewardPresets[0].shortMessage, subject: "跨学科",
    classroom: "我们的课堂", teacher: "", date, copies: 1, cutLines: true,
  };
}

export function rewardStudents(names: string): string[] {
  const students = names.split(/[\n,，;；]+/).map(name => name.trim()).filter(Boolean);
  return students.length ? students : ["闪闪发光的你"];
}

export function validateRewardSettings(settings: RewardSettings): string | null {
  const students = rewardStudents(settings.names);
  if (!settings.title.trim()) return "请先填写奖项名称。";
  if (Array.from(settings.title).length > 16) return "奖项名称最多 16 个字。";
  if (students.some(name => Array.from(name).length > 24)) return "每个学生姓名最多 24 个字，请检查名单。";
  if (!Number.isInteger(settings.copies) || settings.copies < 1 || settings.copies > 12) return "每人份数请填写 1 到 12 之间的整数。";
  if (students.length * settings.copies > MAX_REWARD_LABELS) return `每批最多制作 ${MAX_REWARD_LABELS} 份，请减少名单或份数。`;
  const message = settings.template === "certificate" ? settings.message : settings.shortMessage;
  if (Array.from(message).length > (settings.template === "certificate" ? 120 : 40)) return "鼓励语太长了，请缩短后再打印。";
  if (wrapRewardText(message, settings.template === "certificate" ? 34 : 21).length > (settings.template === "certificate" ? 4 : 2)) return "鼓励语的换行太多了，请合并几行后再打印。";
  if (settings.date && (!/^\d{4}-\d{2}-\d{2}$/.test(settings.date) ||
    Number.isNaN(Date.parse(settings.date)) || new Date(settings.date).toISOString().slice(0, 10) !== settings.date)) return "请选择有效的颁发日期。";
  return null;
}

export function rewardSheets(settings: RewardSettings): RewardLabel[][] {
  if (validateRewardSettings(settings)) return [];
  const labels = rewardStudents(settings.names).flatMap(student =>
    Array.from({ length: settings.copies }, () => student),
  ).map((student, index) => ({ student, number: index + 1 }));
  const perPage = settings.template === "certificate" ? 1 : 12;
  return Array.from({ length: Math.ceil(labels.length / perPage) }, (_, index) =>
    labels.slice(index * perPage, (index + 1) * perPage),
  );
}

/** Wrap Chinese and Latin text without cutting user content off in the SVG. */
export function wrapRewardText(text: string, units: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.trim().split(/\r?\n/)) {
    let line = "", width = 0;
    for (const char of Array.from(paragraph)) {
      const size = /[\u0020-\u007e]/.test(char) ? 0.6 : 1;
      if (line && width + size > units) { lines.push(line.trim()); line = ""; width = 0; }
      line += char; width += size;
    }
    if (line.trim()) lines.push(line.trim());
  }
  return lines;
}

export function formatRewardDate(date: string): string {
  if (!date) return "";
  const [year, month, day] = date.split("-").map(Number);
  return `${year} 年 ${month} 月 ${day} 日`;
}

export function rewardPaper(template: RewardTemplate) {
  return template === "certificate"
    ? { width: 297, height: 210, viewWidth: 1188, viewHeight: 840, pngWidth: 3508, pngHeight: 2480, orientation: "landscape" as const }
    : { width: 210, height: 297, viewWidth: 840, viewHeight: 1188, pngWidth: 2480, pngHeight: 3508, orientation: "portrait" as const };
}
