/**
 * layout.ts 单元测试
 */

import { describe, it, expect } from 'vitest';
import {
	bottom,
	cloneLayout,
	cloneLayoutItem,
	modifyLayout,
	withLayoutItem,
	getLayoutItem,
	getStatics,
	correctBounds,
	validateLayout,
} from '../layout';
import { collides } from '../collision';
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

describe('layout', () => {
	describe('bottom', () => {
		it('返回布局的底部坐标', () => {
			const layout = [
				createItem({ i: '1', x: 0, y: 0, w: 2, h: 3 }),
				createItem({ i: '2', x: 0, y: 3, w: 2, h: 2 }),
			];
			expect(bottom(layout)).toBe(5);
		});

		it('空布局返回 0', () => {
			expect(bottom([])).toBe(0);
		});

		it('单个元素', () => {
			const layout = [createItem({ i: '1', x: 0, y: 2, w: 1, h: 3 })];
			expect(bottom(layout)).toBe(5);
		});
	});

	describe('cloneLayout', () => {
		it('克隆布局', () => {
			const layout = [
				createItem({ i: '1', x: 0, y: 0 }),
				createItem({ i: '2', x: 1, y: 1 }),
			];
			const cloned = cloneLayout(layout);
			// cloneLayoutItem 会添加额外的属性，所以只检查核心属性
			expect(itemAt(cloned, 0).i).toBe('1');
			expect(itemAt(cloned, 0).x).toBe(0);
			expect(itemAt(cloned, 1).i).toBe('2');
			expect(itemAt(cloned, 1).x).toBe(1);
			expect(cloned).not.toBe(layout);
		});

		it('深克隆', () => {
			const layout = [createItem({ i: '1', x: 0, y: 0 })];
			const cloned = cloneLayout(layout);
			itemAt(cloned, 0).x = 10;
			expect(itemAt(layout, 0).x).toBe(0);
		});

		it('空布局', () => {
			expect(cloneLayout([])).toEqual([]);
		});
	});

	describe('cloneLayoutItem', () => {
		it('克隆布局项', () => {
			const item = createItem({ i: '1', x: 1, y: 2, w: 3, h: 4 });
			const cloned = cloneLayoutItem(item);
			// cloneLayoutItem 会标准化属性
			expect(cloned.i).toBe('1');
			expect(cloned.x).toBe(1);
			expect(cloned.y).toBe(2);
			expect(cloned.w).toBe(3);
			expect(cloned.h).toBe(4);
			expect(cloned).not.toBe(item);
		});

		it('标准化布尔值', () => {
			const item = createItem({ i: '1', moved: undefined, static: undefined });
			const cloned = cloneLayoutItem(item);
			expect(cloned.moved).toBe(false);
			expect(cloned.static).toBe(false);
		});
	});

	describe('modifyLayout', () => {
		it('替换指定的布局项', () => {
			const layout = [
				createItem({ i: '1', x: 0, y: 0 }),
				createItem({ i: '2', x: 1, y: 1 }),
			];
			const newItem = createItem({ i: '2', x: 5, y: 5 });
			const modified = modifyLayout(layout, newItem);
			expect(itemAt(modified, 1).x).toBe(5);
			expect(itemAt(modified, 1).y).toBe(5);
		});

		it('不修改原布局', () => {
			const layout = [
				createItem({ i: '1', x: 0, y: 0 }),
				createItem({ i: '2', x: 1, y: 1 }),
			];
			const newItem = createItem({ i: '2', x: 5, y: 5 });
			modifyLayout(layout, newItem);
			expect(itemAt(layout, 1).x).toBe(1);
		});
	});

	describe('withLayoutItem', () => {
		it('修改指定的布局项', () => {
			const layout = [
				createItem({ i: '1', x: 0, y: 0 }),
				createItem({ i: '2', x: 1, y: 1 }),
			];
			const [newLayout, item] = withLayoutItem(layout, '2', (item) => ({
				...item,
				x: 10,
			}));
			expect(item?.x).toBe(10);
			expect(itemAt(newLayout, 1).x).toBe(10);
		});

		it('不存在的 ID 返回原布局', () => {
			const layout = [createItem({ i: '1', x: 0, y: 0 })];
			const [newLayout, item] = withLayoutItem(layout, '999', (item) => item);
			expect(item).toBeUndefined();
			expect(newLayout).toEqual(layout);
		});
	});

	describe('getLayoutItem', () => {
		it('根据 ID 获取布局项', () => {
			const layout = [
				createItem({ i: '1', x: 0, y: 0 }),
				createItem({ i: '2', x: 1, y: 1 }),
			];
			const item = getLayoutItem(layout, '2');
			expect(item?.i).toBe('2');
			expect(item?.x).toBe(1);
		});

		it('不存在的 ID 返回 undefined', () => {
			const layout = [createItem({ i: '1', x: 0, y: 0 })];
			expect(getLayoutItem(layout, '999')).toBeUndefined();
		});

		it('空布局返回 undefined', () => {
			expect(getLayoutItem([], '1')).toBeUndefined();
		});
	});

	describe('getStatics', () => {
		it('返回所有静态元素', () => {
			const layout = [
				createItem({ i: '1', x: 0, y: 0, static: true }),
				createItem({ i: '2', x: 1, y: 1, static: false }),
				createItem({ i: '3', x: 2, y: 2, static: true }),
			];
			const statics = getStatics(layout);
			expect(statics).toHaveLength(2);
			expect(statics.map((item) => item.i)).toContain('1');
			expect(statics.map((item) => item.i)).toContain('3');
		});

		it('无静态元素返回空数组', () => {
			const layout = [
				createItem({ i: '1', x: 0, y: 0, static: false }),
				createItem({ i: '2', x: 1, y: 1 }),
			];
			expect(getStatics(layout)).toEqual([]);
		});
	});

	describe('correctBounds', () => {
		it('修正右侧溢出', () => {
			const layout = [createItem({ i: '1', x: 8, y: 0, w: 4 })];
			const corrected = correctBounds(layout, { cols: 10 });
			expect(itemAt(corrected, 0).x).toBe(6);
		});

		it('修正左侧溢出', () => {
			const layout = [createItem({ i: '1', x: -2, y: 0, w: 2 })];
			const corrected = correctBounds(layout, { cols: 10 });
			expect(itemAt(corrected, 0).x).toBe(0);
			expect(itemAt(corrected, 0).w).toBe(10);
		});

		it('静态元素碰撞时下移', () => {
			const layout = [
				createItem({ i: '1', x: 0, y: 0, w: 2, h: 2, static: true }),
				createItem({ i: '2', x: 0, y: 0, w: 2, h: 2, static: true }),
			];
			const corrected = correctBounds(layout, { cols: 10 });
			expect(itemAt(corrected, 0).y).toBe(2);
			expect(itemAt(corrected, 1).y).toBe(0);
			expect(collides(itemAt(corrected, 0), itemAt(corrected, 1))).toBe(false);
		});
	});

	describe('validateLayout', () => {
		it('有效布局不抛出错误', () => {
			const layout = [
				createItem({ i: '1', x: 0, y: 0, w: 2, h: 2 }),
			];
			expect(() => validateLayout(layout)).not.toThrow();
		});

		it('非数组抛出错误', () => {
			expect(() => validateLayout(null as any)).toThrow('must be an array');
		});

		it('x 不是数字抛出错误', () => {
			const layout = [createItem({ i: '1', x: 'invalid' as any, y: 0, w: 2, h: 2 })];
			expect(() => validateLayout(layout)).toThrow();
		});

		it('w 不是数字抛出错误', () => {
			const layout = [createItem({ i: '1', x: 0, y: 0, w: 'invalid' as any, h: 2 })];
			expect(() => validateLayout(layout)).toThrow();
		});
	});
});
