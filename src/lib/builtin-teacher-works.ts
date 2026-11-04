import type { PublicTeacherWork, TeacherWorkFilters } from "./teacher-ecosystem";
import { curricula, stageGradeTerms } from "./teacher-plaza-taxonomy";

/** First-party tools ship with the portal and do not need a generation job. */
export const builtinTeacherWorks: PublicTeacherWork[] = [{
  id: "builtin-flynt-classroom-rewards",
  jobId: "",
  title: "课堂印记工坊 · A4 奖状、邮票与小红花",
  summary: "把一句鼓励，变成学生手里的小小荣誉。编辑姓名、奖项与鼓励语，生成跨学科 A4 横版奖状，或把夸夸邮票、小红花排满一张 A4 纸。支持批量名单、黑白打印与高清 PNG 下载，普通打印机就能使用。",
  coverUrl: "/teacher-tools/reward-studio.svg",
  playUrl: "/teacher-ecosystem/reward-studio/",
  quizUrl: null,
  subject: "跨学科",
  grade: "全年级",
  tags: ["可打印", "课堂激励", "A4 奖状", "小红花", "邮票", "通用拓展"],
  featured: true,
  publishedAt: "2026-11-03T00:00:00+08:00",
  author: { name: "Flynt", avatarUrl: null },
}, {
  id: "builtin-flynt-recitation",
  jobId: "",
  title: "拾句 · 随机留白背诵",
  summary: "把课文里的字随机藏起来，试着把句子读完整。换一轮就换一批留白，支持调整隐藏比例、点击单字提示、查看原文与分段练习。内置《滕王阁序》《静夜思》《春晓》《登鹳雀楼》，也可以粘贴自己的文章。",
  coverUrl: "/teacher-tools/recitation.svg",
  playUrl: "/teacher-ecosystem/recitation/",
  quizUrl: null,
  subject: "语文",
  grade: "全年级",
  tags: ["背诵", "古诗词", "文言文", "随机留白", "滕王阁序", "自选课文"],
  featured: true,
  publishedAt: "2026-11-03T10:00:00+08:00",
  author: { name: "Flynt", avatarUrl: null },
}, {
  id: "builtin-flynt-sound-meter",
  jobId: "",
  title: "静一静 · 自习音量灯",
  summary: "用麦克风给自习一点看得见的提醒。实时显示相对音量，自定提醒阈值与连续超标时长，持续超标时缓慢闪红，安静后自动恢复。支持环境采样、选择外接麦克风与投屏模式。仅在本机分析音量，不录音、不上传；读数是未校准的数字电平，不是环境声压级。",
  coverUrl: "/teacher-tools/sound-meter.svg",
  playUrl: "/teacher-ecosystem/sound-meter/",
  quizUrl: null,
  subject: "跨学科",
  grade: "全年级",
  tags: ["自习", "课堂管理", "音量", "麦克风", "分贝", "通用拓展"],
  featured: true,
  publishedAt: "2026-11-03T11:00:00+08:00",
  author: { name: "Flynt", avatarUrl: null },
}, {
  id: "builtin-flynt-poetry-challenge",
  jobId: "",
  title: "诗词接龙 · 上下句闯关",
  summary: "给出上句接下句，也能反过来挑战。18 首诗词、36 组上下句，每轮随机十关。入门四选一，进阶自己默写，挑战藏起出处；支持混合出题、首字提示、积分与错题重练。",
  coverUrl: "/teacher-tools/poetry-challenge.svg",
  playUrl: "/teacher-ecosystem/poetry-challenge/",
  quizUrl: null,
  subject: "语文",
  grade: "全年级",
  tags: ["诗词", "闯关", "上下句", "古诗词", "背诵", "难度可调"],
  featured: true,
  publishedAt: "2026-11-03T12:00:00+08:00",
  author: { name: "Flynt", avatarUrl: null },
}];

const contains = (text: string | null, term: string) => (text || "").toLocaleLowerCase().includes(term.toLocaleLowerCase());

export function matchingBuiltinTeacherWorks(query: string, filters: TeacherWorkFilters = {}) {
  return builtinTeacherWorks.filter(work => {
    const tags = work.tags;
    if (query.trim() && ![work.title, work.summary, work.author.name].some(text => contains(text, query.trim().slice(0, 80)))) return false;
    if (filters.subject?.length && !filters.subject.some(subject => work.subject === subject || tags.includes(subject))) return false;
    if (filters.grade?.length && work.grade !== "全年级" && !filters.grade.some(grade => work.grade?.startsWith(grade) || tags.includes(grade))) return false;
    if (filters.stage?.length && work.grade !== "全年级" && !filters.stage.some(stage => tags.includes(stage) || (stageGradeTerms[stage] || [stage]).some(term => work.grade?.includes(term) || tags.includes(term)))) return false;
    if (filters.curriculum?.length && !filters.curriculum.some(value => value === "未标注" ? !curricula.some(c => tags.includes(c)) : tags.includes(value))) return false;
    if (filters.tag?.length && !(filters.tagMode === "all" ? filters.tag.every(tag => tags.includes(tag)) : filters.tag.some(tag => tags.includes(tag)))) return false;
    if (filters.resource === "quiz" && !work.quizUrl) return false;
    if (filters.resource === "story-only" && (work.quizUrl || tags.includes("可打印"))) return false;
    if (filters.resource === "printable" && !tags.includes("可打印")) return false;
    if (filters.featuredOnly === "1" && !work.featured) return false;
    if (filters.author && !contains(work.author.name, filters.author)) return false;
    const published = Date.parse(work.publishedAt);
    if (filters.after && published < Date.parse(`${filters.after}T00:00:00+08:00`)) return false;
    if (filters.before && published >= Date.parse(`${filters.before}T00:00:00+08:00`) + 86400000) return false;
    return true;
  });
}
