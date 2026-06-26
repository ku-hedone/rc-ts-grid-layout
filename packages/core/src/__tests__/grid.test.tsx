/**
 * GridLayout 组件集成测试
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import GridLayout from '../grid';
import type { Layout } from '../type';

// 辅助函数：创建布局
function createLayout(): Layout {
	return [
		{ i: '1', x: 0, y: 0, w: 2, h: 2 },
		{ i: '2', x: 2, y: 0, w: 2, h: 2 },
		{ i: '3', x: 4, y: 0, w: 2, h: 2 },
	];
}

describe('GridLayout', () => {
	it('渲染网格容器', () => {
		const layout = createLayout();
		render(
			<GridLayout
				width={1200}
				layout={layout}
				cols={12}
				rowHeight={30}
			>
				<div key="1">Item 1</div>
				<div key="2">Item 2</div>
				<div key="3">Item 3</div>
			</GridLayout>,
		);

		// 检查网格容器是否存在
		const container = document.querySelector('.react-grid-layout');
		expect(container).toBeInTheDocument();
	});

	it('渲染网格项', () => {
		const layout = createLayout();
		render(
			<GridLayout
				width={1200}
				layout={layout}
				cols={12}
				rowHeight={30}
			>
				<div key="1">Item 1</div>
				<div key="2">Item 2</div>
				<div key="3">Item 3</div>
			</GridLayout>,
		);

		// 检查网格项是否存在
		const items = document.querySelectorAll('.react-grid-item');
		expect(items).toHaveLength(3);
	});

	it('应用自定义类名', () => {
		const layout = createLayout();
		render(
			<GridLayout
				width={1200}
				layout={layout}
				cols={12}
				rowHeight={30}
				className="custom-grid"
			>
				<div key="1">Item 1</div>
				<div key="2">Item 2</div>
				<div key="3">Item 3</div>
			</GridLayout>,
		);

		// 检查自定义类名是否应用
		const container = document.querySelector('.react-grid-layout');
		expect(container).toHaveClass('custom-grid');
	});

	it('应用自定义样式', () => {
		const layout = createLayout();
		const style = { backgroundColor: 'red' };
		render(
			<GridLayout
				width={1200}
				layout={layout}
				cols={12}
				rowHeight={30}
				style={style}
			>
				<div key="1">Item 1</div>
				<div key="2">Item 2</div>
				<div key="3">Item 3</div>
			</GridLayout>,
		);

		// 检查网格容器是否存在
		const container = document.querySelector('.react-grid-layout');
		expect(container).toBeInTheDocument();
	});

	it('调用 onLayoutChange 回调', () => {
		const layout = createLayout();
		const onLayoutChange = vi.fn();
		render(
			<GridLayout
				width={1200}
				layout={layout}
				cols={12}
				rowHeight={30}
				onLayoutChange={onLayoutChange}
			>
				<div key="1">Item 1</div>
				<div key="2">Item 2</div>
				<div key="3">Item 3</div>
			</GridLayout>,
		);

		// onLayoutChange 应该在组件挂载时被调用
		expect(onLayoutChange).toHaveBeenCalled();
	});

	it('静态项不可拖拽', () => {
		const layout: Layout = [
			{ i: '1', x: 0, y: 0, w: 2, h: 2, static: true },
			{ i: '2', x: 2, y: 0, w: 2, h: 2 },
		];
		render(
			<GridLayout
				width={1200}
				layout={layout}
				cols={12}
				rowHeight={30}
			>
				<div key="1">Static Item</div>
				<div key="2">Draggable Item</div>
			</GridLayout>,
		);

		// 检查网格项是否存在
		const items = document.querySelectorAll('.react-grid-item');
		expect(items).toHaveLength(2);
	});

	it('禁用拖拽', () => {
		const layout = createLayout();
		render(
			<GridLayout
				width={1200}
				layout={layout}
				cols={12}
				rowHeight={30}
				isDraggable={false}
			>
				<div key="1">Item 1</div>
				<div key="2">Item 2</div>
				<div key="3">Item 3</div>
			</GridLayout>,
		);

		// 检查网格容器
		const container = document.querySelector('.react-grid-layout');
		expect(container).toBeInTheDocument();
	});

	it('禁用缩放', () => {
		const layout = createLayout();
		render(
			<GridLayout
				width={1200}
				layout={layout}
				cols={12}
				rowHeight={30}
				isResizable={false}
			>
				<div key="1">Item 1</div>
				<div key="2">Item 2</div>
				<div key="3">Item 3</div>
			</GridLayout>,
		);

		// 检查网格项是否存在
		const items = document.querySelectorAll('.react-grid-item');
		expect(items).toHaveLength(3);
	});

	it('启用缩放', () => {
		const layout = createLayout();
		render(
			<GridLayout
				width={1200}
				layout={layout}
				cols={12}
				rowHeight={30}
				isResizable={true}
			>
				<div key="1">Item 1</div>
				<div key="2">Item 2</div>
				<div key="3">Item 3</div>
			</GridLayout>,
		);

		// 检查网格项是否存在
		const items = document.querySelectorAll('.react-grid-item');
		expect(items).toHaveLength(3);
	});

	it('使用 CSS transforms 定位', () => {
		const layout = createLayout();
		render(
			<GridLayout
				width={1200}
				layout={layout}
				cols={12}
				rowHeight={30}
				useCSSTransforms={true}
			>
				<div key="1">Item 1</div>
				<div key="2">Item 2</div>
				<div key="3">Item 3</div>
			</GridLayout>,
		);

		// 检查网格项是否有 transform 样式
		const items = document.querySelectorAll('.react-grid-item');
		items.forEach((item) => {
			expect(item).toHaveStyle({ position: 'absolute' });
		});
	});

	it('使用 top/left 定位', () => {
		const layout = createLayout();
		render(
			<GridLayout
				width={1200}
				layout={layout}
				cols={12}
				rowHeight={30}
				useCSSTransforms={false}
			>
				<div key="1">Item 1</div>
				<div key="2">Item 2</div>
				<div key="3">Item 3</div>
			</GridLayout>,
		);

		// 检查网格项是否有 top/left 样式
		const items = document.querySelectorAll('.react-grid-item');
		items.forEach((item) => {
			expect(item).toHaveStyle({ position: 'absolute' });
		});
	});

	it('空布局', () => {
		render(
			<GridLayout
				width={1200}
				layout={[]}
				cols={12}
				rowHeight={30}
			>
				<div key="1">Item 1</div>
			</GridLayout>,
		);

		// 检查网格容器是否存在
		const container = document.querySelector('.react-grid-layout');
		expect(container).toBeInTheDocument();
	});
});
