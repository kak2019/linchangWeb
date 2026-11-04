const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const playwright = require(process.env.PLAYWRIGHT_MODULE || "playwright");

const origin = process.env.UI_TEST_PORTAL_URL || "http://localhost:3000";
const output = process.env.REWARD_REPORT_DIR || "/tmp/linchang-reward-check";

async function pngDownload(page, name, width, height) {
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "下载本页 PNG" }).click(),
  ]);
  const file = path.join(output, `${name}.png`);
  await download.saveAs(file);
  const data = await fs.readFile(file);
  assert.equal(data.readUInt32BE(16), width);
  assert.equal(data.readUInt32BE(20), height);
  assert(data.length > 20000, "download contains rendered artwork, not an empty canvas");
  assert.equal(await page.locator(".rewards-export-status a").count(), 1, "mobile image-saving fallback available");
}

async function studio(browser, options, name) {
  const context = await browser.newContext({ ...options, acceptDownloads: true });
  try {
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.addInitScript(() => { window.printCalls = 0; window.print = () => { window.printCalls++; }; });
    const response = await page.goto(`${origin}/teacher-ecosystem/reward-studio/`, { waitUntil: "networkidle" });
    assert.equal(response.status(), 200);
    const preview = page.getByTestId("reward-preview");
    await page.getByLabel(/学生姓名/).fill("安安\n小满");
    await page.getByLabel("奖项名称", { exact: true }).fill("好奇心探索奖");
    await page.getByLabel(/颁发老师/).fill("陈老师");
    await page.getByLabel(/班级 \/ 颁发单位/).fill("三年级二班");
    assert((await preview.textContent()).includes("安安 同学"));
    assert(!/NARRATIVEOS|作者 Flynt|成长的闪光时刻/.test(await preview.textContent()));
    assert.equal(await page.locator(".reward-print-page").count(), 2);
    assert.equal(await page.locator(".reward-print-root").isVisible(), false);
    await page.getByRole("button", { name: "预览下一页" }).click();
    assert((await preview.textContent()).includes("小满 同学"));
    await page.getByRole("button", { name: "打印全部 2 页" }).click();
    assert.equal(await page.evaluate(() => window.printCalls), 1);

    await page.emulateMedia({ media: "print" });
    assert.equal(await page.locator(".rewards-app").isVisible(), false, "editor and site navigation are excluded from printing");
    assert.equal(await page.locator(".reward-print-root").isVisible(), true);
    const box = await page.locator(".reward-print-page").first().boundingBox();
    assert(Math.abs(box.width - 297 / 25.4 * 96) < 1);
    assert(Math.abs(box.height - 210 / 25.4 * 96) < 1);
    assert.equal(await page.locator(".reward-print-page").last().evaluate(node => getComputedStyle(node).breakAfter), "auto", "no forced trailing blank page");
    await page.emulateMedia({ media: "screen" });
    await pngDownload(page, `${name}-certificate`, 3508, 2480);

    await page.getByRole("button", { name: /夸夸邮票/ }).click();
    await page.getByLabel("每人份数", { exact: true }).fill("7");
    assert.equal(await preview.locator("svg[data-reward-artwork] > g").count(), 12);
    assert.equal(await page.locator(".reward-print-page").count(), 2);
    await page.getByRole("button", { name: "预览下一页" }).click();
    assert.equal(await preview.locator("svg[data-reward-artwork] > g").count(), 2);
    assert((await preview.textContent()).includes("小满"));
    await pngDownload(page, `${name}-postage`, 2480, 3508);

    await page.getByRole("button", { name: /小红花.*A4/ }).click();
    await page.getByLabel(/学生姓名/).fill("小禾");
    await page.getByLabel("每人份数", { exact: true }).fill("12");
    await page.getByRole("button", { name: "黑白省墨" }).click();
    assert.equal(await preview.locator("svg[data-reward-artwork] > g").count(), 12);
    assert.equal(await preview.locator('rect[stroke-dasharray="4 6"]').count(), 12);
    await page.getByLabel("显示裁切虚线").uncheck();
    assert.equal(await preview.locator('rect[stroke-dasharray="4 6"]').count(), 0);
    assert(await preview.locator("[fill]").evaluateAll(nodes => nodes.every(node => {
      const color = node.getAttribute("fill");
      return color === "none" || color === "white" || /^#([0-9a-f]{2})\1\1$/i.test(color);
    })), "monochrome output contains only neutral fills");
    await preview.scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(output, `${name}-flower.png`) });
    await pngDownload(page, `${name}-flower-sheet`, 2480, 3508);

    await page.getByLabel("每人份数", { exact: true }).fill("0");
    assert(await page.getByRole("button", { name: "下载本页 PNG" }).isDisabled());
    assert((await page.locator(".rewards-validation").textContent()).includes("份数"));
    await page.getByLabel("每人份数", { exact: true }).fill("1");
    await page.getByLabel(/学生姓名/).fill(Array.from({ length: 61 }, (_, i) => `学生${i}`).join("\n"));
    assert((await page.locator(".rewards-validation").textContent()).includes("60"));
    await page.getByLabel(/学生姓名/).fill("<script>test()</script>");
    assert.equal(await preview.locator("script").count(), 0);
    assert((await preview.textContent()).includes("<script>test()</script>"));
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.deepEqual(errors, []);
    console.log(`PASS ${name}: batch names, 3 templates, PNGs, A4 print isolation, validation and escaped text`);
  } finally { await context.close(); }
}

async function gallery(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  try {
    const page = await context.newPage();
    await page.route("**/api/**", route => route.fulfill({ status: 401, json: { error: "unauthenticated" } }));
    const query = new URLSearchParams({ subject: "跨学科", resource: "printable", author: "Flynt" });
    await page.goto(`${origin}/teacher-ecosystem/?${query}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    const card = page.locator(".plaza-card").filter({ hasText: "课堂印记工坊" });
    await card.waitFor();
    assert.equal(await card.locator(".plaza-author").textContent(), "FFlynt");
    assert.equal(await card.locator(".plaza-card-caption a").getAttribute("href"), "/teacher-ecosystem/reward-studio/");
    await card.getByRole("button", { name: /查看作品:/ }).click();
    assert((await page.locator(".plaza-dialog").textContent()).includes("A4"));
    await page.getByRole("button", { name: "关闭作品预览" }).click();
    await page.screenshot({ path: path.join(output, "gallery-flynt.png") });
    const api = await context.request.get(`${origin}/api/teacher-ecosystem/works?q=Flynt&limit=30`);
    assert.equal(api.status(), 200);
    const publication = (await api.json()).works.find(work => work.id === "builtin-flynt-classroom-rewards");
    assert.equal(publication.playUrl, `${origin}/teacher-ecosystem/reward-studio/`);
    assert.equal(publication.coverUrl, `${origin}/teacher-tools/reward-studio.svg`);
    console.log("PASS gallery: Flynt resource is discoverable by subject, printable type and creator; preview and launch link work");
  } finally { await context.close(); }
}

async function main() {
  await fs.mkdir(output, { recursive: true });
  const browserType = playwright[process.env.PLAYWRIGHT_BROWSER || "chromium"];
  const browser = await browserType.launch({ headless: true,
    ...(process.env.PLAYWRIGHT_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE } : {}),
    ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}),
  });
  try {
    const isWebkit = process.env.PLAYWRIGHT_BROWSER === "webkit";
    await studio(browser, isWebkit ? playwright.devices["iPad Pro 11 landscape"] : { viewport: { width: 1440, height: 1100 } }, isWebkit ? "webkit-ipad" : "chrome-desktop");
    const context = await browser.newContext(isWebkit ? playwright.devices["iPad Pro 11"] : { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    await page.goto(`${origin}/teacher-ecosystem/reward-studio/`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /小红花.*A4/ }).click();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    if (!isWebkit) {
      await page.getByRole("link", { name: "返回预览" }).click();
      await page.waitForFunction(() => document.querySelector("#reward-preview").getBoundingClientRect().top < 100);
    }
    await page.screenshot({ path: path.join(output, isWebkit ? "ipad-portrait.png" : "mobile.png"), fullPage: true });
    await context.close();
    if (!isWebkit) await gallery(browser);
  } finally { await browser.close(); }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
