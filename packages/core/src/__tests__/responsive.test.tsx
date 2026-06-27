import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ResponsiveGridLayout from '../responsive';
import type { Layout } from '../type';
import type { Breakpoint, Breakpoints, ResponsiveLayout } from '../type.responsive';

function responsiveLayouts(
	layouts: Partial<Record<Breakpoint, Layout>>,
): ResponsiveLayout<Breakpoint> {
	return layouts as ResponsiveLayout<Breakpoint>;
}

const defaultBreakpoints: Breakpoints<Breakpoint> = {
	lg: 1200,
	md: 996,
	sm: 768,
	xs: 480,
	xxs: 0,
};

const defaultCols: Breakpoints<Breakpoint> = {
	lg: 12,
	md: 10,
	sm: 6,
	xs: 4,
	xxs: 2,
};

describe('ResponsiveGridLayout', () => {
	it('switches breakpoint, synchronizes children, and reports width details', async () => {
		const layouts = responsiveLayouts({
			lg: [{ i: 'a', x: 0, y: 0, w: 2, h: 1 }],
		});
		const margin = {
			lg: [20, 20],
			md: [10, 10],
			sm: [4, 5],
			xs: [2, 2],
			xxs: [1, 1],
		} satisfies Record<Breakpoint, [number, number]>;
		const containerPadding = {
			lg: [9, 9],
			sm: [7, 8],
		} satisfies Partial<Record<Breakpoint, [number, number]>>;
		const onBreakpointChange = vi.fn();
		const onLayoutChange = vi.fn();
		const onWidthChange = vi.fn();

		const { rerender } = render(
			<ResponsiveGridLayout
				width={1300}
				rowHeight={30}
				layouts={layouts}
				margin={margin}
				containerPadding={containerPadding}
				onBreakpointChange={onBreakpointChange}
				onLayoutChange={onLayoutChange}
				onWidthChange={onWidthChange}>
				<div key="a">Item A</div>
			</ResponsiveGridLayout>,
		);

		expect(await screen.findByText('Item A')).toBeInTheDocument();

		rerender(
			<ResponsiveGridLayout
				width={800}
				rowHeight={30}
				layouts={layouts}
				margin={margin}
				containerPadding={containerPadding}
				onBreakpointChange={onBreakpointChange}
				onLayoutChange={onLayoutChange}
				onWidthChange={onWidthChange}>
				<div key="a">Item A</div>
			</ResponsiveGridLayout>,
		);

		await waitFor(() => {
			expect(onBreakpointChange).toHaveBeenCalledWith('sm', 6);
		});
		expect(onWidthChange).toHaveBeenCalledWith(800, [4, 5], 6, [7, 8]);
		expect(onLayoutChange).toHaveBeenCalledWith(
			expect.arrayContaining([expect.objectContaining({ i: 'a' })]),
			expect.objectContaining({
				lg: expect.arrayContaining([expect.objectContaining({ i: 'a' })]),
				sm: expect.arrayContaining([expect.objectContaining({ i: 'a' })]),
			}),
		);
	});

	it('recomputes layout when breakpoint definitions or cols change', async () => {
		const layouts = responsiveLayouts({
			md: [{ i: 'a', x: 0, y: 0, w: 2, h: 1 }],
		});
		const changedBreakpoints: Breakpoints<Breakpoint> = {
			lg: 1300,
			md: 900,
			sm: 700,
			xs: 400,
			xxs: 0,
		};
		const changedCols: Breakpoints<Breakpoint> = {
			...defaultCols,
			md: 8,
		};
		const onBreakpointChange = vi.fn();
		const onWidthChange = vi.fn();

		const { rerender } = render(
			<ResponsiveGridLayout
				width={1000}
				rowHeight={30}
				breakpoints={defaultBreakpoints}
				cols={defaultCols}
				layouts={layouts}
				onBreakpointChange={onBreakpointChange}
				onWidthChange={onWidthChange}>
				<div key="a">Item A</div>
			</ResponsiveGridLayout>,
		);

		rerender(
			<ResponsiveGridLayout
				width={1000}
				rowHeight={30}
				breakpoints={changedBreakpoints}
				cols={changedCols}
				layouts={layouts}
				onBreakpointChange={onBreakpointChange}
				onWidthChange={onWidthChange}>
				<div key="a">Item A</div>
			</ResponsiveGridLayout>,
		);

		await waitFor(() => {
			expect(onBreakpointChange).toHaveBeenCalledWith('md', 8);
		});
		expect(onWidthChange).toHaveBeenCalledWith(1000, [10, 10], 8, undefined);
	});

	it('uses an explicit breakpoint over width-derived breakpoints', () => {
		render(
			<ResponsiveGridLayout
				breakpoint="xs"
				width={1300}
				rowHeight={30}
				layouts={responsiveLayouts({
					xs: [{ i: 'a', x: 0, y: 0, w: 1, h: 1 }],
				})}>
				<div key="a">Explicit breakpoint item</div>
			</ResponsiveGridLayout>,
		);

		expect(screen.getByText('Explicit breakpoint item')).toBeInTheDocument();
	});
});
