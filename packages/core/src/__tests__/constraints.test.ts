/**
 * constraints.ts 单元测试
 */

import { describe, it, expect } from 'vitest';
import {
	gridBounds,
	minMaxSize,
	containerBounds,
	boundedX,
	boundedY,
	aspectRatio,
	snapToGrid,
	minSize,
	maxSize,
	defaultConstraints,
	applyPositionConstraints,
	applySizeConstraints,
} from '../constraints';
import type { LayoutItem, ConstraintContext } from '../type';

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

// 辅助函数：创建约束上下文
function createContext(overrides: Partial<ConstraintContext> = {}): ConstraintContext {
	return {
		cols: 12,
		maxRows: 100,
		containerWidth: 1200,
		containerHeight: 800,
		rowHeight: 30,
		margin: [10, 10],
		layout: [],
		...overrides,
	};
}

describe('constraints', () => {
	describe('gridBounds', () => {
		it('名称正确', () => {
			expect(gridBounds.name).toBe('gridBounds');
		});

		it('约束位置在网格内', () => {
			const item = createItem({ w: 2, h: 2 });
			const context = createContext({ cols: 12, maxRows: 100 });
			const result = gridBounds.constrainPosition!(item, 15, 105, context);
			expect(result.x).toBe(10); // cols - w = 12 - 2 = 10
			expect(result.y).toBe(98); // maxRows - h = 100 - 2 = 98
		});

		it('允许负坐标修正为 0', () => {
			const item = createItem({ w: 2, h: 2 });
			const context = createContext();
			const result = gridBounds.constrainPosition!(item, -5, -10, context);
			expect(result.x).toBe(0);
			expect(result.y).toBe(0);
		});

		it('约束尺寸', () => {
			const item = createItem({ x: 5, y: 5, w: 2, h: 2 });
			const context = createContext({ cols: 12, maxRows: 100 });
			const result = gridBounds.constrainSize!(item, 20, 200, 'se', context);
			expect(result.w).toBe(7); // cols - x = 12 - 5 = 7
			expect(result.h).toBe(95); // maxRows - y = 100 - 5 = 95
		});

		it('西向缩放时宽度受右边缘限制', () => {
			const item = createItem({ x: 5, y: 5, w: 3, h: 3 });
			const context = createContext({ cols: 12, maxRows: 100 });
			const result = gridBounds.constrainSize!(item, 20, 20, 'w', context);
			expect(result.w).toBe(8); // x + w = 5 + 3 = 8
		});
	});

	describe('minMaxSize', () => {
		it('名称正确', () => {
			expect(minMaxSize.name).toBe('minMaxSize');
		});

		it('约束最小尺寸', () => {
			const item = createItem({ minW: 2, minH: 3 });
			const result = minMaxSize.constrainSize!(item, 1, 1, 'se', createContext());
			expect(result.w).toBe(2);
			expect(result.h).toBe(3);
		});

		it('约束最大尺寸', () => {
			const item = createItem({ maxW: 5, maxH: 4 });
			const result = minMaxSize.constrainSize!(item, 10, 10, 'se', createContext());
			expect(result.w).toBe(5);
			expect(result.h).toBe(4);
		});

		it('默认最小值为 1', () => {
			const item = createItem();
			const result = minMaxSize.constrainSize!(item, 0, 0, 'se', createContext());
			expect(result.w).toBe(1);
			expect(result.h).toBe(1);
		});
	});

	describe('containerBounds', () => {
		it('名称正确', () => {
			expect(containerBounds.name).toBe('containerBounds');
		});

		it('根据容器高度约束位置', () => {
			const item = createItem({ w: 2, h: 2 });
			const context = createContext({
				cols: 12,
				maxRows: 100,
				containerHeight: 300,
				rowHeight: 30,
				margin: [10, 10],
			});
			const result = containerBounds.constrainPosition!(item, 5, 100, context);
			// visibleRows = floor((300 + 10) / (30 + 10)) = floor(310 / 40) = 7
			expect(result.y).toBe(5); // 7 - 2 = 5
		});

		it('容器高度为 0 时回退到 maxRows', () => {
			const item = createItem({ w: 2, h: 2 });
			const context = createContext({ maxRows: 100, containerHeight: 0 });
			const result = containerBounds.constrainPosition!(item, 5, 105, context);
			expect(result.y).toBe(98); // maxRows - h = 100 - 2 = 98
		});
	});

	describe('boundedX', () => {
		it('名称正确', () => {
			expect(boundedX.name).toBe('boundedX');
		});

		it('仅约束水平方向', () => {
			const item = createItem({ w: 2, h: 2 });
			const context = createContext({ cols: 12 });
			const result = boundedX.constrainPosition!(item, 15, 105, context);
			expect(result.x).toBe(10); // cols - w = 12 - 2 = 10
			expect(result.y).toBe(105); // 不约束
		});
	});

	describe('boundedY', () => {
		it('名称正确', () => {
			expect(boundedY.name).toBe('boundedY');
		});

		it('仅约束垂直方向', () => {
			const item = createItem({ w: 2, h: 2 });
			const context = createContext({ maxRows: 100 });
			const result = boundedY.constrainPosition!(item, 15, 105, context);
			expect(result.x).toBe(15); // 不约束
			expect(result.y).toBe(98); // maxRows - h = 100 - 2 = 98
		});
	});

	describe('aspectRatio', () => {
		it('创建宽高比约束', () => {
			const constraint = aspectRatio(16 / 9);
			expect(constraint.name).toBe('aspectRatio(1.7777777777777777)');
		});

		it('约束尺寸保持宽高比', () => {
			const constraint = aspectRatio(1); // 正方形
			const item = createItem({ w: 2, h: 2 });
			const context = createContext({
				cols: 12,
				containerWidth: 1200,
				rowHeight: 30,
				margin: [10, 10],
			});
			const result = constraint.constrainSize!(item, 4, 10, 'se', context);
			// 宽度 4 应该对应高度 4（正方形）
			expect(result.w).toBe(4);
			expect(result.h).toBeGreaterThan(0);
		});
	});

	describe('snapToGrid', () => {
		it('创建网格吸附约束', () => {
			const constraint = snapToGrid(2);
			expect(constraint.name).toBe('snapToGrid(2, 2)');
		});

		it('吸附到步长倍数', () => {
			const constraint = snapToGrid(2);
			const item = createItem();
			const result = constraint.constrainPosition!(item, 3, 5, createContext());
			expect(result.x).toBe(4); // round(3/2) * 2 = 2 * 2 = 4
			expect(result.y).toBe(6); // round(5/2) * 2 = 3 * 2 = 6
		});

		it('支持不同的水平和垂直步长', () => {
			const constraint = snapToGrid(2, 3);
			const item = createItem();
			const result = constraint.constrainPosition!(item, 3, 5, createContext());
			expect(result.x).toBe(4); // round(3/2) * 2 = 4
			expect(result.y).toBe(6); // round(5/3) * 3 = 6
		});

		it('步长为 0 时抛出错误', () => {
			expect(() => snapToGrid(0)).toThrow();
		});

		it('步长为负数时抛出错误', () => {
			expect(() => snapToGrid(-1)).toThrow();
		});
	});

	describe('minSize', () => {
		it('创建最小尺寸约束', () => {
			const constraint = minSize(2, 3);
			expect(constraint.name).toBe('minSize(2, 3)');
		});

		it('约束最小尺寸', () => {
			const constraint = minSize(2, 3);
			const item = createItem();
			const result = constraint.constrainSize!(item, 1, 1, 'se', createContext());
			expect(result.w).toBe(2);
			expect(result.h).toBe(3);
		});

		it('不影响大于最小值的尺寸', () => {
			const constraint = minSize(2, 3);
			const item = createItem();
			const result = constraint.constrainSize!(item, 5, 5, 'se', createContext());
			expect(result.w).toBe(5);
			expect(result.h).toBe(5);
		});
	});

	describe('maxSize', () => {
		it('创建最大尺寸约束', () => {
			const constraint = maxSize(5, 4);
			expect(constraint.name).toBe('maxSize(5, 4)');
		});

		it('约束最大尺寸', () => {
			const constraint = maxSize(5, 4);
			const item = createItem();
			const result = constraint.constrainSize!(item, 10, 10, 'se', createContext());
			expect(result.w).toBe(5);
			expect(result.h).toBe(4);
		});

		it('不影响小于最大值的尺寸', () => {
			const constraint = maxSize(5, 4);
			const item = createItem();
			const result = constraint.constrainSize!(item, 2, 2, 'se', createContext());
			expect(result.w).toBe(2);
			expect(result.h).toBe(2);
		});
	});

	describe('defaultConstraints', () => {
		it('包含 gridBounds 和 minMaxSize', () => {
			expect(defaultConstraints).toHaveLength(2);
			expect(defaultConstraints[0].name).toBe('gridBounds');
			expect(defaultConstraints[1].name).toBe('minMaxSize');
		});
	});

	describe('applyPositionConstraints', () => {
		it('应用网格级别约束', () => {
			const constraints = [gridBounds];
			const item = createItem({ w: 2, h: 2 });
			const context = createContext({ cols: 12, maxRows: 100 });
			const result = applyPositionConstraints(constraints, item, 15, 105, context);
			expect(result.x).toBe(10);
			expect(result.y).toBe(98);
		});

		it('应用项级别约束', () => {
			const constraints: any[] = [];
			const item = createItem({
				w: 2,
				h: 2,
				constraints: [boundedX],
			});
			const context = createContext({ cols: 12 });
			const result = applyPositionConstraints(constraints, item, 15, 105, context);
			expect(result.x).toBe(10);
			expect(result.y).toBe(105); // 项级别没有 y 约束
		});

		it('按顺序应用多个约束', () => {
			const constraints = [gridBounds, snapToGrid(2)];
			const item = createItem({ w: 2, h: 2 });
			const context = createContext({ cols: 12, maxRows: 100 });
			const result = applyPositionConstraints(constraints, item, 3, 5, context);
			// 先应用 gridBounds，再应用 snapToGrid
			expect(result.x % 2).toBe(0);
			expect(result.y % 2).toBe(0);
		});
	});

	describe('applySizeConstraints', () => {
		it('应用网格级别约束', () => {
			const constraints = [gridBounds];
			const item = createItem({ x: 5, y: 5, w: 2, h: 2 });
			const context = createContext({ cols: 12, maxRows: 100 });
			const result = applySizeConstraints(constraints, item, 20, 200, 'se', context);
			expect(result.w).toBe(7);
			expect(result.h).toBe(95);
		});

		it('应用项级别约束', () => {
			const constraints: any[] = [];
			const item = createItem({
				w: 2,
				h: 2,
				constraints: [minSize(3, 4)],
			});
			const context = createContext();
			const result = applySizeConstraints(constraints, item, 1, 1, 'se', context);
			expect(result.w).toBe(3);
			expect(result.h).toBe(4);
		});

		it('按顺序应用多个约束', () => {
			const constraints = [minSize(2, 2), maxSize(5, 4)];
			const item = createItem();
			const context = createContext();
			const result = applySizeConstraints(constraints, item, 1, 10, 'se', context);
			// 先应用 minSize，再应用 maxSize
			expect(result.w).toBe(2); // minSize(2, 2) -> 2
			expect(result.h).toBe(4); // maxSize(5, 4) -> 4
		});
	});
});
