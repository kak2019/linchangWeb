import type { Metadata } from "next";
import {
  featuredCases,
  features,
  narrativeModes,
  navLinks,
  products,
  stats,
  steps,
  stories,
  subjects,
  teamMembers,
  techLayers,
  techNotes,
  type FeaturedCase,
  type Feature,
  type NarrativeMode,
  type Product,
  type Story,
  type TeamMember,
  type TechLayer,
} from "@/lib/content";

export type Locale = "zh-CN" | "en" | "zh-Hant";

export const localePaths = {
  "zh-CN": "/",
  en: "/en/",
  "zh-Hant": "/zh-hant/",
} as const satisfies Record<Locale, string>;

export const localizedRouteValues = ["en", "zh-hant"] as const;

export function isLocalePath(value: string): value is "en" | "zh-hant" {
  return value === "en" || value === "zh-hant";
}

export function routeToLocale(value: string): Locale {
  if (value === "en") return "en";
  if (value === "zh-hant") return "zh-Hant";
  return "zh-CN";
}

export function localizedPath(locale: Locale) {
  return localePaths[locale];
}

export function loginPath(locale: Locale) {
  if (locale === "en") return "/en/login/";
  if (locale === "zh-Hant") return "/zh-hant/login/";
  return "/login/";
}

export function teacherEcosystemPath(locale: Locale) {
  if (locale === "en") return "/en/teacher-ecosystem/";
  if (locale === "zh-Hant") return "/zh-hant/teacher-ecosystem/";
  return "/teacher-ecosystem/";
}

export function isLoginPath(pathname: string) {
  return /(?:^|\/)login\/?$/.test(pathname);
}

export type UiMessages = {
  header: {
    brand: string;
    nav: string[];
    backToTop: string;
    mainNav: string;
    mobileNav: string;
    openNav: string;
    closeNav: string;
    enterWorkbench: string;
    language: string;
    community: string;
    login: string;
    logout: string;
    register: string;
  };
  hero: {
    engine: string;
    eyebrow: string;
    line1: string;
    line2Prefix: string;
    emphasis: string;
    description: string;
    start: string;
    learnMore: string;
    introTitle: string;
  };
  products: {
    label: string;
  };
  experience: {
    label: string;
    title: [string, string];
    description: string;
    choose: string;
    tabLabel: string;
    tabs: string[];
    explore: string;
    teacher: string;
    generating: string;
    edit: string;
    preview: string;
  };
  capabilities: {
    label: string;
    title: [string, string];
    description: string;
    learn: string;
  };
  stories: {
    label: string;
    title: [string, string];
    description: string;
    templates: string;
    lesson: string;
  };
  cases: {
    label: string;
    title: string;
    description: string;
    enter: string;
    comingSoon: string;
    author: string;
    more: string;
  };
  team: {
    label: string;
    title: [string, string];
    description: string;
    fieldNotes: string;
    members: string;
    current: string;
    viewMember: string;
    imageAlt: string;
  };
  tech: {
    label: string;
    title: string[];
    description: string;
    architecture: string;
    fromMaterial: string;
  };
  workflow: {
    label: string;
    title: [string, string];
    description: string;
    start: string;
  };
  about: {
    label: string;
    quoteFirst: string;
    quoteEmphasis: string;
    quoteLast: string;
    description: string;
  };
  finalCta: {
    label: string;
    title: [string, string];
    start: string;
  };
  footer: {
    backToTop: string;
    slogan: string;
    nav: string;
  };
  subjects: {
    ariaLabel: string;
    firstMark: string;
    secondMark: string;
  };
  wechat: {
    ariaLabel: string;
    closeDialog: string;
    close: string;
    title: string;
    description: string;
    qrAlt: string;
    instruction: string;
    qrUnavailable: string;
    qrRetry: string;
  };
  auth: {
    title: string;
    description: string;
    registerTitle: string;
    registerDescription: string;
    tabLogin: string;
    tabRegister: string;
    email: string;
    emailPlaceholder: string;
    password: string;
    passwordPlaceholder: string;
    confirmPassword: string;
    sendCode: string;
    sending: string;
    sent: string;
    code: string;
    codePlaceholder: string;
    passwordLogin: string;
    codeLogin: string;
    verify: string;
    verifying: string;
    register: string;
    registering: string;
    wechat: string;
    wechatSoon: string;
    backHome: string;
    resendIn: string;
    errorInvalidEmail: string;
    errorSend: string;
    errorVerify: string;
    errorPassword: string;
    errorPasswordMismatch: string;
    errorCredentials: string;
  };
};

export type LocaleContent = {
  products: Product[];
  narrativeModes: NarrativeMode[];
  features: Feature[];
  subjects: string[];
  stories: Story[];
  featuredCases: FeaturedCase[];
  teamMembers: TeamMember[];
  techNotes: string[];
  techLayers: TechLayer[];
  steps: typeof steps;
  stats: typeof stats;
};

export type LocaleMessages = {
  locale: Locale;
  ui: UiMessages;
  content: LocaleContent;
  metadata: {
    title: string;
    description: string;
    keywords: string[];
    openGraphDescription: string;
    locale: string;
    alternateName: string;
  };
};

const zhUi: UiMessages = {
  header: {
    brand: "临场 · AI 叙事课堂生成平台",
    nav: ["优质案例", "产品", "能力", "灵感", "团队", "技术", "关于我们"],
    backToTop: "返回顶部",
    mainNav: "主导航",
    mobileNav: "移动端导航",
    openNav: "打开导航",
    closeNav: "关闭导航",
    enterWorkbench: "进入工作台",
    language: "选择语言",
    community: "官方社群",
    login: "登录",
    logout: "退出",
    register: "注册",
  },
  hero: {
    engine: "已接入 AI 叙事课堂生成引擎",
    eyebrow: "NARRATIVE LEARNING, REIMAGINED",
    line1: "让知识不只被讲述，",
    line2Prefix: "而是被",
    emphasis: "亲历",
    description: "将课文、知识点与教学目标，转化为一场学生可以进入、选择和反思的 AI 叙事课堂。",
    start: "开始创作",
    learnMore: "了解更多",
    introTitle: "AI 叙事课堂",
  },
  products: { label: "产品工作台" },
  experience: {
    label: "AGENT 与叙事",
    title: ["把教学意图，", "变成可以进入的故事。"],
    description: "老师保留判断与修改权，NarrativeOS 负责把复杂的角色、场景、任务和分支组织成完整体验。",
    choose: "选择一个叙事入口",
    tabLabel: "叙事模式",
    tabs: ["角色扮演", "闯关解谜", "分支选择"],
    explore: "探索全部叙事模式",
    teacher: "师",
    generating: "NARRATIVEOS 正在编排叙事…",
    edit: "继续修改这场课堂…",
    preview: "即将生成 · PREVIEW",
  },
  capabilities: {
    label: "PLATFORM FEATURE",
    title: ["从一份材料，", "到一场完整体验。"],
    description: "AI 负责搭建复杂叙事结构，教师始终掌握教学目标、内容边界与最终判断。",
    learn: "了解",
  },
  stories: {
    label: "STORY LIBRARY",
    title: ["最新", "课堂灵感"],
    description: "从语文到信息科技，把真实课堂变成可以被学生亲历的故事。每一份模板，都是一个可以直接开场的世界。",
    templates: "进入资源模板",
    lesson: "每一课，都是一场亲历",
  },
  cases: {
    label: "FEATURED CASES",
    title: "优质案例",
    description: "来自一线课堂的完整体验。悬停或点击一块，展开文字与画面。",
    enter: "进入课堂体验",
    comingSoon: "VIDEO · 即将上线",
    author: "作者",
    more: "更多优质案例",
  },
  team: {
    label: "THE PEOPLE BEHIND THE STORY",
    title: ["来自不同世界，", "在同一张桌上工作。"],
    description: "教育、语言、叙事与工程，在这里不是四条平行线，而是一支真正会互相影响的创作团队。",
    fieldNotes: "FIELD NOTES",
    members: "MEMBERS",
    current: "CURRENT MEMBER",
    viewMember: "查看 {name} 的介绍",
    imageAlt: "{name} 的团队头像",
  },
  tech: {
    label: "TECHNOLOGY FRAMEWORK",
    title: ["一套围绕课堂目标", "组织的生成架构。"],
    description: "从教学材料理解，到叙事规划、内容生成与课堂交付，NarrativeOS 以分层工作流保持内容的一致性、可编辑性和教学可控性。",
    architecture: "NarrativeOS Architecture",
    fromMaterial: "FROM MATERIAL TO EXPERIENCE",
  },
  workflow: {
    label: "HOW IT WORKS",
    title: ["四步，让课堂", "从文本走向现场。"],
    description: "不必学习复杂工具。保持你原本备课的方式，把叙事编排交给 NarrativeOS。",
    start: "现在开始创作",
  },
  about: {
    label: "ABOUT NARRATIVEOS",
    quoteFirst: "真正的理解，往往发生在学生",
    quoteEmphasis: "必须做出选择",
    quoteLast: "的那一刻。",
    description: "NarrativeOS 希望让每一堂课，都拥有一次值得记住的亲历。",
  },
  finalCta: {
    label: "READY TO BEGIN?",
    title: ["下一堂课，", "从一个故事开始。"],
    start: "免费创建",
  },
  footer: {
    backToTop: "返回顶部",
    slogan: "让每一次的选择都成为理解的入口",
    nav: "页脚导航",
  },
  subjects: { ariaLabel: "支持的学科", firstMark: "文以载道", secondMark: "学以致用" },
  wechat: {
    ariaLabel: "扫码进官方社群",
    closeDialog: "关闭弹窗",
    close: "关闭",
    title: "扫码进官方社群",
    description: "与老师们一起共创叙事课堂，第一时间获取新课例与玩法。",
    qrAlt: "NarrativeOS 用户内测微信群二维码",
    instruction: "打开微信「扫一扫」加入",
    qrUnavailable: "二维码暂时无法加载，请稍后再试。",
    qrRetry: "重新加载",
  },
  auth: {
    title: "登录账号",
    description: "使用邮箱和密码登录。也可以用邮箱验证码登录。",
    registerTitle: "注册账号",
    registerDescription: "设置密码，并用邮箱验证码完成注册。",
    tabLogin: "登录",
    tabRegister: "注册",
    email: "邮箱",
    emailPlaceholder: "name@example.com",
    password: "密码",
    passwordPlaceholder: "至少 8 位",
    confirmPassword: "确认密码",
    sendCode: "发送验证码",
    sending: "发送中…",
    sent: "验证码已发送",
    code: "验证码",
    codePlaceholder: "6 位数字",
    passwordLogin: "密码登录",
    codeLogin: "验证码登录",
    verify: "登录",
    verifying: "登录中…",
    register: "注册并登录",
    registering: "注册中…",
    wechat: "微信登录",
    wechatSoon: "即将开放",
    backHome: "返回首页",
    resendIn: "秒后可重新发送",
    errorInvalidEmail: "请输入有效邮箱",
    errorSend: "验证码发送失败，请稍后再试",
    errorVerify: "验证码无效或已过期",
    errorPassword: "密码至少 8 位",
    errorPasswordMismatch: "两次输入的密码不一致",
    errorCredentials: "邮箱或密码错误",
  },
};

const enUi: UiMessages = {
  header: {
    brand: "Linchang · AI Narrative Classroom Platform",
    nav: ["Cases", "Products", "Capabilities", "Inspiration", "Team", "Technology", "About"],
    backToTop: "Back to top",
    mainNav: "Main navigation",
    mobileNav: "Mobile navigation",
    openNav: "Open navigation",
    closeNav: "Close navigation",
    enterWorkbench: "Workbench",
    language: "Choose language",
    community: "Community",
    login: "Login",
    logout: "Sign out",
    register: "Register",
  },
  hero: {
    engine: "Connected to the AI narrative classroom engine",
    eyebrow: "NARRATIVE LEARNING, REIMAGINED",
    line1: "Knowledge",
    line2Prefix: "should be ",
    emphasis: "lived",
    description: "Turn texts, concepts, and learning goals into AI narrative classrooms students can enter, shape, and reflect on.",
    start: "Start creating",
    learnMore: "Learn more",
    introTitle: "AI Narrative Classroom",
  },
  products: { label: "PRODUCT WORKBENCH" },
  experience: {
    label: "AGENT & NARRATIVE",
    title: ["Turn teaching intent", "into a story students can enter."],
    description: "Teachers keep the judgment and editing rights. NarrativeOS organizes characters, scenes, tasks, and branches into a complete experience.",
    choose: "Choose a narrative entry point",
    tabLabel: "Narrative modes",
    tabs: ["Roleplay", "Puzzle quest", "Branching choice"],
    explore: "Explore all narrative modes",
    teacher: "T",
    generating: "NARRATIVEOS IS ORCHESTRATING…",
    edit: "Keep editing this classroom…",
    preview: "GENERATING · PREVIEW",
  },
  capabilities: {
    label: "PLATFORM FEATURE",
    title: ["From one source", "to a complete experience."],
    description: "AI builds the complex narrative structure while teachers keep control of learning goals, content boundaries, and the final call.",
    learn: "Learn about",
  },
  stories: {
    label: "STORY LIBRARY",
    title: ["Fresh", "classroom inspiration"],
    description: "From language arts to information technology, turn real classrooms into stories students can live through. Every template is a world ready to open.",
    templates: "Browse templates",
    lesson: "Every lesson is an experience",
  },
  cases: {
    label: "FEATURED CASES",
    title: "Featured cases",
    description: "Complete experiences from real classrooms. Hover or tap a panel to reveal the story and the visual layer.",
    enter: "Enter classroom",
    comingSoon: "VIDEO · COMING SOON",
    author: "Author",
    more: "More teacher cases",
  },
  team: {
    label: "THE PEOPLE BEHIND THE STORY",
    title: ["Different worlds,", "one shared table."],
    description: "Education, language, narrative, and engineering are not parallel tracks here. They are a creative team that genuinely changes one another’s work.",
    fieldNotes: "FIELD NOTES",
    members: "MEMBERS",
    current: "CURRENT MEMBER",
    viewMember: "View {name}'s profile",
    imageAlt: "Portrait of {name}",
  },
  tech: {
    label: "TECHNOLOGY FRAMEWORK",
    title: ["A generation", "architecture", "organized around", "learning goals."],
    description: "From understanding teaching materials to narrative planning, content generation, and classroom delivery, NarrativeOS uses layered workflows to keep content consistent, editable, and teachable.",
    architecture: "NarrativeOS Architecture",
    fromMaterial: "FROM MATERIAL TO EXPERIENCE",
  },
  workflow: {
    label: "HOW IT WORKS",
    title: ["Four steps take class", "from text to the room."],
    description: "No complex tool training required. Keep the way you plan lessons and let NarrativeOS orchestrate the narrative.",
    start: "Start creating",
  },
  about: {
    label: "ABOUT NARRATIVEOS",
    quoteFirst: "Real understanding often begins when students",
    quoteEmphasis: "have to make a choice",
    quoteLast: ".",
    description: "NarrativeOS gives every lesson an experience worth remembering.",
  },
  finalCta: {
    label: "READY TO BEGIN?",
    title: ["Your next lesson", "starts with a story."],
    start: "Create for free",
  },
  footer: {
    backToTop: "Back to top",
    slogan: "Let every choice become an entrance to understanding",
    nav: "Footer navigation",
  },
  subjects: { ariaLabel: "Supported subjects", firstMark: "Meaning through words", secondMark: "Learning through practice" },
  wechat: {
    ariaLabel: "Scan to join the official community",
    closeDialog: "Close dialog",
    close: "Close",
    title: "Join the official community",
    description: "Co-create narrative classrooms with teachers and get new cases and ideas first.",
    qrAlt: "NarrativeOS internal beta WeChat group QR code",
    instruction: "Open WeChat and scan to join",
    qrUnavailable: "The QR code is temporarily unavailable. Please try again later.",
    qrRetry: "Reload",
  },
  auth: {
    title: "Sign in",
    description: "Sign in with email and password, or with an email code.",
    registerTitle: "Create an account",
    registerDescription: "Set a password and verify your email to register.",
    tabLogin: "Sign in",
    tabRegister: "Sign up",
    email: "Email",
    emailPlaceholder: "name@example.com",
    password: "Password",
    passwordPlaceholder: "At least 8 characters",
    confirmPassword: "Confirm password",
    sendCode: "Send code",
    sending: "Sending…",
    sent: "Code sent",
    code: "Verification code",
    codePlaceholder: "6-digit code",
    passwordLogin: "Password",
    codeLogin: "Email code",
    verify: "Sign in",
    verifying: "Signing in…",
    register: "Create account",
    registering: "Creating…",
    wechat: "WeChat",
    wechatSoon: "Coming soon",
    backHome: "Back to home",
    resendIn: "s before resend",
    errorInvalidEmail: "Please enter a valid email",
    errorSend: "Could not send the code. Please try again later.",
    errorVerify: "The code is invalid or has expired",
    errorPassword: "Password must be at least 8 characters",
    errorPasswordMismatch: "Passwords do not match",
    errorCredentials: "Incorrect email or password",
  },
};

const hantUi: UiMessages = {
  header: {
    brand: "臨場 · AI 敘事課堂生成平台",
    nav: ["優質案例", "產品", "能力", "靈感", "團隊", "技術", "關於我們"],
    backToTop: "返回頂部",
    mainNav: "主導航",
    mobileNav: "移動端導航",
    openNav: "打開導航",
    closeNav: "關閉導航",
    enterWorkbench: "進入工作臺",
    language: "選擇語言",
    community: "官方社群",
    login: "登錄",
    logout: "退出",
    register: "註冊",
  },
  hero: {
    engine: "已接入 AI 敘事課堂生成引擎",
    eyebrow: "NARRATIVE LEARNING, REIMAGINED",
    line1: "讓知識不只被講述，",
    line2Prefix: "而是被",
    emphasis: "親歷",
    description: "將課文、知識點與教學目標，轉化為一場學生可以進入、選擇和反思的 AI 敘事課堂。",
    start: "開始創作",
    learnMore: "了解更多",
    introTitle: "AI 敘事課堂",
  },
  products: { label: "產品工作臺" },
  experience: {
    label: "AGENT 與敘事",
    title: ["把教學意圖，", "變成可以進入的故事。"],
    description: "老師保留判斷與修改權，NarrativeOS 負責把複雜的角色、場景、任務和分支組織成完整體驗。",
    choose: "選擇一個敘事入口",
    tabLabel: "敘事模式",
    tabs: ["角色扮演", "闖關解謎", "分支選擇"],
    explore: "探索全部敘事模式",
    teacher: "師",
    generating: "NARRATIVEOS 正在編排敘事…",
    edit: "繼續修改這場課堂…",
    preview: "即將生成 · PREVIEW",
  },
  capabilities: {
    label: "PLATFORM FEATURE",
    title: ["從一份材料，", "到一場完整體驗。"],
    description: "AI 負責搭建複雜敘事結構，教師始終掌握教學目標、內容邊界與最終判斷。",
    learn: "了解",
  },
  stories: {
    label: "STORY LIBRARY",
    title: ["最新", "課堂靈感"],
    description: "從語文到資訊科技，把真實課堂變成可以被學生親歷的故事。每一份模板，都是一個可以直接開場的世界。",
    templates: "進入資源模板",
    lesson: "每一課，都是一場親歷",
  },
  cases: {
    label: "FEATURED CASES",
    title: "優質案例",
    description: "來自一線課堂的完整體驗。懸停或點擊一塊，展開文字與畫面。",
    enter: "進入課堂體驗",
    comingSoon: "VIDEO · 即將上線",
    author: "作者",
    more: "更多優質案例",
  },
  team: {
    label: "THE PEOPLE BEHIND THE STORY",
    title: ["來自不同世界，", "在同一張桌上工作。"],
    description: "教育、語言、敘事與工程，在這裏不是四條平行線，而是一支真正會互相影響的創作團隊。",
    fieldNotes: "FIELD NOTES",
    members: "MEMBERS",
    current: "CURRENT MEMBER",
    viewMember: "查看 {name} 的介紹",
    imageAlt: "{name} 的團隊頭像",
  },
  tech: {
    label: "TECHNOLOGY FRAMEWORK",
    title: ["一套圍繞課堂目標", "組織的生成架構。"],
    description: "從教學材料理解，到敘事規劃、內容生成與課堂交付，NarrativeOS 以分層工作流保持內容的一致性、可編輯性和教學可控性。",
    architecture: "NarrativeOS Architecture",
    fromMaterial: "FROM MATERIAL TO EXPERIENCE",
  },
  workflow: {
    label: "HOW IT WORKS",
    title: ["四步，讓課堂", "從文本走向現場。"],
    description: "不必學習複雜工具。保持你原本備課的方式，把敘事編排交給 NarrativeOS。",
    start: "現在開始創作",
  },
  about: {
    label: "ABOUT NARRATIVEOS",
    quoteFirst: "真正的理解，往往發生在學生",
    quoteEmphasis: "必須做出選擇",
    quoteLast: "的那一刻。",
    description: "NarrativeOS 希望讓每一堂課，都擁有一次值得記住的親歷。",
  },
  finalCta: {
    label: "READY TO BEGIN?",
    title: ["下一堂課，", "從一個故事開始。"],
    start: "免費創建",
  },
  footer: {
    backToTop: "返回頂部",
    slogan: "讓每一次的選擇都成為理解的入口",
    nav: "頁腳導航",
  },
  subjects: { ariaLabel: "支持的學科", firstMark: "文以載道", secondMark: "學以致用" },
  wechat: {
    ariaLabel: "掃碼進官方社群",
    closeDialog: "關閉彈窗",
    close: "關閉",
    title: "掃碼進官方社群",
    description: "與老師們一起共創敘事課堂，第一時間獲取新課例與玩法。",
    qrAlt: "NarrativeOS 用戶內測微信群二維碼",
    instruction: "打開微信「掃一掃」加入",
    qrUnavailable: "二維碼暫時無法載入，請稍後再試。",
    qrRetry: "重新載入",
  },
  auth: {
    title: "登錄賬號",
    description: "使用郵箱和密碼登錄，也可以用郵箱驗證碼登錄。",
    registerTitle: "註冊賬號",
    registerDescription: "設置密碼，並用郵箱驗證碼完成註冊。",
    tabLogin: "登錄",
    tabRegister: "註冊",
    email: "郵箱",
    emailPlaceholder: "name@example.com",
    password: "密碼",
    passwordPlaceholder: "至少 8 位",
    confirmPassword: "確認密碼",
    sendCode: "發送驗證碼",
    sending: "發送中…",
    sent: "驗證碼已發送",
    code: "驗證碼",
    codePlaceholder: "6 位數字",
    passwordLogin: "密碼登錄",
    codeLogin: "驗證碼登錄",
    verify: "登錄",
    verifying: "登錄中…",
    register: "註冊並登錄",
    registering: "註冊中…",
    wechat: "微信登錄",
    wechatSoon: "即將開放",
    backHome: "返回首頁",
    resendIn: "秒後可重新發送",
    errorInvalidEmail: "請輸入有效郵箱",
    errorSend: "驗證碼發送失敗，請稍後再試",
    errorVerify: "驗證碼無效或已過期",
    errorPassword: "密碼至少 8 位",
    errorPasswordMismatch: "兩次輸入的密碼不一致",
    errorCredentials: "郵箱或密碼錯誤",
  },
};

function mapProducts(locale: Locale): Product[] {
  if (locale === "zh-CN") return products;
  const translated: Array<[string, string, string]> = locale === "en"
    ? [
        ["Core", "Narrative classroom workshop", "Start with teaching material and generate characters, scenes, tasks, and complete branches."],
        ["Popular", "Roleplay assistant", "Let students enter a character’s situation and understand motive and history through choices."],
        ["New", "Puzzle quest assistant", "Turn concepts into clues and levels, then connect the learning path through exploration."],
        ["New", "Classroom debate assistant", "Turn abstract questions into multiple positions, testimony, and real decisions."],
        ["Advanced", "Investigation assistant", "Design evidence-based inquiries around a text and turn reading into active verification."],
      ]
    : [
        ["核心", "敘事課堂工坊", "從教學文本出發，生成角色、場景、任務與完整分支。"],
        ["熱門", "角色扮演助手", "讓學生進入人物處境，在選擇裏讀懂動機與時代。"],
        ["新", "闖關解謎助手", "把知識點變成線索與關卡，用探索串起學習路徑。"],
        ["新", "課堂思辨助手", "將抽象議題轉成多方立場、證詞與真實決策。"],
        ["進階", "探案推理助手", "圍繞文本證據設計調查，讓閱讀變成主動求證。"],
      ];
  return products.map((item, index) => ({
    ...item,
    badge: translated[index][0],
    title: translated[index][1],
    description: translated[index][2],
  }));
}

function mapNarrativeModes(locale: Locale): NarrativeMode[] {
  if (locale === "zh-CN") return narrativeModes;
  const translated = locale === "en"
    ? [
        {
          eyebrow: "Literature · Character analysis", title: "Understand a text through a character’s choice", prompt: "In New Year's Sacrifice, what would Xianglin Sao do if she had one more chance to choose?", reply: "You stand in the snowy night of Luzhen. Aunt Liu's words still ring in your ears, and firecrackers sound in the distance. You can find Master Lu, leave Luzhen, or ask the narrator for help…", tags: ["Character motive", "Close reading", "Value judgment"], preview: { meta: "20-minute immersive literature game", title: "Snow over Luzhen", sub: "Character fate and social setting in New Year's Sacrifice", scene: "SCENE 03 / 06", sceneText: "New Year firecrackers cross the high wall. Xianglin Sao stands outside, clutching her last few coins.", choices: ["Ask the narrator whether souls exist", "Turn and leave Luzhen"] },
        },
        {
          eyebrow: "History · Knowledge review", title: "Hide key knowledge inside an exploration", prompt: "Use the Silk Road to connect Han dynasty history through four key missions.", reply: "The camel bells ring, but a seal is missing from the travel document at Chang'an's western market. Reconstruct the mission's true purpose through political, economic, geographic, and cultural clues.", tags: ["Knowledge links", "Clue solving", "Instant feedback"], preview: { meta: "15-minute history puzzle", title: "The Missing Seal in Chang'an", sub: "Political, economic, and cultural clues along the Silk Road", scene: "CLUE 02 / 04", sceneText: "A page is missing from a merchant's ledger. Half of a wet red seal remains on the stall.", choices: ["Compare it with the Ministry of Personnel records", "Track the camel caravan that left last night"] },
        },
        {
          eyebrow: "Civics · Values discussion", title: "Turn an abstract question into a real choice", prompt: "Design a multi-stakeholder hearing on technology ethics.", reply: "You represent the city's algorithm committee. A company, a community, and researchers offer conflicting testimony. Every decision changes trust, fairness, and efficiency.", tags: ["Multiple positions", "Decision consequences", "Class discussion"], preview: { meta: "30-minute decision lab", title: "The Algorithm Hearing", sub: "Public decisions between fairness, efficiency, and trust", scene: "HEARING 02 / 05", sceneText: "The company presents efficiency data while the community raises a stack of complaints. The chair's gavel hangs in the air.", choices: ["Prioritize the company's algorithm", "Establish an independent oversight committee"] },
        },
      ]
    : [
        {
          eyebrow: "文學 · 人物分析", title: "在角色的選擇裏，讀懂文本", prompt: "《祝福》中，如果祥林嫂有一次重新選擇的機會，她會怎麼做？", reply: "你站在魯鎮的雪夜裏。柳媽的話仍在耳邊，遠處傳來新年的爆竹聲。此刻，你可以去找魯四老爺、離開魯鎮，或向「我」求助……", tags: ["人物動機", "文本細讀", "價值判斷"], preview: { meta: "20 分鐘沉浸式文學遊戲", title: "雪落魯鎮", sub: "《祝福》人物命運與社會環境探究", scene: "場景 03 / 06", sceneText: "新年的爆竹聲越過高牆。祥林嫂站在門外，手裏攥著最後一點工錢。", choices: ["去問「我」，人死後有沒有魂靈", "轉身離開魯鎮"] },
        },
        {
          eyebrow: "歷史 · 知識複習", title: "把知識點藏進一場探索", prompt: "用一條絲綢之路，把漢代史串成四個關鍵任務。", reply: "駝鈴響起，長安西市的通關文牒卻少了一枚印章。你需要從政治、經濟、地理與文化四條線索中，還原使團的真正目的。", tags: ["知識聯結", "線索推理", "即時反饋"], preview: { meta: "15 分鐘歷史解謎課", title: "長安失印案", sub: "絲綢之路的政治、經濟與文化線索", scene: "線索 02 / 04", sceneText: "西市胡商的賬冊缺了一頁，攤位上留著半枚未乾的紅泥印。", choices: ["比對吏部案牘的印文", "追查昨夜出城的駝隊"] },
        },
        {
          eyebrow: "思政 · 價值討論", title: "讓抽象議題成為真實抉擇", prompt: "設計一場關於技術倫理的多方決策聽證會。", reply: "你將代表城市算法委員會。企業、社區與研究者給出了相互衝突的證詞，每一項決定都會改變信任、公平與效率三項指標。", tags: ["多元立場", "決策後果", "課堂討論"], preview: { meta: "30 分鐘思辨決策課", title: "算法聽證會", sub: "公平、效率與信任之間的公共決策", scene: "聽證 02 / 05", sceneText: "企業代表展示效率數據，社區代表舉起一疊投訴記錄。主持人的木槌懸在半空。", choices: ["優先採用企業算法方案", "成立獨立監督委員會"] },
        },
      ];
  return narrativeModes.map((item, index) => ({
    ...item,
    ...translated[index],
    preview: { ...item.preview, ...translated[index].preview },
  }));
}

function mapFeatures(locale: Locale): Feature[] {
  if (locale === "zh-CN") return features;
  const translated = locale === "en"
    ? [
        ["A source becomes a complete narrative", "Enter a text, concept, or teaching need and generate characters, scenes, tasks, and branches."],
        ["Every step serves the learning goal", "Weave understanding, application, and reflection into the plot so the experience never stops at being fun."],
        ["Two workflows, fully in your hands", "Auto gives you a playable first draft fast; Advance lets you review, edit, and regenerate scene by scene."],
        ["One content set, many classrooms", "Reuse it for lesson openings, class activities, club projects, and after-class inquiry."],
      ]
    : [
        ["一段材料，生成完整敘事", "輸入課文、知識點或一句教學需求，自動形成角色、場景、任務與分支。"],
        ["每一步都服務教學目標", "把理解、應用與反思自然嵌入情節，不讓體驗止於「好玩」。"],
        ["兩種工作流，自由掌控", "Auto 快速獲得可玩初版；Advance 逐段審閱、修改與重新生成。"],
        ["一套內容，多次課堂復用", "可拆成課前導入、課堂活動、社團項目與課後探究。"],
      ];
  return features.map((item, index) => ({ ...item, title: translated[index][0], description: translated[index][1] }));
}

function mapStories(locale: Locale): Story[] {
  if (locale === "zh-CN") return stories;
  const translated = locale === "en"
    ? [
        ["Close reading", "Snow over Luzhen", "20 minutes · Roleplay", "Enter the fate of Xianglin Sao and the social world of New Year's Sacrifice through one new choice."],
        ["Historical simulation", "The Missing Seal in Chang'an", "15 minutes · Puzzle quest", "Follow a travel document to connect the political, economic, and cultural clues of the Silk Road."],
        ["Values discussion", "The Algorithm Hearing", "30 minutes · Branching choice", "Represent different stakeholders and decide between fairness, efficiency, and trust."],
      ]
    : [
        ["文學文本細讀", "雪落魯鎮", "20 分鐘 · 角色扮演", "以祥林嫂的一次重新選擇，進入《祝福》的人物命運與社會環境。"],
        ["歷史情境推演", "長安失印案", "15 分鐘 · 闖關解謎", "沿著一紙通關文牒，串起絲綢之路的政治、經濟與文化線索。"],
        ["議題思辨課堂", "算法聽證會", "30 分鐘 · 分支選擇", "代表不同利益相關者，在公平、效率與信任之間作出決策。"],
      ];
  return stories.map((item, index) => ({ ...item, category: translated[index][0], title: translated[index][1], meta: translated[index][2], description: translated[index][3] }));
}

function mapCases(locale: Locale): FeaturedCase[] {
  if (locale === "zh-CN") return featuredCases;
  const translated = locale === "en"
    ? [
        ["Hengyang dream", "Literature · Character analysis", "Dreaming on the Hengyang river, follow Liu Yuxi as he revisits his lifelong friendship with Liu Zongyuan.", "Hengyang Boat Dream: Liu and Liu, a thousand-year friendship"],
        ["Guanju", "Language arts · Classics", "Enter the opening poem of the Book of Songs and read the longing, ritual, and beauty carried by the riverbank.", "Guanju"],
        ["Little Prince", "Literature · Character analysis", "Some encounters return to the first starlight. In a golden wheat field, say farewell to the fox and learn what it means to tame, to be responsible, and to love one unique rose.", "Return and Taming"],
        ["Yueyang Tower", "Language arts · Classics", "Climb Yueyang Tower over Dongting Lake. Follow Fan Zhongyan and Teng Zijing through weather and feeling, and live the idea of worrying first and rejoicing last.", "Yueyang Tower: Between Sorrow and Joy"],
      ]
    : [
        ["衡陽舟中夢", "文學 · 人物分析", "夜泊衡陽，隨劉禹錫在夢境中重訪與柳宗元的半生知己之情。", "《衡陽舟中夢：劉柳千年知己》"],
        ["關雎", "語文 · 經典研讀", "走進《詩經》開篇，在雎鳩關關的水岸，讀懂君子之思與禮樂之美。", "《關雎》"],
        ["小王子", "文學 · 人物分析", "有些相遇，終會回到最初的星光。在金色麥田裏與狐狸告別，讀懂馴服、責任與那朵獨一無二的玫瑰。", "《歸途與馴服》"],
        ["岳陽樓記", "語文 · 經典研讀", "登岳陽樓，臨洞庭湖。隨范仲淹與滕子京在陰晴之間，體會「先天下之憂而憂，後天下之樂而樂」。", "《岳陽樓記·憂樂之間》"],
      ];
  const authors = locale === "en"
    ? ["Teacher Zhao", "Teacher Zhang", "Teacher He", "Teacher Zhang"]
    : ["趙老師", "張老師", "何老師", "張老師"];
  return featuredCases.map((item, index) => ({ ...item, shortTitle: translated[index][0], author: authors[index] || item.author, category: translated[index][1], description: translated[index][2], title: translated[index][3] }));
}

function mapTeam(locale: Locale): TeamMember[] {
  if (locale === "zh-CN") return teamMembers;
  const translated: Array<[string, string, string, string[]]> = locale === "en"
    ? [
        ["Literary education & language research", "Turns the details of language into situations students can enter.", "Linguistics PhD candidate. Former Chinese language and literature grade coordinator at an international school in Guangdong; author of Hong Kong senior high literature textbooks with ACL and ACCL publications.", ["Linguistics", "Literary education", "Curriculum design"]],
        ["Learning science & academic research", "Makes sure every delightful experience can answer a learning question.", "Winner of the Best Paper Presentation at ICAIE2025, with research published at the 2025 annual conference of the Learning Sciences branch of the Chinese Society of Education.", ["Learning science", "Academic research", "Evaluation"]],
        ["AI product & interaction engineering", "Turns complex systems into interactions with warmth.", "React developer and AI-native builder working across Next.js, Remix, LangChain, OpenAI, and Fiber-level performance tuning.", ["Next.js", "AI Native", "Interaction"]],
        ["Narrative strategy & expression design", "Finds the questions worth discussing between different positions.", "Serial entrepreneur with national and provincial debate, moot-court, and innovation awards; former legal and procuratorial practitioner.", ["Debate", "Legal thinking", "Entrepreneurship"]],
        ["Backend architecture & cloud native", "Makes sure every spark of inspiration has a reliable system to land on.", "AI-native application explorer and engineer with six-plus years of experience in digital transformation, cloud-native architecture, backend systems, and performance optimization.", ["Backend", "Cloud native", "Systems"]],
        ["International Chinese & language teaching", "Lets language cross borders and lets the classroom reach real people.", "Former Chinese teacher at Beijing International Chinese Language Training Institute; award-winning translator and language-teaching practitioner now based in Shanghai.", ["Chinese teaching", "Language education", "Cross-cultural"]],
        ["Market research & innovation practice", "Looks to the real world for the next workable path.", "2026 Anhui Outstanding Graduate and Anhui University Outstanding Graduate, with awards in entrepreneurship, innovation, and project competitions.", ["Market research", "Innovation", "Project planning"]],
      ]
    : [
        ["文學教育與語言研究", "把語言的細部，變成可以進入的情境。", "語言學博士在讀，曾任廣東國際學校中國語文與中國文學年級統籌，出版多部香港高中文學教材，並擁有多篇 ACL、ACCL 等頂刊經歷。", ["語言學", "文學教育", "課程設計"]],
        ["學習科學與學術研究", "讓每一個有趣的體驗，都能回答學習問題。", "曾獲 ICAIE2025 最佳論文報告獎，並在中國高等教育學會學習科學研究分會 2025 學術年會發表研究成果，持續探索技術、學習與課堂之間的連接。", ["學習科學", "學術研究", "效果評估"]],
        ["AI 產品與互動工程", "把複雜系統，做成有溫度的互動。", "React 開發者 × AI 驅動開發實踐者，擅長 Next.js / Remix 全棧架構與 Fiber 級性能調優，探索 LangChain、OpenAI 與 React 邊界的融合。", ["Next.js", "AI Native", "互動體驗"]],
        ["敘事策略與表達設計", "在不同立場之間，找到值得討論的問題。", "連續創業者，曾獲涉外模擬法庭全英文辯論賽全國二等獎、挑戰杯廣東省省賽銅獎等，曾在律師事務所與人民檢察院工作。", ["辯論表達", "法律思維", "創業實踐"]],
        ["後端架構與雲原生", "讓每一次靈感，都有可靠的系統接住。", "AI Native 應用探索者、開發工程師，擁有六年以上開發經驗，曾參與企業數字化轉型與雲原生架構建設，負責後端架構設計、核心功能開發與性能優化。", ["後端架構", "雲原生", "系統工程"]],
        ["國際中文與語言教學", "讓語言跨過邊界，也讓課堂抵達真實的人。", "曾任北京國際漢語研修院中文培優普北班項目中文教師，獲全國大學生英語翻譯大賽省級三等獎、復旦大學漢語教學技能大賽二等獎，現於上海從事國際中文教學。", ["國際中文", "語言教學", "跨文化"]],
        ["市場研究與創新實踐", "從真實世界裏，尋找下一條可行的路徑。", "2026 年安徽省優秀畢業生、安徽大學優秀畢業生，曾獲挑戰杯大學生創業計劃競賽銀獎、安徽省大學生創新大賽金獎等多項獎項。", ["市場研究", "創新實踐", "項目策劃"]],
      ];
  return teamMembers.map((item, index) => ({ ...item, role: translated[index][0], short: translated[index][1], bio: translated[index][2], tags: translated[index][3] }));
}

function mapTech(locale: Locale) {
  if (locale === "zh-CN") return { techNotes, techLayers };
  const notes = locale === "en" ? ["Multi-model collaboration", "Node-based generation", "Learning-goal constraints", "Editable end to end"] : ["多模型協同", "節點式生成", "教學目標約束", "全流程可編輯"];
  const layers: Array<[string, string[]]> = locale === "en"
    ? [["Experience layer", ["Student narrative games", "Teacher workbench", "Classroom companion content"]], ["Narrative orchestration", ["Characters & scenes", "Tasks & branches", "Question chains", "Node review"]], ["Intelligent generation", ["Text generation models", "Image generation models", "Character voice", "Quality checks"]], ["Teaching knowledge", ["Course materials", "Learning goals", "Grade & difficulty", "Resource templates"]]]
    : [["應用體驗層", ["學生端敘事遊戲", "教師工作臺", "課堂配套內容"]], ["敘事編排層", ["角色與場景", "任務與分支", "課堂提問鏈", "節點審閱"]], ["智能生成層", ["文本生成模型", "圖像生成模型", "角色語音", "質量校驗"]], ["教學知識層", ["課程材料", "教學目標", "年級與難度", "資源模板庫"]]];
  return { techNotes: notes, techLayers: techLayers.map((item, index) => ({ ...item, name: layers[index][0], chips: layers[index][1] })) };
}

function mapSteps(locale: Locale) {
  if (locale === "zh-CN") return steps;
  const translated = locale === "en"
    ? [["Input", "Provide a text, knowledge source, or teaching need"], ["Orchestrate", "Choose duration, narrative mode, and learning goal"], ["Generate", "Receive characters, scenes, branches, and prompts"], ["Open", "Share the link and bring students into the story"]]
    : [["輸入", "提供課文、知識材料或一句教學需求"], ["編排", "選擇時長、敘事模式與教學目標"], ["生成", "獲得角色、場景、分支與課堂引導"], ["開場", "分享連結，讓學生進入故事現場"]];
  return steps.map((item, index) => ({ ...item, title: translated[index][0], description: translated[index][1] }));
}

function mapStats(locale: Locale) {
  if (locale === "zh-CN") return stats;
  const labels = locale === "en" ? ["Narrative modes", "Working modes", "Classroom possibilities"] : ["敘事模式", "工作模式", "課堂可能"];
  return stats.map((item, index) => ({ ...item, label: labels[index] }));
}

function getContent(locale: Locale): LocaleContent {
  const tech = mapTech(locale);
  return {
    products: mapProducts(locale),
    narrativeModes: mapNarrativeModes(locale),
    features: mapFeatures(locale),
    subjects: locale === "zh-CN" ? subjects : locale === "en" ? ["Language arts", "History", "Geography", "Civics", "Mathematics", "Physics", "Chemistry", "Biology", "English", "Arts", "Information technology", "Interdisciplinary"] : ["語文", "歷史", "地理", "政治", "數學", "物理", "化學", "生物", "英語", "藝術", "資訊科技", "跨學科"],
    stories: mapStories(locale),
    featuredCases: mapCases(locale),
    teamMembers: mapTeam(locale),
    techNotes: tech.techNotes,
    techLayers: tech.techLayers,
    steps: mapSteps(locale),
    stats: mapStats(locale),
  };
}

const metadataByLocale: Record<Locale, LocaleMessages["metadata"]> = {
  "zh-CN": {
    title: "NarrativeOS · AI 叙事课堂生成平台",
    description: "将课文、知识点与教学目标，转化为一场学生可以进入、选择和反思的 AI 叙事课堂。",
    keywords: ["AI 教育", "叙事课堂", "生成式 AI", "角色扮演", "闯关解谜", "NarrativeOS"],
    openGraphDescription: "让知识不只被讲述，而是被亲历。从一份教学材料，到一场完整体验。",
    locale: "zh_CN",
    alternateName: "临场",
  },
  en: {
    title: "NarrativeOS · AI Narrative Classroom Platform",
    description: "Turn texts, concepts, and learning goals into AI narrative classrooms students can enter, shape, and reflect on.",
    keywords: ["AI education", "narrative classroom", "generative AI", "roleplay learning", "experiential learning", "NarrativeOS"],
    openGraphDescription: "Make knowledge something students do, not only something they are told. From teaching material to a complete experience.",
    locale: "en_US",
    alternateName: "Linchang",
  },
  "zh-Hant": {
    title: "NarrativeOS · AI 敘事課堂生成平台",
    description: "將課文、知識點與教學目標，轉化為一場學生可以進入、選擇和反思的 AI 敘事課堂。",
    keywords: ["AI 教育", "敘事課堂", "生成式 AI", "角色扮演", "闖關解謎", "NarrativeOS"],
    openGraphDescription: "讓知識不只被講述，而是被親歷。從一份教學材料，到一場完整體驗。",
    locale: "zh_TW",
    alternateName: "臨場",
  },
};

const messagesByLocale: Record<Locale, LocaleMessages> = {
  "zh-CN": { locale: "zh-CN", ui: zhUi, content: getContent("zh-CN"), metadata: metadataByLocale["zh-CN"] },
  en: { locale: "en", ui: enUi, content: getContent("en"), metadata: metadataByLocale.en },
  "zh-Hant": { locale: "zh-Hant", ui: hantUi, content: getContent("zh-Hant"), metadata: metadataByLocale["zh-Hant"] },
};

export function getMessages(locale: Locale): LocaleMessages {
  return messagesByLocale[locale];
}

export function getLocaleMetadata(locale: Locale): Metadata {
  const { metadata } = getMessages(locale);
  const path = localizedPath(locale);
  return {
    metadataBase: new URL("https://www.narrativeos.cn"),
    title: metadata.title,
    description: metadata.description,
    keywords: metadata.keywords,
    alternates: {
      canonical: path,
      languages: {
        "zh-CN": localizedPath("zh-CN"),
        en: localizedPath("en"),
        "zh-Hant": localizedPath("zh-Hant"),
      },
    },
    openGraph: {
      title: metadata.title,
      description: metadata.openGraphDescription,
      type: "website",
      locale: metadata.locale,
      url: path,
      siteName: "NarrativeOS",
      images: [{ url: "/hero-poster.jpg", width: 1279, height: 722, alt: metadata.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: metadata.title,
      description: metadata.description,
      images: ["/hero-poster.jpg"],
    },
  };
}

export { navLinks };
