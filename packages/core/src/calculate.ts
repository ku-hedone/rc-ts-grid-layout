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

/**
 * 将像素坐标转换为网格单位，不做边界限制。
 *
 * 与约束系统配合使用，用于自定义边界控制。
 *
 * @param positionParams - 网格参数
 * @param top - 相对于父元素的顶部位置（像素）
 * @param left - 相对于父元素的左侧位置（像素）
 * @returns 网格单位的 x 和 y（未限制）
 */
export function calcXYRaw(
	positionParams: PositionParams,
	top: number,
	left: number,
): { x: number; y: number } {
	const { margin, containerPadding, rowHeight } = positionParams;
	const paddingX =
		Array.isArray(containerPadding) && containerPadding.length
			? containerPadding[0]
			: margin[0];
	const paddingY =
		Array.isArray(containerPadding) && containerPadding.length
			? containerPadding[1]
			: margin[1];
	const colWidth = calcGridColWidth(positionParams);

	const x = Math.round((left - paddingX) / (colWidth + margin[0]));
	const y = Math.round((top - paddingY) / (rowHeight + margin[1]));

	return { x, y };
}

/**
 * 根据像素尺寸计算网格单位，不做边界限制。
 *
 * 与约束系统配合使用，用于自定义尺寸控制。
 *
 * @param positionParams - 网格参数
 * @param width - 像素宽度
 * @param height - 像素高度
 * @returns 网格单位的 w 和 h（未限制，最小为 1）
 */
export function calcWHRaw(
	positionParams: PositionParams,
	width: number,
	height: number,
): { w: number; h: number } {
	const { margin, rowHeight } = positionParams;
	const colWidth = calcGridColWidth(positionParams);

	// width = colWidth * w - (margin * (w - 1))
	// w = (width + margin) / (colWidth + margin)
	const w = Math.max(1, Math.round((width + margin[0]) / (colWidth + margin[0])));
	const h = Math.max(1, Math.round((height + margin[1]) / (rowHeight + margin[1])));

	return { w, h };
}

// ============================================================================
// 网格背景计算
// ============================================================================

/**
 * 网格单元尺寸信息，用于渲染背景或覆盖层
 */
export interface GridCellDimensions {
	/** 单个单元格的宽度（像素） */
	readonly cellWidth: number;
	/** 单个单元格的高度（像素） */
	readonly cellHeight: number;
	/** 从容器边缘到第一个单元格的水平偏移 */
	readonly offsetX: number;
	/** 从容器边缘到第一个单元格的垂直偏移 */
	readonly offsetY: number;
	/** 单元格之间的水平间距 */
	readonly gapX: number;
	/** 单元格之间的垂直间距 */
	readonly gapY: number;
	/** 列数 */
	readonly cols: number;
	/** 容器总宽度 */
	readonly containerWidth: number;
}

/**
 * 网格单元尺寸计算的配置
 */
export interface GridCellConfig {
	/** 容器宽度（像素） */
	width: number;
	/** 列数 */
	cols: number;
	/** 行高（像素） */
	rowHeight: number;
	/** 项之间的间距 [x, y] */
	margin?: readonly [number, number];
	/** 容器内边距 [x, y]，未指定时使用 margin */
	containerPadding?: readonly [number, number] | null;
}

/**
 * 计算渲染网格背景所需的单元格尺寸
 *
 * 此函数提供渲染与实际网格单元对齐的可视化网格背景
 * 所需的所有测量值。
 *
 * @param config - 网格配置
 * @returns 单元格尺寸和偏移量
 *
 * @example
 * ```tsx
 * import { calcGridCellDimensions } from '@hedone/rc-ts-grid-layout';
 *
 * const dims = calcGridCellDimensions({
 *   width: 1200,
 *   cols: 12,
 *   rowHeight: 30,
 *   margin: [10, 10],
 *   containerPadding: [10, 10]
 * });
 *
 * // dims.cellWidth = 88.33...
 * // dims.cellHeight = 30
 * // dims.offsetX = 10 (containerPadding[0])
 * // dims.offsetY = 10 (containerPadding[1])
 * // dims.gapX = 10 (margin[0])
 * // dims.gapY = 10 (margin[1])
 * ```
 */
export function calcGridCellDimensions(config: GridCellConfig): GridCellDimensions {
	const { width, cols, rowHeight, margin = [10, 10], containerPadding } = config;

	// 容器内边距未指定时使用 margin
	const padding = containerPadding ?? margin;

	// 计算单元格宽度：总宽度减去内边距和间距，除以列数
	// 公式: width = 2*padding + cols*cellWidth + (cols-1)*gap
	// 求解 cellWidth: cellWidth = (width - 2*padding - (cols-1)*gap) / cols
	const cellWidth = (width - padding[0] * 2 - margin[0] * (cols - 1)) / cols;
	const cellHeight = rowHeight;

	return {
		cellWidth,
		cellHeight,
		offsetX: padding[0],
		offsetY: padding[1],
		gapX: margin[0],
		gapY: margin[1],
		cols,
		containerWidth: width,
	};
}

// 类似 _.clamp 的数值限制函数
export function clamp(num: number, lowerBound: number, upperBound: number): number {
	return Math.max(Math.min(num, upperBound), lowerBound);
}
