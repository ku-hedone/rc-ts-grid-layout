import { cloneLayout, compact, correctBounds } from './utils';
import type { CompactType, Layout } from './type';
import type { Breakpoint, Breakpoints, ResponsiveLayout } from './type.responsive';
/**
 * Given a width, find the highest breakpoint that matches is valid for it (width > breakpoint).
 *
 * @param  {Object} breakpoints Breakpoints object (e.g. {lg: 1200, md: 960, ...})
 * @param  {Number} width Screen width.
 * @return {String}       Highest breakpoint that is less than width.
 */
export const getBreakpointFromWidth = <T extends Breakpoint>(
	breakpoints: Breakpoints<T>,
	width: number,
): T => {
	const sorted = sortBreakpoints(breakpoints);
	let matching = sorted[0]!;
	for (let i = 1, len = sorted.length; i < len; i++) {
		const breakpointName = sorted[i];
		if (breakpointName && width > breakpoints[breakpointName]) {
			matching = breakpointName;
		}
	}
	return matching;
};

/**
 * Given a breakpoint, get the # of cols set for it.
 * @param  {String} breakpoint Breakpoint name.
 * @param  {Object} cols       Map of breakpoints to cols.
 * @return {Number}            Number of cols.
 */
export const getColsFromBreakpoint = <T extends Breakpoint>(
	breakpoint: T,
	cols: Breakpoints<T>,
): number => {
	if (!cols[breakpoint]) {
		throw new Error(
			'ResponsiveReactGridLayout: `cols` entry for breakpoint ' +
				breakpoint +
				' is missing!',
		);
	}
	return cols[breakpoint];
};

/**
 * Given existing layouts and a new breakpoint, find or generate a new layout.
 *
 * This finds the layout above the new one and generates from it, if it exists.
 *
 * @param  {ResponsiveLayout<Breakpoint>} layouts     Existing layouts.
 * @param  {Breakpoints<Breakpoint>} breakpoints All breakpoints.
 * @param  {String} breakpoint Current breakpoint.
 * @param  {String} lastBreakpoint Last breakpoint (for fallback).
 * @param  {Number} cols       Column count at new breakpoint.
 * @param  {CompactType} compactType  Current compactType
 * @return {Layout}             New layout.
 */
export const findOrGenerateResponsiveLayout = <T extends Breakpoint>(
	layouts: ResponsiveLayout<T>,
	breakpoints: Breakpoints<T>,
	breakpoint: T,
	lastBreakpoint: T,
	cols: number,
	compactType: CompactType,
): Layout => {
	// If it already exists, just return it.
	if (layouts[breakpoint]) {
		return cloneLayout(layouts[breakpoint]);
	}
	// Find or generate the next layout
	let layout = layouts[lastBreakpoint];
	const breakpointsSorted = sortBreakpoints(breakpoints);
	const breakpointsAbove = breakpointsSorted.slice(breakpointsSorted.indexOf(breakpoint));
	for (let i = 0, len = breakpointsAbove.length; i < len; i++) {
		const b = breakpointsAbove[i];
		if (b && layouts[b]) {
			layout = layouts[b];
			break;
		}
	}
	layout = cloneLayout(layout || []); // clone layout so we don't modify existing items
	return compact(correctBounds(layout, { cols }), compactType, cols);
};

/**
 * Given breakpoints, return an array of breakpoints sorted by width. This is usually
 * e.g. ['xxs', 'xs', 'sm', ...]
 *
 * @param  {Object} breakpoints Key/value pair of breakpoint names to widths.
 * @return {Array}              Sorted breakpoints.
 */
export const sortBreakpoints = <T extends Breakpoint>(
	breakpoints: Breakpoints<T>,
): T[] => {
	const keys: T[] = Object.keys(breakpoints) as T[];
	return keys.sort((a, b) => breakpoints[a] - breakpoints[b]);
};
