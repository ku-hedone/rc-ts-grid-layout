/**
 * GridLayout 拖拽相关测试
 *
 * TDD: 修复 onDragStop 回调中 oldItem 被提前清空的 Bug
 */

import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import React from 'react';
import GridLayout from '../grid';
import type { Layout } from '../type';

describe('GridLayout - 拖拽回调', () => {
	it('onDragStop 应该提供拖拽前的 item 信息 (oldItem)', () => {
		const layout: Layout = [
			{ i: '1', x: 0, y: 0, w: 2, h: 2 },
			{ i: '2', x: 5, y: 5, w: 2, h: 2 },
		];
		const onDragStop = vi.fn();

		render(
			<GridLayout
				width={1200}
				layout={layout}
				cols={12}
				rowHeight={30}
				onDragStop={onDragStop}
			>
				<div key="1">Item 1</div>
				<div key="2">Item 2</div>
			</GridLayout>,
		);

		// 获取第一个网格项
		const gridItem = document.querySelector('.react-grid-item');
		expect(gridItem).toBeInTheDocument();

		if (gridItem) {
			const box = gridItem.getBoundingClientRect();

			// 模拟拖拽
			fireEvent.mouseDown(gridItem, {
				clientX: box.left + box.width / 2,
				clientY: box.top + box.height / 2,
			});

			fireEvent.mouseMove(document, {
				clientX: box.left + box.width / 2 + 100,
				clientY: box.top + box.height / 2 + 50,
			});

			fireEvent.mouseUp(document);

			// 验证 onDragStop 被调用
			expect(onDragStop).toHaveBeenCalled();

			if (onDragStop.mock.calls.length > 0) {
				const callArgs = onDragStop.mock.calls[0];
				const [callbackLayout, oldItem, newItem] = callArgs;

				// oldItem 不应该是 undefined
				// 这是当前的 Bug：oldItem 在传给回调前被清空
				expect(oldItem).toBeDefined();
				expect(oldItem?.i).toBe('1');

				// newItem 应该有新的位置
				expect(newItem).toBeDefined();
			}
		}
	});

	it('onResizeStop 应该提供缩放前的 item 信息 (oldItem)', () => {
		const layout: Layout = [
			{ i: '1', x: 0, y: 0, w: 2, h: 2 },
		];
		const onResizeStop = vi.fn();

		render(
			<GridLayout
				width={1200}
				layout={layout}
				cols={12}
				rowHeight={30}
				onResizeStop={onResizeStop}
			>
				<div key="1">Item 1</div>
			</GridLayout>,
		);

		// 获取缩放把手
		const resizeHandle = document.querySelector('.react-resizable-handle');
		expect(resizeHandle).toBeInTheDocument();

		if (resizeHandle) {
			const box = resizeHandle.getBoundingClientRect();

			// 模拟缩放
			fireEvent.mouseDown(resizeHandle, {
				clientX: box.left + box.width / 2,
				clientY: box.top + box.height / 2,
			});

			fireEvent.mouseMove(document, {
				clientX: box.left + box.width / 2 + 50,
				clientY: box.top + box.height / 2 + 50,
			});

			fireEvent.mouseUp(document);

			// 验证 onResizeStop 被调用
			expect(onResizeStop).toHaveBeenCalled();

			if (onResizeStop.mock.calls.length > 0) {
				const callArgs = onResizeStop.mock.calls[0];
				const [callbackLayout, oldItem, newItem] = callArgs;

				// oldItem 不应该是 undefined
				expect(oldItem).toBeDefined();
				expect(oldItem?.i).toBe('1');
			}
		}
	});
});
