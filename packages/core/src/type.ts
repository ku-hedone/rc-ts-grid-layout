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

/**
 * 布局是只读的布局项数组
 * 布局应被视为不可变的
 */
export type Layout = readonly LayoutItem[];

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

/**
 * CSS 定位策略接口
 *
 * 实现此接口可自定义项在 DOM 中的定位方式。
 * 内置策略: transformStrategy, absoluteStrategy
 *
 * @example
 * ```typescript
 * // 使用基于 transform 的定位（默认，性能更好）
 * <GridLayout positionStrategy={transformStrategy} />
 *
 * // 使用 top/left 定位（用于 transform 导致问题的场景）
 * <GridLayout positionStrategy={absoluteStrategy} />
 *
 * // 使用缩放 transform（用于缩放容器）
 * <GridLayout positionStrategy={createScaledStrategy(0.5)} />
 * ```
 */
export interface PositionStrategy {
	/** 策略类型标识符 */
	readonly type: 'transform' | 'absolute';

	/** 拖拽/缩放计算的缩放因子 */
	readonly scale: number;

	/**
	 * 将像素位置转换为 CSS 样式对象
	 *
	 * @param pos - 像素位置
	 * @returns 用于定位元素的 CSS 属性
	 */
	calcStyle(pos: Position): React.CSSProperties;

	/**
	 * 在拖拽操作期间计算位置，考虑 transform 和缩放
	 *
	 * 此方法可选。未提供时，react-draggable 使用其内置的
	 * 父元素相对坐标计算。仅在需要自定义坐标处理时覆盖此方法，
	 * 例如缩放容器场景。
	 *
	 * @param clientX - 鼠标客户端 X 位置
	 * @param clientY - 鼠标客户端 Y 位置
	 * @param offsetX - 相对于元素原点的 X 偏移
	 * @param offsetY - 相对于元素原点的 Y 偏移
	 * @returns 调整后的 left/top 位置
	 */
	calcDragPosition?(clientX: number, clientY: number, offsetX: number, offsetY: number): PartialPosition;
}

// ============================================================================
// 网格配置类型（v2 可组合接口）
// ============================================================================

/**
 * 网格测量配置
 * 将所有网格指标（列数、行高、边距）分组
 */
export interface GridConfig {
	/** 网格列数（默认: 12） */
	cols: number;

	/** 单行高度（像素）（默认: 150） */
	rowHeight: number;

	/** [水平, 垂直] 项之间的间距（像素）（默认: [10, 10]） */
	margin: readonly [number, number];

	/** [水平, 垂直] 容器内边距（像素）（默认: null，使用 margin） */
	containerPadding: readonly [number, number] | null;

	/** 最大行数（默认: Infinity） */
	maxRows: number;
}

/** 默认网格配置 */
export const defaultGridConfig: GridConfig = {
	cols: 12,
	rowHeight: 150,
	margin: [10, 10],
	containerPadding: null,
	maxRows: Infinity,
};

/**
 * 拖拽行为配置
 * 将所有拖拽相关设置分组
 */
export interface DragConfig {
	/** 是否可拖拽（默认: true） */
	enabled: boolean;

	/** 是否限制在容器内（默认: false） */
	bounded: boolean;

	/** 拖拽把手的 CSS 选择器（如 '.drag-handle'） */
	handle?: string;

	/** 不触发拖拽的元素的 CSS 选择器 */
	cancel?: string;

	/**
	 * 拖拽开始前的最小移动像素数
	 * 区分点击和拖拽（修复 #1341, #1401）
	 * @default 3
	 */
	threshold: number;
}

/** 默认拖拽配置 */
export const defaultDragConfig: DragConfig = {
	enabled: true,
	bounded: false,
	threshold: 3,
};

/**
 * 缩放行为配置
 * 将所有缩放相关设置分组
 */
export interface ResizeConfig {
	/** 是否可缩放（默认: true） */
	enabled: boolean;

	/** 显示哪些缩放把手（默认: ['se']） */
	handles: readonly ResizeHandleAxis[];

	/**
	 * 自定义缩放把手组件
	 * 可以是 React 节点或接收 axis 的函数
	 */
	handleComponent?: React.ReactNode | ((axis: ResizeHandleAxis, ref: React.Ref<HTMLElement>) => React.ReactNode);
}

/** 默认缩放配置 */
export const defaultResizeConfig: ResizeConfig = {
	enabled: true,
	handles: ['se'],
};

/**
 * 拖放配置（用于拖放外部元素）
 * 将所有拖放相关设置分组
 */
export interface DropConfig {
	/** 是否可拖放外部元素到网格（默认: false） */
	enabled: boolean;

	/** 拖放项的默认尺寸（默认: { w: 1, h: 1 }） */
	defaultItem: { w: number; h: number };

	/**
	 * 在网格上拖拽时调用
	 * 返回尺寸以覆盖 defaultItem，或 false 以拒绝拖放
	 * 也可以返回 dragOffsetX/dragOffsetY 以指定光标偏移量用于居中
	 */
	onDragOver?: (e: DragEvent) => { w?: number; h?: number; dragOffsetX?: number; dragOffsetY?: number } | false | void;
}

/** 默认拖放配置 */
export const defaultDropConfig: DropConfig = {
	enabled: false,
	defaultItem: { w: 1, h: 1 },
};
