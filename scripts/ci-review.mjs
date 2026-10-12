// Review the built site: screenshots, accessibility scan (axe-core),
// console errors, internal link check, and fresh screenshots of the live
// project sites. Usage: node scripts/ci-review.mjs <outDir>
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile, readdir, stat } from 'node:fs/promises';
import { join, extname, resolve } from 'node:path';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const out = resolve(process.argv[2] || 'report');
const dist = resolve('dist');
await mkdir(join(out, 'shots'), { recursive: true });
await mkdir(join(out, 'live'), { recursive: true });

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
  '.pdf': 'application/pdf',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain',
};

async function resolveFile(urlPath) {
  let p = join(dist, decodeURIComponent(urlPath.split('?')[0]));
  try {
    const s = await stat(p);
    if (s.isDirectory()) p = join(p, 'index.html');
  } catch {
    if (!extname(p)) p = p + '.html';
  }
  return p;
}

const server = createServer(async (req, res) => {
  try {
    const p = await resolveFile(req.url || '/');
    const body = await readFile(p);
    res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    const body = await readFile(join(dist, '404.html')).catch(() => 'not found');
    res.writeHead(404, { 'content-type': 'text/html' });
    res.end(body);
  }
}).listen(4321);
const base = 'http://localhost:4321';

async function htmlPages(dir = dist, prefix = '') {
  const pages = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.name.startsWith('_')) continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) pages.push(...(await htmlPages(full, `${prefix}/${e.name}`)));
    else if (e.name === 'index.html') pages.push(prefix || '/');
    else if (e.name.endsWith('.html')) pages.push(`${prefix}/${e.name}`);
  }
  return pages.sort();
}

const pages = await htmlPages();
const browser = await chromium.launch();
const summary = { pages: {}, brokenLinks: [], consoleErrors: [], live: {} };

// ---- Accessibility + console + links (reduced motion so everything is visible) ----
const links = new Set();
for (const path of pages) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(base + path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  summary.pages[path] = {
    violations: axe.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.slice(0, 5).map((n) => ({ target: n.target.join(' '), summary: n.failureSummary })),
    })),
  };
  if (errors.length) summary.consoleErrors.push({ path, errors });
  for (const href of await page.$$eval('a[href^="/"]', (as) => as.map((a) => a.getAttribute('href')))) links.add(href);
  await ctx.close();
}
for (const href of links) {
  const target = href.split('#')[0] || '/';
  try {
    await stat(await resolveFile(target));
  } catch {
    summary.brokenLinks.push(href);
  }
}

// ---- Screenshots ----
const shotPages = ['/', '/projects', '/projects/wordbox', '/projects/expression-benchmark', '/accessibility', '/404.html'].filter(
  (p) => pages.includes(p),
);
const views = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 820, height: 1180 },
  { name: 'desktop', width: 1440, height: 900 },
];
for (const v of views) {
  const ctx = await browser.newContext({ viewport: { width: v.width, height: v.height }, reducedMotion: 'reduce', deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  for (const path of shotPages) {
    await page.goto(base + path, { waitUntil: 'networkidle' });
    // Scroll through so lazy images load before the full-page capture.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(500);
    const name = (path === '/' ? 'home' : path.replace(/^\//, '').replace(/[/.]/g, '_')) + `-${v.name}.jpg`;
    await page.screenshot({ path: join(out, 'shots', name), fullPage: true, type: 'jpeg', quality: 70 });
  }
  await ctx.close();
}
// Hero with full motion (animations running)
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: join(out, 'shots', 'motion-hero-desktop.jpg'), type: 'jpeg', quality: 80 });
  await page.mouse.wheel(0, 1400);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: join(out, 'shots', 'motion-work-desktop.jpg'), type: 'jpeg', quality: 80 });
  await page.keyboard.press('Control+k');
  await page.waitForTimeout(700);
  await page.screenshot({ path: join(out, 'shots', 'motion-palette-desktop.jpg'), type: 'jpeg', quality: 80 });
  await page.keyboard.press('Escape');
  // Navigate to a project via the router to make sure transitions work
  const first = await page.$('a[href^="/projects/"]');
  if (first) {
    await first.click();
    await page.waitForTimeout(1800);
    summary.navigationTest = page.url();
    await page.screenshot({ path: join(out, 'shots', 'motion-project-desktop.jpg'), type: 'jpeg', quality: 80 });
  }
  const mob = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const mp = await mob.newPage();
  await mp.goto(base + '/', { waitUntil: 'networkidle' });
  await mp.waitForTimeout(3000);
  await mp.screenshot({ path: join(out, 'shots', 'motion-hero-mobile.jpg'), type: 'jpeg', quality: 75 });
  await mob.close();
  await ctx.close();
}

// ---- Live project sites (fresh screenshots for the portfolio) ----
const live = {
  'matan-refaely': 'https://matanrefaely.com/',
  'meat-and-cheese': 'https://roni5604.github.io/meatandcheese/index.html',
  wordbox: 'https://roni5604.github.io/WordboxGame/',
  'card-games': 'https://card-games.expo.app',
  'yehudit-michaeli': 'https://yehudit-michaeli.vercel.app/',
};
for (const [slug, url] of Object.entries(live)) {
  for (const v of [
    { name: 'desktop', width: 1440, height: 900, scale: 1 },
    { name: 'mobile', width: 390, height: 844, scale: 2 },
  ]) {
    const ctx = await browser.newContext({ viewport: { width: v.width, height: v.height }, deviceScaleFactor: v.scale, isMobile: v.name === 'mobile' });
    const page = await ctx.newPage();
    try {
      const resp = await page.goto(url, { waitUntil: 'load', timeout: 60000 });
      await page.waitForTimeout(slug === 'wordbox' || slug === 'card-games' || slug === 'yehudit-michaeli' ? 9000 : 2500);
      await page.screenshot({ path: join(out, 'live', `${slug}-${v.name}.png`) });
      summary.live[`${slug}-${v.name}`] = resp ? resp.status() : 'no response';
    } catch (e) {
      summary.live[`${slug}-${v.name}`] = `error: ${String(e).slice(0, 200)}`;
    }
    await ctx.close();
  }
}

await browser.close();
server.close();

const total = Object.values(summary.pages).reduce((n, p) => n + p.violations.length, 0);
summary.totalViolations = total;
await writeFile(join(out, 'review.json'), JSON.stringify(summary, null, 2));
console.log(`pages: ${pages.length}, axe violations: ${total}, broken links: ${summary.brokenLinks.length}, console errors: ${summary.consoleErrors.length}`);
