import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 配置
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
	// 测试目录
	testDir: './e2e',

	// 测试文件匹配模式
	testMatch: '**/*.spec.ts',

	// 完全并行运行测试
	fullyParallel: true,

	// CI 环境下禁止 .only
	forbidOnly: !!process.env.CI,

	// 重试次数
	retries: process.env.CI ? 2 : 0,

	// 并发工作线程数
	workers: process.env.CI ? 1 : undefined,

	// 报告器
	reporter: [
		['html', { open: 'never' }],
		['list'],
	],

	// 共享设置
	use: {
		// 基础 URL
		baseURL: 'http://localhost:5173',

		// 收集失败时的追踪
		trace: 'on-first-retry',

		// 截图
		screenshot: 'only-on-failure',

		// 视频
		video: 'retain-on-failure',
	},

	// 浏览器项目配置
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},

		{
			name: 'firefox',
			use: { ...devices['Desktop Firefox'] },
		},

		{
			name: 'webkit',
			use: { ...devices['Desktop Safari'] },
		},

		// 移动端测试
		// {
		//   name: 'Mobile Chrome',
		//   use: { ...devices['Pixel 5'] },
		// },
		// {
		//   name: 'Mobile Safari',
		//   use: { ...devices['iPhone 12'] },
		// },
	],

	// 本地开发服务器
	webServer: {
		command: 'pnpm run dev',
		url: 'http://localhost:5173',
		reuseExistingServer: !process.env.CI,
		timeout: 120 * 1000,
	},
});
