export const WORKBENCH_URL =
  process.env.NEXT_PUBLIC_WORKBENCH_URL?.trim() || "https://www.narrativeos.cn/narrativeos/";

export const navLinks = [
  { label: "优质案例", href: "#cases" },
  { label: "产品", href: "#products" },
  { label: "能力", href: "#capabilities" },
  { label: "灵感", href: "#stories" },
  { label: "团队", href: "#team" },
  { label: "技术", href: "#tech" },
  { label: "定价", href: `${WORKBENCH_URL.replace(/\/$/, "")}/recharge` },
  { label: "关于我们", href: "#about" },
];

export type Product = {
  icon: string;
  badge: string;
  badgeClass: string;
  title: string;
  description: string;
};

export const products: Product[] = [
  {
    icon: "叙",
    badge: "核心",
    badgeClass: "bg-cinnabar text-paper-soft",
    title: "叙事课堂工坊",
    description: "从教学文本出发，生成角色、场景、任务与完整分支。",
  },
  {
    icon: "角",
    badge: "热门",
    badgeClass: "bg-cinnabar-soft text-cinnabar",
    title: "角色扮演助手",
    description: "让学生进入人物处境，在选择里读懂动机与时代。",
  },
  {
    icon: "谜",
    badge: "新",
    badgeClass: "bg-gold-soft/60 text-[#7a5f2a]",
    title: "闯关解谜助手",
    description: "把知识点变成线索与关卡，用探索串起学习路径。",
  },
  {
    icon: "辩",
    badge: "新",
    badgeClass: "bg-gold-soft/60 text-[#7a5f2a]",
    title: "课堂思辨助手",
    description: "将抽象议题转成多方立场、证词与真实决策。",
  },
  {
    icon: "案",
    badge: "进阶",
    badgeClass: "bg-ink-soft/10 text-ink-soft",
    title: "探案推理助手",
    description: "围绕文本证据设计调查，让阅读变成主动求证。",
  },
];

export type NarrativeMode = {
  id: string;
  eyebrow: string;
  title: string;
  prompt: string;
  reply: string;
  tags: string[];
  preview: {
    meta: string;
    title: string;
    sub: string;
    scene: string;
    sceneText: string;
    choices: string[];
  };
};

export const narrativeModes: NarrativeMode[] = [
  {
    id: "roleplay",
    eyebrow: "文学 · 人物分析",
    title: "在角色的选择里，读懂文本",
    prompt: "《祝福》中，如果祥林嫂有一次重新选择的机会，她会怎么做？",
    reply:
      "你站在鲁镇的雪夜里。柳妈的话仍在耳边，远处传来新年的爆竹声。此刻，你可以去找鲁四老爷、离开鲁镇，或向“我”求助……",
    tags: ["人物动机", "文本细读", "价值判断"],
    preview: {
      meta: "20 分钟沉浸式文学游戏",
      title: "雪落鲁镇",
      sub: "《祝福》人物命运与社会环境探究",
      scene: "场景 03 / 06",
      sceneText: "新年的爆竹声越过高墙。祥林嫂站在门外，手里攥着最后一点工钱。",
      choices: ["去问“我”，人死后有没有魂灵", "转身离开鲁镇"],
    },
  },
  {
    id: "puzzle",
    eyebrow: "历史 · 知识复习",
    title: "把知识点藏进一场探索",
    prompt: "用一条丝绸之路，把汉代史串成四个关键任务。",
    reply:
      "驼铃响起，长安西市的通关文牒却少了一枚印章。你需要从政治、经济、地理与文化四条线索中，还原使团的真正目的。",
    tags: ["知识联结", "线索推理", "即时反馈"],
    preview: {
      meta: "15 分钟历史解谜课",
      title: "长安失印案",
      sub: "丝绸之路的政治、经济与文化线索",
      scene: "线索 02 / 04",
      sceneText: "西市胡商的账册缺了一页，摊位上留着半枚未干的红泥印。",
      choices: ["比对吏部案牍的印文", "追查昨夜出城的驼队"],
    },
  },
  {
    id: "debate",
    eyebrow: "思政 · 价值讨论",
    title: "让抽象议题成为真实抉择",
    prompt: "设计一场关于技术伦理的多方决策听证会。",
    reply:
      "你将代表城市算法委员会。企业、社区与研究者给出了相互冲突的证词，每一项决定都会改变信任、公平与效率三项指标。",
    tags: ["多元立场", "决策后果", "课堂讨论"],
    preview: {
      meta: "30 分钟思辨决策课",
      title: "算法听证会",
      sub: "公平、效率与信任之间的公共决策",
      scene: "听证 02 / 05",
      sceneText: "企业代表展示效率数据，社区代表举起一叠投诉记录。主持人的木槌悬在半空。",
      choices: ["优先采用企业算法方案", "成立独立监督委员会"],
    },
  },
];

export type Feature = {
  num: string;
  title: string;
  description: string;
};

export const features: Feature[] = [
  {
    num: "01",
    title: "一段材料，生成完整叙事",
    description: "输入课文、知识点或一句教学需求，自动形成角色、场景、任务与分支。",
  },
  {
    num: "02",
    title: "每一步都服务教学目标",
    description: "把理解、应用与反思自然嵌入情节，不让体验止于“好玩”。",
  },
  {
    num: "03",
    title: "两种工作流，自由掌控",
    description: "Auto 快速获得可玩初版；Advance 逐段审阅、修改与重新生成。",
  },
  {
    num: "04",
    title: "一套内容，多次课堂复用",
    description: "可拆成课前导入、课堂活动、社团项目与课后探究。",
  },
];

export const subjects = [
  "语文",
  "历史",
  "地理",
  "政治",
  "数学",
  "物理",
  "化学",
  "生物",
  "英语",
  "艺术",
  "信息科技",
  "跨学科",
];

export type Story = {
  category: string;
  char: string;
  visualClass: string;
  meta: string;
  title: string;
  description: string;
};

export const stories: Story[] = [
  {
    category: "文学文本细读",
    char: "雪",
    visualClass: "bg-cinnabar",
    meta: "20 分钟 · 角色扮演",
    title: "雪落鲁镇",
    description: "以祥林嫂的一次重新选择，进入《祝福》的人物命运与社会环境。",
  },
  {
    category: "历史情境推演",
    char: "印",
    visualClass: "bg-[#96752f]",
    meta: "15 分钟 · 闯关解谜",
    title: "长安失印案",
    description: "沿着一纸通关文牒，串起丝绸之路的政治、经济与文化线索。",
  },
  {
    category: "议题思辨课堂",
    char: "辩",
    visualClass: "bg-night",
    meta: "30 分钟 · 分支选择",
    title: "算法听证会",
    description: "代表不同利益相关者，在公平、效率与信任之间作出决策。",
  },
];

export type FeaturedCase = {
  image: string;
  video?: string;
  imageFit?: "cover" | "contain";
  imageTone?: "light" | "dark";
  imagePosition?: string;
  shortTitle: string;
  author?: string;
  category: string;
  title: string;
  description: string;
  href: string;
};

export const featuredCases: FeaturedCase[] = [
  {
    image: "/cases/bg-cabin-night.webp",
    video: "/cases/case-heng.mp4",
    shortTitle: "衡阳舟中梦",
    author: "赵老师",
    category: "文学 · 人物分析",
    title: "《衡阳舟中梦：刘柳千年知己》",
    description: "夜泊衡阳，随刘禹锡在梦境中重访与柳宗元的半生知己之情。",
    href: "https://www.narrativeos.cn/narrativeos/play/612a82770e8f4f09b0aed54f8e0670f4/",
  },
  {
    image: "/cases/bg-phase5.webp",
    video: "/cases/case-guanju.mp4",
    shortTitle: "关雎",
    author: "张老师",
    category: "语文 · 经典研读",
    title: "《关雎》",
    description: "走进《诗经》开篇，在雎鸠关关的水岸，读懂君子之思与礼乐之美。",
    href: "https://www.narrativeos.cn/narrativeos/play/7011eaf8a8354409bca771236ab4097e/",
  },
  {
    image: "/cases/bg-b612.png",
    imagePosition: "object-[18%_center]",
    shortTitle: "小王子",
    author: "何老师",
    category: "文学 · 人物分析",
    title: "《归途与驯服》",
    description:
      "有些相遇，终会回到最初的星光。在金色麦田里与狐狸告别，读懂驯服、责任与那朵独一无二的玫瑰。",
    href: "https://www.narrativeos.cn/narrativeos/play/b7b89dcf7c1141308dacd245aeaf7f32/",
  },
  {
    image: "/cases/bg-yueyang.webp",
    shortTitle: "岳阳楼记",
    author: "张老师",
    category: "语文 · 经典研读",
    title: "《岳阳楼记·忧乐之间》",
    description:
      "登岳阳楼，临洞庭湖。随范仲淹与滕子京在阴晴之间，体会「先天下之忧而忧，后天下之乐而乐」。",
    href: "https://www.narrativeos.cn/narrativeos/play/a5a323e2990c4e96a7167046bc5f5a95/",
  },
];

export type TeamRole = {
  num: string;
  role: string;
  member: string;
  description: string;
};

export const teamRoles: TeamRole[] = [
  {
    num: "01 / EDUCATION",
    role: "教育研究",
    member: "成员姓名 / 职位",
    description: "负责课程目标、学习任务与课堂流程设计，确保生成内容真正服务于教学。",
  },
  {
    num: "02 / NARRATIVE",
    role: "叙事设计",
    member: "成员姓名 / 职位",
    description: "负责角色、场景、冲突与分支结构，让知识自然进入故事和行动过程。",
  },
  {
    num: "03 / ENGINEERING",
    role: "AI 工程",
    member: "成员姓名 / 职位",
    description: "负责模型编排、内容生成、质量校验以及系统稳定性。",
  },
  {
    num: "04 / CO-CREATION",
    role: "产品与课堂共创",
    member: "成员姓名 / 职位",
    description: "连接教师、学生与产品团队，根据真实课堂反馈持续迭代体验。",
  },
];

export type TeamMember = {
  name: string;
  nameEn: string;
  role: string;
  discipline: string;
  image: string;
  accent: string;
  short: string;
  bio: string;
  tags: string[];
};

export const teamMembers: TeamMember[] = [
  {
    name: "Josephine", nameEn: "THE LINGUIST", role: "文学教育与语言研究", discipline: "EDUCATION / LANGUAGE", image: "/team/josephine.jpg", accent: "#d99aa7",
    short: "把语言的细部，变成可以进入的情境。", bio: "小红书：@约瑟芬的日与夜。语言学博士在读，曾任广东国际学校中国语文与中国文学年级统筹，出版多部香港高中文学教材，并拥有多篇 ACL、ACCL 等顶刊经历。", tags: ["语言学", "文学教育", "课程设计"],
  },
  {
    name: "Nicc", nameEn: "THE RESEARCHER", role: "学习科学与学术研究", discipline: "RESEARCH / LEARNING", image: "/team/nicc.jpg", accent: "#7da8c8",
    short: "让每一个有趣的体验，都能回答学习问题。", bio: "曾获 ICAIE2025 最佳论文报告奖，并在中国高等教育学会学习科学研究分会 2025 学术年会发表研究成果，持续探索技术、学习与课堂之间的连接。", tags: ["学习科学", "学术研究", "效果评估"],
  },
  {
    name: "Flynt", nameEn: "THE BUILDER", role: "AI 产品与互动工程", discipline: "AI / ENGINEERING", image: "/team/flynt.jpg", accent: "#b18c45",
    short: "把复杂系统，做成有温度的交互。", bio: "React 开发者 × AI 驱动开发实践者，擅长 Next.js / Remix 全栈架构与 Fiber 级性能调优，探索 LangChain、OpenAI 与 React 边界的融合。", tags: ["Next.js", "AI Native", "互动体验"],
  },
  {
    name: "Stella", nameEn: "THE ADVOCATE", role: "叙事策略与表达设计", discipline: "NARRATIVE / DEBATE", image: "/team/stella.jpg", accent: "#d68b61",
    short: "在不同立场之间，找到值得讨论的问题。", bio: "连续创业者，曾获第五届“领军杯”涉外模拟法庭全英文辩论赛全国二等奖、第十五届“挑战杯”广东省省赛铜奖等经历，曾在律师事务所与人民检察院工作。", tags: ["辩论表达", "法律思维", "创业实践"],
  },
  {
    name: "Eden", nameEn: "THE ARCHITECT", role: "后端架构与云原生", discipline: "BACKEND / CLOUD", image: "/team/eden.jpg", accent: "#6e9eb7",
    short: "让每一次灵感，都有可靠的系统接住。", bio: "AI Native 应用探索者、开发工程师，拥有六年以上开发经验，曾参与企业数字化转型与云原生架构建设，负责后端架构设计、核心功能开发与性能优化。", tags: ["后端架构", "云原生", "系统工程"],
  },
  {
    name: "Cathy", nameEn: "THE BRIDGE", role: "国际中文与语言教学", discipline: "LANGUAGE / TEACHING", image: "/team/cathy.jpg", accent: "#d8a04f",
    short: "让语言跨过边界，也让课堂抵达真实的人。", bio: "曾任北京国际汉语研修院中文培优普北班项目中文教师，获全国大学生英语翻译大赛省级三等奖、复旦大学汉语教学技能大赛二等奖，现于上海从事国际中文教学。", tags: ["国际中文", "语言教学", "跨文化"],
  },
  {
    name: "Roy", nameEn: "THE EXPLORER", role: "市场研究与创新实践", discipline: "RESEARCH / PRACTICE", image: "/team/roy.jpg", accent: "#7c9ed0",
    short: "从真实世界里，寻找下一条可行的路径。", bio: "2026 年安徽省优秀毕业生、安徽大学优秀毕业生，曾获“挑战杯”大学生创业计划竞赛银奖、安徽省大学生创新大赛金奖等多项奖项。", tags: ["市场研究", "创新实践", "项目策划"],
  },
];

export const techNotes = [
  "多模型协同",
  "节点式生成",
  "教学目标约束",
  "全流程可编辑",
];

export type TechLayer = {
  name: string;
  nameEn: string;
  chips: string[];
  tone: "default" | "cinnabar" | "gold";
};

export const techLayers: TechLayer[] = [
  {
    name: "应用体验层",
    nameEn: "EXPERIENCE",
    chips: ["学生端叙事游戏", "教师工作台", "课堂配套内容"],
    tone: "default",
  },
  {
    name: "叙事编排层",
    nameEn: "ORCHESTRATION",
    chips: ["角色与场景", "任务与分支", "课堂提问链", "节点审阅"],
    tone: "cinnabar",
  },
  {
    name: "智能生成层",
    nameEn: "GENERATION",
    chips: ["文本生成模型", "图像生成模型", "角色语音", "质量校验"],
    tone: "gold",
  },
  {
    name: "教学知识层",
    nameEn: "KNOWLEDGE",
    chips: ["课程材料", "教学目标", "年级与难度", "资源模板库"],
    tone: "default",
  },
];

export type Step = {
  num: string;
  title: string;
  description: string;
};

export const steps: Step[] = [
  { num: "01", title: "输入", description: "提供课文、知识材料或一句教学需求" },
  { num: "02", title: "编排", description: "选择时长、叙事模式与教学目标" },
  { num: "03", title: "生成", description: "获得角色、场景、分支与课堂引导" },
  { num: "04", title: "开场", description: "分享链接，让学生进入故事现场" },
];

export const stats = [
  { value: 6, suffix: "+", label: "叙事模式" },
  { value: 2, suffix: "", label: "工作模式" },
  { value: Infinity, suffix: "", label: "课堂可能" },
];
