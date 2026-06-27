import type { Layout } from './type';
import type { RGLProps } from './type.rgl';

export type Breakpoint = 'lg' | 'md' | 'sm' | 'xs' | 'xxs';

export type ResponsiveLayout<T extends Breakpoint> = {
	readonly [breakpoint in T]: Layout;
};
export type Breakpoints<T extends Breakpoint> = {
	readonly [breakpoint in T]: number;
};

type PassThroughPropKeys =
	| 'children'
	| 'innerRef'
	| 'className'
	| 'style'
	| 'width'
	| 'autoSize'
	| 'layout'
	| 'gridConfig'
	| 'dragConfig'
	| 'resizeConfig'
	| 'dropConfig'
	| 'compactor'
	| 'positionStrategy'
	| 'constraints'
	| 'onDrag'
	| 'onDragStart'
	| 'onDragStop'
	| 'onResize'
	| 'onResizeStart'
	| 'onResizeStop'
	| 'onDrop';

export interface ResponsiveRGLProps extends Pick<RGLProps, PassThroughPropKeys> {
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
	margin?: { [key in Breakpoint]: [number, number] } | [number, number];

	onWidthChange?: (
		containerWidth: number,
		margin: [number, number],
		cols: number,
		containerPadding: [number, number] | undefined,
	) => void;
}
