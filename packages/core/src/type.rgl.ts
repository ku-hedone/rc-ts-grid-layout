import type {
	CSSProperties,
	DragEventHandler,
	ReactNode,
	Ref,
	SyntheticEvent,
} from 'react';
import type {
	Compactor,
	DragConfig,
	DropConfig,
	GridConfig,
	Layout,
	LayoutConstraint,
	LayoutItem,
	PositionStrategy,
	ResizeConfig,
} from './type';
import { DraggableEvent } from 'react-draggable';

export type DragNativeEvent = Parameters<DragEventHandler<HTMLDivElement>>[number];

export type DroppingPosition = { left: number; top: number; e: DragNativeEvent };

type InnerHandler<T> = (
	layout: Layout,
	oldItem: LayoutItem | undefined,
	newItem: LayoutItem | undefined,
	placeholder: LayoutItem | undefined,
	event: T,
	element?: HTMLElement,
) => void;

export type DragHandler = InnerHandler<DraggableEvent>;
export type ResizeHandler = InnerHandler<SyntheticEvent>;

export interface RGLProps {
	/** 网格宽度（像素） */
	width: number;

	/** 布局数组 */
	layout?: Layout;

	/** 子元素 */
	children: ReactNode;

	// ─── 可组合配置 ───

	/** 网格测量配置（cols, rowHeight, margin, containerPadding, maxRows） */
	gridConfig?: Partial<GridConfig>;

	/** 拖拽行为配置（enabled, bounded, handle, cancel） */
	dragConfig?: Partial<DragConfig>;

	/** 缩放行为配置（enabled, handles, handleComponent） */
	resizeConfig?: Partial<ResizeConfig>;

	/** 外部拖放配置（enabled, defaultItem, onDragOver） */
	dropConfig?: Partial<DropConfig>;

	/** 布局压缩策略（替代 compactType + allowOverlap + preventCollision） */
	compactor?: Compactor;

	/** CSS 定位策略（替代 useCSSTransforms + transformScale） */
	positionStrategy?: PositionStrategy;

	/** 位置/尺寸约束数组（替代 isBounded） */
	constraints?: LayoutConstraint[];

	// ─── 回调 ───

	onLayoutChange?: (layout: Layout) => void;
	onDrag?: DragHandler;
	onDragStart?: DragHandler;
	onDragStop?: DragHandler;
	onResize?: ResizeHandler;
	onResizeStart?: ResizeHandler;
	onResizeStop?: ResizeHandler;
	onDrop?: (
		layout: Layout,
		item: LayoutItem | null | undefined,
		e: DragNativeEvent,
	) => void;

	// ─── 样式与 DOM ───

	className?: string;
	style?: CSSProperties;
	autoSize?: boolean;
	mergeStyle?: boolean;
	innerRef?: Ref<HTMLDivElement>;
	attributes?: Pick<HTMLDivElement, 'id'>;
	/**
	 * 包装元素 props，用于解决 ref 冲突。
	 * 当 children 中的组件需要自己的 ref 时，使用 wrapperProps 生成包裹元素。
	 */
	wrapperProps?: {
		style?: CSSProperties;
		className?: string;
	};
}
