import type { ResizeHandle } from 'react-resizable';

/**
 * 缩放把手方向类型
 * - 基数方向: 'n', 's', 'e', 'w' (北、南、东、西)
 * - 对角方向: 'ne', 'nw', 'se', 'sw'
 */
export type ResizeHandleAxis = 's' | 'w' | 'e' | 'n' | 'sw' | 'nw' | 'se' | 'ne';

export type LayoutItem = {
	w: number;
	h: number;
	x: number;
	y: number;
	i: string;
	minW?: number;
	minH?: number;
	maxW?: number;
	maxH?: number;
	moved?: boolean;
	static?: boolean;
	isDraggable?: boolean;
	isResizable?: boolean;
	resizeHandles?: ResizeHandle[]; // 缩放把手方向数组
	isBounded?: boolean;
	/** 项级别的布局约束，与网格级别约束叠加应用 */
	constraints?: LayoutConstraint[];
};
export type Layout = LayoutItem[];

export type Position = {
	left: number;
	top: number;
	width: number;
	height: number;
};

export type PartialPosition = { left: number; top: number };

export type CompactType = 'horizontal' | 'vertical' | null | undefined;

/**
 * 使 T 的所有属性可变（移除 readonly）
 */
export type Mutable<T> = {
	-readonly [P in keyof T]: T[P];
};

/**
 * 布局压缩策略接口
 *
 * 实现此接口可创建自定义的压缩算法。
 *
 * @example
 * ```typescript
 * const myCompactor: Compactor = {
 *   type: 'vertical',
 *   allowOverlap: false,
 *   compact(layout, cols) {
 *     // 自定义压缩逻辑
 *     return compactedLayout;
 *   }
 * };
 * ```
 */
export interface Compactor {
	/** 压缩类型标识符 */
	readonly type: CompactType;

	/**
	 * 是否允许项重叠（堆叠在同一位置）
	 *
	 * 为 true 时:
	 * - 项可以放置在其他项之上
	 * - 拖拽到另一个项上不会推开它
	 * - 拖拽/缩放后跳过压缩
	 */
	readonly allowOverlap: boolean;

	/**
	 * 是否阻止会导致碰撞的移动
	 *
	 * 为 true 时（且 allowOverlap 为 false）:
	 * - 拖拽到另一个项上会被阻止（项会弹回）
	 * - 其他项不会被推开
	 * - 仅影响拖拽/缩放，不影响压缩
	 *
	 * 当 allowOverlap 为 true 时无效
	 */
	readonly preventCollision?: boolean;

	/**
	 * 压缩布局
	 *
	 * @param layout - 要压缩的布局
	 * @param cols - 网格列数
	 * @returns 压缩后的布局
	 */
	compact(layout: Layout, cols: number): Layout;
}

/**
 * 约束函数在拖拽/缩放操作期间提供的上下文信息
 */
export interface ConstraintContext {
	/** 网格列数 */
	cols: number;
	/** 最大行数（无限制时为 Infinity） */
	maxRows: number;
	/** 容器宽度（像素） */
	containerWidth: number;
	/** 容器高度（像素，自动高度时可能为 0） */
	containerHeight: number;
	/** 行高（像素） */
	rowHeight: number;
	/** 项之间的间距 [水平, 垂直]（像素） */
	margin: readonly [number, number];
	/** 当前布局状态 */
	layout: Layout;
}

/**
 * 布局约束接口
 *
 * 实现此接口可创建自定义的位置/尺寸约束。
 * 内置约束: gridBounds, minMaxSize, containerBounds, boundedX, boundedY
 *
 * @example
 * ```typescript
 * // 网格级别约束
 * <GridLayout constraints={[gridBounds, minMaxSize, aspectRatio(16/9)]} />
 *
 * // 项级别约束
 * const layout = [
 *   { i: 'video', x: 0, y: 0, w: 4, h: 2, constraints: [aspectRatio(16/9)] }
 * ];
 * ```
 */
export interface LayoutConstraint {
	/** 约束标识符，用于调试 */
	readonly name: string;

	/**
	 * 在拖拽操作期间约束位置。
	 * 在网格单位转换后、布局更新前调用。
	 *
	 * @param item - 被拖拽的项
	 * @param x - 建议的 x 位置（网格单位）
	 * @param y - 建议的 y 位置（网格单位）
	 * @param context - 网格上下文（cols, maxRows 等）
	 * @returns 约束后的位置
	 */
	constrainPosition?(
		item: LayoutItem,
		x: number,
		y: number,
		context: ConstraintContext,
	): { x: number; y: number };

	/**
	 * 在缩放操作期间约束尺寸。
	 * 在网格单位转换后、布局更新前调用。
	 *
	 * @param item - 被缩放的项
	 * @param w - 建议的宽度（网格单位）
	 * @param h - 建议的高度（网格单位）
	 * @param handle - 正在使用的缩放把手方向
	 * @param context - 网格上下文（cols, maxRows 等）
	 * @returns 约束后的尺寸
	 */
	constrainSize?(
		item: LayoutItem,
		w: number,
		h: number,
		handle: ResizeHandleAxis,
		context: ConstraintContext,
	): { w: number; h: number };
}
