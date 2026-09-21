const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");

const base = process.env.PREVIEW_URL || "http://localhost:4173";
const root = path.resolve(__dirname, "..");

async function main() {
  const browser = await chromium.launch({ headless: true });
  const errors = [];
  async function openContext(options = {}) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce", ...options,
    });
    context.on("page", (page) => page.on("pageerror", (error) => errors.push(error.message)));
    return context;
  }

  try {
    const context = await openContext({ colorScheme: "light" });
    const page = await context.newPage();
    assert.equal((await page.goto(`${base}/`)).status(), 200);
    assert.equal(await page.locator("[data-subject-resources] button.subject-link").count(), 6);
    await page.locator(".section-nav").getByRole("link", { name: "RM Skills", exact: true }).click();
    await page.waitForURL("**/rm-skills/");
    assert.equal(await page.locator("h1").textContent(), "RM Skills");
    assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");

    // Local links and section destinations must resolve, including nested routes.
    const localLinks = await page.locator("a[href]").evaluateAll((links) => links.map((a) => a.href).filter((href) => new URL(href).origin === location.origin));
    for (const href of new Set(localLinks)) {
      const url = new URL(href);
      assert.equal((await page.request.get(url.href)).status(), 200, url.href);
      if (url.pathname === "/rm-skills/" && url.hash) {
        assert.ok(await page.locator(`[id="${url.hash.slice(1)}"]`).count(), url.hash);
      }
    }
    await page.locator('.skills-contents a[href="#pruebas"]').click();
    assert.equal(new URL(page.url()).hash, "#pruebas");
    const exams = page.locator(".exam");
    assert.equal(await exams.count(), 8);
    for (let i = 0; i < await exams.count(); i++) {
      const exam = exams.nth(i);
      const wasOpen = await exam.evaluate((el) => el.open);
      await exam.locator("summary").focus();
      await page.keyboard.press("Enter");
      assert.equal(await exam.evaluate((el) => el.open), !wasOpen);
      if (wasOpen) await exam.locator("summary").click();
    }

    await page.locator("[data-theme-toggle]").click();
    assert.equal(await page.locator("html").getAttribute("data-theme"), "light");
    for (const route of ["/sef/", "/ejercicios/di/INDICE.html", "/ejercicios/lm/XML%201/TAREA.html"]) {
      await page.goto(`${base}${route}`);
      const link = page.locator(".section-nav").getByRole("link", { name: "RM Skills", exact: true });
      assert.equal(await link.getAttribute("href").then((href) => new URL(href, page.url()).pathname), "/rm-skills/");
      await link.click();
      await page.waitForURL("**/rm-skills/");
      assert.equal(await page.locator("html").getAttribute("data-theme"), "light");
    }
    for (const theme of ["light", "dark"]) {
      await page.evaluate((value) => document.documentElement.dataset.theme = value, theme);
      for (const width of [320, 390, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.locator("details").evaluateAll((items) => items.forEach((item) => { item.open = true; }));
        await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const dimensions = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
        assert.ok(dimensions.scroll <= dimensions.width, `${theme} at ${width}px: ${dimensions.scroll}px`);
      }
    }

    const blocked = await openContext();
    await blocked.addInitScript(() => {
      Object.defineProperty(window, "localStorage", { get() { throw new DOMException("Blocked", "SecurityError"); } });
    });
    const blockedPage = await blocked.newPage();
    await blockedPage.goto(`${base}/rm-skills/`);
    await blockedPage.locator("[data-theme-toggle]").click();
    assert.equal(await blockedPage.locator("html").getAttribute("data-theme"), "light");

    const noScript = await openContext({ javaScriptEnabled: false });
    const noScriptPage = await noScript.newPage();
    await noScriptPage.goto(`${base}/rm-skills/`);
    await noScriptPage.locator("#prueba-2023 summary").click();
    assert.equal(await noScriptPage.getByRole("link", { name: "Abrir prueba completa" }).isVisible(), true);

    let exerciseHeaders = 0;
    function checkHeaders(directory) {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const file = path.join(directory, entry.name);
        if (entry.isDirectory()) { checkHeaders(file); continue; }
        if (!entry.name.endsWith(".html")) continue;
        const html = fs.readFileSync(file, "utf8");
        if (!html.includes('<nav class="section-nav"')) continue;
        const match = html.match(/<a href="([^"]+)">RM Skills<\/a>/);
        assert.ok(match, file);
        assert.equal(path.resolve(directory, match[1]), path.join(root, "rm-skills"), file);
        exerciseHeaders++;
      }
    }
    checkHeaders(path.join(root, "ejercicios"));
    assert.ok(exerciseHeaders > 0);
    assert.deepEqual(errors, []);
    console.log(`RM Skills: navegación de ${exerciseHeaders} páginas, enlaces locales, 8 ediciones, desplegables, temas y móvil correctos.`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
