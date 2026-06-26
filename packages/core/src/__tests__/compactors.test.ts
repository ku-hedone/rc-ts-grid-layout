/**
 * compactors.ts 单元测试
 */

import { describe, it, expect } from 'vitest';
import {
	verticalCompactor,
	horizontalCompactor,
	noCompactor,
	verticalOverlapCompactor,
	horizontalOverlapCompactor,
	noOverlapCompactor,
	getCompactor,
	compactItemVertical,
	compactItemHorizontal,
	resolveCompactionCollision,
} from '../compactors';
import type { LayoutItem } from '../type';

// 辅助函数：创建布局项
function createItem(overrides: Partial<LayoutItem> = {}): LayoutItem {
	return {
		i: 'test',
		x: 0,
		y: 0,
		w: 1,
		h: 1,
		...overrides,
	};
}

function itemAt<T>(items: readonly T[], index: number): T {
	const item = items[index];
	if (!item) throw new Error(`Expected item at index ${index}`);
	return item;
}

describe('compactors', () => {
	describe('verticalCompactor', () => {
		it('类型为 vertical', () => {
			expect(verticalCompactor.type).toBe('vertical');
		});

		it('不允许重叠', () => {
			expect(verticalCompactor.allowOverlap).toBe(false);
		});

		it('垂直压缩布局', () => {
			const layout = [
				createItem({ i: '1', x: 0, y: 5, w: 2, h: 2 }),
				createItem({ i: '2', x: 0, y: 10, w: 2, h: 2 }),
			];
			const compacted = verticalCompactor.compact(layout, 12);
			// 元素应该被压缩到顶部
			expect(itemAt(compacted, 0).y).toBe(0);
			expect(itemAt(compacted, 1).y).toBe(2);
		});

		it('静态元素不移动', () => {
			const layout = [
				createItem({ i: '1', x: 0, y: 10, w: 2, h: 2, static: true }),
				createItem({ i: '2', x: 0, y: 5, w: 2, h: 2 }),
			];
			const compacted = verticalCompactor.compact(layout, 12);
			// 静态元素应该保持原位
			expect(itemAt(compacted, 0).y).toBe(10);
		});
	});

	describe('horizontalCompactor', () => {
		it('类型为 horizontal', () => {
			expect(horizontalCompactor.type).toBe('horizontal');
		});

		it('不允许重叠', () => {
			expect(horizontalCompactor.allowOverlap).toBe(false);
		});

		it('水平压缩布局', () => {
			const layout = [
				createItem({ i: '1', x: 5, y: 0, w: 2, h: 2 }),
				createItem({ i: '2', x: 10, y: 0, w: 2, h: 2 }),
			];
			const compacted = horizontalCompactor.compact(layout, 12);
			// 元素应该被压缩到左侧
			expect(itemAt(compacted, 0).x).toBe(0);
			expect(itemAt(compacted, 1).x).toBe(2);
		});
	});

	describe('noCompactor', () => {
		it('类型为 null', () => {
			expect(noCompactor.type).toBeNull();
		});

		it('不允许重叠', () => {
			expect(noCompactor.allowOverlap).toBe(false);
		});

		it('不移动元素', () => {
			const layout = [
				createItem({ i: '1', x: 5, y: 5, w: 2, h: 2 }),
				createItem({ i: '2', x: 10, y: 10, w: 2, h: 2 }),
			];
			const compacted = noCompactor.compact(layout, 12);
			// 元素位置应该保持不变
			expect(itemAt(compacted, 0).x).toBe(5);
			expect(itemAt(compacted, 0).y).toBe(5);
			expect(itemAt(compacted, 1).x).toBe(10);
			expect(itemAt(compacted, 1).y).toBe(10);
		});
	});

	describe('overlap compactors', () => {
		it('verticalOverlapCompactor 允许重叠', () => {
			expect(verticalOverlapCompactor.allowOverlap).toBe(true);
		});

		it('horizontalOverlapCompactor 允许重叠', () => {
			expect(horizontalOverlapCompactor.allowOverlap).toBe(true);
		});

		it('noOverlapCompactor 允许重叠', () => {
			expect(noOverlapCompactor.allowOverlap).toBe(true);
		});

		it('允许重叠时不移动元素', () => {
			const layout = [
				createItem({ i: '1', x: 0, y: 5, w: 2, h: 2 }),
				createItem({ i: '2', x: 0, y: 10, w: 2, h: 2 }),
			];
			const compacted = verticalOverlapCompactor.compact(layout, 12);
			// 元素位置应该保持不变
			expect(itemAt(compacted, 0).y).toBe(5);
			expect(itemAt(compacted, 1).y).toBe(10);
		});
	});

	describe('getCompactor', () => {
		it('返回垂直压缩器', () => {
			const compactor = getCompactor('vertical');
			expect(compactor.type).toBe('vertical');
			expect(compactor.allowOverlap).toBe(false);
		});

		it('返回水平压缩器', () => {
			const compactor = getCompactor('horizontal');
			expect(compactor.type).toBe('horizontal');
			expect(compactor.allowOverlap).toBe(false);
		});

		it('返回无压缩器', () => {
			const compactor = getCompactor(null);
			expect(compactor.type).toBeNull();
			expect(compactor.allowOverlap).toBe(false);
		});

		it('返回允许重叠的垂直压缩器', () => {
			const compactor = getCompactor('vertical', true);
			expect(compactor.type).toBe('vertical');
			expect(compactor.allowOverlap).toBe(true);
		});

		it('返回允许重叠的水平压缩器', () => {
			const compactor = getCompactor('horizontal', true);
			expect(compactor.type).toBe('horizontal');
			expect(compactor.allowOverlap).toBe(true);
		});

		it('返回允许重叠的无压缩器', () => {
			const compactor = getCompactor(null, true);
			expect(compactor.type).toBeNull();
			expect(compactor.allowOverlap).toBe(true);
		});

		it('设置 preventCollision', () => {
			const compactor = getCompactor('vertical', false, true);
			expect(compactor.preventCollision).toBe(true);
		});

		it('默认不设置 preventCollision', () => {
			const compactor = getCompactor('vertical');
			expect(compactor.preventCollision).toBeUndefined();
		});
	});

	describe('compactItemVertical', () => {
		it('向上移动元素', () => {
			const compareWith: LayoutItem[] = [];
			const item = createItem({ i: '1', x: 0, y: 5, w: 2, h: 2 });
			const compacted = compactItemVertical(compareWith, item, [], 10);
			expect(compacted.y).toBe(0);
		});

		it('遇到碰撞时停止', () => {
			const compareWith = [createItem({ i: '1', x: 0, y: 0, w: 2, h: 2 })];
			const item = createItem({ i: '2', x: 0, y: 5, w: 2, h: 2 });
			const compacted = compactItemVertical(compareWith, item, [], 10);
			expect(compacted.y).toBe(2);
		});

		it('修正负坐标', () => {
			const compareWith: LayoutItem[] = [];
			const item = createItem({ i: '1', x: -5, y: -5, w: 2, h: 2 });
			const compacted = compactItemVertical(compareWith, item, [], 10);
			expect(compacted.x).toBeGreaterThanOrEqual(0);
			expect(compacted.y).toBeGreaterThanOrEqual(0);
		});
	});

	describe('compactItemHorizontal', () => {
		it('向左移动元素', () => {
			const compareWith: LayoutItem[] = [];
			const item = createItem({ i: '1', x: 5, y: 0, w: 2, h: 2 });
			const compacted = compactItemHorizontal(compareWith, item, 12, []);
			expect(compacted.x).toBe(0);
		});

		it('遇到碰撞时停止', () => {
			const compareWith = [createItem({ i: '1', x: 0, y: 0, w: 2, h: 2 })];
			const item = createItem({ i: '2', x: 5, y: 0, w: 2, h: 2 });
			const compacted = compactItemHorizontal(compareWith, item, 12, []);
			expect(compacted.x).toBe(2);
		});

		it('溢出时换行', () => {
			const compareWith = [createItem({ i: '1', x: 0, y: 0, w: 10, h: 2 })];
			const item = createItem({ i: '2', x: 5, y: 0, w: 4, h: 2 });
			const compacted = compactItemHorizontal(compareWith, item, 12, []);
			// 应该换行到下一行
			expect(compacted.y).toBeGreaterThan(0);
		});
	});

	describe('resolveCompactionCollision', () => {
		it('解决碰撞', () => {
			const layout = [
				createItem({ i: '1', x: 0, y: 0, w: 2, h: 2 }),
				createItem({ i: '2', x: 0, y: 3, w: 2, h: 2 }),
			];
			resolveCompactionCollision(layout, itemAt(layout, 0), 5, 'y');
			expect(itemAt(layout, 0).y).toBe(5);
		});

		it('处理静态元素', () => {
			const layout = [
				createItem({ i: '1', x: 0, y: 0, w: 2, h: 2 }),
				createItem({ i: '2', x: 0, y: 3, w: 2, h: 2, static: true }),
			];
			resolveCompactionCollision(layout, itemAt(layout, 0), 5, 'y');
			expect(itemAt(layout, 0).y).toBe(5);
		});
	});
});
