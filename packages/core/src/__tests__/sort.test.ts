/**
 * sort.ts 单元测试
 */

import { describe, it, expect } from 'vitest';
import { sortLayoutItems, sortLayoutItemsByRowCol, sortLayoutItemsByColRow } from '../sort';
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

describe('sort', () => {
	describe('sortLayoutItemsByRowCol', () => {
		it('按行优先排序', () => {
			const layout = [
				createItem({ i: '3', x: 0, y: 2 }),
				createItem({ i: '1', x: 0, y: 0 }),
				createItem({ i: '2', x: 0, y: 1 }),
			];
			const sorted = sortLayoutItemsByRowCol(layout);
			expect(sorted.map((item) => item.i)).toEqual(['1', '2', '3']);
		});

		it('同行按列排序', () => {
			const layout = [
				createItem({ i: '3', x: 2, y: 0 }),
				createItem({ i: '1', x: 0, y: 0 }),
				createItem({ i: '2', x: 1, y: 0 }),
			];
			const sorted = sortLayoutItemsByRowCol(layout);
			expect(sorted.map((item) => item.i)).toEqual(['1', '2', '3']);
		});

		it('不修改原数组', () => {
			const layout = [
				createItem({ i: '2', x: 0, y: 1 }),
				createItem({ i: '1', x: 0, y: 0 }),
			];
			const original = [...layout];
			sortLayoutItemsByRowCol(layout);
			expect(layout).toEqual(original);
		});

		it('空数组返回空数组', () => {
			expect(sortLayoutItemsByRowCol([])).toEqual([]);
		});
	});

	describe('sortLayoutItemsByColRow', () => {
		it('按列优先排序', () => {
			const layout = [
				createItem({ i: '3', x: 2, y: 0 }),
				createItem({ i: '1', x: 0, y: 0 }),
				createItem({ i: '2', x: 1, y: 0 }),
			];
			const sorted = sortLayoutItemsByColRow(layout);
			expect(sorted.map((item) => item.i)).toEqual(['1', '2', '3']);
		});

		it('同列按行排序', () => {
			const layout = [
				createItem({ i: '3', x: 0, y: 2 }),
				createItem({ i: '1', x: 0, y: 0 }),
				createItem({ i: '2', x: 0, y: 1 }),
			];
			const sorted = sortLayoutItemsByColRow(layout);
			expect(sorted.map((item) => item.i)).toEqual(['1', '2', '3']);
		});

		it('不修改原数组', () => {
			const layout = [
				createItem({ i: '2', x: 1, y: 0 }),
				createItem({ i: '1', x: 0, y: 0 }),
			];
			const original = [...layout];
			sortLayoutItemsByColRow(layout);
			expect(layout).toEqual(original);
		});
	});

	describe('sortLayoutItems', () => {
		it('vertical 模式使用行排序', () => {
			const layout = [
				createItem({ i: '3', x: 0, y: 2 }),
				createItem({ i: '1', x: 0, y: 0 }),
				createItem({ i: '2', x: 0, y: 1 }),
			];
			const sorted = sortLayoutItems(layout, 'vertical');
			expect(sorted.map((item) => item.i)).toEqual(['1', '2', '3']);
		});

		it('horizontal 模式使用列排序', () => {
			const layout = [
				createItem({ i: '3', x: 2, y: 0 }),
				createItem({ i: '1', x: 0, y: 0 }),
				createItem({ i: '2', x: 1, y: 0 }),
			];
			const sorted = sortLayoutItems(layout, 'horizontal');
			expect(sorted.map((item) => item.i)).toEqual(['1', '2', '3']);
		});

		it('null 模式返回原数组', () => {
			const layout = [
				createItem({ i: '2', x: 0, y: 1 }),
				createItem({ i: '1', x: 0, y: 0 }),
			];
			const sorted = sortLayoutItems(layout, null);
			expect(sorted).toEqual(layout);
		});

		it('undefined 模式返回原数组', () => {
			const layout = [
				createItem({ i: '2', x: 0, y: 1 }),
				createItem({ i: '1', x: 0, y: 0 }),
			];
			const sorted = sortLayoutItems(layout, undefined);
			expect(sorted).toEqual(layout);
		});
	});
});
