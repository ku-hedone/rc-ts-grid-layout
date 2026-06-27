import { defineConfig, devices } from '@playwright/test';

/**
 * Ladle Story E2E 测试配置
 *
 * 需要先启动 Ladle：pnpm run ladle
 * 然后运行：pnpm run test:e2e:ladle
 */
export default defineConfig({
	testDir: './e2e',
	testMatch: 'ladle.spec.ts',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: [
		['html', { open: 'never' }],
		['list'],
	],
	use: {
		baseURL: 'http://localhost:61000',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
		video: 'retain-on-failure',
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],
	// 注意：不自动启动 Ladle，需要手动启动
	// 运行步骤：
	// 1. pnpm run ladle
	// 2. pnpm run test:e2e:ladle
});
