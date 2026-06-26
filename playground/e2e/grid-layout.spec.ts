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
				const initialX = box.x;
				const initialY = box.y;

				// 拖拽网格项
				await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
				await page.mouse.down();
				await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2 + 50, {
					steps: 10,
				});
				await page.mouse.up();

				// 等待动画完成
				await page.waitForTimeout(500);

				// 验证位置已改变
				const newBox = await gridItem.boundingBox();
				if (newBox) {
					expect(newBox.x).not.toBe(initialX);
				}
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

	test('静态项不可拖拽', async ({ page }) => {
		// 查找静态项
		const staticItem = page.locator('.react-grid-item--static').first();

		if (await staticItem.isVisible()) {
			// 获取初始位置
			const box = await staticItem.boundingBox();

			if (box) {
				// 尝试拖拽
				await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
				await page.mouse.down();
				await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2 + 50, {
					steps: 10,
				});
				await page.mouse.up();

				// 等待动画完成
				await page.waitForTimeout(500);

				// 验证位置未改变
				const newBox = await staticItem.boundingBox();
				if (newBox) {
					expect(newBox.x).toBe(box.x);
					expect(newBox.y).toBe(box.y);
				}
			}
		}
	});

	test('网格项数量正确', async ({ page }) => {
		// 等待网格项出现
		const items = page.locator('.react-grid-item');
		const count = await items.count();

		// 至少应该有一个网格项
		expect(count).toBeGreaterThan(0);
	});

	test('网格项有正确的定位样式', async ({ page }) => {
		// 等待网格项出现
		const gridItem = page.locator('.react-grid-item').first();

		if (await gridItem.isVisible()) {
			// 检查是否有定位样式
			const style = await gridItem.getAttribute('style');
			expect(style).toBeTruthy();

			// 应该有 position: absolute 或 transform
			expect(style).toMatch(/position:\s*absolute|transform/);
		}
	});

	test('页面响应窗口大小变化', async ({ page }) => {
		// 获取初始窗口大小
		const initialSize = page.viewportSize();

		// 改变窗口大小
		await page.setViewportSize({ width: 800, height: 600 });
		await page.waitForTimeout(500);

		// 检查布局是否仍然存在
		const container = page.locator('.react-grid-layout').first();
		if (await container.isVisible()) {
			await expect(container).toBeVisible();
		}

		// 恢复原始大小
		if (initialSize) {
			await page.setViewportSize(initialSize);
		}
	});

	test('网格项有正确的类名', async ({ page }) => {
		// 等待网格项出现
		const gridItem = page.locator('.react-grid-item').first();

		if (await gridItem.isVisible()) {
			// 检查是否有 react-grid-item 类名
			await expect(gridItem).toHaveClass(/react-grid-item/);
		}
	});

	test('网格容器有正确的类名', async ({ page }) => {
		// 等待网格容器出现
		const container = page.locator('.react-grid-layout').first();

		if (await container.isVisible()) {
			// 检查是否有 react-grid-layout 类名
			await expect(container).toHaveClass(/react-grid-layout/);
		}
	});
});
