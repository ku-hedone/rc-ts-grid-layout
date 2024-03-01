import { perc, setTopLeft, setTransform } from './utils';
import { calcGridItemWHPx, calcGridColWidth } from './calculate';
import type { Dragging, ItemProps, Resizing } from './type.item';
import type { PositionParams } from './type.calculate';
import type { Position } from './type';

export function calcGridItemPosition(
	positionParams: PositionParams,
	x: number,
	y: number,
	w: number,
	h: number,
	state?:
		| {
				resizing: Resizing;
		  }
		| {
				dragging: Dragging;
		  },
): Position {
	const { margin, containerPadding, rowHeight } = positionParams;
	const colWidth = calcGridColWidth(positionParams);
	const out: Position = {} as Position;
	const padding =
		Array.isArray(containerPadding) && containerPadding.length
			? containerPadding
			: margin;

	if (state && 'resizing' in state) {
		out.width = Math.round(state.resizing.width);
		out.height = Math.round(state.resizing.height);
	} else {
		out.width = calcGridItemWHPx(w, colWidth, margin[0]);
		out.height = calcGridItemWHPx(h, rowHeight, margin[1]);
	}

	if (state) {
		if ('dragging' in state) {
			out.top = Math.round(state.dragging.top);
			out.left = Math.round(state.dragging.left);
		} else {
			out.top = Math.round(state.resizing.top);
			out.left = Math.round(state.resizing.left);
		}
	} else {
		out.top = Math.round((rowHeight + margin[1]) * y + padding[1]);
		out.left = Math.round((colWidth + margin[0]) * x + padding[0]);
	}
	return out;
}

export const createStyle = (
	position: Position,
	{
		usePercentages,
		containerWidth,
		useCSSTransforms,
	}: Pick<ItemProps, 'usePercentages' | 'containerWidth' | 'useCSSTransforms'>,
): { [key: string]: string | null | undefined } => {
	let style;
	if (useCSSTransforms) {
		style = setTransform(position);
	} else {
		style = setTopLeft(position);
		if (usePercentages) {
			style.left = perc(position.left / containerWidth);
			style.width = perc(position.width / containerWidth);
		}
	}
	return style;
};
