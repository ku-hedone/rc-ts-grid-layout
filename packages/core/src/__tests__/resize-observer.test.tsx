import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ResizeResponsiveGridLayout from '../resize';
import ResizeGridLayout from '../resize.grid';
import type { Layout } from '../type';
import type { Breakpoint, ResponsiveLayout } from '../type.responsive';

class TestResizeObserver implements ResizeObserver {
	static instances: TestResizeObserver[] = [];

	readonly callback: ResizeObserverCallback;
	readonly observed: Element[] = [];
	readonly unobserved: Element[] = [];
	disconnected = false;

	constructor(callback: ResizeObserverCallback) {
		this.callback = callback;
		TestResizeObserver.instances.push(this);
	}

	observe(target: Element): void {
		this.observed.push(target);
	}

	unobserve(target: Element): void {
		this.unobserved.push(target);
	}

	disconnect(): void {
		this.disconnected = true;
	}

	trigger(width: number): void {
		const target = this.observed[0];
		if (!target) throw new Error('Expected ResizeObserver to observe an element');

		this.callback(
			[
				{
					target,
					contentRect: { width },
				} as ResizeObserverEntry,
			],
			this,
		);
	}
}

const originalResizeObserver = globalThis.ResizeObserver;

function installResizeObserverMock(): void {
	const MockResizeObserver = TestResizeObserver as unknown as typeof ResizeObserver;
	globalThis.ResizeObserver = MockResizeObserver;
	window.ResizeObserver = MockResizeObserver;
	TestResizeObserver.instances = [];
}

function firstObserver(): TestResizeObserver {
	const observer = TestResizeObserver.instances[0];
	if (!observer) throw new Error('Expected ResizeObserver instance');
	return observer;
}

function responsiveLayouts(
	layouts: Partial<Record<Breakpoint, Layout>>,
): ResponsiveLayout<Breakpoint> {
	return layouts as ResponsiveLayout<Breakpoint>;
}

beforeEach(() => {
	installResizeObserverMock();
});

afterEach(() => {
	cleanup();
	globalThis.ResizeObserver = originalResizeObserver;
	window.ResizeObserver = originalResizeObserver;
});

describe('ResizeObserver wrappers', () => {
	it('renders a placeholder before measurement and then renders GridLayout', async () => {
		const layout: Layout = [{ i: 'a', x: 0, y: 0, w: 2, h: 1 }];
		const { container, unmount } = render(
			<ResizeGridLayout
				measureBeforeMount
				className="measured-grid"
				style={{ minHeight: 40 }}
				layout={layout}
				cols={12}
				rowHeight={30}>
				<div key="a">Measured item</div>
			</ResizeGridLayout>,
		);

		const placeholder = container.querySelector('.react-grid-layout');
		expect(placeholder).toBeInTheDocument();
		expect(placeholder).toHaveClass('measured-grid');
		expect(placeholder).toHaveStyle({ minHeight: '40px' });
		expect(screen.queryByText('Measured item')).not.toBeInTheDocument();
		expect(firstObserver().observed[0]).toBe(placeholder);

		act(() => {
			firstObserver().trigger(640);
		});

		expect(await screen.findByText('Measured item')).toBeInTheDocument();
		expect(screen.getByText('Measured item').closest('.react-grid-item')).toBeInTheDocument();

		unmount();
		expect(firstObserver().unobserved).toContain(placeholder);
		expect(firstObserver().disconnected).toBe(true);
	});

	it('passes observed widths through ResponsiveGridLayout', async () => {
		const layouts = responsiveLayouts({
			lg: [{ i: 'a', x: 0, y: 0, w: 2, h: 1 }],
		});
		const onBreakpointChange = vi.fn();
		const onLayoutChange = vi.fn();
		const onWidthChange = vi.fn();

		const { unmount } = render(
			<ResizeResponsiveGridLayout
				layouts={layouts}
				rowHeight={30}
				onBreakpointChange={onBreakpointChange}
				onLayoutChange={onLayoutChange}
				onWidthChange={onWidthChange}>
				<div key="a">Responsive item</div>
			</ResizeResponsiveGridLayout>,
		);

		expect(await screen.findByText('Responsive item')).toBeInTheDocument();

		act(() => {
			firstObserver().trigger(500);
		});

		await waitFor(() => {
			expect(onBreakpointChange).toHaveBeenCalledWith('xs', 4);
		});
		expect(onWidthChange).toHaveBeenCalledWith(500, [10, 10], 4, undefined);
		expect(onLayoutChange).toHaveBeenCalledWith(
			expect.arrayContaining([expect.objectContaining({ i: 'a' })]),
			expect.objectContaining({
				xs: expect.arrayContaining([expect.objectContaining({ i: 'a' })]),
			}),
		);

		unmount();
		expect(TestResizeObserver.instances.some((observer) => observer.disconnected)).toBe(true);
	});
});
