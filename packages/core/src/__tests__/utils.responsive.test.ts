import { describe, expect, it } from 'vitest';
import {
	findOrGenerateResponsiveLayout,
	getBreakpointFromWidth,
	getColsFromBreakpoint,
	sortBreakpoints,
} from '../utils.responsive';
import type { Breakpoint, Breakpoints, ResponsiveLayout } from '../type.responsive';
import type { Layout, LayoutItem } from '../type';

const breakpoints: Breakpoints<Breakpoint> = {
	lg: 1200,
	md: 996,
	sm: 768,
	xs: 480,
	xxs: 0,
};

const cols: Breakpoints<Breakpoint> = {
	lg: 12,
	md: 10,
	sm: 6,
	xs: 4,
	xxs: 2,
};

function layoutItem(overrides: Partial<LayoutItem> = {}): LayoutItem {
	return {
		i: 'item',
		x: 0,
		y: 0,
		w: 1,
		h: 1,
		...overrides,
	};
}

function itemAt(layout: Layout, index: number): LayoutItem {
	const item = layout[index];
	if (!item) throw new Error(`Expected layout item at index ${index}`);
	return item;
}

function responsiveLayouts(
	layouts: Partial<Record<Breakpoint, Layout>>,
): ResponsiveLayout<Breakpoint> {
	return layouts as ResponsiveLayout<Breakpoint>;
}

describe('utils.responsive', () => {
	it('sorts breakpoints by ascending width', () => {
		expect(sortBreakpoints(breakpoints)).toEqual(['xxs', 'xs', 'sm', 'md', 'lg']);
	});

	it('selects the highest breakpoint below the current width', () => {
		expect(getBreakpointFromWidth(breakpoints, 1300)).toBe('lg');
		expect(getBreakpointFromWidth(breakpoints, 1200)).toBe('md');
		expect(getBreakpointFromWidth(breakpoints, 500)).toBe('xs');
		expect(getBreakpointFromWidth(breakpoints, 0)).toBe('xxs');
	});

	it('reads cols for the active breakpoint and throws when missing', () => {
		expect(getColsFromBreakpoint('md', cols)).toBe(10);

		const incompleteCols = { lg: 12 } as Breakpoints<Breakpoint>;
		expect(() => getColsFromBreakpoint('sm', incompleteCols)).toThrow(
			'ResponsiveReactGridLayout: `cols` entry for breakpoint sm is missing!',
		);
	});

	it('returns a cloned layout when the current breakpoint already exists', () => {
		const source: Layout = [
			layoutItem({
				i: 'a',
				x: 1,
				y: 2,
				w: 3,
				h: 4,
				static: true,
				isResizable: false,
			}),
		];

		const result = findOrGenerateResponsiveLayout(
			responsiveLayouts({ md: source }),
			breakpoints,
			'md',
			'lg',
			cols.md,
			'vertical',
		);

		expect(result).not.toBe(source);
		expect(itemAt(result, 0)).not.toBe(itemAt(source, 0));
		expect(itemAt(result, 0)).toMatchObject({
			i: 'a',
			x: 1,
			y: 2,
			w: 3,
			h: 4,
			static: true,
			isResizable: false,
		});
	});

	it('generates a layout from the nearest larger breakpoint without mutating it', () => {
		const source: Layout = [
			layoutItem({
				i: 'wide',
				x: 5,
				y: 3,
				w: 4,
				h: 1,
			}),
		];

		const result = findOrGenerateResponsiveLayout(
			responsiveLayouts({ lg: source }),
			breakpoints,
			'sm',
			'xs',
			cols.sm,
			'vertical',
		);

		expect(itemAt(result, 0)).toMatchObject({
			i: 'wide',
			x: 2,
			y: 0,
			w: 4,
			h: 1,
		});
		expect(itemAt(source, 0)).toMatchObject({
			x: 5,
			y: 3,
		});
	});

	it('falls back to an empty layout when no source breakpoint is available', () => {
		const result = findOrGenerateResponsiveLayout(
			responsiveLayouts({}),
			breakpoints,
			'xs',
			'sm',
			cols.xs,
			'vertical',
		);

		expect(result).toEqual([]);
	});
});
