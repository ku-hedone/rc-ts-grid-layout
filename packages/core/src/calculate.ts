import type { PositionParams } from './type.calculate';

// 计算单列宽度的辅助函数
export function calcGridColWidth(positionParams: PositionParams): number {
	// 即使 containerPadding = [0,0] 也存在间距
	// containerWidth = 列宽 * 列数 + margin[0] * (列数 + 1) + containerPadding[0] * 2
	// 列宽 = containerWidth - margin[0] * (列数 + 1) - containerPadding[0] * 2
	const { margin, containerPadding, containerWidth, cols } = positionParams;
	const paddingX =
		Array.isArray(containerPadding) && containerPadding.length
			? containerPadding[0]
			: margin[0];
	return (containerWidth - margin[0] * (cols - 1) - paddingX * 2) / cols;
}

// 调用方式：
// calcGridItemWHPx(w, colWidth, margin[0]) 计算宽度
// 或
// calcGridItemWHPx(h, rowHeight, margin[1]) 计算高度
export function calcGridItemWHPx(
	gridUnits: number,
	colOrRowSize: number,
	marginPx: number,
): number {
	// 0 * Infinity === NaN，会导致缩放约束出问题
	if (!Number.isFinite(gridUnits)) return gridUnits;
	return Math.round(colOrRowSize * gridUnits + Math.max(0, gridUnits - 1) * marginPx);
}

/**
 * 将像素坐标转换为网格单位。
 * @param  {PositionParams} positionParams  坐标计算所需的网格参数。
 * @param  {Number} top                     相对于父元素的顶部位置（像素）。
 * @param  {Number} left                    相对于父元素的左侧位置（像素）。
 * @param  {Number} w                       网格单位的宽度。
 * @param  {Number} h                       网格单位的高度。
 * @return {Object}                         网格单位的 x 和 y。
 */
export function calcXY(
	positionParams: PositionParams,
	top: number,
	left: number,
	w: number,
	h: number,
): { x: number; y: number } {
	const { margin, cols, rowHeight, maxRows, containerPadding = margin } = positionParams;
	const colWidth = calcGridColWidth(positionParams);

	// left = colWidth * x + margin[0] * x + containerPadding[0]
	// l = cx + mx + pd
	// (l - pd) / (c + m) = x
	// x = (left - containerPadding) / (colWidth + margin)
	let x = Math.round((left - containerPadding[0]) / (colWidth + margin[0]));
	let y = Math.round((top - containerPadding[1]) / (rowHeight + margin[1]));

	// 边界限制
	x = clamp(x, 0, cols - w);
	y = clamp(y, 0, maxRows - h);
	return { x, y };
}

/**
 * 根据像素尺寸计算网格单位。
 * @param  {PositionParams} positionParams  坐标计算所需的网格参数。
 * @param  {Number} height                  像素高度。
 * @param  {Number} width                   像素宽度。
 * @param  {Number} x                       网格单位的 x 坐标。
 * @param  {Number} y                       网格单位的 y 坐标。
 * @param {String} handle                   缩放把手方向。
 * @return {Object}                         网格单位的 w 和 h。
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

	// 边界限制
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

// 类似 _.clamp 的数值限制函数
export function clamp(num: number, lowerBound: number, upperBound: number): number {
	return Math.max(Math.min(num, upperBound), lowerBound);
}
