/**
 * 布局排序函数
 *
 * 提供按不同维度排序布局项的功能。
 */

import type { CompactType, Layout } from './type';

/**
 * 根据压缩类型获取排序后的布局项
 *
 * @param layout - 布局数组
 * @param compactType - 压缩类型
 * @returns 排序后的布局
 */
export function sortLayoutItems(layout: Layout, compactType: CompactType): Layout {
	if (compactType === 'horizontal') return sortLayoutItemsByColRow(layout);
	if (compactType === 'vertical') return sortLayoutItemsByRowCol(layout);
	else return layout;
}

/**
 * 按行升序、列升序排列布局项（从上到下，从左到右）
 *
 * 不修改原布局。
 *
 * @param layout - 布局数组
 * @returns 排序后的布局
 */
export function sortLayoutItemsByRowCol(layout: Layout): Layout {
	// slice 克隆数组，因为 sort 会修改原数组
	return layout.slice(0).sort(function (a, b) {
		if (a.y > b.y || (a.y === b.y && a.x > b.x)) {
			return 1;
		} else if (a.y === b.y && a.x === b.x) {
			// 没有这个判断，IE 和 Chrome/FF 的排序结果可能不同
			return 0;
		}
		return -1;
	});
}

/**
 * 按列升序、行升序排列布局项（从左到右，从上到下）
 *
 * 不修改原布局。
 *
 * @param layout - 布局数组
 * @returns 排序后的布局
 */
export function sortLayoutItemsByColRow(layout: Layout): Layout {
	return layout.slice(0).sort(function (a, b) {
		if (a.x > b.x || (a.x === b.x && a.y > b.y)) {
			return 1;
		}
		return -1;
	});
}
