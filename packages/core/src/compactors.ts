/**
 * 压缩策略实现
 *
 * 压缩器是用于消除网格项之间间隙的可插拔策略。
 * 使用 Compactor 接口创建自定义压缩算法。
 */

import type { Compactor, CompactType, Layout, LayoutItem, Mutable } from './type';
import {
	getFirstCollision,
	sortLayoutItemsByRowCol,
	sortLayoutItemsByColRow,
	bottom,
	cloneLayoutItem,
	getStatics,
	cloneLayout,
	collides,
} from './utils';

// ============================================================================
// 自定义压缩器的辅助函数
// ============================================================================

/**
 * 通过移动项来解决压缩碰撞
 *
 * 在将项移动到某个位置之前，检查该移动是否会导致碰撞，
 * 并先递归移动那些碰撞的项。
 *
 * 适用于实现自定义压缩器。
 *
 * @param layout - 完整布局（必须已排序以优化）
 * @param item - 被移动的项（会被修改）
 * @param moveToCoord - 目标坐标
 * @param axis - 移动的轴（'x' 或 'y'）
 * @param hasStatics - 布局是否包含静态项（禁用提前退出优化）
 */
export function resolveCompactionCollision(
	layout: Layout,
	item: LayoutItem,
	moveToCoord: number,
	axis: 'x' | 'y',
	hasStatics?: boolean,
): void {
	const sizeProp = axis === 'x' ? 'w' : 'h';

	// 临时递增位置以检测碰撞
	(item as Mutable<LayoutItem>)[axis] += 1;

	const itemIndex = layout.findIndex((l) => l.i === item.i);

	// 如果未提供 hasStatics，则计算一次（向后兼容）
	const layoutHasStatics = hasStatics ?? getStatics(layout).length > 0;

	for (let i = itemIndex + 1; i < layout.length; i++) {
		const otherItem = layout[i];
		if (otherItem === undefined) continue;
		if (otherItem.static) continue;
		// 优化：仅在没有静态项时才提前退出。
		// 静态项可能散布在布局中，因此不能假设排序顺序保证没有更多碰撞。
		if (!layoutHasStatics && otherItem.y > item.y + item.h) break;

		if (collides(item, otherItem)) {
			resolveCompactionCollision(
				layout,
				otherItem,
				moveToCoord + item[sizeProp],
				axis,
				layoutHasStatics,
			);
		}
	}

	(item as Mutable<LayoutItem>)[axis] = moveToCoord;
}

/**
 * 垂直压缩单个项（向上移动）
 *
 * 将项尽可能向上移动而不发生碰撞。
 * 适用于实现自定义垂直压缩器。
 *
 * @param compareWith - 用于碰撞检测的项
 * @param l - 要压缩的项（会被修改）
 * @param fullLayout - 用于碰撞解决的完整布局
 * @param maxY - 起始的最大 Y 坐标
 * @returns 压缩后的项
 */
export function compactItemVertical(
	compareWith: Layout,
	l: LayoutItem,
	fullLayout: Layout,
	maxY: number,
): LayoutItem {
	// 先修正负坐标
	(l as Mutable<LayoutItem>).x = Math.max(l.x, 0);
	(l as Mutable<LayoutItem>).y = Math.max(l.y, 0);

	// 限制 Y 不超过当前底部
	(l as Mutable<LayoutItem>).y = Math.min(maxY, l.y);

	// 尽可能向上移动
	while (l.y > 0 && !getFirstCollision(compareWith, l)) {
		(l as Mutable<LayoutItem>).y--;
	}

	// 通过向下移动解决碰撞
	let collision: LayoutItem | undefined;
	while ((collision = getFirstCollision(compareWith, l)) !== undefined) {
		resolveCompactionCollision(fullLayout, l, collision.y + collision.h, 'y');
	}

	(l as Mutable<LayoutItem>).y = Math.max(l.y, 0);
	return l;
}

/**
 * 水平压缩单个项（向左移动）
 *
 * 将项尽可能向左移动而不发生碰撞。
 * 如果溢出则换到下一行。
 * 适用于实现自定义水平压缩器。
 *
 * @param compareWith - 用于碰撞检测的项
 * @param l - 要压缩的项（会被修改）
 * @param cols - 网格列数
 * @param fullLayout - 用于碰撞解决的完整布局
 * @returns 压缩后的项
 */
export function compactItemHorizontal(
	compareWith: Layout,
	l: LayoutItem,
	cols: number,
	fullLayout: Layout,
): LayoutItem {
	// 先修正负坐标
	(l as Mutable<LayoutItem>).x = Math.max(l.x, 0);
	(l as Mutable<LayoutItem>).y = Math.max(l.y, 0);

	// 尽可能向左移动
	while (l.x > 0 && !getFirstCollision(compareWith, l)) {
		(l as Mutable<LayoutItem>).x--;
	}

	// 解决碰撞
	let collision: LayoutItem | undefined;
	while ((collision = getFirstCollision(compareWith, l)) !== undefined) {
		resolveCompactionCollision(fullLayout, l, collision.x + collision.w, 'x');

		// 水平溢出：换到下一行
		if (l.x + l.w > cols) {
			(l as Mutable<LayoutItem>).x = cols - l.w;
			(l as Mutable<LayoutItem>).y++;

			while (l.x > 0 && !getFirstCollision(compareWith, l)) {
				(l as Mutable<LayoutItem>).x--;
			}
		}
	}

	(l as Mutable<LayoutItem>).x = Math.max(l.x, 0);
	return l;
}

// ============================================================================
// 垂直压缩器
// ============================================================================

/**
 * 垂直压缩器 - 向上移动项以填补间隙
 *
 * 项按行再列排序，每个项尽可能向上移动而不与其他项重叠。
 *
 * 这是 react-grid-layout 的默认压缩模式。
 */
export const verticalCompactor: Compactor = {
	type: 'vertical',
	allowOverlap: false,

	compact(layout: Layout, _cols: number): Layout {
		const compareWith = getStatics(layout);
		let maxY = bottom(compareWith);
		const sorted = sortLayoutItemsByRowCol(layout);
		const out: LayoutItem[] = new Array(layout.length);

		for (let i = 0; i < sorted.length; i++) {
			const sortedItem = sorted[i];
			if (sortedItem === undefined) continue;

			let l = cloneLayoutItem(sortedItem);

			if (!l.static) {
				l = compactItemVertical(compareWith, l, sorted, maxY);
				maxY = Math.max(maxY, l.y + l.h);
				compareWith.push(l);
			}

			const originalIndex = layout.indexOf(sortedItem);
			out[originalIndex] = l;
			l.moved = false;
		}

		return out;
	},
};

// ============================================================================
// 水平压缩器
// ============================================================================

/**
 * 水平压缩器 - 向左移动项以填补间隙
 *
 * 项按列再行排序，每个项尽可能向左移动而不与其他项重叠。
 */
export const horizontalCompactor: Compactor = {
	type: 'horizontal',
	allowOverlap: false,

	compact(layout: Layout, cols: number): Layout {
		const compareWith = getStatics(layout);
		const sorted = sortLayoutItemsByColRow(layout);
		const out: LayoutItem[] = new Array(layout.length);

		for (let i = 0; i < sorted.length; i++) {
			const sortedItem = sorted[i];
			if (sortedItem === undefined) continue;

			let l = cloneLayoutItem(sortedItem);

			if (!l.static) {
				l = compactItemHorizontal(compareWith, l, cols, sorted);
				compareWith.push(l);
			}

			const originalIndex = layout.indexOf(sortedItem);
			out[originalIndex] = l;
			l.moved = false;
		}

		return out;
	},
};

// ============================================================================
// 无压缩
// ============================================================================

/**
 * 无压缩 - 项保持在放置的位置
 *
 * 用于自由形式的布局，项可以放置在任何位置。
 * 项不会自动移动以填补间隙。
 */
export const noCompactor: Compactor = {
	type: null,
	allowOverlap: false,

	compact(layout: Layout, _cols: number): Layout {
		// 无压缩 - 仅克隆以保持不可变性
		return cloneLayout(layout);
	},
};

// ============================================================================
// 允许重叠的变体
// ============================================================================

/**
 * 允许重叠的垂直压缩器
 *
 * 项向上压缩但允许相互重叠。
 * 适用于分层布局或碰撞检测由外部处理的场景。
 */
export const verticalOverlapCompactor: Compactor = {
	...verticalCompactor,
	allowOverlap: true,

	compact(layout: Layout, _cols: number): Layout {
		// 允许重叠时，仅克隆不移动
		return cloneLayout(layout);
	},
};

/**
 * 允许重叠的水平压缩器
 */
export const horizontalOverlapCompactor: Compactor = {
	...horizontalCompactor,
	allowOverlap: true,

	compact(layout: Layout, _cols: number): Layout {
		return cloneLayout(layout);
	},
};

/**
 * 无压缩，允许重叠
 *
 * 项保持在放置的位置，可以相互重叠。
 */
export const noOverlapCompactor: Compactor = {
	...noCompactor,
	allowOverlap: true,
};

// ============================================================================
// 工厂函数
// ============================================================================

/**
 * 根据类型获取压缩器
 *
 * 这是一个便捷函数，用于向后兼容基于字符串的 compactType API。
 *
 * 注意：对于 'wrap' 模式，请从 'react-grid-layout/extras' 导入 `wrapCompactor`
 * 并直接传递给 `compactor` 属性。此函数对 'wrap' 类型返回 `noCompactor`，
 * 因为 wrap 压缩器是可 tree-shake 的。
 *
 * @param compactType - 'vertical'、'horizontal'、'wrap' 或 null
 * @param allowOverlap - 是否允许项重叠
 * @returns 对应的 Compactor
 */
export function getCompactor(
	compactType: CompactType,
	allowOverlap: boolean = false,
	preventCollision: boolean = false,
): Compactor {
	let baseCompactor: Compactor;

	if (allowOverlap) {
		if (compactType === 'vertical') baseCompactor = verticalOverlapCompactor;
		else if (compactType === 'horizontal') baseCompactor = horizontalOverlapCompactor;
		else baseCompactor = noOverlapCompactor;
	} else {
		if (compactType === 'vertical') baseCompactor = verticalCompactor;
		else if (compactType === 'horizontal') baseCompactor = horizontalCompactor;
		// 对于 'wrap' 和 null，使用 noCompactor
		// 需要 wrap 模式的用户应从 extras 导入 wrapCompactor
		else baseCompactor = noCompactor;
	}

	// 如果指定了 preventCollision，则返回带有该属性的压缩器
	if (preventCollision) {
		return { ...baseCompactor, preventCollision };
	}
	return baseCompactor;
}
