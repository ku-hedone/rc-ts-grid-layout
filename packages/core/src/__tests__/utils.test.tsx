import { describe, expect, it, vi } from 'vitest';
import { deepEqual } from '../equals';
import {
	childrenEqual,
	compactType,
	fastGridItemPropsEqual,
	fastPositionEqual,
	fastRGLPropsEqual,
	getIndentationValue,
	noop,
} from '../utils';
import type { Layout, Position } from '../type';

const layout: Layout = [{ i: 'a', x: 0, y: 0, w: 1, h: 1 }];

describe('utils', () => {
	describe('childrenEqual', () => {
		it('compares children by key order and data-grid props', () => {
			const first = [
				<div key="a" data-grid={{ x: 0, y: 0, w: 1, h: 1 }} />,
				<div key="b" data-grid={{ x: 1, y: 0, w: 1, h: 1, static: true }} />,
			];
			const same = [
				<div key="a" data-grid={{ x: 0, y: 0, w: 1, h: 1 }} />,
				<div key="b" data-grid={{ x: 1, y: 0, w: 1, h: 1, static: true }} />,
			];

			expect(childrenEqual(first, same)).toBe(true);
			expect(childrenEqual(first, [same[1], same[0]])).toBe(false);
			expect(
				childrenEqual(first, [
					<div key="a" data-grid={{ x: 0, y: 0, w: 1, h: 1 }} />,
					<div key="b" data-grid={{ x: 1, y: 0, w: 1, h: 1, static: false }} />,
				]),
			).toBe(false);
		});
	});

	describe('fastRGLPropsEqual', () => {
		const onLayoutChange = vi.fn();
		const onDragStart = vi.fn();
		const onDrag = vi.fn();
		const onDragStop = vi.fn();
		const onResizeStart = vi.fn();
		const onResize = vi.fn();
		const onResizeStop = vi.fn();
		const onDrop = vi.fn();
		const innerRef = { current: null };

		const baseProps: Record<string, unknown> = {
			width: 1200,
			cols: 12,
			rowHeight: 30,
			maxRows: Infinity,
			transformScale: 1,
			className: 'grid',
			draggableCancel: '.cancel',
			draggableHandle: '.handle',
			compactType: 'vertical',
			verticalCompact: true,
			autoSize: true,
			isBounded: false,
			isDraggable: true,
			isResizable: true,
			allowOverlap: false,
			preventCollision: false,
			useCSSTransforms: true,
			isDroppable: false,
			onLayoutChange,
			onDragStart,
			onDrag,
			onDragStop,
			onResizeStart,
			onResize,
			onResizeStop,
			onDrop,
			resizeHandles: ['se'],
			layout,
			margin: [10, 10],
			resizeHandle: undefined,
			style: { color: 'red' },
			containerPadding: [10, 10],
			droppingItem: { i: '__dropping-elem__', w: 1, h: 1 },
			innerRef,
			wrapperProps: { className: 'item-wrapper' },
		};

		it('short-circuits identical references', () => {
			expect(
				fastRGLPropsEqual(baseProps, baseProps, () => {
					throw new Error('Should not compare fields for identical references');
				}),
			).toBe(true);
		});

		it('compares scalar fields by identity and structured fields deeply', () => {
			expect(
				fastRGLPropsEqual(
					baseProps,
					{
						...baseProps,
						resizeHandles: ['se'],
						layout: [{ i: 'a', x: 0, y: 0, w: 1, h: 1 }],
						margin: [10, 10],
						style: { color: 'red' },
						containerPadding: [10, 10],
						droppingItem: { i: '__dropping-elem__', w: 1, h: 1 },
						wrapperProps: { className: 'item-wrapper' },
					},
					deepEqual,
				),
			).toBe(true);

			expect(
				fastRGLPropsEqual(
					baseProps,
					{
						...baseProps,
						width: 800,
					},
					deepEqual,
				),
			).toBe(false);
			expect(
				fastRGLPropsEqual(
					baseProps,
					{
						...baseProps,
						style: { color: 'blue' },
					},
					deepEqual,
				),
			).toBe(false);
		});
	});

	describe('fastPositionEqual', () => {
		const base: Position = { left: 1, top: 2, width: 3, height: 4 };

		it('compares all position fields', () => {
			expect(fastPositionEqual(base, { left: 1, top: 2, width: 3, height: 4 })).toBe(true);
			expect(fastPositionEqual(base, { left: 1, top: 2, width: 4, height: 4 })).toBe(false);
		});
	});

	describe('compactType', () => {
		it('maps legacy verticalCompact=false to null', () => {
			expect(compactType({ verticalCompact: false, compactType: 'vertical' })).toBeNull();
			expect(compactType({ verticalCompact: true, compactType: 'horizontal' })).toBe(
				'horizontal',
			);
			expect(compactType()).toBeUndefined();
		});
	});

	describe('noop', () => {
		it('returns undefined', () => {
			expect(noop()).toBeUndefined();
		});
	});

	describe('getIndentationValue', () => {
		it('reads tuple values directly or from breakpoint maps', () => {
			expect(getIndentationValue([8, 12], 'lg')).toEqual([8, 12]);
			expect(
				getIndentationValue(
					{
						lg: [10, 10],
						sm: [4, 4],
					},
					'sm',
				),
			).toEqual([4, 4]);
			expect(getIndentationValue(undefined, 'lg')).toBeUndefined();
		});
	});

	describe('fastGridItemPropsEqual', () => {
		const onDragStart = vi.fn();
		const onDrag = vi.fn();
		const onDragStop = vi.fn();
		const onResizeStart = vi.fn();
		const onResize = vi.fn();
		const onResizeStop = vi.fn();
		const child = <div>item</div>;
		const style = { color: 'red' };
		const wrapperProps = { className: 'wrapper' };
		const resizeHandle = <span />;

		const baseProps: Record<string, unknown> = {
			children: child,
			style,
			wrapperProps,
			resizeHandle,
			droppingPosition: { left: 1, top: 2, e: {} },
			onDragStart,
			onDrag,
			onDragStop,
			onResizeStart,
			onResize,
			onResizeStop,
			x: 0,
			y: 1,
			w: 2,
			h: 3,
			minH: 1,
			maxH: 5,
			minW: 1,
			maxW: 6,
			cols: 12,
			rowHeight: 30,
			maxRows: Infinity,
			containerWidth: 1200,
			transformScale: 1,
			isDraggable: true,
			isResizable: true,
			isBounded: false,
			static: false,
			useCSSTransforms: true,
			usePercentages: false,
			i: 'a',
			className: 'item',
			cancel: '.cancel',
			handle: '.handle',
			resizeHandles: ['se'],
			containerPadding: [10, 10],
			margin: [10, 10],
		};

		it('short-circuits identical references', () => {
			expect(
				fastGridItemPropsEqual(baseProps, baseProps, () => {
					throw new Error('Should not compare fields for identical references');
				}),
			).toBe(true);
		});

		it('compares item props and treats equal dropping coordinates as equal', () => {
			expect(
				fastGridItemPropsEqual(
					baseProps,
					{
						...baseProps,
						droppingPosition: { left: 1, top: 2, e: { type: 'dragover' } },
						resizeHandles: ['se'],
						containerPadding: [10, 10],
						margin: [10, 10],
					},
					deepEqual,
				),
			).toBe(true);

			expect(
				fastGridItemPropsEqual(
					baseProps,
					{
						...baseProps,
						droppingPosition: { left: 1, top: 3, e: {} },
					},
					deepEqual,
				),
			).toBe(false);
			expect(
				fastGridItemPropsEqual(
					baseProps,
					{
						...baseProps,
						useCSSTransforms: false,
					},
					deepEqual,
				),
			).toBe(false);
			expect(
				fastGridItemPropsEqual(
					baseProps,
					{
						...baseProps,
						resizeHandles: ['s'],
					},
					deepEqual,
				),
			).toBe(false);
		});

		it('detects missing dropping positions', () => {
			expect(
				fastGridItemPropsEqual(
					{
						...baseProps,
						droppingPosition: undefined,
					},
					{
						...baseProps,
						droppingPosition: undefined,
					},
					deepEqual,
				),
			).toBe(true);

			expect(
				fastGridItemPropsEqual(
					{
						...baseProps,
						droppingPosition: undefined,
					},
					baseProps,
					deepEqual,
				),
			).toBe(false);
		});
	});
});
