/**
 * GridLayout 拖拽/缩放交互测试
 *
 * 覆盖：拖拽回调顺序、preventCollision、allowOverlap、static 项、缩放回调
 */

import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import GridLayout from '../grid';
import type { Layout } from '../type';

// 辅助函数：获取第一个可拖拽 item 及其 bounding box
function getDraggableItem() {
	const items = document.querySelectorAll<HTMLElement>(
		'.react-grid-item.react-draggable',
	);
	return items[0] ?? null;
}

function simulateDrag(
	element: HTMLElement,
	deltaX: number,
	deltaY: number,
) {
	const box = element.getBoundingClientRect();
	const startX = box.left + box.width / 2;
	const startY = box.top + box.height / 2;

	fireEvent.mouseDown(element, {
		clientX: startX,
		clientY: startY,
	});

	// 分多步移动以触发 onDrag
	const steps = 5;
	for (let i = 1; i <= steps; i++) {
		fireEvent.mouseMove(document, {
			clientX: startX + (deltaX * i) / steps,
			clientY: startY + (deltaY * i) / steps,
		});
	}

	fireEvent.mouseUp(document);
}

function simulateResize(
	element: HTMLElement,
	deltaX: number,
	deltaY: number,
) {
	const handle = element.querySelector<HTMLElement>(
		'.react-resizable-handle',
	);
	if (!handle) throw new Error('Resize handle not found');

	const box = handle.getBoundingClientRect();
	const startX = box.left + box.width / 2;
	const startY = box.top + box.height / 2;

	fireEvent.mouseDown(handle, {
		clientX: startX,
		clientY: startY,
	});

	const steps = 5;
	for (let i = 1; i <= steps; i++) {
		fireEvent.mouseMove(document, {
			clientX: startX + (deltaX * i) / steps,
			clientY: startY + (deltaY * i) / steps,
		});
	}

	fireEvent.mouseUp(document);
}

describe('GridLayout - 拖拽交互', () => {
	it('拖拽触发 onDragStart → onDrag → onDragStop 且回调参数正确', () => {
		const layout: Layout = [
			{ i: '1', x: 0, y: 0, w: 2, h: 2 },
			{ i: '2', x: 5, y: 0, w: 2, h: 2 },
		];
		const onDragStart = vi.fn();
		const onDrag = vi.fn();
		const onDragStop = vi.fn();

		render(
			<GridLayout
				width={1200}
				layout={layout}
				cols={12}
				rowHeight={30}
				onDragStart={onDragStart}
				onDrag={onDrag}
				onDragStop={onDragStop}
			>
				<div key="1">Item 1</div>
				<div key="2">Item 2</div>
			</GridLayout>,
		);

		const item = getDraggableItem();
		expect(item).toBeInTheDocument();

		if (item) {
			simulateDrag(item, 200, 100);

			// onDragStart 应被调用
			expect(onDragStart).toHaveBeenCalled();
			const startArgs = onDragStart.mock.calls[0];
			expect(startArgs?.[1]).toBeDefined(); // oldItem
			expect(startArgs?.[1]?.i).toBe('1');

			// onDrag 应被调用（可能多次）
			expect(onDrag).toHaveBeenCalled();

			// onDragStop 应被调用
			expect(onDragStop).toHaveBeenCalled();
			const stopArgs = onDragStop.mock.calls[0];
			expect(stopArgs?.[1]).toBeDefined(); // oldItem (previousItem)
			expect(stopArgs?.[1]?.i).toBe('1');
			expect(stopArgs?.[2]).toBeDefined(); // newItem
			expect(stopArgs?.[2]?.i).toBe('1');
		}
	});

	it('preventCollision=true 时拖拽不会推移碰撞项', () => {
		// item 1 和 item 2 不重叠，拖拽 item 1 到 item 2 位置时不应推移 item 2
		const layout: Layout = [
			{ i: '1', x: 0, y: 0, w: 2, h: 2 },
			{ i: '2', x: 6, y: 0, w: 2, h: 2 },
		];
		const onDragStop = vi.fn();

		render(
			<GridLayout
				width={1200}
				layout={layout}
				cols={12}
				rowHeight={30}
				preventCollision={true}
				compactType={null}
				onDragStop={onDragStop}
			>
				<div key="1">Item 1</div>
				<div key="2">Item 2</div>
			</GridLayout>,
		);

		const items = document.querySelectorAll<HTMLElement>('.react-grid-item');
		const item1 = items[0];

		if (item1) {
			// 拖拽 item 1 向右到 item 2 的位置附近
			simulateDrag(item1, 600, 0);

			// onDragStop 应被调用
			expect(onDragStop).toHaveBeenCalled();

			if (onDragStop.mock.calls.length > 0) {
				const finalLayout = onDragStop.mock.calls[0]?.[0];
				const item1After = finalLayout?.find(
					(l: { i: string }) => l.i === '1',
				);
				const item2After = finalLayout?.find(
					(l: { i: string }) => l.i === '2',
				);
				// item 2 的位置不应改变（preventCollision 阻止了碰撞推移）
				expect(item2After?.x).toBe(6);
				expect(item2After?.y).toBe(0);
				// item 1 被拖到了 item 2 左侧边界（x=4），不能进入 item 2 空间
				expect(item1After?.x).toBeGreaterThanOrEqual(0);
				expect(item1After?.x).toBeLessThan(6);
				// 最终两个 item 不应重叠
				if (item1After && item2After) {
					const overlap =
						item1After.x < item2After.x + item2After.w &&
						item1After.x + item1After.w > item2After.x &&
						item1After.y < item2After.y + item2After.h &&
						item1After.y + item1After.h > item2After.y;
					expect(overlap).toBe(false);
				}
			}
		}
	});

	it('allowOverlap=true 时拖拽允许 item 重叠', () => {
		const layout: Layout = [
			{ i: '1', x: 0, y: 0, w: 2, h: 2 },
			{ i: '2', x: 5, y: 0, w: 2, h: 2 },
		];
		const onDragStop = vi.fn();

		render(
			<GridLayout
				width={1200}
				layout={layout}
				cols={12}
				rowHeight={30}
				allowOverlap={true}
				onDragStop={onDragStop}
			>
				<div key="1">Item 1</div>
				<div key="2">Item 2</div>
			</GridLayout>,
		);

		const items = document.querySelectorAll<HTMLElement>('.react-grid-item');
		const item1 = items[0];

		if (item1) {
			// 拖拽 item 1 到 item 2 的位置
			simulateDrag(item1, 500, 0);

			// onDragStop 应被调用
			expect(onDragStop).toHaveBeenCalled();

			if (onDragStop.mock.calls.length > 0) {
				const finalLayout = onDragStop.mock.calls[0]?.[0];
				const item1After = finalLayout?.find(
					(l: { i: string }) => l.i === '1',
				);
				const item2After = finalLayout?.find(
					(l: { i: string }) => l.i === '2',
				);
				// allowOverlap=true 时 item 2 保持原位不被推移
				expect(item2After?.x).toBe(5);
				expect(item2After?.y).toBe(0);
				// item 1 被拖到了新位置（x > 0）
				expect(item1After?.x).toBeGreaterThan(0);
			}
		}
	});

	it('static item 不响应拖拽', () => {
		const layout: Layout = [
			{ i: '1', x: 0, y: 0, w: 2, h: 2, static: true },
			{ i: '2', x: 5, y: 0, w: 2, h: 2 },
		];
		const onDragStart = vi.fn();

		render(
			<GridLayout
				width={1200}
				layout={layout}
				cols={12}
				rowHeight={30}
				onDragStart={onDragStart}
			>
				<div key="1">Static Item</div>
				<div key="2">Draggable Item</div>
			</GridLayout>,
		);

		// 找到 static item
		const staticItem = document.querySelector('.react-grid-item.static');
		expect(staticItem).toBeInTheDocument();

		if (staticItem) {
			const box = staticItem.getBoundingClientRect();
			fireEvent.mouseDown(staticItem as HTMLElement, {
				clientX: box.left + box.width / 2,
				clientY: box.top + box.height / 2,
			});
			fireEvent.mouseMove(document, {
				clientX: box.left + box.width / 2 + 100,
				clientY: box.top + box.height / 2 + 50,
			});
			fireEvent.mouseUp(document);

			// onDragStart 不应被调用（static item 不可拖拽）
			expect(onDragStart).not.toHaveBeenCalled();
		}
	});

	it('isDraggable=false 时 item 不响应拖拽', () => {
		const layout: Layout = [
			{ i: '1', x: 0, y: 0, w: 2, h: 2 },
		];
		const onDragStart = vi.fn();

		render(
			<GridLayout
				width={1200}
				layout={layout}
				cols={12}
				rowHeight={30}
				isDraggable={false}
				onDragStart={onDragStart}
			>
				<div key="1">Item 1</div>
			</GridLayout>,
		);

		const item = document.querySelector<HTMLElement>('.react-grid-item');
		expect(item).toBeInTheDocument();
		expect(item).not.toHaveClass('react-draggable');

		if (item) {
			const box = item.getBoundingClientRect();
			fireEvent.mouseDown(item, {
				clientX: box.left + box.width / 2,
				clientY: box.top + box.height / 2,
			});
			fireEvent.mouseMove(document, {
				clientX: box.left + box.width / 2 + 100,
				clientY: box.top + box.height / 2 + 50,
			});
			fireEvent.mouseUp(document);

			expect(onDragStart).not.toHaveBeenCalled();
		}
	});
});

describe('GridLayout - 缩放交互', () => {
	it('缩放触发 onResizeStart → onResize → onResizeStop 且回调参数正确', () => {
		const layout: Layout = [
			{ i: '1', x: 0, y: 0, w: 2, h: 2 },
		];
		const onResizeStart = vi.fn();
		const onResize = vi.fn();
		const onResizeStop = vi.fn();

		render(
			<GridLayout
				width={1200}
				layout={layout}
				cols={12}
				rowHeight={30}
				onResizeStart={onResizeStart}
				onResize={onResize}
				onResizeStop={onResizeStop}
			>
				<div key="1">Item 1</div>
			</GridLayout>,
		);

		const item = document.querySelector<HTMLElement>('.react-grid-item');
		expect(item).toBeInTheDocument();

		if (item) {
			simulateResize(item, 100, 60);

			// onResizeStart 应被调用
			expect(onResizeStart).toHaveBeenCalled();
			const startArgs = onResizeStart.mock.calls[0];
			expect(startArgs?.[1]).toBeDefined(); // oldItem

			// onResize 应被调用（可能多次）
			expect(onResize).toHaveBeenCalled();

			// onResizeStop 应被调用
			expect(onResizeStop).toHaveBeenCalled();
			const stopArgs = onResizeStop.mock.calls[0];
			expect(stopArgs?.[1]).toBeDefined(); // oldItem (previousItem)
			expect(stopArgs?.[1]?.i).toBe('1');
			expect(stopArgs?.[2]).toBeDefined(); // newItem
			expect(stopArgs?.[2]?.i).toBe('1');
		}
	});

	it('preventCollision=true 时缩放碰撞后 item 2 位置不变', () => {
		// item 2 紧邻 item 1 右侧，缩放 item 1 超过 item 2 时应被阻止
		const layout: Layout = [
			{ i: '1', x: 0, y: 0, w: 2, h: 2 },
			{ i: '2', x: 4, y: 0, w: 2, h: 2 },
		];
		const onResizeStop = vi.fn();

		render(
			<GridLayout
				width={1200}
				layout={layout}
				cols={12}
				rowHeight={30}
				preventCollision={true}
				onResizeStop={onResizeStop}
			>
				<div key="1">Item 1</div>
				<div key="2">Item 2</div>
			</GridLayout>,
		);

		const items = document.querySelectorAll<HTMLElement>('.react-grid-item');
		const item1 = items[0];

		if (item1) {
			// 尝试缩放 item 1 越过 item 2
			simulateResize(item1, 300, 0);

			// onResizeStop 应被调用
			expect(onResizeStop).toHaveBeenCalled();

			if (onResizeStop.mock.calls.length > 0) {
				const finalLayout = onResizeStop.mock.calls[0]?.[0];
				const item2After = finalLayout?.find(
					(l: { i: string }) => l.i === '2',
				);
				// item 2 位置不应被推移
				expect(item2After?.x).toBe(4);
				expect(item2After?.y).toBe(0);
			}

			// 验证布局没有崩溃
			expect(document.querySelectorAll('.react-grid-item')).toHaveLength(2);
		}
	});

	it('isResizable=false 时 item 不显示缩放把手', () => {
		render(
			<GridLayout
				width={1200}
				layout={[{ i: '1', x: 0, y: 0, w: 2, h: 2 }]}
				cols={12}
				rowHeight={30}
				isResizable={false}
			>
				<div key="1">Item 1</div>
			</GridLayout>,
		);

		const item = document.querySelector<HTMLElement>('.react-grid-item');
		expect(item).toBeInTheDocument();
		expect(item).toHaveClass('react-resizable-hide');
	});

	it('static item 不显示缩放把手', () => {
		render(
			<GridLayout
				width={1200}
				layout={[{ i: '1', x: 0, y: 0, w: 2, h: 2, static: true }]}
				cols={12}
				rowHeight={30}
			>
				<div key="1">Static Item</div>
			</GridLayout>,
		);

		const item = document.querySelector<HTMLElement>('.react-grid-item.static');
		expect(item).toBeInTheDocument();
		expect(item).toHaveClass('react-resizable-hide');
	});
});
