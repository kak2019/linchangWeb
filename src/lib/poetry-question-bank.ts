export type PoetryDifficulty = "easy" | "medium" | "hard";
type Poem = {
  id: string;
  title: string;
  author: string;
  difficulty: PoetryDifficulty;
  source: string;
  couplets: [string, string][];
  variants?: Record<string, string[]>;
  note?: string;
};

// Public-domain originals, with familiar classroom readings. Each entry retains
// its text source; only explicitly listed textual variants are accepted.
export const poetryPoems: Poem[] = [
  { id: "jingyesi", title: "静夜思", author: "唐 · 李白", difficulty: "easy", source: "https://zh.wikisource.org/zh-hans/靜夜思#唐詩三百首", couplets: [["床前明月光", "疑是地上霜"], ["举头望明月", "低头思故乡"]] },
  { id: "chunxiao", title: "春晓", author: "唐 · 孟浩然", difficulty: "easy", source: "https://zh.wikisource.org/zh-hans/春曉_(孟浩然)", couplets: [["春眠不觉晓", "处处闻啼鸟"], ["夜来风雨声", "花落知多少"]] },
  { id: "dengguanquelou", title: "登鹳雀楼", author: "唐 · 王之涣", difficulty: "easy", source: "https://zh.wikisource.org/zh-hans/登鸛雀樓_(王之渙)", couplets: [["白日依山尽", "黄河入海流"], ["欲穷千里目", "更上一层楼"]] },
  { id: "xiangsi", title: "相思", author: "唐 · 王维", difficulty: "easy", source: "https://zh.wikisource.org/zh-hans/相思", couplets: [["红豆生南国", "春来发几枝"], ["愿君多采撷", "此物最相思"]] },
  { id: "minnong", title: "悯农·其二", author: "唐 · 李绅", difficulty: "easy", source: "https://zh.wikisource.org/zh-hans/憫農二首", couplets: [["锄禾日当午", "汗滴禾下土"], ["谁知盘中餐", "粒粒皆辛苦"]], variants: { "谁知盘中餐": ["谁知盘中飧"] }, note: "“谁知盘中餐”中的“餐”亦作“飧”，两种写法均接受。" },
  { id: "jiangxue", title: "江雪", author: "唐 · 柳宗元", difficulty: "easy", source: "https://zh.wikisource.org/zh-hans/江雪", couplets: [["千山鸟飞绝", "万径人踪灭"], ["孤舟蓑笠翁", "独钓寒江雪"]] },
  { id: "wanglushan", title: "望庐山瀑布·其二", author: "唐 · 李白", difficulty: "medium", source: "https://zh.wikisource.org/zh-hans/望廬山瀑布", couplets: [["日照香炉生紫烟", "遥看瀑布挂前川"], ["飞流直下三千尺", "疑是银河落九天"]] },
  { id: "baidicheng", title: "早发白帝城", author: "唐 · 李白", difficulty: "medium", source: "https://zh.wikisource.org/zh-hans/早發白帝城", couplets: [["朝辞白帝彩云间", "千里江陵一日还"], ["两岸猿声啼不尽", "轻舟已过万重山"]] },
  { id: "wangtianmen", title: "望天门山", author: "唐 · 李白", difficulty: "medium", source: "https://zh.wikisource.org/zh-hans/望天門山", couplets: [["天门中断楚江开", "碧水东流至此回"], ["两岸青山相对出", "孤帆一片日边来"]] },
  { id: "jueju", title: "绝句·两个黄鹂鸣翠柳", author: "唐 · 杜甫", difficulty: "medium", source: "https://zh.wikisource.org/zh-hans/絕句_(兩個黃鸝鳴翠柳)", couplets: [["两个黄鹂鸣翠柳", "一行白鹭上青天"], ["窗含西岭千秋雪", "门泊东吴万里船"]] },
  { id: "shanxing", title: "山行", author: "唐 · 杜牧", difficulty: "medium", source: "https://zh.wikisource.org/zh-hans/山行_(杜牧)", couplets: [["远上寒山石径斜", "白云生处有人家"], ["停车坐爱枫林晚", "霜叶红于二月花"]], variants: { "白云生处有人家": ["白云深处有人家"] }, note: "“白云生处有人家”亦作“白云深处有人家”，两种写法均接受。" },
  { id: "tixilinbi", title: "题西林壁", author: "宋 · 苏轼", difficulty: "medium", source: "https://zh.wikisource.org/zh-hans/題西林壁", couplets: [["横看成岭侧成峰", "远近高低各不同"], ["不识庐山真面目", "只缘身在此山中"]], variants: { "只缘身在此山中": ["祇缘身在此山中"] } },
  { id: "xinglunan", title: "行路难·其一", author: "唐 · 李白", difficulty: "hard", source: "https://zh.wikisource.org/zh-hans/行路難三首", couplets: [["欲渡黄河冰塞川", "将登太行雪满山"], ["长风破浪会有时", "直挂云帆济沧海"]] },
  { id: "denggao", title: "登高", author: "唐 · 杜甫", difficulty: "hard", source: "https://zh.wikisource.org/zh-hans/登高", couplets: [["无边落木萧萧下", "不尽长江滚滚来"], ["万里悲秋常作客", "百年多病独登台"]] },
  { id: "jinse", title: "锦瑟", author: "唐 · 李商隐", difficulty: "hard", source: "https://zh.wikisource.org/zh-hans/錦瑟", couplets: [["沧海月明珠有泪", "蓝田日暖玉生烟"], ["此情可待成追忆", "只是当时已惘然"]] },
  { id: "shuidiaogetou", title: "水调歌头·明月几时有", author: "宋 · 苏轼", difficulty: "hard", source: "https://zh.wikisource.org/zh-hans/水調歌頭_(明月幾時有)", couplets: [["人有悲欢离合", "月有阴晴圆缺"], ["但愿人长久", "千里共婵娟"]] },
  { id: "yumeiren", title: "虞美人·春花秋月何时了", author: "南唐 · 李煜", difficulty: "hard", source: "https://zh.wikisource.org/zh-hans/虞美人_(春花秋月何時了)", couplets: [["雕栏玉砌应犹在", "只是朱颜改"], ["问君能有几多愁", "恰似一江春水向东流"]], variants: { "雕栏玉砌应犹在": ["雕阑玉砌应犹在"] } },
  { id: "jiangjinjiu", title: "将进酒", author: "唐 · 李白", difficulty: "hard", source: "https://zh.wikisource.org/zh-hans/將進酒_(李白)", couplets: [["人生得意须尽欢", "莫使金樽空对月"], ["天生我材必有用", "千金散尽还复来"]] },
];

export const poetryPairs = poetryPoems.flatMap(poem => poem.couplets.map(([upper, lower], index) => ({
  id: `${poem.id}-${index}`, title: poem.title, author: poem.author, difficulty: poem.difficulty,
  source: poem.source, note: poem.note, upper, lower,
  upperVariants: poem.variants?.[upper] || [], lowerVariants: poem.variants?.[lower] || [],
})));
export type PoetryPair = typeof poetryPairs[number];
