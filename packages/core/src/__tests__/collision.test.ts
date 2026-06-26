/**
 * collision.ts 单元测试
 */

import { describe, it, expect } from 'vitest';
import { collides, getFirstCollision, getAllCollisions } from '../collision';
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

describe('collision', () => {
	describe('collides', () => {
		it('同一元素不碰撞', () => {
			const item = createItem({ i: '1' });
			expect(collides(item, item)).toBe(false);
		});

		it('不重叠的元素不碰撞', () => {
			const item1 = createItem({ i: '1', x: 0, y: 0, w: 2, h: 2 });
			const item2 = createItem({ i: '2', x: 3, y: 3, w: 2, h: 2 });
			expect(collides(item1, item2)).toBe(false);
		});

		it('水平不重叠不碰撞', () => {
			const item1 = createItem({ i: '1', x: 0, y: 0, w: 2, h: 2 });
			const item2 = createItem({ i: '2', x: 2, y: 0, w: 2, h: 2 });
			expect(collides(item1, item2)).toBe(false);
		});

		it('垂直不重叠不碰撞', () => {
			const item1 = createItem({ i: '1', x: 0, y: 0, w: 2, h: 2 });
			const item2 = createItem({ i: '2', x: 0, y: 2, w: 2, h: 2 });
			expect(collides(item1, item2)).toBe(false);
		});

		it('重叠的元素碰撞', () => {
			const item1 = createItem({ i: '1', x: 0, y: 0, w: 2, h: 2 });
			const item2 = createItem({ i: '2', x: 1, y: 1, w: 2, h: 2 });
			expect(collides(item1, item2)).toBe(true);
		});

		it('完全重叠碰撞', () => {
			const item1 = createItem({ i: '1', x: 0, y: 0, w: 2, h: 2 });
			const item2 = createItem({ i: '2', x: 0, y: 0, w: 2, h: 2 });
			expect(collides(item1, item2)).toBe(true);
		});

		it('包含关系碰撞', () => {
			const item1 = createItem({ i: '1', x: 0, y: 0, w: 4, h: 4 });
			const item2 = createItem({ i: '2', x: 1, y: 1, w: 2, h: 2 });
			expect(collides(item1, item2)).toBe(true);
		});
	});

	describe('getFirstCollision', () => {
		it('无碰撞时返回 undefined', () => {
			const layout = [
				createItem({ i: '1', x: 0, y: 0, w: 2, h: 2 }),
				createItem({ i: '2', x: 3, y: 3, w: 2, h: 2 }),
			];
			const item = createItem({ i: '3', x: 5, y: 5, w: 1, h: 1 });
			expect(getFirstCollision(layout, item)).toBeUndefined();
		});

		it('返回第一个碰撞的元素', () => {
			const layout = [
				createItem({ i: '1', x: 0, y: 0, w: 2, h: 2 }),
				createItem({ i: '2', x: 3, y: 3, w: 2, h: 2 }),
			];
			const item = createItem({ i: '3', x: 1, y: 1, w: 2, h: 2 });
			const collision = getFirstCollision(layout, item);
			expect(collision).toBeDefined();
			expect(collision?.i).toBe('1');
		});

		it('空布局返回 undefined', () => {
			const item = createItem({ i: '1', x: 0, y: 0, w: 1, h: 1 });
			expect(getFirstCollision([], item)).toBeUndefined();
		});
	});

	describe('getAllCollisions', () => {
		it('无碰撞时返回空数组', () => {
			const layout = [
				createItem({ i: '1', x: 0, y: 0, w: 2, h: 2 }),
				createItem({ i: '2', x: 5, y: 5, w: 2, h: 2 }),
			];
			const item = createItem({ i: '3', x: 10, y: 10, w: 1, h: 1 });
			expect(getAllCollisions(layout, item)).toEqual([]);
		});

		it('返回所有碰撞的元素', () => {
			const layout = [
				createItem({ i: '1', x: 0, y: 0, w: 3, h: 3 }),
				createItem({ i: '2', x: 2, y: 2, w: 3, h: 3 }),
				createItem({ i: '3', x: 5, y: 5, w: 2, h: 2 }),
			];
			const item = createItem({ i: '4', x: 1, y: 1, w: 2, h: 2 });
			const collisions = getAllCollisions(layout, item);
			expect(collisions).toHaveLength(2);
			expect(collisions.map((c) => c.i)).toContain('1');
			expect(collisions.map((c) => c.i)).toContain('2');
		});

		it('空布局返回空数组', () => {
			const item = createItem({ i: '1', x: 0, y: 0, w: 1, h: 1 });
			expect(getAllCollisions([], item)).toEqual([]);
		});
	});
});
