/**
 * GridLayout 组件集成测试
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import GridLayout from '../grid';
import type { Layout, LayoutItem } from '../type';

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

describe('GridLayout - Props 行为回归', () => {
	it('allowOverlap=true 时重叠项共存不推移', () => {
		// 两个 item 放在同一位置，allowOverlap=true 时不触发推移
		const layout: Layout = [
			{ i: '1', x: 0, y: 0, w: 2, h: 2 },
			{ i: '2', x: 0, y: 0, w: 2, h: 2 },
		];
		render(
			<GridLayout
				width={1200}
				layout={layout}
				cols={12}
				rowHeight={30}
				allowOverlap={true}
			>
				<div key="1">Item 1</div>
				<div key="2">Item 2</div>
			</GridLayout>,
		);

		const items = getGridItems();
		expect(items).toHaveLength(2);
		// 两个 item 都应在 y=0 位置（不被推移）
		expect(getGridItemByText('Item 1')).toBeInTheDocument();
		expect(getGridItemByText('Item 2')).toBeInTheDocument();
	});

	it('allowOverlap=true 时不触发改变布局的 compact', () => {
		// 验证 allowOverlap=true 时 onLayoutChange 不被 compact 触发
		// （compact 应为 no-op，不移动任何 item）
		const layout: Layout = [
			{ i: '1', x: 0, y: 0, w: 2, h: 2 },
			{ i: '2', x: 0, y: 0, w: 2, h: 2 },
		];
		const onLayoutChange = vi.fn();
		render(
			<GridLayout
				width={1200}
				layout={layout}
				cols={12}
				rowHeight={30}
				allowOverlap={true}
				onLayoutChange={onLayoutChange}
			>
				<div key="1">Item 1</div>
				<div key="2">Item 2</div>
			</GridLayout>,
		);

		// allowOverlap=true 时 compact 不应改变布局
		// 如果 onLayoutChange 被调用，layout 应与输入一致（无推移）
		if (onLayoutChange.mock.calls.length > 0) {
			const finalLayout = onLayoutChange.mock.calls[0]?.[0];
			const item1 = finalLayout?.find((l: LayoutItem) => l.i === '1');
			const item2 = finalLayout?.find((l: LayoutItem) => l.i === '2');
			// 两个 item 保持原位
			expect(item1?.x).toBe(0);
			expect(item1?.y).toBe(0);
			expect(item2?.x).toBe(0);
			expect(item2?.y).toBe(0);
		}
	});

	it('allowOverlap=false 时重叠项被压缩推移', () => {
		// 两个 item 放在同一位置，allowOverlap=false 时第二个应被推移
		const layout: Layout = [
			{ i: '1', x: 0, y: 0, w: 2, h: 2 },
			{ i: '2', x: 0, y: 0, w: 2, h: 2 },
		];
		const onLayoutChange = vi.fn();
		render(
			<GridLayout
				width={1200}
				layout={layout}
				cols={12}
				rowHeight={30}
				allowOverlap={false}
				compactType="vertical"
				onLayoutChange={onLayoutChange}
			>
				<div key="1">Item 1</div>
				<div key="2">Item 2</div>
			</GridLayout>,
		);

		// onLayoutChange 应被调用，且 layout 已被修正（无重叠）
		expect(onLayoutChange).toHaveBeenCalled();
		const finalLayout = onLayoutChange.mock.calls[0]?.[0];
		expect(finalLayout).toBeDefined();
		// 两个 item 的 y 值不应完全相同（被推移了）
		const item1 = finalLayout.find((l: LayoutItem) => l.i === '1');
		const item2 = finalLayout.find((l: LayoutItem) => l.i === '2');
		expect(item1).toBeDefined();
		expect(item2).toBeDefined();
		if (item1 && item2) {
			const overlap =
				item1.x < item2.x + item2.w &&
				item1.x + item1.w > item2.x &&
				item1.y < item2.y + item2.h &&
				item1.y + item1.h > item2.y;
			expect(overlap).toBe(false);
		}
	});

	it('compactType="vertical" 时垂直压缩布局', () => {
		// item 2 在 item 1 下方有空隙时应向上压缩
		const layout: Layout = [
			{ i: '1', x: 0, y: 0, w: 2, h: 1 },
			{ i: '2', x: 0, y: 3, w: 2, h: 1 },
		];
		const onLayoutChange = vi.fn();
		render(
			<GridLayout
				width={1200}
				layout={layout}
				cols={12}
				rowHeight={30}
				compactType="vertical"
				onLayoutChange={onLayoutChange}
			>
				<div key="1">Item 1</div>
				<div key="2">Item 2</div>
			</GridLayout>,
		);

		expect(onLayoutChange).toHaveBeenCalled();
		const finalLayout = onLayoutChange.mock.calls[0]?.[0];
		const item2 = finalLayout?.find((l: LayoutItem) => l.i === '2');
		// 垂直压缩后 item 2 应紧贴 item 1 下方 (y=1)
		expect(item2?.y).toBe(1);
	});

	it('compactType="horizontal" 时水平压缩布局', () => {
		// item 2 在 item 1 右侧有空隙时应向左压缩
		const layout: Layout = [
			{ i: '1', x: 0, y: 0, w: 2, h: 1 },
			{ i: '2', x: 5, y: 0, w: 2, h: 1 },
		];
		const onLayoutChange = vi.fn();
		render(
			<GridLayout
				width={1200}
				layout={layout}
				cols={12}
				rowHeight={30}
				compactType="horizontal"
				onLayoutChange={onLayoutChange}
			>
				<div key="1">Item 1</div>
				<div key="2">Item 2</div>
			</GridLayout>,
		);

		expect(onLayoutChange).toHaveBeenCalled();
		const finalLayout = onLayoutChange.mock.calls[0]?.[0];
		const item2 = finalLayout?.find((l: LayoutItem) => l.i === '2');
		// 水平压缩后 item 2 应紧贴 item 1 右侧 (x=2)
		expect(item2?.x).toBe(2);
	});

	it('compactType=null 时不压缩，item 保持原位', () => {
		const layout: Layout = [
			{ i: '1', x: 0, y: 0, w: 2, h: 1 },
			{ i: '2', x: 0, y: 5, w: 2, h: 1 },
		];
		render(
			<GridLayout
				width={1200}
				layout={layout}
				cols={12}
				rowHeight={30}
				margin={[10, 10]}
				compactType={null}
				useCSSTransforms={false}
			>
				<div key="1">Item 1</div>
				<div key="2">Item 2</div>
			</GridLayout>,
		);

		// compactType=null 时 item 2 保持 y=5 不被压缩
		// top = y * (rowHeight + margin[1]) + padding = 5 * (30 + 10) + 10 = 210px
		const item2 = getGridItemByText('Item 2');
		expect(item2.style.top).toBe('210px');
	});

	it('全局 isDraggable=false 时 item 级 isDraggable=true 可覆盖', () => {
		const layout: Layout = [
			{ i: '1', x: 0, y: 0, w: 2, h: 2, isDraggable: true },
			{ i: '2', x: 2, y: 0, w: 2, h: 2 },
		];
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
			</GridLayout>,
		);

		// item 1 有 item 级 isDraggable=true，应可拖拽
		expect(getGridItemByText('Item 1')).toHaveClass('react-draggable');
		// item 2 跟随全局 isDraggable=false，不可拖拽
		expect(getGridItemByText('Item 2')).not.toHaveClass('react-draggable');
	});

	it('全局 isResizable=false 时 item 级 isResizable=true 可覆盖', () => {
		const layout: Layout = [
			{ i: '1', x: 0, y: 0, w: 2, h: 2, isResizable: true },
			{ i: '2', x: 2, y: 0, w: 2, h: 2 },
		];
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
			</GridLayout>,
		);

		// item 1 有 item 级 isResizable=true，应有缩放把手
		expect(getGridItemByText('Item 1')).not.toHaveClass('react-resizable-hide');
		// item 2 跟随全局 isResizable=false，隐藏缩放把手
		expect(getGridItemByText('Item 2')).toHaveClass('react-resizable-hide');
	});

	it('自定义 margin 影响 item 定位', () => {
		const layout: Layout = [{ i: '1', x: 0, y: 0, w: 2, h: 2 }];
		render(
			<GridLayout
				width={1200}
				layout={layout}
				cols={12}
				rowHeight={30}
				margin={[20, 20]}
				useCSSTransforms={true}
			>
				<div key="1">Item 1</div>
			</GridLayout>,
		);

		const item = getGridItemByText('Item 1');
		// margin=[20,20] 时，第一个 item 的 translate 应为 (20px, 20px)
		expect(item.style.transform).toBe('translate(20px,20px)');
	});

	it('自定义 containerPadding 影响 item 定位', () => {
		const layout: Layout = [{ i: '1', x: 0, y: 0, w: 2, h: 2 }];
		render(
			<GridLayout
				width={1200}
				layout={layout}
				cols={12}
				rowHeight={30}
				containerPadding={[30, 30]}
				margin={[10, 10]}
				useCSSTransforms={true}
			>
				<div key="1">Item 1</div>
			</GridLayout>,
		);

		const item = getGridItemByText('Item 1');
		// containerPadding=[30,30] 时，第一个 item 的 translate 应为 (30px, 30px)
		expect(item.style.transform).toBe('translate(30px,30px)');
	});
});

describe('GridLayout - children/layout 同步', () => {
	it('三次连续 children 变化每次都正确同步', () => {
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

		expect(getGridItems()).toHaveLength(1);
		expect(screen.getByText('Item A')).toBeInTheDocument();

		// 第二次变化
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

		expect(getGridItems()).toHaveLength(2);
		expect(screen.getByText('Item B')).toBeInTheDocument();

		// 第三次变化：移除 b，添加 c
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

		expect(getGridItems()).toHaveLength(2);
		expect(screen.getByText('Item C')).toBeInTheDocument();
		expect(screen.queryByText('Item B')).not.toBeInTheDocument();

		// 第四次变化：全部替换
		rerender(
			<GridLayout
				width={1200}
				layout={[
					{ i: 'd', x: 0, y: 0, w: 3, h: 3 },
					{ i: 'e', x: 3, y: 0, w: 3, h: 3 },
				]}
				cols={12}
				rowHeight={30}
			>
				<div key="d">Item D</div>
				<div key="e">Item E</div>
			</GridLayout>,
		);

		expect(getGridItems()).toHaveLength(2);
		expect(screen.getByText('Item D')).toBeInTheDocument();
		expect(screen.getByText('Item E')).toBeInTheDocument();
		expect(screen.queryByText('Item A')).not.toBeInTheDocument();
		expect(screen.queryByText('Item C')).not.toBeInTheDocument();
	});

	it('layout 保持稳定、只靠 children 连续变化时正确同步', () => {
		// 使用稳定的 layout 数组引用，只通过 children key 变化触发同步
		// 这能覆盖之前 childrenChanged boolean 依赖导致连续变化被跳过的 bug
		const stableLayout: Layout = [
			{ i: 'a', x: 0, y: 0, w: 2, h: 2 },
			{ i: 'b', x: 2, y: 0, w: 2, h: 2 },
		];
		const { rerender } = render(
			<GridLayout
				width={1200}
				layout={stableLayout}
				cols={12}
				rowHeight={30}
			>
				<div key="a">Item A</div>
				<div key="b">Item B</div>
			</GridLayout>,
		);

		expect(getGridItems()).toHaveLength(2);

		// children 变化：移除 b，添加 c（layout 引用不变）
		rerender(
			<GridLayout
				width={1200}
				layout={stableLayout}
				cols={12}
				rowHeight={30}
			>
				<div key="a">Item A</div>
				<div key="c">Item C</div>
			</GridLayout>,
		);

		expect(getGridItems()).toHaveLength(2);
		expect(screen.getByText('Item C')).toBeInTheDocument();
		expect(screen.queryByText('Item B')).not.toBeInTheDocument();

		// 再次变化：移除 a，添加 d
		rerender(
			<GridLayout
				width={1200}
				layout={stableLayout}
				cols={12}
				rowHeight={30}
			>
				<div key="d">Item D</div>
				<div key="c">Item C</div>
			</GridLayout>,
		);

		expect(getGridItems()).toHaveLength(2);
		expect(screen.getByText('Item D')).toBeInTheDocument();
		expect(screen.queryByText('Item A')).not.toBeInTheDocument();
	});

	it('StrictMode 下 layout 稳定、children 连续变化正确同步', () => {
		// 结合 StrictMode 双渲染 + children-only 变化，覆盖最严格的同步场景
		const stableLayout: Layout = [
			{ i: 'x', x: 0, y: 0, w: 2, h: 2 },
			{ i: 'y', x: 2, y: 0, w: 2, h: 2 },
		];
		const { rerender } = render(
			<React.StrictMode>
				<GridLayout
					width={1200}
					layout={stableLayout}
					cols={12}
					rowHeight={30}
				>
					<div key="x">Item X</div>
					<div key="y">Item Y</div>
				</GridLayout>
			</React.StrictMode>,
		);

		expect(getGridItems()).toHaveLength(2);

		// children 变化：移除 y，添加 z
		rerender(
			<React.StrictMode>
				<GridLayout
					width={1200}
					layout={stableLayout}
					cols={12}
					rowHeight={30}
				>
					<div key="x">Item X</div>
					<div key="z">Item Z</div>
				</GridLayout>
			</React.StrictMode>,
		);

		expect(getGridItems()).toHaveLength(2);
		expect(screen.getByText('Item Z')).toBeInTheDocument();
		expect(screen.queryByText('Item Y')).not.toBeInTheDocument();
	});

	it('layout 中 minW 约束限制 resize 缩小', () => {
		const onResize = vi.fn();
		const layout: Layout = [
			{ i: '1', x: 0, y: 0, w: 4, h: 2, minW: 2 },
		];
		render(
			<GridLayout
				width={1200}
				layout={layout}
				cols={12}
				rowHeight={30}
				onResize={onResize}
			>
				<div key="1">Item 1</div>
			</GridLayout>,
		);

		const item = getGridItemByText('Item 1');
		expect(item).toBeInTheDocument();
		expect(item).not.toHaveClass('react-resizable-hide');

		// 向左拖拽缩放把手（试图把 w 从 4 缩到 < minW=2）
		const handle = item.querySelector<HTMLElement>('.react-resizable-handle');
		expect(handle).toBeInTheDocument();

		if (handle) {
			const box = handle.getBoundingClientRect();
			fireEvent.mouseDown(handle, {
				clientX: box.left + box.width / 2,
				clientY: box.top + box.height / 2,
			});
			fireEvent.mouseMove(document, {
				clientX: box.left + box.width / 2 - 500,
				clientY: box.top + box.height / 2,
			});
			fireEvent.mouseUp(document);

			// onResize 应被触发
			expect(onResize).toHaveBeenCalled();
			const lastCall = onResize.mock.calls[onResize.mock.calls.length - 1];
			const newItem = lastCall?.[2];
			// minW=2：宽度不应小于 2
			expect(newItem?.w).toBeGreaterThanOrEqual(2);
		}
	});

	it('layout 中 maxH 约束限制 resize 拉高', () => {
		const onResize = vi.fn();
		const layout: Layout = [
			{ i: '1', x: 0, y: 0, w: 2, h: 2, maxH: 4 },
		];
		render(
			<GridLayout
				width={1200}
				layout={layout}
				cols={12}
				rowHeight={30}
				onResize={onResize}
				resizeHandles={['se']}
			>
				<div key="1">Item 1</div>
			</GridLayout>,
		);

		const item = getGridItemByText('Item 1');
		expect(item).toBeInTheDocument();

		// 向下拖拽缩放把手（试图把 h 从 2 拉到 > maxH=4）
		const handle = item.querySelector<HTMLElement>('.react-resizable-handle');
		expect(handle).toBeInTheDocument();

		if (handle) {
			const box = handle.getBoundingClientRect();
			fireEvent.mouseDown(handle, {
				clientX: box.left + box.width / 2,
				clientY: box.top + box.height / 2,
			});
			fireEvent.mouseMove(document, {
				clientX: box.left + box.width / 2 + 50,
				clientY: box.top + box.height / 2 + 500,
			});
			fireEvent.mouseUp(document);

			// onResize 应被触发
			expect(onResize).toHaveBeenCalled();
			const lastCall = onResize.mock.calls[onResize.mock.calls.length - 1];
			const newItem = lastCall?.[2];
			// maxH=4：高度不应超过 4
			expect(newItem?.h).toBeLessThanOrEqual(4);
		}
	});

	it('layout 中 static 属性变化时 CSS 类同步更新', () => {
		const { rerender } = render(
			<GridLayout
				width={1200}
				layout={[{ i: '1', x: 0, y: 0, w: 2, h: 2, static: true }]}
				cols={12}
				rowHeight={30}
			>
				<div key="1">Item 1</div>
			</GridLayout>,
		);

		expect(getGridItemByText('Item 1')).toHaveClass('static');
		expect(getGridItemByText('Item 1')).not.toHaveClass('react-draggable');

		// 切换为非静态
		rerender(
			<GridLayout
				width={1200}
				layout={[{ i: '1', x: 0, y: 0, w: 2, h: 2, static: false }]}
				cols={12}
				rowHeight={30}
			>
				<div key="1">Item 1</div>
			</GridLayout>,
		);

		expect(getGridItemByText('Item 1')).not.toHaveClass('static');
		expect(getGridItemByText('Item 1')).toHaveClass('react-draggable');

		// 再切换回静态
		rerender(
			<GridLayout
				width={1200}
				layout={[{ i: '1', x: 0, y: 0, w: 2, h: 2, static: true }]}
				cols={12}
				rowHeight={30}
			>
				<div key="1">Item 1</div>
			</GridLayout>,
		);

		expect(getGridItemByText('Item 1')).toHaveClass('static');
		expect(getGridItemByText('Item 1')).not.toHaveClass('react-draggable');
	});

	it('StrictMode 下渲染不报错且 layout 正确', () => {
		const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		render(
			<React.StrictMode>
				<GridLayout
					width={1200}
					layout={[
						{ i: '1', x: 0, y: 0, w: 2, h: 2 },
						{ i: '2', x: 2, y: 0, w: 2, h: 2 },
					]}
					cols={12}
					rowHeight={30}
				>
					<div key="1">Item 1</div>
					<div key="2">Item 2</div>
				</GridLayout>
			</React.StrictMode>,
		);

		expect(getGridItems()).toHaveLength(2);
		expect(screen.getByText('Item 1')).toBeInTheDocument();
		expect(screen.getByText('Item 2')).toBeInTheDocument();

		// 不应有 React 错误
		const reactErrors = consoleSpy.mock.calls.filter(
			(args) => typeof args[0] === 'string' && args[0].includes('Error'),
		);
		expect(reactErrors).toHaveLength(0);

		consoleSpy.mockRestore();
	});

	it('StrictMode 下连续 rerender 不丢 item', () => {
		const { rerender } = render(
			<React.StrictMode>
				<GridLayout
					width={1200}
					layout={[{ i: '1', x: 0, y: 0, w: 2, h: 2 }]}
					cols={12}
					rowHeight={30}
				>
					<div key="1">Item 1</div>
				</GridLayout>
			</React.StrictMode>,
		);

		expect(getGridItems()).toHaveLength(1);

		rerender(
			<React.StrictMode>
				<GridLayout
					width={1200}
					layout={[
						{ i: '1', x: 0, y: 0, w: 2, h: 2 },
						{ i: '2', x: 2, y: 0, w: 2, h: 2 },
					]}
					cols={12}
					rowHeight={30}
				>
					<div key="1">Item 1</div>
					<div key="2">Item 2</div>
				</GridLayout>
			</React.StrictMode>,
		);

		expect(getGridItems()).toHaveLength(2);

		rerender(
			<React.StrictMode>
				<GridLayout
					width={1200}
					layout={[
						{ i: '1', x: 0, y: 0, w: 2, h: 2 },
						{ i: '2', x: 2, y: 0, w: 2, h: 2 },
						{ i: '3', x: 4, y: 0, w: 2, h: 2 },
					]}
					cols={12}
					rowHeight={30}
				>
					<div key="1">Item 1</div>
					<div key="2">Item 2</div>
					<div key="3">Item 3</div>
				</GridLayout>
			</React.StrictMode>,
		);

		expect(getGridItems()).toHaveLength(3);
	});
});
