/**
 * react-grid-layout v2 的可组合布局约束系统
 *
 * 约束控制拖拽/缩放操作期间的位置和尺寸限制。
 * 约束是可组合的、支持 tree-shake 的，可以在网格级别或项级别应用。
 */

import type { LayoutItem, LayoutConstraint, ConstraintContext, ResizeHandleAxis } from './type';

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 将值限制在最小和最大边界之间
 */
function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

// ============================================================================
// 内置约束
// ============================================================================

/**
 * 网格边界约束
 *
 * 确保项保持在网格边界内（x: 0 到 cols-w, y: 0 到 maxRows-h）。
 * 这是默认的位置约束。
 */
export const gridBounds: LayoutConstraint = {
	name: 'gridBounds',

	constrainPosition(
		item: LayoutItem,
		x: number,
		y: number,
		{ cols, maxRows }: ConstraintContext,
	): { x: number; y: number } {
		return {
			x: clamp(x, 0, Math.max(0, cols - item.w)),
			y: clamp(y, 0, Math.max(0, maxRows - item.h)),
		};
	},

	constrainSize(
		item: LayoutItem,
		w: number,
		h: number,
		handle: ResizeHandleAxis,
		{ cols, maxRows }: ConstraintContext,
	): { w: number; h: number } {
		// 对于西向缩放（w, nw, sw），最大宽度受右边缘位置限制
		// 因为项向左扩展（x 减小时 w 增加）
		const maxW =
			handle === 'w' || handle === 'nw' || handle === 'sw'
				? item.x + item.w // 右边缘 = x + w，可以向左扩展到 x=0
				: cols - item.x; // 可以向右扩展到 cols

		// 对于北向缩放（n, nw, ne），最大高度受底边缘位置限制
		// 因为项向上扩展（y 减小时 h 增加）
		const maxH =
			handle === 'n' || handle === 'nw' || handle === 'ne'
				? item.y + item.h // 底边缘 = y + h，可以向上扩展到 y=0
				: maxRows - item.y; // 可以向下扩展到 maxRows

		return {
			w: clamp(w, 1, Math.max(1, maxW)),
			h: clamp(h, 1, Math.max(1, maxH)),
		};
	},
};

/**
 * 最小/最大尺寸约束
 *
 * 强制执行每项的 minW/maxW/minH/maxH 属性。
 * 默认在 gridBounds 之后应用。
 */
export const minMaxSize: LayoutConstraint = {
	name: 'minMaxSize',

	constrainSize(item: LayoutItem, w: number, h: number): { w: number; h: number } {
		return {
			w: clamp(w, item.minW ?? 1, item.maxW ?? Infinity),
			h: clamp(h, item.minH ?? 1, item.maxH ?? Infinity),
		};
	},
};

/**
 * 容器边界约束
 *
 * 约束项保持在可见容器内。
 * 可作为旧版 `isBounded` 属性的替代品。
 *
 * 与使用 maxRows（可能是 Infinity）的 gridBounds 不同，
 * 此约束根据实际容器高度计算可见行数。
 * 如果容器高度为 0（自动高度网格），则回退到 maxRows。
 */
export const containerBounds: LayoutConstraint = {
	name: 'containerBounds',

	constrainPosition(
		item: LayoutItem,
		x: number,
		y: number,
		{ cols, maxRows, containerHeight, rowHeight, margin }: ConstraintContext,
	): { x: number; y: number } {
		// 根据容器高度计算可见行数
		// 公式: containerHeight = rows * rowHeight + (rows - 1) * margin
		// 求解: rows = (containerHeight + margin) / (rowHeight + margin)
		const visibleRows =
			containerHeight > 0
				? Math.floor((containerHeight + margin[1]) / (rowHeight + margin[1]))
				: maxRows;

		return {
			x: clamp(x, 0, Math.max(0, cols - item.w)),
			y: clamp(y, 0, Math.max(0, visibleRows - item.h)),
		};
	},
};

/**
 * 水平边界约束
 *
 * 仅约束水平方向的位置（x 轴）。
 * 项可以在垂直方向自由移动。
 */
export const boundedX: LayoutConstraint = {
	name: 'boundedX',

	constrainPosition(
		item: LayoutItem,
		x: number,
		y: number,
		{ cols }: ConstraintContext,
	): { x: number; y: number } {
		return {
			x: clamp(x, 0, Math.max(0, cols - item.w)),
			y,
		};
	},
};

/**
 * 垂直边界约束
 *
 * 仅约束垂直方向的位置（y 轴）。
 * 项可以在水平方向自由移动。
 */
export const boundedY: LayoutConstraint = {
	name: 'boundedY',

	constrainPosition(
		item: LayoutItem,
		x: number,
		y: number,
		{ maxRows }: ConstraintContext,
	): { x: number; y: number } {
		return {
			x,
			y: clamp(y, 0, Math.max(0, maxRows - item.h)),
		};
	},
};

// ============================================================================
// 约束工厂函数
// ============================================================================

/**
 * 创建宽高比约束
 *
 * 在缩放操作期间保持固定的**像素级**宽高比。
 * 考虑了网格列与行的不同像素尺寸。
 *
 * @param ratio - 宽高比（如 16/9 为宽屏，1 为正方形）
 * @returns 强制宽高比的约束
 *
 * @example
 * ```typescript
 * // 16:9 宽高比（实际像素比例）
 * const layout = [
 *   { i: 'video', x: 0, y: 0, w: 4, h: 2, constraints: [aspectRatio(16/9)] }
 * ];
 *
 * // 正方形项（像素级，非网格单位）
 * <GridLayout constraints={[gridBounds, minMaxSize, aspectRatio(1)]} />
 * ```
 */
export function aspectRatio(ratio: number): LayoutConstraint {
	return {
		name: `aspectRatio(${ratio})`,

		constrainSize(
			_item: LayoutItem,
			w: number,
			_h: number,
			_handle: ResizeHandleAxis,
			context: ConstraintContext,
		): { w: number; h: number } {
			const { cols, containerWidth, rowHeight, margin } = context;
			// 计算列宽（像素）
			// colWidth = (containerWidth - margin[0] * (cols - 1)) / cols
			// 注意：简化公式假设没有容器内边距
			const colWidth = (containerWidth - margin[0] * (cols - 1)) / cols;

			// 计算项的像素宽度
			// pixelWidth = colWidth * w + margin[0] * (w - 1)
			const pixelWidth = colWidth * w + margin[0] * Math.max(0, w - 1);

			// 计算宽高比所需的像素高度
			const pixelHeight = pixelWidth / ratio;

			// 将像素高度转换回网格单位
			// pixelHeight = rowHeight * h + margin[1] * (h - 1)
			// 求解 h:
			// pixelHeight = h * (rowHeight + margin[1]) - margin[1]
			// h = (pixelHeight + margin[1]) / (rowHeight + margin[1])
			const h = Math.max(
				1,
				Math.round((pixelHeight + margin[1]) / (rowHeight + margin[1])),
			);

			return { w, h };
		},
	};
}

/**
 * 创建网格吸附约束
 *
 * 将位置吸附到指定步长的倍数。
 * 用于将项对齐到更粗的网格。
 *
 * @param stepX - 水平吸附步长（网格单位）
 * @param stepY - 垂直吸附步长（网格单位，默认等于 stepX）
 * @returns 吸附到网格的约束
 *
 * @example
 * ```typescript
 * // 每 2 个网格单位吸附
 * <GridLayout constraints={[snapToGrid(2), gridBounds]} />
 *
 * // 不同的水平和垂直吸附
 * <GridLayout constraints={[snapToGrid(2, 3), gridBounds]} />
 * ```
 */
export function snapToGrid(stepX: number, stepY: number = stepX): LayoutConstraint {
	// 验证步长值，防止除零或无效吸附
	if (stepX <= 0 || stepY <= 0) {
		throw new Error(
			`snapToGrid: 步长值必须为正数 (got stepX=${stepX}, stepY=${stepY})`,
		);
	}

	return {
		name: `snapToGrid(${stepX}, ${stepY})`,

		constrainPosition(_item: LayoutItem, x: number, y: number): { x: number; y: number } {
			return {
				x: Math.round(x / stepX) * stepX,
				y: Math.round(y / stepY) * stepY,
			};
		},
	};
}

/**
 * 创建最小尺寸约束
 *
 * 为使用此约束的所有项设置最小宽度和高度。
 * 适用于网格级别的最小值，无需在每项上设置 minW/minH。
 *
 * @param minW - 最小宽度（网格单位）
 * @param minH - 最小高度（网格单位）
 * @returns 强制最小尺寸的约束
 */
export function minSize(minW: number, minH: number): LayoutConstraint {
	return {
		name: `minSize(${minW}, ${minH})`,

		constrainSize(_item: LayoutItem, w: number, h: number): { w: number; h: number } {
			return {
				w: Math.max(minW, w),
				h: Math.max(minH, h),
			};
		},
	};
}

/**
 * 创建最大尺寸约束
 *
 * 为使用此约束的所有项设置最大宽度和高度。
 * 适用于网格级别的最大值，无需在每项上设置 maxW/maxH。
 *
 * @param maxW - 最大宽度（网格单位）
 * @param maxH - 最大高度（网格单位）
 * @returns 强制最大尺寸的约束
 */
export function maxSize(maxW: number, maxH: number): LayoutConstraint {
	return {
		name: `maxSize(${maxW}, ${maxH})`,

		constrainSize(_item: LayoutItem, w: number, h: number): { w: number; h: number } {
			return {
				w: Math.min(maxW, w),
				h: Math.min(maxH, h),
			};
		},
	};
}

// ============================================================================
// 默认约束
// ============================================================================

/**
 * 未指定约束时应用的默认约束
 *
 * 包括:
 * - gridBounds: 保持项在网格内
 * - minMaxSize: 遵守每项的最小/最大约束
 */
export const defaultConstraints: LayoutConstraint[] = [gridBounds, minMaxSize];

// ============================================================================
// 约束应用函数
// ============================================================================

/**
 * 将位置约束应用到建议的位置
 *
 * 约束按数组顺序应用，允许组合。
 * 网格级别约束先应用，然后是项级别约束。
 *
 * @param constraints - 要应用的约束数组
 * @param item - 被定位的布局项
 * @param x - 建议的 x 位置
 * @param y - 建议的 y 位置
 * @param context - 网格上下文（cols, maxRows 等）
 * @returns 约束后的位置
 */
export function applyPositionConstraints(
	constraints: LayoutConstraint[],
	item: LayoutItem,
	x: number,
	y: number,
	context: ConstraintContext,
): { x: number; y: number } {
	let result = { x, y };

	// 应用网格级别约束
	for (const constraint of constraints) {
		if (constraint.constrainPosition) {
			result = constraint.constrainPosition(item, result.x, result.y, context);
		}
	}

	// 应用项级别约束
	if (item.constraints) {
		for (const constraint of item.constraints) {
			if (constraint.constrainPosition) {
				result = constraint.constrainPosition(item, result.x, result.y, context);
			}
		}
	}

	return result;
}

/**
 * 将尺寸约束应用到建议的尺寸
 *
 * 约束按数组顺序应用，允许组合。
 * 网格级别约束先应用，然后是项级别约束。
 *
 * @param constraints - 要应用的约束数组
 * @param item - 被缩放的布局项
 * @param w - 建议的宽度
 * @param h - 建议的高度
 * @param handle - 正在使用的缩放把手方向
 * @param context - 网格上下文（cols, maxRows 等）
 * @returns 约束后的尺寸
 */
export function applySizeConstraints(
	constraints: LayoutConstraint[],
	item: LayoutItem,
	w: number,
	h: number,
	handle: ResizeHandleAxis,
	context: ConstraintContext,
): { w: number; h: number } {
	let result = { w, h };

	// 应用网格级别约束
	for (const constraint of constraints) {
		if (constraint.constrainSize) {
			result = constraint.constrainSize(item, result.w, result.h, handle, context);
		}
	}

	// 应用项级别约束
	if (item.constraints) {
		for (const constraint of item.constraints) {
			if (constraint.constrainSize) {
				result = constraint.constrainSize(item, result.w, result.h, handle, context);
			}
		}
	}

	return result;
}
