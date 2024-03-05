import type { Layout } from './type';
import type { RGLProps } from './type.rgl';

export type Breakpoint = 'lg' | 'md' | 'sm' | 'xs' | 'xxs';

export type ResponsiveLayout<T extends Breakpoint> = {
	readonly [breakpoint in T]: Layout;
};
export type Breakpoints<T extends Breakpoint> = {
	readonly [breakpoint in T]: number;
};

type ExtendCallbackPropKeys =
	| 'onDrag'
	| 'onDragStart'
	| 'onDragStop'
	| 'onResize'
	| 'onResizeStart'
	| 'onResizeStop'
	| 'onDropDragOver'
	| 'onDrop';

type ExtendPropKeys =
	| 'children'
	| 'innerRef'
	| 'className'
	| 'style'
	| 'width'
	| 'autoSize'
	| 'allowOverlap'
	| 'compactType'
	| 'verticalCompact'
	| 'layout'
	| 'rowHeight'
	| 'maxRows'
	| 'isBounded'
	| 'preventCollision'
	| 'useCSSTransforms'
	| 'transformScale'
	| 'droppingItem';

type ExtendDropPropsKeys = 'isDroppable';

type ExtendDragPropsKeys = 'isDraggable' | 'draggableCancel' | 'draggableHandle';

type ExtendResizePropsKeys = 'isResizable' | 'resizeHandles' | 'resizeHandle';

export interface ResponsiveRGLProps
	extends Pick<
		RGLProps,
		| ExtendPropKeys
		| ExtendCallbackPropKeys
		| ExtendDragPropsKeys
		| ExtendResizePropsKeys
		| ExtendDropPropsKeys
	> {
	breakpoint?: Breakpoint;
	breakpoints?: Breakpoints<Breakpoint>;
	layouts?: ResponsiveLayout<Breakpoint>;

	onBreakpointChange?: (breakpoint: Breakpoint, cols: number) => void;
	/**
	 * onLayoutChange with Breakpoint
	 */
	onLayoutChange?: (layout: Layout, layouts: { [key in Breakpoint]: Layout }) => void;
	/**
	 * cols with Breakpoint
	 */
	cols?: { [key in Breakpoint]: number };
	/**
	 * containerPadding with Breakpoint
	 */
	containerPadding?: { [key in Breakpoint]?: [number, number] } | [number, number];
	/**
	 * margin with Breakpoint
	 */
	margin?: { [key in Breakpoint]: RGLProps['margin'] } | RGLProps['margin'];

	onWidthChange?: (
		containerWidth: number,
		margin: RGLProps['margin'],
		cols: RGLProps['cols'],
		containerPadding: RGLProps['containerPadding'],
	) => void;
}
