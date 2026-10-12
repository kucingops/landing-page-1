import { defineConfig, devices } from '@playwright/test';

const base = process.env.BASE_PATH ?? '';
const port = 4173;

export default defineConfig({
	testDir: 'tests/e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? [['github'], ['list']] : 'list',
	use: {
		baseURL: `http://localhost:${port}${base}/`,
		trace: 'retain-on-failure'
	},
	projects: [
		{
			name: 'chromium',
			use: {
				...devices['Desktop Chrome'],
				// Lets a sandbox with a preinstalled Chromium run the suite; CI uses Playwright's own.
				launchOptions: { executablePath: process.env.CHROMIUM_PATH || undefined }
			}
		},
		{
			name: 'mobile',
			use: {
				...devices['Pixel 7'],
				launchOptions: { executablePath: process.env.CHROMIUM_PATH || undefined }
			}
		}
	],
	webServer: {
		command: 'bun scripts/serve.ts',
		url: `http://localhost:${port}${base}/`,
		reuseExistingServer: !process.env.CI
	}
});
