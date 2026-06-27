/**
 * GridLayout 组件集成测试
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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

function renderBasicGrid(props: Partial<React.ComponentProps<typeof GridLayout>> = {}) {
	return render(
		<GridLayout
			width={1200}
			layout={createLayout()}
			cols={12}
			rowHeight={30}
			{...props}
		>
			<div key="1">Item 1</div>
			<div key="2">Item 2</div>
			<div key="3">Item 3</div>
		</GridLayout>,
	);
}

function getGridContainer(): HTMLElement {
	const container = document.querySelector('.react-grid-layout');
	expect(container).toBeInTheDocument();
	return container as HTMLElement;
}

function getGridItems(): HTMLElement[] {
	return Array.from(document.querySelectorAll<HTMLElement>('.react-grid-item'));
}

function getGridItemByText(text: string): HTMLElement {
	const item = screen.getByText(text).closest('.react-grid-item');
	if (!(item instanceof HTMLElement)) {
		throw new Error(`Grid item not found for text: ${text}`);
	}
	return item;
}

describe('GridLayout', () => {
	it('渲染网格容器', () => {
		renderBasicGrid();

		const container = getGridContainer();
		expect(container).toHaveClass('react-grid-layout');
	});

	it('渲染网格项', () => {
		renderBasicGrid();

		const items = getGridItems();
		expect(items).toHaveLength(3);
		expect(screen.getByText('Item 1')).toBeInTheDocument();
		expect(screen.getByText('Item 2')).toBeInTheDocument();
		expect(screen.getByText('Item 3')).toBeInTheDocument();
	});

	it('应用自定义类名', () => {
		renderBasicGrid({ className: 'custom-grid' });

		const container = getGridContainer();
		expect(container).toHaveClass('custom-grid');
	});

	it('应用自定义样式', () => {
		const style = { backgroundColor: 'red' };
		renderBasicGrid({ style });

		const container = getGridContainer();
		expect(container.style.backgroundColor).toBe('red');
	});

	it('调用 onLayoutChange 回调', () => {
		const onLayoutChange = vi.fn();
		renderBasicGrid({ onLayoutChange });

		expect(onLayoutChange).toHaveBeenCalled();
		expect(onLayoutChange).toHaveBeenCalledWith(
			expect.arrayContaining([
				expect.objectContaining({ i: '1', x: 0, y: 0, w: 2, h: 2 }),
				expect.objectContaining({ i: '2', x: 2, y: 0, w: 2, h: 2 }),
				expect.objectContaining({ i: '3', x: 4, y: 0, w: 2, h: 2 }),
			]),
		);
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

		const staticItem = getGridItemByText('Static Item');
		const draggableItem = getGridItemByText('Draggable Item');
		expect(staticItem).toHaveClass('static');
		expect(staticItem).not.toHaveClass('react-draggable');
		expect(draggableItem).toHaveClass('react-draggable');
	});

	it('连续 children 更新时重新同步布局', async () => {
		const { rerender } = render(
			<GridLayout
				width={1200}
				layout={[{ i: 'a', x: 0, y: 0, w: 2, h: 2 }]}
				cols={12}
				rowHeight={30}
			>
				<div key="a">Item A</div>
			</GridLayout>,
		);

		rerender(
			<GridLayout
				width={1200}
				layout={[
					{ i: 'a', x: 0, y: 0, w: 2, h: 2 },
					{ i: 'b', x: 2, y: 0, w: 2, h: 2 },
				]}
				cols={12}
				rowHeight={30}
			>
				<div key="a">Item A</div>
				<div key="b">Item B</div>
			</GridLayout>,
		);

		rerender(
			<GridLayout
				width={1200}
				layout={[
					{ i: 'a', x: 0, y: 0, w: 2, h: 2 },
					{ i: 'c', x: 4, y: 0, w: 2, h: 2 },
				]}
				cols={12}
				rowHeight={30}
			>
				<div key="a">Item A</div>
				<div key="c">Item C</div>
			</GridLayout>,
		);

		await waitFor(() => expect(screen.getByText('Item C')).toBeInTheDocument());
		expect(screen.queryByText('Item B')).not.toBeInTheDocument();
		expect(getGridItems()).toHaveLength(2);
		expect(getGridItemByText('Item C')).toHaveStyle({ position: 'absolute' });
	});

	it('layout metadata 更新时同步到网格项', () => {
		const child = <div key="1">Item 1</div>;
		const { rerender } = render(
			<GridLayout
				width={1200}
				layout={[{ i: '1', x: 0, y: 0, w: 2, h: 2, static: true }]}
				cols={12}
				rowHeight={30}
			>
				{child}
			</GridLayout>,
		);

		expect(getGridItemByText('Item 1')).toHaveClass('static');

		rerender(
			<GridLayout
				width={1200}
				layout={[{ i: '1', x: 0, y: 0, w: 2, h: 2, static: false }]}
				cols={12}
				rowHeight={30}
			>
				{child}
			</GridLayout>,
		);

		const item = getGridItemByText('Item 1');
		expect(item).not.toHaveClass('static');
		expect(item).toHaveClass('react-draggable');
	});

	it('禁用拖拽', () => {
		renderBasicGrid({ isDraggable: false });

		const items = getGridItems();
		expect(items).toHaveLength(3);
		items.forEach((item) => {
			expect(item).not.toHaveClass('react-draggable');
		});
	});

	it('禁用缩放', () => {
		renderBasicGrid({ isResizable: false });

		const hiddenResizeItems = document.querySelectorAll('.react-resizable-hide');
		expect(hiddenResizeItems).toHaveLength(3);
	});

	it('启用缩放', () => {
		renderBasicGrid({ isResizable: true });

		const items = getGridItems();
		expect(items).toHaveLength(3);
		items.forEach((item) => {
			expect(item).not.toHaveClass('react-resizable-hide');
		});
	});

	it('使用 CSS transforms 定位', async () => {
		renderBasicGrid({ useCSSTransforms: true });

		const item = getGridItemByText('Item 1');
		await waitFor(() => expect(item).toHaveClass('cssTransforms'));
		expect(item.style.transform).toBe('translate(10px,10px)');
		expect(item.style.top).toBe('');
		expect(item.style.left).toBe('');
	});

	it('使用 top/left 定位', async () => {
		renderBasicGrid({ useCSSTransforms: false });

		const item = getGridItemByText('Item 1');
		expect(item).not.toHaveClass('cssTransforms');
		expect(item.style.transform).toBe('');
		await waitFor(() => {
			expect(item.style.top).toBe('10px');
			expect(item.style.left).toBe('10px');
		});
	});

	it('空 layout 会为 child 自动生成布局项', () => {
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

		expect(getGridContainer()).toBeInTheDocument();
		expect(getGridItems()).toHaveLength(1);
		expect(getGridItemByText('Item 1')).toHaveStyle({ position: 'absolute' });
	});
});
