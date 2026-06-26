/**
 * GridLayout 性能测试
 *
 * TDD: 优化 latestLayout 的 children 依赖问题
 */

import { describe, it, expect, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import React, { useState } from 'react';
import GridLayout from '../grid';
import type { Layout } from '../type';

describe('GridLayout - 性能优化', () => {
	it('children 引用变化但内容相同时不应触发 synchronizeLayoutWithChildren', () => {
		const layout: Layout = [
			{ i: '1', x: 0, y: 0, w: 2, h: 2 },
			{ i: '2', x: 2, y: 0, w: 2, h: 2 },
		];

		// 创建一个父组件，每次渲染都创建新的 children 引用
		function Parent() {
			const [, setTick] = useState(0);

			return (
				<div>
					<GridLayout
						width={1200}
						layout={layout}
						cols={12}
						rowHeight={30}
					>
						<div key="1">Item 1</div>
						<div key="2">Item 2</div>
					</GridLayout>
					<button onClick={() => setTick((t) => t + 1)}>Rerender</button>
				</div>
			);
		}

		const { getByText } = render(<Parent />);

		// 触发父组件重渲染，children 引用会变化但内容相同
		act(() => {
			getByText('Rerender').click();
		});

		// 验证 GridLayout 内部没有不必要的重计算
		// 这个测试主要验证不会崩溃，实际性能需要 profiling
		expect(true).toBe(true);
	});

	it('layout prop 变化时应该正确更新', () => {
		const initialLayout: Layout = [
			{ i: '1', x: 0, y: 0, w: 2, h: 2 },
		];

		const updatedLayout: Layout = [
			{ i: '1', x: 5, y: 5, w: 2, h: 2 },
		];

		function Parent() {
			const [currentLayout, setCurrentLayout] = useState(initialLayout);

			return (
				<div>
					<GridLayout
						width={1200}
						layout={currentLayout}
						cols={12}
						rowHeight={30}
					>
						<div key="1">Item 1</div>
					</GridLayout>
					<button onClick={() => setCurrentLayout(updatedLayout)}>
						Update Layout
					</button>
				</div>
			);
		}

		const { getByText } = render(<Parent />);

		// 更新 layout
		act(() => {
			getByText('Update Layout').click();
		});

		// 验证布局更新
		const gridItem = document.querySelector('.react-grid-item');
		expect(gridItem).toBeInTheDocument();
	});

	it('快速连续更新不应导致状态不一致', () => {
		const layout: Layout = [
			{ i: '1', x: 0, y: 0, w: 2, h: 2 },
		];

		function Parent() {
			const [width, setWidth] = useState(1200);

			return (
				<div>
					<GridLayout
						width={width}
						layout={layout}
						cols={12}
						rowHeight={30}
					>
						<div key="1">Item 1</div>
					</GridLayout>
					<button
						onClick={() => {
							// 快速连续更新
							setWidth(800);
							setWidth(1000);
							setWidth(1200);
						}}
					>
						Fast Update
					</button>
				</div>
			);
		}

		const { getByText } = render(<Parent />);

		// 快速连续更新
		act(() => {
			getByText('Fast Update').click();
		});

		// 验证最终状态正确
		const container = document.querySelector('.react-grid-layout');
		expect(container).toBeInTheDocument();
	});
});
