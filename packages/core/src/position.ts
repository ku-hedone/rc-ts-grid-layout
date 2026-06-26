/**
 * 位置计算工具函数
 *
 * 这些函数在网格单位和像素位置之间转换，
 * 并为网格项生成 CSS 样式。
 */

import type { Position, PartialPosition, ResizeHandleAxis, PositionStrategy } from './type';

// ============================================================================
// CSS 样式生成
// ============================================================================

/**
 * 生成基于 CSS transform 的定位样式
 *
 * 使用 transform 比 top/left 定位更高效，
 * 因为它不会触发布局重新计算。
 *
 * @param position - 像素位置
 * @returns CSS 样式对象
 */
export function setTransform({ top, left, width, height }: Position): Record<string, string> {
	const translate = `translate(${left}px,${top}px)`;
	return {
		transform: translate,
		WebkitTransform: translate,
		MozTransform: translate,
		msTransform: translate,
		OTransform: translate,
		width: `${width}px`,
		height: `${height}px`,
		position: 'absolute',
	};
}

/**
 * 生成基于 CSS top/left 的定位样式
 *
 * 当 transform 不适用时使用此函数（如打印场景
 * 或 transform 导致子元素定位问题时）。
 *
 * @param position - 像素位置
 * @returns CSS 样式对象
 */
export function setTopLeft({ top, left, width, height }: Position): Record<string, string> {
	return {
		top: `${top}px`,
		left: `${left}px`,
		width: `${width}px`,
		height: `${height}px`,
		position: 'absolute',
	};
}

/**
 * 将数字转换为百分比字符串
 *
 * @param num - 要转换的数字（通常是 0-1 范围）
 * @returns 百分比字符串（如 "50%"）
 */
export function perc(num: number): string {
	return num * 100 + '%';
}

// ============================================================================
// 缩放方向处理
// ============================================================================

/**
 * 限制宽度不溢出容器
 */
function constrainWidth(
	left: number,
	currentWidth: number,
	newWidth: number,
	containerWidth: number,
): number {
	return left + newWidth > containerWidth ? currentWidth : newWidth;
}

/**
 * 限制高度不超出容器顶部（负 top）
 */
function constrainHeight(top: number, currentHeight: number, newHeight: number): number {
	return top < 0 ? currentHeight : newHeight;
}

/**
 * 限制 left 不为负
 */
function constrainLeft(left: number): number {
	return Math.max(0, left);
}

/**
 * 限制 top 不为负
 */
function constrainTop(top: number): number {
	return Math.max(0, top);
}

// 方向处理器类型
type ResizeHandler = (currentSize: Position, newSize: Position, containerWidth: number) => Position;

const resizeNorth: ResizeHandler = (currentSize, newSize, _containerWidth) => {
	const { left, height, width } = newSize;
	const top = currentSize.top - (height - currentSize.height);

	return {
		left,
		width,
		height: constrainHeight(top, currentSize.height, height),
		top: constrainTop(top),
	};
};

const resizeEast: ResizeHandler = (currentSize, newSize, containerWidth) => {
	const { top, left, height, width } = newSize;
	return {
		top,
		height,
		width: constrainWidth(currentSize.left, currentSize.width, width, containerWidth),
		left: constrainLeft(left),
	};
};

const resizeWest: ResizeHandler = (currentSize, newSize, _containerWidth) => {
	const { top, height, width } = newSize;
	const left = currentSize.left + currentSize.width - width;

	if (left < 0) {
		return {
			height,
			width: currentSize.left + currentSize.width,
			top: constrainTop(top),
			left: 0,
		};
	}

	return {
		height,
		width,
		top: constrainTop(top),
		left,
	};
};

const resizeSouth: ResizeHandler = (currentSize, newSize, _containerWidth) => {
	const { top, left, height, width } = newSize;
	return {
		width,
		left,
		height: constrainHeight(top, currentSize.height, height),
		top: constrainTop(top),
	};
};

// 复合方向（角落）
const resizeNorthEast: ResizeHandler = (currentSize, newSize, containerWidth) =>
	resizeNorth(currentSize, resizeEast(currentSize, newSize, containerWidth), containerWidth);

const resizeNorthWest: ResizeHandler = (currentSize, newSize, containerWidth) =>
	resizeNorth(currentSize, resizeWest(currentSize, newSize, containerWidth), containerWidth);

const resizeSouthEast: ResizeHandler = (currentSize, newSize, containerWidth) =>
	resizeSouth(currentSize, resizeEast(currentSize, newSize, containerWidth), containerWidth);

const resizeSouthWest: ResizeHandler = (currentSize, newSize, containerWidth) =>
	resizeSouth(currentSize, resizeWest(currentSize, newSize, containerWidth), containerWidth);

const resizeHandlerMap: Record<ResizeHandleAxis, ResizeHandler> = {
	n: resizeNorth,
	ne: resizeNorthEast,
	e: resizeEast,
	se: resizeSouthEast,
	s: resizeSouth,
	sw: resizeSouthWest,
	w: resizeWest,
	nw: resizeNorthWest,
};

/**
 * 在指定方向上缩放项，限制在容器边界内
 *
 * 处理从不同边缘/角落缩放的复杂逻辑，
 * 确保项不会溢出容器。
 *
 * @param direction - 正在拖拽的边缘/角落
 * @param currentSize - 当前位置和尺寸
 * @param newSize - 请求的新位置和尺寸
 * @param containerWidth - 容器宽度
 * @returns 限制后的位置和尺寸
 */
export function resizeItemInDirection(
	direction: ResizeHandleAxis,
	currentSize: Position,
	newSize: Position,
	containerWidth: number,
): Position {
	const handler = resizeHandlerMap[direction];

	// 如果找不到方向则回退（不应该发生，但类型检查需要）
	if (!handler) {
		return newSize;
	}

	return handler(currentSize, { ...currentSize, ...newSize }, containerWidth);
}

// ============================================================================
// 位置策略（v2 可组合接口）
// ============================================================================

/**
 * 基于 CSS transform 的定位策略
 *
 * 使用 CSS transform 进行定位，性能更好，
 * 不会触发布局重新计算。
 *
 * 这是默认策略。
 */
export const transformStrategy: PositionStrategy = {
	type: 'transform',
	scale: 1,

	calcStyle(pos: Position): React.CSSProperties {
		return setTransform(pos) as React.CSSProperties;
	},
};

/**
 * 绝对定位（top/left）策略
 *
 * 使用 CSS top/left 进行定位。当 CSS transform
 * 导致问题时使用此策略（如打印、某些子元素定位问题）。
 */
export const absoluteStrategy: PositionStrategy = {
	type: 'absolute',
	scale: 1,

	calcStyle(pos: Position): React.CSSProperties {
		return setTopLeft(pos) as React.CSSProperties;
	},
};

/**
 * 创建缩放 transform 策略
 *
 * 当网格容器在缩放元素内时使用此策略
 * （如 `transform: scale(0.5)`）。缩放因子会调整
 * 拖拽/缩放计算以考虑父元素的 transform。
 *
 * @param scale - 缩放因子（如 0.5 为半尺寸）
 * @returns 带缩放计算的位置策略
 *
 * @example
 * ```tsx
 * <div style={{ transform: 'scale(0.5)' }}>
 *   <GridLayout positionStrategy={createScaledStrategy(0.5)} />
 * </div>
 * ```
 */
export function createScaledStrategy(scale: number): PositionStrategy {
	return {
		type: 'transform',
		scale,

		calcStyle(pos: Position): React.CSSProperties {
			return setTransform(pos) as React.CSSProperties;
		},

		calcDragPosition(
			clientX: number,
			clientY: number,
			offsetX: number,
			offsetY: number,
		): PartialPosition {
			return {
				left: (clientX - offsetX) / scale,
				top: (clientY - offsetY) / scale,
			};
		},
	};
}

/** 默认位置策略（基于 transform） */
export const defaultPositionStrategy = transformStrategy;
