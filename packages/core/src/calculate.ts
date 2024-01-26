import type { PositionParams } from './type.calculate';

// Helper for generating column width
export function calcGridColWidth(positionParams: PositionParams): number {
	// if containerPadding = [0,0] also has distance
	// containerWidth = column width * cols + margin[0] * (cols + 1) + containerPadding[0] * 2
	// column width = containerWidth - margin[0] * (cols + 1) - containerPadding[0] * 2
	const { margin, containerPadding, containerWidth, cols } = positionParams;
	const paddingX =
		Array.isArray(containerPadding) && containerPadding.length
			? containerPadding[0]
			: margin[0];
	return (containerWidth - margin[0] * (cols - 1) - paddingX * 2) / cols;
}

// This can either be called:
// calcGridItemWHPx(w, colWidth, margin[0])
// or
// calcGridItemWHPx(h, rowHeight, margin[1])
export function calcGridItemWHPx(
	gridUnits: number,
	colOrRowSize: number,
	marginPx: number,
): number {
	// 0 * Infinity === NaN, which causes problems with resize contraints
	if (!Number.isFinite(gridUnits)) return gridUnits;
	return Math.round(colOrRowSize * gridUnits + Math.max(0, gridUnits - 1) * marginPx);
}

/**
 * Translate x and y coordinates from pixels to grid units.
 * @param  {PositionParams} positionParams  Parameters of grid needed for coordinates calculations.
 * @param  {Number} top                     Top position (relative to parent) in pixels.
 * @param  {Number} left                    Left position (relative to parent) in pixels.
 * @param  {Number} w                       W coordinate in grid units.
 * @param  {Number} h                       H coordinate in grid units.
 * @return {Object}                         x and y in grid units.
 */
export function calcXY(
	positionParams: PositionParams,
	top: number,
	left: number,
	w: number,
	h: number,
): { x: number; y: number } {
	const { margin, cols, rowHeight, maxRows } = positionParams;
	const colWidth = calcGridColWidth(positionParams);

	// left = colWidth * x + margin * (x + 1)
	// l = cx + m(x+1)
	// l = cx + mx + m
	// l - m = cx + mx
	// l - m = x(c + m)
	// (l - m) / (c + m) = x
	// x = (left - margin) / (coldWidth + margin)
	let x = Math.round((left - margin[0]) / (colWidth + margin[0]));
	let y = Math.round((top - margin[1]) / (rowHeight + margin[1]));

	// Capping
	x = clamp(x, 0, cols - w);
	y = clamp(y, 0, maxRows - h);
	return { x, y };
}

/**
 * Given a height and width in pixel values, calculate grid units.
 * @param  {PositionParams} positionParams  Parameters of grid needed for coordinates calcluations.
 * @param  {Number} height                  Height in pixels.
 * @param  {Number} width                   Width in pixels.
 * @param  {Number} x                       X coordinate in grid units.
 * @param  {Number} y                       Y coordinate in grid units.
 * @param {String} handle Resize Handle.
 * @return {Object}                         w, h as grid units.
 */
export function calcWH(
	positionParams: PositionParams,
	width: number,
	height: number,
	x: number,
	y: number,
	handle: string,
): { w: number; h: number } {
	const { margin, maxRows, cols, rowHeight } = positionParams;
	const colWidth = calcGridColWidth(positionParams);

	// width = colWidth * w - (margin * (w - 1))
	// ...
	// w = (width + margin) / (colWidth + margin)
	const w = Math.round((width + margin[0]) / (colWidth + margin[0]));
	const h = Math.round((height + margin[1]) / (rowHeight + margin[1]));

	// Capping
	let _w = clamp(w, 0, cols - x);
	let _h = clamp(h, 0, maxRows - y);
	if (['sw', 'w', 'nw'].indexOf(handle) !== -1) {
		_w = clamp(w, 0, cols);
	}
	if (['nw', 'n', 'ne'].indexOf(handle) !== -1) {
		_h = clamp(h, 0, maxRows);
	}
	return { w: _w, h: _h };
}

// Similar to _.clamp
export function clamp(num: number, lowerBound: number, upperBound: number): number {
	return Math.max(Math.min(num, upperBound), lowerBound);
}
