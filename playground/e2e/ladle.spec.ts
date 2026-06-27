/**
 * Ladle Story E2E 测试
 *
 * 目标：验证核心 story 的基本行为（加载、拖拽、无项目侧错误）
 * Ladle 默认端口：61000
 * Story URL 格式：/?story=<category>--<story>
 */

import { test, expect, type Locator, type Page } from '@playwright/test';

// Ladle 默认端口
const LADLE_BASE = process.env.LADLE_BASE ?? 'http://localhost:61000';

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

async function getTranslate(locator: Locator): Promise<{ x: number; y: number }> {
	return locator.evaluate((element) => {
		const transform = getComputedStyle(element).transform;
		if (!transform || transform === 'none') {
			return { x: 0, y: 0 };
		}
		const matrix = new DOMMatrixReadOnly(transform);
		return { x: matrix.m41, y: matrix.m42 };
	});
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

	test('多步拖拽累计位移，不只使用最后一帧 delta', async ({ page }) => {
		const item = page.locator('.react-grid-item').first();
		await expect(item).toBeVisible();

		const box = await item.boundingBox();
		expect(box).not.toBeNull();
		if (!box) return;

		const initial = await getTranslate(item);
		const startX = box.x + box.width / 2;
		const startY = box.y + box.height / 2;
		const totalX = 150;
		const totalY = 60;
		const steps = 10;

		await page.mouse.move(startX, startY);
		await page.mouse.down();
		for (let i = 1; i <= steps; i++) {
			await page.mouse.move(
				startX + (totalX * i) / steps,
				startY + (totalY * i) / steps,
			);
		}

		const during = await getTranslate(item);
		expect(during.x - initial.x).toBeGreaterThan(totalX * 0.8);
		expect(during.y - initial.y).toBeGreaterThan(totalY * 0.8);

		await page.mouse.up();
	});

	test('maxRows 约束拒绝越界拖拽后恢复到合法 DOM 位置', async ({ page }) => {
		await page.goto(`${LADLE_BASE}/?story=basic--max-rows`);
		await page.waitForLoadState('networkidle');

		const item = page.locator('.react-grid-item').first();
		await expect(item).toBeVisible();

		const box = await item.boundingBox();
		expect(box).not.toBeNull();
		if (!box) return;

		const initial = await getTranslate(item);
		const startX = box.x + box.width / 2;
		const startY = box.y + box.height / 2;

		await page.mouse.move(startX, startY);
		await page.mouse.down();
		await page.mouse.move(startX, startY + 200);

		const during = await getTranslate(item);
		expect(during.y - initial.y).toBeGreaterThan(150);

		await page.mouse.up();
		await page.waitForTimeout(500);

		const final = await getTranslate(item);
		// maxRows=4 且 item 高度为 2 行，最终最大 y=2；
		// rowHeight=30, marginY=10, 初始 y=0，所以最终像素偏移为 2 * (30 + 10) = 80。
		expect(Math.round(final.y - initial.y)).toBe(80);
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

test.describe('Ladle - Dropping Story', () => {
	async function dragExternalItemToGrid(
		page: Page,
		targetPosition: { x: number; y: number } = { x: 600, y: 50 },
	) {
		const draggable = page.locator('[draggable="true"]').first();
		const grid = page.locator('.react-grid-layout').first();
		await expect(draggable).toBeVisible();
		await expect(grid).toBeVisible();
		await draggable.dragTo(grid, { targetPosition, force: true });
		await page.waitForTimeout(500);
	}

	test('drop 成功：onDrop 回调触发，文本包含 __dropping-elem__', async ({ page }) => {
		const errors: string[] = [];
		page.on('console', (msg) => {
			if (msg.type() === 'error' && isProjectError(msg.text())) {
				errors.push(msg.text());
			}
		});

		await page.goto(`${LADLE_BASE}/?story=dropping--basic-dropping`);
		await page.waitForLoadState('networkidle');

		await expect(page.locator('.react-grid-layout').first()).toBeVisible();

		await dragExternalItemToGrid(page);

		// BasicDropping story 在 onDrop 后将 item.i 追加到 "已拖入的项" 文本
		// 验证文本包含 __dropping-elem__（默认 droppingItem.i）
		const droppedText = page.locator('text=__dropping-elem__');
		await expect(droppedText).toBeVisible();

		expect(errors).toHaveLength(0);
	});

	test('连续 drop 后不残留 dropping placeholder', async ({ page }) => {
		await page.goto(`${LADLE_BASE}/?story=dropping--basic-dropping`);
		await page.waitForLoadState('networkidle');

		await dragExternalItemToGrid(page, { x: 600, y: 50 });
		await dragExternalItemToGrid(page, { x: 650, y: 50 });

		const bodyText = (await page.locator('body').textContent()) ?? '';
		const dropCount = bodyText.match(/__dropping-elem__/g)?.length ?? 0;
		expect(dropCount).toBeGreaterThanOrEqual(2);

		// drop 后：dropping placeholder 应被清除
		const droppingAfterDrop = await page.locator('.react-grid-item.dropping').count();
		expect(droppingAfterDrop).toBe(0);
	});

	test('无项目侧 console.error（dropping story）', async ({ page }) => {
		const errors: string[] = [];
		page.on('console', (msg) => {
			if (msg.type() === 'error' && isProjectError(msg.text())) {
				errors.push(msg.text());
			}
		});

		await page.goto(`${LADLE_BASE}/?story=dropping--basic-dropping`);
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(1000);

		expect(errors).toHaveLength(0);
	});
});
