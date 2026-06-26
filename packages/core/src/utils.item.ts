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

		// 非拖拽/缩放状态下，修正 Math.round() 导致的间距不一致问题。
		// 由于取整，相邻项之间的实际间距可能与期望 margin 不同（如 0px 或 2px 而非 1px）。
		// 通过计算下一个相邻项的起始位置与当前项结束位置的差值，调整宽高以维持一致的间距。
		if (Number.isFinite(w)) {
			// 计算下一列项的起始位置
			const siblingLeft = Math.round(
				(colWidth + margin[0]) * (x + w) + padding[0],
			);
			// 计算实际间距：相邻项起始位置 - (当前项左侧 + 当前项宽度)
			const actualMarginRight = siblingLeft - out.left - out.width;
			// 间距不一致时调整宽度
			if (actualMarginRight !== margin[0]) {
				out.width += actualMarginRight - margin[0];
			}
		}

		if (Number.isFinite(h)) {
			// 计算下一行项的起始位置
			const siblingTop = Math.round(
				(rowHeight + margin[1]) * (y + h) + padding[1],
			);
			// 计算实际间距：相邻项起始位置 - (当前项顶部 + 当前项高度)
			const actualMarginBottom = siblingTop - out.top - out.height;
			// 间距不一致时调整高度
			if (actualMarginBottom !== margin[1]) {
				out.height += actualMarginBottom - margin[1];
			}
		}
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
