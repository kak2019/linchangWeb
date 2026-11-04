const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

function createLoader(database) {
  const cache = new Map();
  function load(file) {
    file = path.resolve(file);
    if (cache.has(file)) return cache.get(file);
    const container = { exports: {} };
    cache.set(file, container.exports);
    const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText;
    vm.runInNewContext(code, {
      module: container, exports: container.exports, Date, Buffer, URLSearchParams,
      require: id => id === "@/lib/db" ? { getPrisma: () => database }
        : id.startsWith(".") ? load(path.resolve(path.dirname(file), `${id}.ts`)) : require(id),
    });
    return container.exports;
  }
  return load;
}

const load = createLoader();
const rewards = load("src/lib/classroom-rewards.ts");
const catalog = load("src/lib/builtin-teacher-works.ts");

test("certificate batches preserve student names, ordering and per-student copies", () => {
  const settings = { ...rewards.initialRewardSettings("2026-11-03"), names: "小禾，安安\nChristopher", copies: 2 };
  const sheets = rewards.rewardSheets(settings);
  assert.equal(sheets.length, 6);
  assert.equal(sheets.map(sheet => sheet[0].student).join("|"), "小禾|小禾|安安|安安|Christopher|Christopher");
  assert.equal(rewards.rewardSheets({ ...settings, names: "  " })[0][0].student, "闪闪发光的你");
});

test("A4 sticker batches paginate without losing names and copies", () => {
  const settings = { ...rewards.initialRewardSettings("2026-11-03"), template: "flower", names: "小禾\n安安\n小满", copies: 5 };
  const sheets = rewards.rewardSheets(settings);
  assert.equal(sheets.map(sheet => sheet.length).join(","), "12,3");
  assert.equal(sheets[1].map(label => label.student).join(","), "小满,小满,小满");
  assert.equal(sheets[1][2].number, 15);
});

test("invalid quantities, oversized batches, invalid dates and overflowing text are blocked", () => {
  const defaults = rewards.initialRewardSettings("2026-11-03");
  for (const copies of [NaN, 0, 1.5, 13]) assert.match(rewards.validateRewardSettings({ ...defaults, copies }), /份数/);
  assert.match(rewards.validateRewardSettings({ ...defaults, names: Array.from({ length: 61 }, (_, i) => `学生${i}`).join("\n") }), /60/);
  assert.match(rewards.validateRewardSettings({ ...defaults, date: "2026-02-30" }), /日期/);
  assert.match(rewards.validateRewardSettings({ ...defaults, message: "一\n二\n三\n四\n五" }), /换行/);
  assert.equal(rewards.validateRewardSettings({ ...defaults, message: "好".repeat(120) }), null);
});

test("Chinese and Latin wrapping retains content and A4 orientation has the right geometry", () => {
  const original = "跨学科探索ABC123小小的好奇心";
  assert.equal(rewards.wrapRewardText(original, 6).join(""), original);
  assert.equal(rewards.formatRewardDate("2026-11-03"), "2026 年 11 月 3 日");
  const certificate = rewards.rewardPaper("certificate"), stickers = rewards.rewardPaper("postage");
  assert.equal(certificate.width, 297); assert.equal(certificate.height, 210);
  assert.equal(stickers.width, 210); assert.equal(stickers.height, 297);
  assert.equal(certificate.pngWidth, stickers.pngHeight);
});

test("Flynt's resource is discoverable by author, print type and cross-disciplinary filters", () => {
  assert.equal(catalog.matchingBuiltinTeacherWorks("Flynt")[0].author.name, "Flynt");
  assert.equal(catalog.matchingBuiltinTeacherWorks("奖状", { subject: ["跨学科"], stage: ["小学"], grade: ["五年级"], resource: "printable" }).length, 1);
  assert.equal(catalog.matchingBuiltinTeacherWorks("", { subject: ["物理"] }).length, 0);
  assert.equal(catalog.matchingBuiltinTeacherWorks("", { resource: "quiz" }).length, 0);
  assert.equal(catalog.matchingBuiltinTeacherWorks("", { resource: "story-only" }).length, catalog.builtinTeacherWorks.filter(work => !work.quizUrl && !work.tags.includes("可打印")).length);
  assert.equal(catalog.matchingBuiltinTeacherWorks("", { after: "2026-11-04" }).length, 0);
  assert.equal(catalog.matchingBuiltinTeacherWorks("", { after: "2026-11-03", before: "2026-11-03" }).length, catalog.builtinTeacherWorks.length);
});

function compare(a, b) { return a < b ? -1 : a > b ? 1 : 0; }
function matches(row, where) {
  if (!where) return true;
  return Object.entries(where).every(([key, value]) => {
    if (key === "AND") return (Array.isArray(value) ? value : [value]).every(item => matches(row, item));
    if (key === "OR") return value.some(item => matches(row, item));
    if (key === "NOT") return !matches(row, value);
    const actual = row[key];
    if (value === null || typeof value !== "object" || value instanceof Date) return Number.isNaN(Number(value)) ? actual === value : actual instanceof Date ? +actual === +value : actual === value;
    if (key === "author") return matches(actual, value);
    return Object.entries(value).every(([operator, expected]) => {
      if (operator === "contains") return String(actual || "").toLowerCase().includes(String(expected).toLowerCase());
      if (operator === "startsWith") return String(actual || "").startsWith(expected);
      if (operator === "in") return expected.includes(actual);
      if (operator === "array_contains") return expected.every(item => actual.includes(item));
      if (operator === "not") return actual !== expected;
      if (operator === "lt") return actual < expected;
      if (operator === "gt") return actual > expected;
      if (operator === "gte") return actual >= expected;
      throw new Error(`Unexpected operator ${operator}`);
    });
  });
}

const records = Array.from({ length: 13 }, (_, index) => ({
  id: `db-${String(index).padStart(2, "0")}`, jobId: String(index).padStart(32, "0"), title: `Lesson ${String(index).padStart(2, "0")}`,
  summary: "课堂作品", status: "PUBLISHED", featured: index === 5, publishedAt: new Date(`2026-11-${String(index + 1).padStart(2, "0")}T00:00:00+08:00`),
  subject: "数学", grade: "五年级", tags: ["小学"], coverUrl: null, playUrl: "https://example.com/", quizUrl: null,
  author: { nickname: "Teacher", email: null, avatarUrl: null },
}));
const database = { teacherWork: {
  count: async ({ where }) => records.filter(row => matches(row, where)).length,
  findMany: async ({ where, orderBy, skip, take }) => records.filter(row => matches(row, where)).sort((a, b) => {
    for (const rule of orderBy) {
      const [key, direction] = Object.entries(rule)[0];
      const result = compare(a[key], b[key]) * (direction === "asc" ? 1 : -1);
      if (result) return result;
    }
    return 0;
  }).slice(skip, skip + take),
} };
const publications = createLoader(database)("src/lib/teacher-ecosystem.ts");

test("built-in insertion preserves complete, non-overlapping pagination for every sort", async () => {
  const all = [...records, ...catalog.builtinTeacherWorks.map(work => ({ ...work, publishedAt: new Date(work.publishedAt) }))];
  for (const sort of ["featured", "latest", "oldest", "title"]) {
    const actual = [];
    for (let page = 1; page <= Math.ceil(all.length / 4); page++) {
      const result = await publications.listFilteredTeacherWorks("", page, 4, { sort });
      assert.equal(result.total, all.length); actual.push(...result.works.map(work => work.id));
    }
    const expected = [...all].sort((a, b) => sort === "title" ? compare(a.title, b.title) || compare(a.id, b.id)
      : (sort === "featured" ? Number(b.featured) - Number(a.featured) : 0)
        || (sort === "oldest" ? +a.publishedAt - +b.publishedAt : +b.publishedAt - +a.publishedAt)
        || (sort === "oldest" ? compare(a.id, b.id) : compare(b.id, a.id)));
    assert.equal(actual.length, all.length); assert.equal(new Set(actual).size, all.length);
    assert.equal(actual.join(","), expected.map(work => work.id).join(","));
  }
});

test("public API offsets count built-in resources and resource filters stay consistent", async () => {
  const first = await publications.listPublishedTeacherWorks("", 1, 1, 0);
  const second = await publications.listPublishedTeacherWorks("", 1, 1, first.nextOffset);
  const third = await publications.listPublishedTeacherWorks("", 1, 1, second.nextOffset);
  assert.equal(first.works[0].id, "db-05");
  assert.equal(second.works[0].id, "builtin-flynt-poetry-challenge");
  assert.equal(third.works[0].id, "builtin-flynt-sound-meter");
  const printable = await publications.listFilteredTeacherWorks("Flynt", 999, 12, { resource: "printable" });
  assert.equal(printable.total, 1); assert.equal(printable.page, 1);
  assert.equal(printable.works[0].subject, "跨学科");
  const math = await publications.listFilteredTeacherWorks("", 1, 30, { subject: ["数学"] });
  assert.equal(math.total, 13); assert.equal(math.works.some(work => work.author.name === "Flynt"), false);
});
