import type { UiLocale } from '@narrativeos/ui/i18n';

const zh = {
  "eyebrow": "TEACHER RESOURCE PLAZA",
  "title": "教师资源广场",
  "description": "来自一线教师的叙事课堂作品。寻找灵感，打开作品，并把优秀实践带回自己的课堂。",
  "search": "搜索作品标题",
  "searchButton": "搜索",
  "clear": "清除搜索",
  "back": "返回 NarrativeOS",
  "empty": "暂时没有匹配的作品",
  "emptyHint": "换一个标题关键词试试，或稍后再来看看教师们的新作品。",
  "works": "个公开作品",
  "author": "创作者",
  "enter": "开始体验",
  "practice": "讲评练",
  "previous": "上一页",
  "next": "下一页",
  "feed": {
    "loading": "正在加载作品…",
    "error": "作品加载失败，请重试。",
    "retry": "重试",
    "more": "加载更多",
    "end": "已加载全部作品"
  },
  "returnNames": {
    "/": "首页",
    "/history": "我的作品",
    "/assets": "素材库",
    "/my-assets": "我的资产",
    "/recharge": "创作套餐",
    "/admin": "平台管理",
    "workspace": "创作入口",
    "job": "作品工作台"
  },
  "returnTo": "返回{name}",
  "brandTitle": "临场 · 教师资源广场"
};
export type TeacherPlazaMessages = Omit<typeof zh, 'returnNames'> & { returnNames: Record<string, string> };
export const teacherPlazaMessages: Record<UiLocale, TeacherPlazaMessages> = {
  'zh-CN': zh,
  en: {
  "eyebrow": "TEACHER RESOURCE PLAZA",
  "title": "Teacher Resource Plaza",
  "description": "Narrative classroom experiences made by teachers. Find an idea, open a work, and bring strong practice back to your classroom.",
  "search": "Search by title",
  "searchButton": "Search",
  "clear": "Clear",
  "back": "Back to NarrativeOS",
  "empty": "No matching works yet",
  "emptyHint": "Try another title keyword or return later for new teacher creations.",
  "works": "public works",
  "author": "Creator",
  "enter": "Open experience",
  "practice": "Review & practice",
  "previous": "Previous",
  "next": "Next",
  "feed": {
    "loading": "Loading works…",
    "error": "Unable to load works. Please retry.",
    "retry": "Retry",
    "more": "Load more",
    "end": "All works loaded"
  },
  "returnNames": {
    "/": "Home",
    "/history": "My works",
    "/assets": "Asset library",
    "/my-assets": "My assets",
    "/recharge": "Plans",
    "/admin": "Administration",
    "workspace": "Create",
    "job": "Workbench"
  },
  "returnTo": "Back to {name}",
  "brandTitle": "Teacher Resource Plaza"
},
  'zh-Hant': {
  "eyebrow": "TEACHER RESOURCE PLAZA",
  "title": "教師資源廣場",
  "description": "來自一線教師的敘事課堂作品。尋找靈感，打開作品，並把優秀實踐帶回自己的課堂。",
  "search": "搜尋作品標題",
  "searchButton": "搜尋",
  "clear": "清除搜尋",
  "back": "返回 NarrativeOS",
  "empty": "暫時沒有符合的作品",
  "emptyHint": "換一個標題關鍵詞試試，或稍後再來看看教師們的新作品。",
  "works": "個公開作品",
  "author": "創作者",
  "enter": "開始體驗",
  "practice": "講評練",
  "previous": "上一頁",
  "next": "下一頁",
  "feed": {
    "loading": "正在載入作品…",
    "error": "作品載入失敗，請重試。",
    "retry": "重試",
    "more": "載入更多",
    "end": "已載入全部作品"
  },
  "returnNames": {
    "/": "首頁",
    "/history": "我的作品",
    "/assets": "素材庫",
    "/my-assets": "我的資產",
    "/recharge": "創作套餐",
    "/admin": "平台管理",
    "workspace": "創作入口",
    "job": "作品工作臺"
  },
  "returnTo": "返回{name}",
  "brandTitle": "临场 · 教師資源廣場"
},
};
