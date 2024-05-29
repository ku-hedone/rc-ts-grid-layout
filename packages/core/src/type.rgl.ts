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
	wrapperProps?: {
		style?: CSSProperties;
		className?: string;
	};
	innerRef?: Ref<HTMLDivElement>;
}
