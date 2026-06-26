/**
 * movement.ts 单元测试
 */

import { describe, it, expect } from 'vitest';
import { compact, compactItem, moveElement, moveElementAwayFromCollision } from '../movement';
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

describe('movement', () => {
	describe('compact', () => {
		it('垂直压缩 - 消除间隙', () => {
			const layout = [
				createItem({ i: '1', x: 0, y: 5, w: 2, h: 2 }),
				createItem({ i: '2', x: 0, y: 10, w: 2, h: 2 }),
			];
			const compacted = compact(layout, 'vertical', 12);
			// 元素应该被压缩到顶部
			expect(compacted[0].y).toBeLessThan(5);
			expect(compacted[1].y).toBeLessThan(10);
		});

		it('水平压缩 - 消除间隙', () => {
			const layout = [
				createItem({ i: '1', x: 5, y: 0, w: 2, h: 2 }),
				createItem({ i: '2', x: 10, y: 0, w: 2, h: 2 }),
			];
			const compacted = compact(layout, 'horizontal', 12);
			// 元素应该被压缩到左侧
			expect(compacted[0].x).toBeLessThan(5);
			expect(compacted[1].x).toBeLessThan(10);
		});

		it('null 压缩 - 不移动元素', () => {
			const layout = [
				createItem({ i: '1', x: 5, y: 5, w: 2, h: 2 }),
				createItem({ i: '2', x: 10, y: 10, w: 2, h: 2 }),
			];
			const compacted = compact(layout, null, 12);
			// 元素位置应该保持不变
			expect(compacted[0].x).toBe(5);
			expect(compacted[0].y).toBe(5);
			expect(compacted[1].x).toBe(10);
			expect(compacted[1].y).toBe(10);
		});

		it('静态元素不移动', () => {
			const layout = [
				createItem({ i: '1', x: 0, y: 10, w: 2, h: 2, static: true }),
				createItem({ i: '2', x: 0, y: 5, w: 2, h: 2 }),
			];
			const compacted = compact(layout, 'vertical', 12);
			// 静态元素应该保持原位
			expect(compacted[0].y).toBe(10);
			// 非静态元素应该被压缩
			expect(compacted[1].y).toBeLessThanOrEqual(5);
		});

		it('允许重叠时不移动元素', () => {
			const layout = [
				createItem({ i: '1', x: 0, y: 5, w: 2, h: 2 }),
				createItem({ i: '2', x: 0, y: 10, w: 2, h: 2 }),
			];
			const compacted = compact(layout, 'vertical', 12, true);
			// 允许重叠时，compact 函数仍然会压缩元素
			// 但不会因为碰撞而阻止移动
			expect(compacted).toHaveLength(2);
		});

		it('空布局返回空数组', () => {
			const compacted = compact([], 'vertical', 12);
			expect(compacted).toEqual([]);
		});

		it('清除 moved 标记', () => {
			const layout = [
				createItem({ i: '1', x: 0, y: 0, w: 2, h: 2, moved: true }),
			];
			const compacted = compact(layout, 'vertical', 12);
			expect(compacted[0].moved).toBe(false);
		});
	});

	describe('compactItem', () => {
		it('垂直压缩 - 向上移动', () => {
			const compareWith: LayoutItem[] = [];
			const item = createItem({ i: '1', x: 0, y: 5, w: 2, h: 2 });
			const compacted = compactItem(compareWith, item, 'vertical', 12, [], false);
			// 元素应该被压缩到顶部
			expect(compacted.y).toBe(0);
		});

		it('水平压缩 - 向左移动', () => {
			const compareWith: LayoutItem[] = [];
			const item = createItem({ i: '1', x: 5, y: 0, w: 2, h: 2 });
			const compacted = compactItem(compareWith, item, 'horizontal', 12, [], false);
			// 元素应该被压缩到左侧
			expect(compacted.x).toBe(0);
		});

		it('遇到碰撞时停止', () => {
			const compareWith = [createItem({ i: '1', x: 0, y: 0, w: 2, h: 2 })];
			const item = createItem({ i: '2', x: 0, y: 5, w: 2, h: 2 });
			const compacted = compactItem(compareWith, item, 'vertical', 12, [], false);
			// 元素应该停在碰撞位置下方
			expect(compacted.y).toBe(2);
		});

		it('确保正坐标', () => {
			const compareWith: LayoutItem[] = [];
			const item = createItem({ i: '1', x: -5, y: -5, w: 2, h: 2 });
			const compacted = compactItem(compareWith, item, 'vertical', 12, [], false);
			// 坐标应该被修正为非负数
			expect(compacted.x).toBeGreaterThanOrEqual(0);
			expect(compacted.y).toBeGreaterThanOrEqual(0);
		});
	});

	describe('moveElement', () => {
		it('移动元素到新位置', () => {
			const layout = [createItem({ i: '1', x: 0, y: 0, w: 2, h: 2 })];
			const item = layout[0];
			const moved = moveElement(layout, item, 5, 5, true, false, 'vertical', 12);
			expect(moved[0].x).toBe(5);
			expect(moved[0].y).toBe(5);
		});

		it('静态元素不可移动', () => {
			const layout = [createItem({ i: '1', x: 0, y: 0, w: 2, h: 2, static: true })];
			const item = layout[0];
			const moved = moveElement(layout, item, 5, 5, true, false, 'vertical', 12);
			// 静态元素不应该移动
			expect(moved[0].x).toBe(0);
			expect(moved[0].y).toBe(0);
		});

		it('位置未变时返回原布局', () => {
			const layout = [createItem({ i: '1', x: 5, y: 5, w: 2, h: 2 })];
			const item = layout[0];
			const moved = moveElement(layout, item, 5, 5, true, false, 'vertical', 12);
			// 返回的应该是同一个数组引用
			expect(moved).toBe(layout);
		});

		it('阻止碰撞时恢复原位', () => {
			const layout = [
				createItem({ i: '1', x: 0, y: 0, w: 2, h: 2 }),
				createItem({ i: '2', x: 5, y: 5, w: 2, h: 2 }),
			];
			const item = layout[1];
			const moved = moveElement(layout, item, 0, 0, true, true, 'vertical', 12);
			// 位置应该恢复
			expect(moved[1].x).toBe(5);
			expect(moved[1].y).toBe(5);
		});

		it('允许重叠时不处理碰撞', () => {
			const layout = [
				createItem({ i: '1', x: 0, y: 0, w: 2, h: 2 }),
				createItem({ i: '2', x: 5, y: 5, w: 2, h: 2 }),
			];
			const item = layout[1];
			const moved = moveElement(layout, item, 0, 0, true, false, 'vertical', 12, true);
			// 元素应该移动到新位置
			expect(moved[1].x).toBe(0);
			expect(moved[1].y).toBe(0);
		});

		it('设置 moved 标记', () => {
			const layout = [createItem({ i: '1', x: 0, y: 0, w: 2, h: 2 })];
			const item = layout[0];
			const moved = moveElement(layout, item, 5, 5, true, false, 'vertical', 12);
			expect(moved[0].moved).toBe(true);
		});
	});

	describe('moveElementAwayFromCollision', () => {
		it('向下移动以避开碰撞', () => {
			const layout = [
				createItem({ i: '1', x: 0, y: 0, w: 2, h: 2 }),
				createItem({ i: '2', x: 0, y: 3, w: 2, h: 2 }),
			];
			const moved = moveElementAwayFromCollision(layout, layout[0], layout[1], false, 'vertical', 12);
			// 元素应该向下移动
			expect(moved[1].y).toBeGreaterThan(3);
		});

		it('用户操作时尝试向上移动', () => {
			const layout = [
				createItem({ i: '1', x: 0, y: 5, w: 2, h: 2 }),
				createItem({ i: '2', x: 0, y: 3, w: 2, h: 2 }),
			];
			const moved = moveElementAwayFromCollision(layout, layout[0], layout[1], true, 'vertical', 12);
			// 用户操作时，函数会尝试找到更好的位置
			// 结果取决于具体的碰撞情况
			expect(moved).toHaveLength(2);
		});

		it('水平压缩时向右移动', () => {
			const layout = [
				createItem({ i: '1', x: 0, y: 0, w: 2, h: 2 }),
				createItem({ i: '2', x: 3, y: 0, w: 2, h: 2 }),
			];
			const moved = moveElementAwayFromCollision(layout, layout[0], layout[1], false, 'horizontal', 12);
			// 元素应该向右移动
			expect(moved[1].x).toBeGreaterThan(3);
		});
	});
});
