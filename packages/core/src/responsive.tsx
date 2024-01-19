import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { deepEqual } from './equals';
import { cloneLayout, synchronizeLayoutWithChildren, getIndentationValue } from './utils';
import {
	getBreakpointFromWidth,
	getColsFromBreakpoint,
	findOrGenerateResponsiveLayout,
} from './utils.responsive';
import GridLayout from './grid';
import type { Layout } from './type';
import type { Breakpoint, ResponsiveLayout, ResponsiveRGLProps } from './type.responsive';

const defaultProps = {
	breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
	cols: { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 },
	layouts: {} as any,
	margin: [10, 10] as [number, number],
	allowOverlap: false,
};

const ResponsiveGridLayout = (props: ResponsiveRGLProps) => {
	const {
		breakpoint,
		breakpoints = defaultProps.breakpoints,
		cols = defaultProps.cols,
		layouts = defaultProps.layouts,
		width,
		margin = defaultProps.margin,
		containerPadding = {},
		allowOverlap = defaultProps.allowOverlap,
		onBreakpointChange,
		onLayoutChange,
		onWidthChange,
		compactType,
		children,
		...otherProps
	} = props;

	const innerLayouts = useRef<ResponsiveLayout<Breakpoint>>(layouts);

	const lastProps = useRef({
		width,
		breakpoint,
		breakpoints,
		cols,
	});

	const [nextBreakpoint, nextCols] = useMemo(() => {
		const nextBreakpoint = breakpoint || getBreakpointFromWidth(breakpoints, width);
		return [nextBreakpoint, getColsFromBreakpoint(nextBreakpoint, cols)];
	}, [breakpoints, breakpoint, width, cols]);

	const [state, setState] = useState({
		breakpoint: nextBreakpoint,
		cols: nextCols,
	});

	const innerMargin = useMemo(
		() => getIndentationValue(margin, state.breakpoint),
		[state.breakpoint, margin],
	);

	const innerContainerPadding = useMemo(
		() => getIndentationValue(containerPadding, state.breakpoint),
		[containerPadding, state.breakpoint],
	);

	const [innerLayout, setLayout] = useState(() =>
		findOrGenerateResponsiveLayout(
			layouts,
			breakpoints,
			nextBreakpoint,
			nextBreakpoint,
			nextCols,
			otherProps.verticalCompact === false ? void 0 : compactType,
		),
	);

	// 当 layouts 变化时 重置 layout
	useEffect(() => {
		if (!deepEqual(layouts, innerLayouts.current)) {
			const nextLayout = findOrGenerateResponsiveLayout(
				layouts,
				breakpoints,
				state.breakpoint,
				state.breakpoint,
				state.cols,
				compactType,
			);
			innerLayouts.current = layouts;
			setLayout(nextLayout);
		}
	}, [layouts, breakpoints, compactType, state]);

	const onInnerWidthChange = useCallback(
		// breakpoints or cols changed
		(changed: boolean) => {
			if (state.breakpoint !== nextBreakpoint || changed) {
				// Preserve the current layout if the current breakpoint is not present in the next layouts.
				if (!(state.breakpoint in layouts)) {
					innerLayouts.current = {
						...innerLayouts.current,
						[state.breakpoint]: cloneLayout(innerLayout),
					};
				}
				// Find or generate a new layout.
				let nextLayout = findOrGenerateResponsiveLayout(
					{ ...innerLayouts.current },
					breakpoints,
					layouts,
					nextBreakpoint,
					nextCols,
					compactType,
				);
				// This adds missing items.
				nextLayout = synchronizeLayoutWithChildren(
					nextLayout,
					children,
					nextCols,
					compactType,
					allowOverlap,
				);

				innerLayouts.current = {
					...innerLayouts.current,
					[nextBreakpoint]: nextLayout,
				};
				if (typeof onLayoutChange === 'function') {
					onLayoutChange(nextLayout, innerLayouts.current);
				}
				if (typeof onBreakpointChange === 'function') {
					onBreakpointChange(nextBreakpoint, nextCols);
				}
				setState({
					breakpoint: nextBreakpoint,
					cols: nextCols,
				});
				setLayout(nextLayout);
			}
			const marginValue = getIndentationValue(margin, nextBreakpoint);
			const containerPaddingValue = getIndentationValue(containerPadding, nextBreakpoint);
			if (typeof onWidthChange === 'function') {
				onWidthChange(width, marginValue, nextCols, containerPaddingValue);
			}
		},
		[
			allowOverlap,
			breakpoints,
			children,
			compactType,
			containerPadding,
			innerLayout,
			layouts,
			margin,
			nextBreakpoint,
			nextCols,
			onBreakpointChange,
			onLayoutChange,
			onWidthChange,
			state.breakpoint,
			width,
		],
	);

	useEffect(() => {
		const changed =
			!deepEqual(breakpoints, lastProps.current.breakpoints) ||
			!deepEqual(cols, lastProps.current.cols);
		if (
			breakpoint !== lastProps.current.breakpoint ||
			width !== lastProps.current.width ||
			changed
		) {
			onInnerWidthChange(changed);
		}
		lastProps.current = {
			width,
			breakpoint,
			breakpoints,
			cols,
		};
	}, [width, breakpoint, breakpoints, cols, onInnerWidthChange]);
	// Handler for layout change
	const onInnerLayoutChange = useCallback(
		(layout: Layout) => {
			onLayoutChange(layout, {
				...layouts,
				[state.breakpoint]: layout,
			});
		},
		[state.breakpoint, layouts, onLayoutChange],
	);

	return (
		<GridLayout
			{...otherProps}
			width={width}
			margin={innerMargin}
			containerPadding={innerContainerPadding}
			onLayoutChange={onInnerLayoutChange}
			layout={innerLayout}
			cols={state.cols}
			compactType={compactType}>
			{children}
		</GridLayout>
	);
};

export default ResponsiveGridLayout;
