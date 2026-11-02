/** Navigation vocabulary is independent of how many works have been published. */
export const curricula = ["中国大陆课程", "IB", "Cambridge", "AP", "通用拓展"];
export const stages = ["学前", "小学", "初中", "高中", "高等教育", "成人学习"];
const schoolSubjects = ["语文", "数学", "英语", "科学", "物理", "化学", "生物", "历史", "地理", "道德与法治", "思想政治", "信息科技", "通用技术", "音乐", "美术", "体育与健康", "劳动", "心理健康", "跨学科"];
export const stageSubjects: Record<string, string[]> = {
  学前: ["健康", "语言", "社会", "科学", "艺术", "跨学科"],
  小学: ["语文", "数学", "英语", "科学", "道德与法治", "信息科技", "音乐", "美术", "体育与健康", "劳动", "心理健康", "跨学科"],
  初中: schoolSubjects.filter(s => !["思想政治", "通用技术"].includes(s)),
  高中: schoolSubjects.filter(s => !["道德与法治"].includes(s)),
};
export const gradeOptions: Record<string, string[]> = {
  学前: ["小班", "中班", "大班"],
  小学: ["一年级", "二年级", "三年级", "四年级", "五年级", "六年级"],
  初中: ["初一", "初二", "初三"],
  高中: ["高一", "高二", "高三"],
};
export const stageGradeTerms: Record<string, string[]> = {
  学前: ["学前", "幼儿", "小班", "中班", "大班"],
  小学: ["小学", ...gradeOptions.小学],
  初中: ["初中", "初一", "初二", "初三", "七年级", "八年级", "九年级"],
  高中: ["高中", "高一", "高二", "高三", "十年级", "十一年级", "十二年级"],
  高等教育: ["大学", "本科", "高等教育", "研究生", "专科"],
  成人学习: ["成人", "职业培训", "终身学习"],
};
export function subjectsForStage(stage = "") { return stageSubjects[stage] || schoolSubjects; }
export function taxonomyLabel(value: string, locale: string) {
  if (locale === "en") return ({ "中国大陆课程":"Mainland China", "通用拓展":"General enrichment", "学前":"Preschool", "小学":"Primary", "初中":"Lower secondary", "高中":"Upper secondary", "高等教育":"Higher education", "成人学习":"Adult learning", "语文":"Chinese", "数学":"Mathematics", "英语":"English", "科学":"Science", "物理":"Physics", "化学":"Chemistry", "生物":"Biology", "历史":"History", "地理":"Geography", "跨学科":"Interdisciplinary" } as Record<string,string>)[value] || value;
  if (locale === "zh-Hant") return ({ "中国大陆课程":"中國大陸課程", "通用拓展":"通用拓展", "学前":"學前", "小学":"小學", "高等教育":"高等教育", "成人学习":"成人學習", "语文":"語文", "数学":"數學", "英语":"英語", "科学":"科學", "历史":"歷史", "地理":"地理", "跨学科":"跨學科" } as Record<string,string>)[value] || value;
  return value;
}
