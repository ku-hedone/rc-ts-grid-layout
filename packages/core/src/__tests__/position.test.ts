import { describe, expect, it } from 'vitest';
import {
	absoluteStrategy,
	createScaledStrategy,
	defaultPositionStrategy,
	perc,
	resizeItemInDirection,
	setTopLeft,
	setTransform,
	transformStrategy,
} from '../position';
import type { Position, ResizeHandleAxis } from '../type';

const position: Position = {
	left: 10,
	top: 20,
	width: 100,
	height: 80,
};

describe('position', () => {
	describe('style helpers', () => {
		it('creates transform based absolute styles', () => {
			expect(setTransform(position)).toEqual({
				transform: 'translate(10px,20px)',
				WebkitTransform: 'translate(10px,20px)',
				MozTransform: 'translate(10px,20px)',
				msTransform: 'translate(10px,20px)',
				OTransform: 'translate(10px,20px)',
				width: '100px',
				height: '80px',
				position: 'absolute',
			});
		});

		it('creates top/left based absolute styles', () => {
			expect(setTopLeft(position)).toEqual({
				top: '20px',
				left: '10px',
				width: '100px',
				height: '80px',
				position: 'absolute',
			});
		});

		it('formats percentages', () => {
			expect(perc(0)).toBe('0%');
			expect(perc(0.5)).toBe('50%');
			expect(perc(1.25)).toBe('125%');
		});
	});

	describe('resizeItemInDirection', () => {
		const current: Position = {
			left: 20,
			top: 50,
			width: 100,
			height: 80,
		};

		const resized: Position = {
			left: 20,
			top: 50,
			width: 110,
			height: 90,
		};

		it.each<{
			direction: ResizeHandleAxis;
			expected: Position;
		}>([
			{ direction: 'n', expected: { left: 20, top: 40, width: 110, height: 90 } },
			{ direction: 'ne', expected: { left: 20, top: 40, width: 110, height: 90 } },
			{ direction: 'e', expected: { left: 20, top: 50, width: 110, height: 90 } },
			{ direction: 'se', expected: { left: 20, top: 50, width: 110, height: 90 } },
			{ direction: 's', expected: { left: 20, top: 50, width: 110, height: 90 } },
			{ direction: 'sw', expected: { left: 10, top: 50, width: 110, height: 90 } },
			{ direction: 'w', expected: { left: 10, top: 50, width: 110, height: 90 } },
			{ direction: 'nw', expected: { left: 10, top: 40, width: 110, height: 90 } },
		])('resizes from the $direction handle', ({ direction, expected }) => {
			expect(resizeItemInDirection(direction, current, resized, 200)).toEqual(expected);
		});

		it('keeps north resize within the top boundary', () => {
			expect(
				resizeItemInDirection(
					'n',
					current,
					{
						...resized,
						height: 160,
					},
					200,
				),
			).toEqual({
				left: 20,
				top: 0,
				width: 110,
				height: 80,
			});
		});

		it('keeps east resize within the container width', () => {
			expect(
				resizeItemInDirection(
					'e',
					current,
					{
						...resized,
						left: -5,
						width: 190,
					},
					180,
				),
			).toEqual({
				left: 0,
				top: 50,
				width: 100,
				height: 90,
			});
		});

		it('keeps west resize within the left boundary', () => {
			expect(
				resizeItemInDirection(
					'w',
					current,
					{
						...resized,
						width: 140,
					},
					200,
				),
			).toEqual({
				left: 0,
				top: 50,
				width: 120,
				height: 90,
			});
		});

		it('keeps south resize within the top boundary', () => {
			expect(
				resizeItemInDirection(
					's',
					current,
					{
						...resized,
						top: -5,
					},
					200,
				),
			).toEqual({
				left: 20,
				top: 0,
				width: 110,
				height: 80,
			});
		});

		it('returns the requested size for an unknown handle', () => {
			const unknown = 'center' as ResizeHandleAxis;

			expect(resizeItemInDirection(unknown, current, resized, 200)).toBe(resized);
		});
	});

	describe('position strategies', () => {
		it('exposes transform and absolute strategies', () => {
			expect(transformStrategy.type).toBe('transform');
			expect(transformStrategy.scale).toBe(1);
			expect(transformStrategy.calcStyle(position)).toEqual(setTransform(position));

			expect(absoluteStrategy.type).toBe('absolute');
			expect(absoluteStrategy.scale).toBe(1);
			expect(absoluteStrategy.calcStyle(position)).toEqual(setTopLeft(position));
		});

		it('creates scaled transform strategies', () => {
			const scaled = createScaledStrategy(0.5);

			expect(scaled.type).toBe('transform');
			expect(scaled.scale).toBe(0.5);
			expect(scaled.calcStyle(position)).toEqual(setTransform(position));
			expect(scaled.calcDragPosition?.(110, 80, 10, 20)).toEqual({
				left: 200,
				top: 120,
			});
		});

		it('uses the transform strategy by default', () => {
			expect(defaultPositionStrategy).toBe(transformStrategy);
		});
	});
});
