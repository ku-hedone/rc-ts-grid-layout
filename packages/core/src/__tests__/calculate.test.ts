/**
 * calculate.ts 单元测试
 */

import { describe, it, expect } from 'vitest';
import {
	calcGridColWidth,
	calcGridItemWHPx,
	calcXY,
	calcWH,
	calcXYRaw,
	calcWHRaw,
	clamp,
	calcGridCellDimensions,
} from '../calculate';

describe('calculate', () => {
	describe('calcGridColWidth', () => {
		it('计算列宽', () => {
			const params = {
				containerWidth: 1200,
				cols: 12,
				margin: [10, 10] as [number, number],
				containerPadding: [10, 10] as [number, number],
				rowHeight: 30,
				maxRows: Infinity,
			};
			const colWidth = calcGridColWidth(params);
			// (1200 - 10 * 11 - 10 * 2) / 12 = (1200 - 110 - 20) / 12 = 1070 / 12 ≈ 89.17
			expect(colWidth).toBeCloseTo(89.17, 1);
		});

		it('无内边距时使用 margin', () => {
			const params = {
				containerWidth: 1200,
				cols: 12,
				margin: [10, 10] as [number, number],
				containerPadding: undefined as any,
				rowHeight: 30,
				maxRows: Infinity,
			};
			const colWidth = calcGridColWidth(params);
			expect(colWidth).toBeCloseTo(89.17, 1);
		});
	});

	describe('calcGridItemWHPx', () => {
		it('计算宽度像素', () => {
			const width = calcGridItemWHPx(2, 100, 10);
			// 100 * 2 + 10 * 1 = 210
			expect(width).toBe(210);
		});

		it('计算高度像素', () => {
			const height = calcGridItemWHPx(3, 30, 10);
			// 30 * 3 + 10 * 2 = 110
			expect(height).toBe(110);
		});

		it('单个单位无边距', () => {
			const width = calcGridItemWHPx(1, 100, 10);
			// 100 * 1 + 10 * 0 = 100
			expect(width).toBe(100);
		});

		it('Infinity 返回 Infinity', () => {
			const width = calcGridItemWHPx(Infinity, 100, 10);
			expect(width).toBe(Infinity);
		});
	});

	describe('calcXY', () => {
		it('计算网格坐标', () => {
			const params = {
				containerWidth: 1200,
				cols: 12,
				margin: [10, 10] as [number, number],
				containerPadding: [10, 10] as [number, number],
				rowHeight: 30,
				maxRows: 100,
			};
			const { x, y } = calcXY(params, 50, 100, 2, 2);
			expect(x).toBe(1);
			expect(y).toBe(1);
		});

		it('边界限制', () => {
			const params = {
				containerWidth: 1200,
				cols: 12,
				margin: [10, 10] as [number, number],
				containerPadding: [10, 10] as [number, number],
				rowHeight: 30,
				maxRows: 100,
			};
			const { x, y } = calcXY(params, -100, -100, 2, 2);
			expect(x).toBe(0);
			expect(y).toBe(0);
		});
	});

	describe('calcWH', () => {
		it('计算网格尺寸', () => {
			const params = {
				containerWidth: 1200,
				cols: 12,
				margin: [10, 10] as [number, number],
				containerPadding: [10, 10] as [number, number],
				rowHeight: 30,
				maxRows: 100,
			};
			const { w, h } = calcWH(params, 200, 60, 0, 0, 'se');
			expect(w).toBe(2);
			expect(h).toBe(2);
		});

		it('西向把手可扩展到全宽', () => {
			const params = {
				containerWidth: 1200,
				cols: 12,
				margin: [10, 10] as [number, number],
				containerPadding: [10, 10] as [number, number],
				rowHeight: 30,
				maxRows: 100,
			};
			const { w } = calcWH(params, 1200, 30, 0, 0, 'w');
			expect(w).toBeLessThanOrEqual(12);
		});
	});

	describe('calcXYRaw', () => {
		it('不做边界限制', () => {
			const params = {
				containerWidth: 1200,
				cols: 12,
				margin: [10, 10] as [number, number],
				containerPadding: [10, 10] as [number, number],
				rowHeight: 30,
				maxRows: 100,
			};
			const { x, y } = calcXYRaw(params, -100, -100);
			expect(x).toBe(-1);
			expect(y).toBe(-3);
		});
	});

	describe('calcWHRaw', () => {
		it('不做边界限制', () => {
			const params = {
				containerWidth: 1200,
				cols: 12,
				margin: [10, 10] as [number, number],
				containerPadding: [10, 10] as [number, number],
				rowHeight: 30,
				maxRows: 100,
			};
			const { w, h } = calcWHRaw(params, 50, 20);
			expect(w).toBe(1);
			expect(h).toBe(1);
		});
	});

	describe('clamp', () => {
		it('值在范围内', () => {
			expect(clamp(5, 0, 10)).toBe(5);
		});

		it('值小于最小值', () => {
			expect(clamp(-5, 0, 10)).toBe(0);
		});

		it('值大于最大值', () => {
			expect(clamp(15, 0, 10)).toBe(10);
		});

		it('边界值', () => {
			expect(clamp(0, 0, 10)).toBe(0);
			expect(clamp(10, 0, 10)).toBe(10);
		});
	});

	describe('calcGridCellDimensions', () => {
		it('计算网格单元尺寸', () => {
			const dims = calcGridCellDimensions({
				width: 1200,
				cols: 12,
				rowHeight: 30,
				margin: [10, 10],
				containerPadding: [10, 10],
			});
			expect(dims.cellWidth).toBeCloseTo(89.17, 1);
			expect(dims.cellHeight).toBe(30);
			expect(dims.offsetX).toBe(10);
			expect(dims.offsetY).toBe(10);
			expect(dims.gapX).toBe(10);
			expect(dims.gapY).toBe(10);
			expect(dims.cols).toBe(12);
			expect(dims.containerWidth).toBe(1200);
		});

		it('无内边距时使用 margin', () => {
			const dims = calcGridCellDimensions({
				width: 1200,
				cols: 12,
				rowHeight: 30,
			});
			expect(dims.offsetX).toBe(10);
			expect(dims.offsetY).toBe(10);
		});
	});
});
