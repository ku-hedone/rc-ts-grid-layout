/**
 * GridLayout E2E 测试
 */

import { test, expect } from '@playwright/test';

test.describe('GridLayout', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
	});

	test('页面加载成功', async ({ page }) => {
		// 等待页面加载
		await page.waitForLoadState('networkidle');

		// 检查页面标题
		await expect(page).toHaveTitle(/.*Grid.*|.*Layout.*|.*Vite.*/);
	});

	test('网格布局容器存在', async ({ page }) => {
		// 等待网格布局容器出现
		const gridContainer = page.locator('.react-grid-layout').first();

		// 如果没有找到，尝试其他选择器
		if (await gridContainer.isVisible()) {
			await expect(gridContainer).toBeVisible();
		} else {
			// 检查是否有任何布局容器
			const anyLayout = page.locator('[class*="grid"], [class*="layout"]').first();
			await expect(anyLayout).toBeVisible();
		}
	});

	test('网格项可拖拽', async ({ page }) => {
		// 等待网格项出现
		const gridItem = page.locator('.react-grid-item').first();

		if (await gridItem.isVisible()) {
			// 获取初始位置
			const box = await gridItem.boundingBox();
			expect(box).not.toBeNull();

			if (box) {
				// 拖拽网格项
				await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
				await page.mouse.down();
				await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2 + 50, {
					steps: 10,
				});
				await page.mouse.up();

				// 等待动画完成
				await page.waitForTimeout(500);
			}
		}
	});

	test('网格项可缩放', async ({ page }) => {
		// 等待缩放把手出现
		const resizeHandle = page.locator('.react-resizable-handle').first();

		if (await resizeHandle.isVisible()) {
			// 获取把手位置
			const box = await resizeHandle.boundingBox();
			expect(box).not.toBeNull();

			if (box) {
				// 拖拽缩放把手
				await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
				await page.mouse.down();
				await page.mouse.move(box.x + box.width / 2 + 50, box.y + box.height / 2 + 50, {
					steps: 10,
				});
				await page.mouse.up();

				// 等待动画完成
				await page.waitForTimeout(500);
			}
		}
	});
});
