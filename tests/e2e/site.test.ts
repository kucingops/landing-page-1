import { expect, test } from '@playwright/test';

test('hero measures its own load time', async ({ page }) => {
	await page.goto('./');
	await expect(page.getByRole('heading', { level: 1 })).toContainText('finished loading in');
	// The hidden, screen-reader version settles to a real number of seconds.
	await expect(page.locator('h1 .visually-hidden')).toHaveText(/\d+\.\d+ seconds/);
	await expect(page.getByText('Transferred')).toBeVisible();
});

test('no layout shift while the page loads and measures', async ({ page }) => {
	await page.goto('./');
	await page.waitForLoadState('load');
	await page.waitForTimeout(1500);
	const cls = await page.evaluate(
		() =>
			new Promise<number>((resolve) => {
				let total = 0;
				new PerformanceObserver((list) => {
					for (const e of list.getEntries() as (PerformanceEntry & { value: number })[])
						total += e.value;
				}).observe({ type: 'layout-shift', buffered: true });
				setTimeout(() => resolve(total), 100);
			})
	);
	expect(cls).toBeLessThan(0.001);
});

test('every in-page link points at a real section', async ({ page }) => {
	await page.goto('./');
	const hrefs = await page
		.locator('a[href^="#"]')
		.evaluateAll((as) => as.map((a) => a.getAttribute('href')!));
	expect(hrefs.length).toBeGreaterThan(0);
	for (const href of hrefs) await expect(page.locator(href)).toHaveCount(1);
});

test('web app manifest is installable', async ({ page, request }) => {
	await page.goto('./');
	const href = await page.locator('link[rel="manifest"]').getAttribute('href');
	const res = await request.get(new URL(href!, page.url()).toString());
	expect(res.ok()).toBe(true);
	const manifest = await res.json();
	expect(manifest.display).toBe('standalone');
	expect(manifest.icons.some((i: { sizes: string }) => i.sizes === '512x512')).toBe(true);
});

test('works offline after the first visit', async ({ page, context }) => {
	await page.goto('./');
	await page.evaluate(() => navigator.serviceWorker.ready);
	// Wait until the worker controls the page, so the reload goes through it.
	await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, {
		timeout: 10_000
	});
	await context.setOffline(true);
	await page.reload();
	await expect(page.getByRole('heading', { level: 1 })).toContainText('finished loading in');
	await expect(page.getByText('from your offline cache')).toBeVisible();
	await context.setOffline(false);
});

test('endless tower keeps only a few floors in the page, even far down', async ({ page }) => {
	await page.goto('./');
	const tower = page.getByRole('region', { name: /scroll to climb down/i });
	await tower.scrollIntoViewIfNeeded();

	await tower.evaluate((el) => el.scrollBy(0, 4000));
	await expect(page.locator('#tower dd').first()).toHaveText(/floor \d+/);

	await page.getByRole('button', { name: /jump 10,000 floors/i }).click();
	await expect(page.locator('#tower dd').first()).toHaveText(/floor 10,\d{3}/);

	const floorsInDom = await page.locator('.floor').count();
	expect(floorsInDom).toBeGreaterThan(0);
	expect(floorsInDom).toBeLessThanOrEqual(6);
});
