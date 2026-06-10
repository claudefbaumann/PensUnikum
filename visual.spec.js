const { test, expect, chromium } = require('@playwright/test');
const fs = require('fs');

const URL       = process.env.TEST_URL   || 'https://pensunikum.authenticus.ch/app.html';
const EMAIL     = process.env.TEST_EMAIL || '';
const PW        = process.env.TEST_PW    || '';
const HAS_CREDS = !!(EMAIL && PW);

if (!fs.existsSync('screenshots')) fs.mkdirSync('screenshots');

// Screen 1: Login-Seite & Script-Struktur (kein Login nötig)
test('Screen 1 — Login-Seite & Script-Struktur', async () => {
  const browser = await chromium.launch();
  const page    = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const jsErrors = [];
  page.on('pageerror', e => jsErrors.push(e.message));

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.screenshot({ path: 'screenshots/01_login.png' });

  await expect(page.locator('#login-email')).toBeVisible();
  await expect(page.locator('#login-btn')).toBeVisible();

  const doLoginExists = await page.evaluate(() => typeof window.doLogin === 'function');
  expect(doLoginExists, 'window.doLogin() muss definiert sein').toBe(true);

  const body = await page.innerText('body');
// Prüft ob JS-Code als sichtbarer DOM-Text erscheint (ausserhalb von <script>-Tags)
const jsVisible = await page.evaluate(() => {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const t = node.textContent.trim();
    if (t.includes('w.document.close') || t.includes('function renderStundenplan')) return true;
  }
  return false;
});
expect(jsVisible, 'JS-Code erscheint als sichtbarer Text im DOM').toBe(false);

  expect(jsErrors, `JS-Fehler beim Laden: ${jsErrors.join(', ')}`).toHaveLength(0);
  await browser.close();
});

// Screen 2: Toolbar — genau 1 Regeln-Button (benötigt Login)
test('Screen 2 — Toolbar (1× Regeln-Button)', async () => {
  test.skip(!HAS_CREDS, 'TEST_EMAIL/TEST_PW nicht gesetzt — übersprungen');
  const browser = await chromium.launch();
  const page    = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const jsErrors = [];
  page.on('pageerror', e => jsErrors.push(e.message));

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.fill('#login-email', EMAIL);
  await page.fill('#login-password', PW);
  await page.click('#login-btn');
  await page.waitForTimeout(3500);
  await page.evaluate(() => showPanel('stundenplan')).catch(() => {});
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screenshots/02_toolbar.png' });

  await expect(page.locator('button', { hasText: /^Regeln$/ }), 'Genau 1 Regeln-Button').toHaveCount(1);
  await expect(page.locator('#btn-generate-sp')).toBeVisible();
  expect(jsErrors, `JS-Fehler: ${jsErrors.join(', ')}`).toHaveLength(0);
  await browser.close();
});

// Screen 3: Scheduler-Grid — keine UUID-Kürzel (benötigt Login)
test('Screen 3 — Scheduler-Grid (keine UUID-Kürzel)', async () => {
  test.skip(!HAS_CREDS, 'TEST_EMAIL/TEST_PW nicht gesetzt — übersprungen');
  const browser = await chromium.launch();
  const page    = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.fill('#login-email', EMAIL);
  await page.fill('#login-password', PW);
  await page.click('#login-btn');
  await page.waitForTimeout(3500);
  await page.evaluate(() => showPanel('stundenplan')).catch(() => {});
  await page.waitForTimeout(1000);

  const opts = await page.locator('#sp-klasse-select option').count();
  if (opts > 1) {
    await page.locator('#sp-klasse-select').selectOption({ index: 1 });
    await page.waitForTimeout(800);
  }
  await page.click('#btn-generate-sp').catch(() => {});
  await page.waitForTimeout(4000);
  await page.screenshot({ path: 'screenshots/03_scheduler.png', fullPage: true });

  const cells     = await page.locator('#scheduler-grid-output td').allInnerTexts();
  const uuidLeaks = cells.filter(t => /^[0-9a-f]{6}$/i.test(t.trim()));
  expect(uuidLeaks, `UUID-Kürzel gefunden: ${uuidLeaks.join(', ')}`).toHaveLength(0);
  await browser.close();
});

// Screen 4: LP-Ansicht getrennt von Klassenansicht (benötigt Login)
test('Screen 4 — LP-Ansicht getrennt von Klassenansicht', async () => {
  test.skip(!HAS_CREDS, 'TEST_EMAIL/TEST_PW nicht gesetzt — übersprungen');
  const browser = await chromium.launch();
  const page    = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.fill('#login-email', EMAIL);
  await page.fill('#login-password', PW);
  await page.click('#login-btn');
  await page.waitForTimeout(3500);
  await page.evaluate(() => showPanel('stundenplan')).catch(() => {});
  await page.waitForTimeout(1000);
  await page.locator('#sp-ansicht').selectOption('lp').catch(() => {});
  await page.evaluate(() => spAnsichtChanged()).catch(() => {});
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'screenshots/04_lp_ansicht.png' });

  await expect(page.locator('#scheduler-variants'), 'Varianten-Panel ausgeblendet').toBeHidden();
  await expect(page.locator('#btn-generate-sp'),    'Generieren-Button ausgeblendet').toBeHidden();
  await expect(page.locator('#sp-lp-wrap'),         'LP-Auswahl sichtbar').toBeVisible();
  await browser.close();
});
