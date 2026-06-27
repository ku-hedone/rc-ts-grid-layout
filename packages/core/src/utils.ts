/**
 * 工具函数聚合入口
 *
 * 此文件作为向后兼容的聚合入口，从各独立模块 re-export 所有函数。
 * 新代码应直接从各模块导入：
 * - collision.ts: 碰撞检测
 * - sort.ts: 排序函数
 * - layout.ts: 布局操作
 * - movement.ts: 元素移动
 * - position.ts: 样式生成
 * - compactors.ts: 压缩策略
 * - constraints.ts: 约束系统
 */

import { deepEqual } from './equals';
import { Children, isValidElement } from 'react';
import type { ReactNode } from 'react';
import type { CompactType, Layout, LayoutItem, Position } from './type';
import type { DroppingPosition } from './type.rgl';

// ============================================================================
// 从新模块 re-export（向后兼容）
// ============================================================================

// 碰撞检测
export { collides, getFirstCollision, getAllCollisions } from './collision';

// 排序函数
export { sortLayoutItems, sortLayoutItemsByRowCol, sortLayoutItemsByColRow } from './sort';

// 布局操作
export {
	bottom,
	cloneLayout,
	cloneLayoutItem,
	modifyLayout,
	withLayoutItem,
	getLayoutItem,
	getStatics,
	correctBounds,
	synchronizeLayoutWithChildren,
	validateLayout,
} from './layout';

// 元素移动
export { compact, compactItem, moveElement, moveElementAwayFromCollision } from './movement';

// 样式生成（向后兼容，新代码应从 position.ts 导入）
export { setTransform, setTopLeft, perc, resizeItemInDirection } from './position';

// ============================================================================
// 保留在此文件的函数
// ============================================================================

/**
 * 比较 React `children` 比较困难。这是一个有效的比较方式。
 * 可以检测 key、顺序和数量的差异。
 */
export function childrenEqual(a: ReactNode, b: ReactNode): boolean {
	const sameElement = deepEqual(
		Children.map(a, (c) => {
			return isValidElement(c) ? c.key : void 0;
		}),
		Children.map(b, (c) => {
			return isValidElement(c) ? c.key : void 0;
		}),
	);
	const sameDataProps = deepEqual(
		Children.map(a, (c) => {
			return isValidElement<{ 'data-grid'?: unknown }>(c)
				? c.props['data-grid']
				: void 0;
		}),
		Children.map(b, (c) => {
			return isValidElement<{ 'data-grid'?: unknown }>(c)
				? c.props['data-grid']
				: void 0;
		}),
	);
	return sameElement && sameDataProps;
}

export const fastRGLPropsEqual = (
	a: Record<string, unknown>,
	b: Record<string, unknown>,
	isEqualImpl: (a: unknown, b: unknown) => boolean,
) => {
	if (a === b) return true;
	return (
		// 数值类型
		a.width === b.width &&
		a.cols === b.cols &&
		a.rowHeight === b.rowHeight &&
		a.maxRows === b.maxRows &&
		a.transformScale === b.transformScale &&
		// 字符串类型
		a.className === b.className &&
		a.draggableCancel === b.draggableCancel &&
		a.draggableHandle === b.draggableHandle &&
		a.compactType === b.compactType &&
		// 布尔类型
		a.verticalCompact === b.verticalCompact &&
		a.autoSize === b.autoSize &&
		a.isBounded === b.isBounded &&
		a.isDraggable === b.isDraggable &&
		a.isResizable === b.isResizable &&
		a.allowOverlap === b.allowOverlap &&
		a.preventCollision === b.preventCollision &&
		a.useCSSTransforms === b.useCSSTransforms &&
		a.isDroppable === b.isDroppable &&
		a.mergeStyle === b.mergeStyle &&
		// 函数类型
		a.onLayoutChange === b.onLayoutChange &&
		a.onDragStart === b.onDragStart &&
		a.onDrag === b.onDrag &&
		a.onDragStop === b.onDragStop &&
		a.onResizeStart === b.onResizeStart &&
		a.onResize === b.onResize &&
		a.onResizeStop === b.onResizeStop &&
		a.onDrop === b.onDrop &&
		a.onDropDragOver === b.onDropDragOver &&
		// 数组类型
		isEqualImpl(a.resizeHandles, b.resizeHandles) &&
		isEqualImpl(a.layout, b.layout) &&
		isEqualImpl(a.margin, b.margin) &&
		isEqualImpl(a.constraints, b.constraints) &&
		// 对象类型
		isEqualImpl(a.resizeHandle, b.resizeHandle) &&
		isEqualImpl(a.style, b.style) &&
		isEqualImpl(a.containerPadding, b.containerPadding) &&
		isEqualImpl(a.droppingItem, b.droppingItem) &&
		isEqualImpl(a.innerRef, b.innerRef) &&
		isEqualImpl(a.attributes, b.attributes) &&
		isEqualImpl(a.wrapperProps, b.wrapperProps)
	);
};

// 类似上面的函数，但更简单。
export function fastPositionEqual(a: Position, b: Position): boolean {
	return (
		a.left === b.left && a.top === b.top && a.width === b.width && a.height === b.height
	);
}

// 对 verticalCompact: false 的旧版兼容
export function compactType(props?: {
	verticalCompact: boolean;
	compactType: CompactType;
}): CompactType {
	const { verticalCompact, compactType } = props || {};
	return verticalCompact === false ? null : compactType;
}

export const noop = () => {
	return void 0;
};

export function getIndentationValue<T extends [number, number] | undefined>(
	param: { [key: string]: T } | T,
	breakpoint: string,
): T | undefined {
	if (!param) return void 0;
	return Array.isArray(param) ? param : param[breakpoint];
}

const droppingPositionCompare = (prev?: DroppingPosition, next?: DroppingPosition) => {
	if (prev === next) {
		return true;
	}
	if (typeof prev !== 'undefined' && typeof next !== 'undefined') {
		return prev.left === next.left && prev.top === next.top;
	}
	return false;
};

export const fastGridItemPropsEqual = (
	prev: Record<string, unknown>,
	next: Record<string, unknown>,
	isEqualImpl: (a: unknown, b: unknown) => boolean,
) => {
	// 子元素
	if (prev === next) return true;
	const areDroppingPositionEquals = droppingPositionCompare(
		prev.droppingPosition as DroppingPosition,
		next.droppingPosition as DroppingPosition,
	);
	return (
		// 对象类型
		prev.children === next.children &&
		prev.style === next.style &&
		prev.wrapperProps === next.wrapperProps &&
		prev.resizeHandle === next.resizeHandle &&
		areDroppingPositionEquals &&
		// 函数类型
		prev.onDragStart === next.onDragStart &&
		prev.onDrag === next.onDrag &&
		prev.onDragStop === next.onDragStop &&
		prev.onResizeStart === next.onResizeStart &&
		prev.onResize === next.onResize &&
		prev.onResizeStop === next.onResizeStop &&
		// 数值类型
		prev.x === next.x &&
		prev.y === next.y &&
		prev.w === next.w &&
		prev.h === next.h &&
		prev.minH === next.minH &&
		prev.maxH === next.maxH &&
		prev.minW === next.minW &&
		prev.maxW === next.maxW &&
		prev.cols === next.cols &&
		prev.rowHeight === next.rowHeight &&
		prev.maxRows === next.maxRows &&
		prev.containerWidth === next.containerWidth &&
		prev.transformScale === next.transformScale &&
		// 布尔类型
		prev.isDraggable === next.isDraggable &&
		prev.isResizable === next.isResizable &&
		prev.isBounded === next.isBounded &&
		prev.static === next.static &&
		prev.useCSSTransforms === next.useCSSTransforms &&
		prev.usePercentages === next.usePercentages &&
		// 字符串类型
		prev.i === next.i &&
		prev.className === next.className &&
		prev.cancel === next.cancel &&
		prev.handle === next.handle &&
		// 数组类型
		isEqualImpl(prev.resizeHandles, next.resizeHandles) &&
		isEqualImpl(prev.containerPadding, next.containerPadding) &&
		isEqualImpl(prev.margin, next.margin) &&
		isEqualImpl(prev.constraints, next.constraints) &&
		isEqualImpl(prev.itemConstraints, next.itemConstraints) &&
		isEqualImpl(prev.layout, next.layout)
	);
};
