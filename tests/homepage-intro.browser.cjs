const assert = require("node:assert/strict");
const { mkdir } = require("node:fs/promises");
const path = require("node:path");
const playwright = require(process.env.PLAYWRIGHT_MODULE || "playwright");

const origin = process.env.UI_TEST_PORTAL_URL || "http://localhost:3000";

async function checkHome(browser, scenario) {
  const context = await browser.newContext({
    ...(scenario.device ? playwright.devices[scenario.device] : { viewport: { width: 1440, height: 960 } }),
    javaScriptEnabled: !scenario.noJavaScript,
    reducedMotion: scenario.reducedMotion ? "reduce" : "no-preference",
  });
  try {
    const page = await context.newPage();
    const errors = [];
    let mediaRequests = 0;
    page.on("pageerror", error => errors.push(error.message));
    await page.route("**/*", route => {
      const request = route.request();
      const url = new URL(request.url());
      // Isolate browser behavior from real accounts, databases and services.
      if (url.pathname.includes("/api/")) {
        if (url.pathname.endsWith("/auth/config")) return route.fulfill({ json: { mode: "sso" } });
        return route.fulfill({ status: 401, json: { error: "unauthenticated" } });
      }
      if (request.resourceType() === "media") {
        mediaRequests++;
        return route.abort();
      }
      if (url.origin !== new URL(origin).origin ||
          (scenario.blockScripts && request.resourceType() === "script")) return route.abort();
      return route.continue();
    });
    if (scenario.rejectPlayback || scenario.successfulPlayback) {
      await page.addInitScript(rejectPlayback => {
        window.playbackAttempts = 0;
        HTMLMediaElement.prototype.play = function () {
          window.playbackAttempts++;
          if (rejectPlayback) return Promise.reject(new DOMException("Playback unavailable", "NotAllowedError"));
          this.dispatchEvent(new Event("playing"));
          return Promise.resolve();
        };
      }, Boolean(scenario.rejectPlayback));
    }

    await page.goto(origin, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(3000);
    assert.equal(await page.evaluate(() => matchMedia("(any-pointer: coarse)").matches), Boolean(scenario.device),
      `${scenario.name}: expected input capability emulation`);
    if (!scenario.device && !scenario.reducedMotion) {
      assert.equal(await page.locator(".hero-intro-curtain").evaluate(node => getComputedStyle(node).animationName),
        "hero-intro-dismiss", `${scenario.name}: desktop intro animation retained`);
    }
    assert.equal(await page.locator(".hero-intro-curtain").isVisible(), false, `${scenario.name}: curtain dismissed`);
    await page.waitForFunction(() =>
      [...document.querySelectorAll("#top .hero-line-char, #top .hero-fade")].every(node =>
        Number(getComputedStyle(node).opacity) > 0.99),
    );
    assert.equal(mediaRequests, 0, `${scenario.name}: no background video preload`);

    if (scenario.rejectPlayback) {
      await page.locator("#top h1").click();
      await page.waitForTimeout(1500);
      assert(await page.evaluate(() => window.playbackAttempts > 0), `${scenario.name}: playback was attempted`);
      assert.equal(await page.locator("#top .hero-fade").last().evaluate(node => getComputedStyle(node).opacity), "1",
        `${scenario.name}: failed video playback preserves entry links`);
    }

    if (scenario.successfulPlayback) {
      await page.locator("#top h1").click();
      await page.waitForFunction(() => window.playbackAttempts > 0 &&
        [...document.querySelectorAll("#top .hero-line-char, #top .hero-fade")].every(node =>
          Number(getComputedStyle(node).opacity) < 0.01),
      );
      await page.evaluate(() => window.scrollTo({ top: 100, behavior: "instant" }));
      await page.waitForTimeout(100);
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      await page.waitForFunction(() =>
        [...document.querySelectorAll("#top .hero-line-char, #top .hero-fade")].every(node =>
          Number(getComputedStyle(node).opacity) > 0.99),
      );
    }

    if (process.env.HOMEPAGE_SCREENSHOT_DIR && scenario.device && !scenario.blockScripts && !scenario.noJavaScript) {
      await mkdir(process.env.HOMEPAGE_SCREENSHOT_DIR, { recursive: true });
      await page.screenshot({ path: path.join(process.env.HOMEPAGE_SCREENSHOT_DIR, `${scenario.name}.png`) });
    }

    await page.evaluate(() => window.scrollTo({ top: document.querySelector("#cases").offsetTop, behavior: "instant" }));
    await page.waitForFunction(() => scrollY > 200 &&
      Number(getComputedStyle(document.querySelector("#cases .reveal")).opacity) > 0.99,
    );
    if (scenario.checkCasePreview) {
      const card = page.locator("#cases article").first();
      assert.equal(await card.locator("video").count(), 0, "collapsed case has no video element");
      await card.dispatchEvent("click");
      await card.locator("video").waitFor({ state: "attached" });
      await card.dispatchEvent("click");
      await card.locator("video").waitFor({ state: "detached" });
    }
    assert.deepEqual(errors, [], `${scenario.name}: no client initialization errors`);
    console.log(`PASS ${scenario.name}: title and links visible, no video preload, following content scrollable`);
  } finally {
    await context.close();
  }
}

async function main() {
  const browserType = playwright[process.env.PLAYWRIGHT_BROWSER || "webkit"];
  const browser = await browserType.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE } : {}),
    ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}),
  });
  try {
    for (const scenario of [
      { name: "ipad-portrait", device: "iPad Pro 11", checkCasePreview: true },
      { name: "ipad-landscape", device: "iPad Pro 11 landscape", rejectPlayback: true },
      { name: "ipad-no-javascript", device: "iPad Pro 11", noJavaScript: true },
      { name: "ipad-failed-scripts", device: "iPad Pro 11 landscape", blockScripts: true },
      { name: "desktop-no-javascript", noJavaScript: true },
      { name: "desktop-failed-scripts", blockScripts: true },
      { name: "desktop-rejected-video", rejectPlayback: true, checkCasePreview: true },
      { name: "desktop-successful-video", successfulPlayback: true },
      { name: "desktop-reduced-motion", reducedMotion: true },
    ]) await checkHome(browser, scenario);
  } finally {
    await browser.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
