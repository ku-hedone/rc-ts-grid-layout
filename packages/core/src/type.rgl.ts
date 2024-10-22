import type {
	CSSProperties,
	DragEventHandler,
	ReactNode,
	Ref,
	SyntheticEvent,
} from 'react';
import type { CompactType, Layout, LayoutItem } from './type';
import { ResizeHandle } from 'react-resizable';
import { DraggableEvent } from 'react-draggable';

export type DragNativeEvent = Parameters<DragEventHandler<HTMLDivElement>>[number];

export type DroppingPosition = { left: number; top: number; e: DragNativeEvent };

type InnerHandler<T> = (
	layout: Layout, // 假设 Layout 是之前定义好的类型
	oldItem: LayoutItem | undefined,
	newItem: LayoutItem | undefined,
	placeholder: LayoutItem | undefined,
	event: T, // 假设 Event 也是已经定义好的类型
	element?: HTMLElement,
) => void;

export type DragHandler = InnerHandler<DraggableEvent>;
export type ResizeHandler = InnerHandler<SyntheticEvent>;

export interface RGLProps {
	width: number;
	rowHeight?: number;
	layout?: Layout;
	margin?: [number, number];
	preventCollision?: boolean;
	useCSSTransforms?: boolean;

	mergeStyle?: boolean;
	attributes?: Pick<HTMLDivElement, 'id'>;

	className?: string;
	style?: CSSProperties;
	autoSize?: boolean;
	cols?: number;
	draggableCancel?: string;
	draggableHandle?: string;
	verticalCompact?: boolean;
	compactType?: CompactType;
	containerPadding?: [number, number];
	maxRows?: number;
	isBounded?: boolean;
	isDraggable?: boolean;
	isResizable?: boolean;
	isDroppable?: boolean;

	transformScale?: number;
	droppingItem?: Partial<LayoutItem>;
	resizeHandles?: ResizeHandle[];
	resizeHandle?: ResizeHandle;
	allowOverlap?: boolean;

	onLayoutChange?: (layout: Layout) => void;
	// callback
	onDrag?: DragHandler;
	onDragStart?: DragHandler;
	onDragStop?: DragHandler;

	onResize?: ResizeHandler;
	onResizeStart?: ResizeHandler;
	onResizeStop?: ResizeHandler;

	onDropDragOver?: ((e: DragNativeEvent) => { w?: number; h?: number } | false) | null;
	onDrop?: (
		layout: Layout,
		item: LayoutItem | null | undefined,
		e: DragNativeEvent,
	) => void;
	//
	children: ReactNode;
	innerRef?: Ref<HTMLDivElement>;
	/**
	 * 当 `children` 中的某些 item 是提供 `ref` 操作能力的 React 组件时，
	 * 它们的 `ref` 属性可能与实现 Draggable 功能所需的 `ref` 属性发生冲突。
	 * 实现 Draggable 功能需要将 `ref` 绑定到包裹的元素节点上，
	 * 以获取 item 最外层 HTML 标签的实时位置属性，并在位置变化时提供该元素的信息。
	 *
	 * 此时，可以使用 `wrapperProps` 来生成一个包装元素，用于绑定实现 Draggable 所需的 `ref`，
	 * 以避免冲突。`wrapperProps` 还支持传入 `style` 和 `className` 以控制样式。
	 */
	wrapperProps?: {
		// useCSSTransforms === true will omit 'transform' | 'WebkitTransform' | 'MozTransform' | 'msTransform' | 'OTransform'
		// useCSSTransforms === false will omit 'top' | 'left'
		style?: CSSProperties;
		className?: string;
	};
}
