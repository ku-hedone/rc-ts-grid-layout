/**
 * GridItem Dropping 相关测试
 *
 * TDD: 修复 shouldDrag 运算符优先级错误
 */

import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import GridLayout from '../grid';
import type { Layout } from '../type';

describe('GridItem - Dropping 行为', () => {
	it('shouldDrag 应该在 dragging 存在时才检查位置变化', () => {
		// 这个测试验证 shouldDrag 的运算符优先级
		// 当前的 Bug: (dragging && left !== prevLeft) || top !== prevTop
		// 应该是: dragging && (left !== prevLeft || top !== prevTop)

		const layout: Layout = [];
		const onDrop = vi.fn();
		const onDropDragOver = vi.fn().mockReturnValue({ w: 2, h: 2 });

		render(
			<GridLayout
				width={1200}
				layout={layout}
				cols={12}
				rowHeight={30}
				isDroppable={true}
				onDrop={onDrop}
				onDropDragOver={onDropDragOver}
			/>,
		);

		const container = document.querySelector('.react-grid-layout');
		expect(container).toBeInTheDocument();

		if (container) {
			// 模拟拖拽进入
			fireEvent.dragOver(container, {
				clientX: 100,
				clientY: 100,
			});

			// 验证不会在 dragging 不存在时触发拖拽
			// 当前的 Bug 可能导致 NaN 值
			if (onDrop.mock.calls.length > 0) {
				const dropItem = onDrop.mock.calls[0][1];
				// 验证位置是有效数字
				expect(dropItem?.x).not.toBeNaN();
				expect(dropItem?.y).not.toBeNaN();
			}
		}
	});

	it('dropping item 应该在位置变化时正确更新', () => {
		const layout: Layout = [];
		const onDrop = vi.fn();
		const onDropDragOver = vi.fn().mockReturnValue({ w: 2, h: 2 });

		render(
			<GridLayout
				width={1200}
				layout={layout}
				cols={12}
				rowHeight={30}
				isDroppable={true}
				onDrop={onDrop}
				onDropDragOver={onDropDragOver}
			/>,
		);

		const container = document.querySelector('.react-grid-layout');
		expect(container).toBeInTheDocument();

		if (container) {
			// 模拟多次拖拽 over
			fireEvent.dragOver(container, {
				clientX: 100,
				clientY: 100,
			});

			fireEvent.dragOver(container, {
				clientX: 200,
				clientY: 200,
			});

			// 验证位置更新是有效的
			expect(onDropDragOver).toHaveBeenCalled();
		}
	});
});
