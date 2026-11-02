const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");

const portalOrigin = process.env.UI_TEST_PORTAL_URL || "http://localhost:3000";
const forgeOrigin = process.env.UI_TEST_WORKBENCH_URL || "http://localhost:3001";
const user = { id: "ui-test-user", nickname: "测试用户", email: "ui-test@example.com", avatar_url: null, providers: ["email"], auth_type: "sso" };
const works = Array.from({ length: 10 }, (_, i) => ({
  id: `ui-work-${i}`, title: `测试作品 ${i + 1}`, summary: "用于验证追加卡片后的滚动范围。", coverUrl: null,
  playUrl: "https://example.com/play/", quizUrl: null, tags: ["课堂"], subject: "语文", grade: "小学", author: { name: "测试教师" },
}));

async function mockApi(page, options = {}) {
  const state = { signedIn: true, admin: true, invite: false, logoutFails: false, balanceFails: false, balanceCalls: 0, subscriptionCalls: 0, ...options };
  // Background videos stream continuously and are unrelated to account behavior.
  await page.route("**/*", route => route.request().resourceType() === "media" ? route.abort() : route.fallback());
  await page.route("**/api/**", async route => {
    const url = new URL(route.request().url());
    const p = url.pathname;
    const json = (body, status = 200) => route.fulfill({ status, json: body });
    if (p.endsWith("/teacher-ecosystem/works")) {
      const offset = Number(url.searchParams.get("offset"));
      const limit = Number(url.searchParams.get("limit"));
      const batch = works.slice(offset, offset + limit);
      return json({ works: batch, total: works.length, nextOffset: offset + batch.length, hasMore: offset + batch.length < works.length });
    }
    if (p.endsWith("/auth/config")) return json({ mode: "sso_or_invite" });
    if (p.endsWith("/admin/me")) return json({ allowed: state.admin }, state.admin ? 200 : 403);
    if (p.endsWith("/auth/me")) return json({ ...user, email: state.invite ? null : user.email, auth_type: state.invite ? "invite" : "sso" }, state.signedIn ? 200 : 401);
    if (p.endsWith("/credits/balance")) {
      ++state.balanceCalls;
      return json({ available: 1234, reserved: 2, consumed: 0, revoked: 0 }, state.balanceFails ? 503 : 200);
    }
    if (p.endsWith("/payments/subscription")) { ++state.subscriptionCalls; return json({ subscription: { name: "Pro" } }); }
    if (p.endsWith("/auth/logout")) {
      if (state.logoutFails) return json({}, 500);
      state.signedIn = false;
      return json({ ok: true });
    }
    if (p.endsWith("/community")) return json({ announcements: [], questions: [], has_more: false });
    if (p.endsWith("/community/mine")) return json({ questions: [], has_more: false });
    return json({});
  });
  return state;
}

async function visit(page, url) {
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  await page.locator(".account-trigger:not([disabled])").first().waitFor();
}

async function main() {
  const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || "msedge" });
  try {
    const context = await browser.newContext({ viewport: { width: 1880, height: 864 } });
    const page = await context.newPage();
    const state = await mockApi(page);
    const pageErrors = [];
    page.on("pageerror", error => pageErrors.push(error.message));

    for (const [locale, prefix, account, myWorks, login] of [
      ["zh-CN", "", "账户", "我的作品", "登录"],
      ["en", "/en", "Account", "My works", "Sign in"],
      ["zh-Hant", "/zh-hant", "帳戶", "我的作品", "登入"],
    ]) {
      await visit(page, `${portalOrigin}${prefix}/teacher-ecosystem/`);
      const logo = page.locator(".plaza-workbench-seal img");
      assert.equal(await logo.evaluate(img => img.naturalWidth), 128);
      await page.locator(".account-trigger").filter({ hasText: account }).click();
      const menu = page.locator(".account-popover");
      await menu.waitFor();
      assert.equal(await menu.getByRole("link", { name: myWorks, exact: true }).count(), 1);
      assert.equal(await menu.locator('a[aria-current="page"]').getAttribute("href"), `${prefix}/teacher-ecosystem/`);
      await page.keyboard.press("Escape");
      await menu.waitFor({ state: "hidden" });
      const before = state.balanceCalls;
      await page.locator(".account-trigger").click();
      await menu.waitFor();
      assert.equal(state.balanceCalls, before, "reopening a fresh account should reuse its cached balance");
      await page.mouse.click(900, 100);
      await menu.waitFor({ state: "hidden" });
      console.log(`PASS portal ${locale}: shared menu, locale links, logo, Escape, outside click, cached balance`);
      state.signedIn = false;
      await page.reload({ waitUntil: "networkidle" });
      const signIn = page.getByRole("link", { name: login, exact: true });
      await signIn.waitFor();
      assert((await signIn.getAttribute("href")).startsWith(`${prefix}/login/`));
      state.signedIn = true;
    }

    await visit(page, `${portalOrigin}/teacher-ecosystem/`);
    await page.mouse.move(900, 450);
    const initialLimit = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    for (let i = 0; i < 8; i++) { await page.mouse.wheel(0, 850); await page.waitForTimeout(450); }
    const bottom = await page.evaluate(() => ({ y: scrollY, limit: document.documentElement.scrollHeight - innerHeight }));
    assert(bottom.y > initialLimit + 100 && Math.abs(bottom.y - bottom.limit) < 10);
    await page.mouse.wheel(0, -600); await page.waitForTimeout(1200);
    assert(await page.evaluate(() => scrollY) < bottom.y - 100);
    console.log("PASS portal: appended cards remain scrollable in both directions");

    state.admin = false;
    state.balanceFails = true;
    await visit(page, `${portalOrigin}/teacher-ecosystem/`);
    await page.locator(".account-trigger").click();
    const menu = page.locator(".account-popover");
    await menu.getByText("积分暂时无法获取，请稍后重新打开").waitFor();
    assert.equal(await menu.getByRole("link", { name: "平台管理" }).count(), 0);
    state.balanceFails = false;
    await page.evaluate(() => window.dispatchEvent(new Event("narrativeos:credits-changed")));
    await menu.getByText("1,234", { exact: true }).waitFor();
    state.logoutFails = true;
    await page.evaluate(() => localStorage.setItem("webgal_invite_code", "retain-on-failure"));
    await menu.getByRole("button", { name: "登出账户" }).click();
    await menu.getByRole("alert").waitFor();
    assert.equal(await page.evaluate(() => localStorage.getItem("webgal_invite_code")), "retain-on-failure");
    state.logoutFails = false;
    await menu.getByRole("button", { name: "登出账户" }).click();
    await page.getByRole("link", { name: "登录", exact: true }).waitFor();
    assert.equal(await page.evaluate(() => localStorage.getItem("webgal_invite_code")), null);
    console.log("PASS portal: denied admin, failed balance retry, failed logout retains identity, successful logout");

    state.signedIn = true;
    state.invite = true;
    const subscriptions = state.subscriptionCalls;
    await visit(page, `${portalOrigin}/teacher-ecosystem/`);
    await page.locator(".account-trigger").click();
    await menu.getByText("邀请码身份", { exact: true }).waitFor();
    assert.equal(await menu.locator(".account-credits").count(), 0);
    assert.equal(state.subscriptionCalls, subscriptions);
    console.log("PASS portal: invitation access does not fetch SSO subscriptions");

    state.invite = false;
    await page.setViewportSize({ width: 390, height: 440 });
    await visit(page, `${portalOrigin}/teacher-ecosystem/`);
    await page.locator(".account-trigger").click();
    await menu.waitFor();
    const box = await menu.boundingBox();
    assert(box.x >= 0 && box.x + box.width <= 390);
    const yBefore = await page.evaluate(() => scrollY);
    await menu.hover(); await page.mouse.wheel(0, 500); await page.waitForTimeout(500);
    assert(await menu.evaluate(el => el.scrollTop) > 0, "short viewport menu must scroll independently");
    assert.equal(await page.evaluate(() => scrollY), yBefore);
    await page.keyboard.press("Escape");
    await menu.waitFor({ state: "hidden" });
    console.log("PASS portal: narrow viewport placement and independent menu scrolling");

    await page.setViewportSize({ width: 1440, height: 900 });
    state.logoutFails = true;
    await page.goto(portalOrigin, { waitUntil: "networkidle", timeout: 60000 });
    await page.getByRole("button", { name: "退出", exact: true }).click();
    await page.getByRole("alert").filter({ hasText: "登出失败，请稍后重试" }).waitFor();
    assert.equal(await page.getByRole("button", { name: "退出", exact: true }).count(), 1);
    state.logoutFails = false;
    await page.getByRole("button", { name: "退出", exact: true }).click();
    await page.getByRole("button", { name: "登录", exact: true }).waitFor();
    console.log("PASS portal homepage: shared session hook, failed logout feedback and confirmed logout");
    assert.deepEqual(pageErrors, []);

    const forge = await context.newPage();
    await mockApi(forge);
    await forge.setViewportSize({ width: 1440, height: 900 });
    await visit(forge, forgeOrigin);
    const brand = forge.locator(".router-brand-mark img");
    assert.equal(await brand.evaluate(img => img.naturalWidth), 128);
    await forge.locator(".account-trigger").first().click();
    const forgeMenu = forge.locator(".account-popover");
    await forgeMenu.waitFor();
    for (const [name, path] of [["我的作品", "/history"], ["我的资产", "/my-assets"], ["素材库", "/assets"], ["充值", "/recharge"]]) {
      const linkHref = await forgeMenu.getByRole("link", { name, exact: true }).getAttribute("href");
      assert.equal(new URL(linkHref, forgeOrigin).pathname, new URL(forgeOrigin).pathname.replace(/\/$/, "") + path);
    }
    await forge.keyboard.press("Escape");
    await forgeMenu.waitFor({ state: "hidden" });
    console.log("PASS workbench: same package, logo, internal route prefix and popover");
  } finally { await browser.close(); }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
