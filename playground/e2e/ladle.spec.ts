/**
 * Ladle Story E2E 测试
 *
 * 目标：验证核心 story 的基本行为（加载、拖拽、无项目侧错误）
 * Ladle 默认端口：61000
 * Story URL 格式：/?story=<category>--<story>
 */

import { test, expect } from '@playwright/test';

// Ladle 默认端口
const LADLE_BASE = 'http://localhost:61000';

// 已知的 Ladle 外部警告（不作为项目失败条件）
const KNOWN_EXTERNAL_WARNINGS = [
	'DevTools failed to load source map',
	'React DevTools',
	'[HMR]',
	'WebSocket connection',
	'downloadable font',
];

function isProjectError(text: string): boolean {
	return !KNOWN_EXTERNAL_WARNINGS.some((w) => text.includes(w));
}

test.describe('Ladle - Basic Story', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto(`${LADLE_BASE}/?story=basic--auto-size`);
		await page.waitForLoadState('networkidle');
	});

	test('story 加载成功，网格容器可见', async ({ page }) => {
		const container = page.locator('.react-grid-layout').first();
		await expect(container).toBeVisible();
	});

	test('grid items 正确渲染', async ({ page }) => {
		const items = page.locator('.react-grid-item');
		const count = await items.count();
		expect(count).toBeGreaterThan(0);
	});

	test('grid items 有正确的定位样式', async ({ page }) => {
		const item = page.locator('.react-grid-item').first();
		await expect(item).toBeVisible();

		const style = await item.getAttribute('style');
		expect(style).toBeTruthy();
		// 应该有 position: absolute 或 transform
		expect(style).toMatch(/position:\s*absolute|transform/);
	});

	test('鼠标拖拽生效：item 位置改变', async ({ page }) => {
		const item = page.locator('.react-grid-item').first();
		await expect(item).toBeVisible();

		const box = await item.boundingBox();
		expect(box).not.toBeNull();

		if (box) {
			const initialX = box.x;
			const initialY = box.y;

			// 执行拖拽
			await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
			await page.mouse.down();
			// 分多步移动以触发拖拽
			for (let i = 1; i <= 10; i++) {
				await page.mouse.move(
					box.x + box.width / 2 + (150 * i) / 10,
					box.y + box.height / 2 + (60 * i) / 10,
				);
			}
			await page.mouse.up();

			// 等待布局更新
			await page.waitForTimeout(500);

			// 验证位置已改变
			const newBox = await item.boundingBox();
			if (newBox) {
				const moved =
					Math.abs(newBox.x - initialX) > 5 ||
					Math.abs(newBox.y - initialY) > 5;
				expect(moved).toBe(true);
			}
		}
	});

	test('无项目侧 console.error', async ({ page }) => {
		const errors: string[] = [];

		page.on('console', (msg) => {
			if (msg.type() === 'error' && isProjectError(msg.text())) {
				errors.push(msg.text());
			}
		});

		// 重新加载页面以捕获所有 console.error
		await page.goto(`${LADLE_BASE}/?story=basic--auto-size`);
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(1000);

		// 不应有项目侧错误
		expect(errors).toHaveLength(0);
	});
});
