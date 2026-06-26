/**
 * 元素移动函数
 *
 * 提供布局元素的移动、碰撞解决、紧凑排列等功能。
 */

import type { CompactType, Layout, LayoutItem } from './type';
import { collides, getAllCollisions, getFirstCollision } from './collision';
import { sortLayoutItems } from './sort';
import { bottom, cloneLayout, cloneLayoutItem, getStatics } from './layout';

const heightWidth = { x: 'w', y: 'h' } as const;

/**
 * 在向下移动元素之前，检查移动是否会导致碰撞，并先移动那些元素。
 *
 * @param layout - 完整布局（必须已排序以优化）
 * @param item - 被移动的项（会被修改）
 * @param moveToCoord - 目标坐标
 * @param axis - 移动的轴（'x' 或 'y'）
 * @param hasStatics - 布局是否包含静态项（禁用提前退出优化）
 */
function resolveCompactionCollision(
	layout: Layout,
	item: LayoutItem,
	moveToCoord: number,
	axis: 'x' | 'y',
	hasStatics?: boolean,
) {
	const sizeProp = heightWidth[axis];
	item[axis] += 1;
	const itemIndex = layout
		.map((layoutItem) => {
			return layoutItem.i;
		})
		.indexOf(item.i);

	// 如果未提供 hasStatics，则计算一次（向后兼容）
	const layoutHasStatics = hasStatics ?? getStatics(layout).length > 0;

	// 遍历与之碰撞的每个元素。
	for (let i = itemIndex + 1; i < layout.length; i++) {
		const otherItem = layout[i];
		if (otherItem) {
			// 忽略静态元素
			if (otherItem.static) continue;

			// 优化：仅在没有静态项时才提前退出。
			// 静态项可能散布在布局中，因此不能假设排序顺序保证没有更多碰撞。
			if (!layoutHasStatics && otherItem.y > item.y + item.h) break;

			if (collides(item, otherItem)) {
				resolveCompactionCollision(layout, otherItem, moveToCoord + item[sizeProp], axis, layoutHasStatics);
			}
		}
	}

	item[axis] = moveToCoord;
}

/**
 * 确保没有负坐标
 */
function ensurePositivePosition(item: LayoutItem): LayoutItem {
	item.y = Math.max(item.y, 0);
	item.x = Math.max(item.x, 0);
	return item;
}

/**
 * 对布局中的元素进行紧凑排列
 *
 * 会修改元素。
 *
 * @param compareWith - 用于碰撞检测的项
 * @param l - 要紧凑排列的项
 * @param compactType - 压缩类型
 * @param cols - 列数
 * @param fullLayout - 完整布局
 * @param allowOverlap - 是否允许重叠
 * @returns 紧凑排列后的项
 */
export function compactItem(
	compareWith: Layout,
	l: LayoutItem,
	compactType: CompactType,
	cols: number,
	fullLayout: Layout,
	allowOverlap: boolean | undefined,
): LayoutItem {
	const compactV = compactType === 'vertical';
	const compactH = compactType === 'horizontal';
	if (compactV) {
		// 最小 y 坐标为布局的底部。
		// 这允许使用 {y: Infinity} 这样的写法。
		// 布局必须先排序才能获取正确的底部 `y` 值。
		l.y = Math.min(bottom(compareWith), l.y);
		// 尽可能向上移动元素，直到发生碰撞。
		while (l.y > 0 && !getFirstCollision(compareWith, l)) {
			l.y--;
		}
	} else if (compactH) {
		// 尽可能向左移动元素，直到发生碰撞。
		while (l.x > 0 && !getFirstCollision(compareWith, l)) {
			l.x--;
		}
	}
	if (!compactType && allowOverlap) {
		return ensurePositivePosition(l);
	}
	// 向下移动元素，如果发生碰撞则继续下移。
	let collidesItem = getFirstCollision(compareWith, l);
	// 检查 compactType 是否为 null，以避免在允许重叠时破坏布局。
	while (collidesItem) {
		if (compactH) {
			resolveCompactionCollision(fullLayout, l, collidesItem.x + collidesItem.w, 'x');
		} else {
			resolveCompactionCollision(fullLayout, l, collidesItem.y + collidesItem.h, 'y');
		}
		// 水平方向不能无限增长，如果溢出则向下移动后重试。
		if (compactH && l.x + l.w > cols) {
			l.x = cols - l.w;
			l.y++;
			// 同时尽可能将元素向左移动
			while (l.x > 0 && !getFirstCollision(compareWith, l)) {
				l.x--;
			}
		}
		collidesItem = getFirstCollision(compareWith, l);
	}
	return ensurePositivePosition(l);
}

/**
 * 对布局进行紧凑排列。遍历每个 y 坐标，消除元素间的间隙。
 *
 * 不会修改原始布局项（克隆处理）。创建新的布局数组。
 *
 * @param layout - 布局
 * @param compactType - 压缩类型
 * @param cols - 列数
 * @param allowOverlap - 是否允许重叠
 * @returns 紧凑排列后的布局
 */
export function compact(
	layout: Layout,
	compactType: CompactType,
	cols: number,
	allowOverlap?: boolean,
): Layout {
	// 静态元素立即放入比较数组，使其他元素围绕它们排列。
	const compareWith = getStatics(layout);
	// 按行和列遍历元素。
	const sorted = sortLayoutItems(layout, compactType);
	// 存放新布局项。
	const out = Array(layout.length);

	for (let i = 0, len = sorted.length; i < len; i++) {
		const innerLayout = sorted[i];
		if (innerLayout) {
			let l = cloneLayoutItem(innerLayout);

			// 不移动静态元素
			if (!l.static) {
				l = compactItem(compareWith, l, compactType, cols, sorted, allowOverlap);

				// 添加到比较数组。只与之前的元素发生碰撞。
				// 静态元素已在此数组中。
				compareWith.push(l);
			}

			// 添加到输出数组，确保元素保持正确的顺序。
			out[layout.indexOf(innerLayout)] = l;

			// 清除 moved 标记（如果存在）。
			l.moved = false;
		}
	}

	return out;
}

/**
 * 移动元素。负责处理其他元素的级联移动。
 *
 * 会修改布局项。
 *
 * @param layout - 要修改的完整布局
 * @param l - 要移动的元素
 * @param x - 网格单位的 X 坐标
 * @param y - 网格单位的 Y 坐标
 * @param isUserAction - 是否是用户操作
 * @param preventCollision - 是否阻止碰撞
 * @param compactType - 压缩类型
 * @param cols - 列数
 * @param allowOverlap - 是否允许重叠
 * @returns 修改后的布局
 */
export function moveElement(
	layout: Layout,
	l: LayoutItem,
	x: number | undefined,
	y: number | undefined,
	isUserAction: boolean | undefined,
	preventCollision: boolean | undefined,
	compactType: CompactType,
	cols: number,
	allowOverlap?: boolean,
): Layout {
	// 如果元素是静态的且未显式设置为可拖拽，
	// 则无法移动，可以直接返回。
	if (l.static && l.isDraggable !== true) return layout;

	// 如果没有变化则直接返回。
	if (l.y === y && l.x === x) return layout;

	const oldX = l.x;
	const oldY = l.y;

	// 直接赋值比扩展对象快得多
	if (typeof x === 'number') l.x = x;
	if (typeof y === 'number') l.y = y;
	l.moved = true;

	// 如果发生碰撞则移动元素。
	// 进行比较时需要排序，以确保在多个碰撞情况下
	// 获取最近的碰撞。
	let sorted = sortLayoutItems(layout, compactType);
	const movingUp =
		compactType === 'vertical' && typeof y === 'number'
			? oldY >= y
			: compactType === 'horizontal' && typeof x === 'number'
				? oldX >= x
				: false;
	// 可接受的只读数组修改，因为是最近克隆的
	if (movingUp) sorted = [...sorted].reverse();
	const collisions = getAllCollisions(sorted, l);
	const hasCollisions = collisions.length > 0;

	// 可能存在碰撞。如果关闭碰撞检测或允许重叠则直接返回。
	if (hasCollisions && allowOverlap) {
		// 不需要解决碰撞，但布局已改变，返回时需克隆。
		return cloneLayout(layout);
	} else if (hasCollisions && preventCollision) {
		// 如果阻止碰撞但不允许重叠，需要将元素恢复到原始位置，
		// 而不是用户期望的位置。
		l.x = oldX;
		l.y = oldY;
		l.moved = false;
		return layout; // 未改变，无需克隆
	}

	// 将每个碰撞的元素移开。
	for (let i = 0, len = collisions.length; i < len; i++) {
		const collision = collisions[i];
		if (collision) {
			if (collision.moved) {
				// 直接跳过以避免无限循环
				continue;
			}

			// 不移动静态元素 - 必须移动当前元素
			if (collision.static) {
				layout = moveElementAwayFromCollision(
					layout,
					collision,
					l,
					isUserAction,
					compactType,
					cols,
				);
			} else {
				layout = moveElementAwayFromCollision(
					layout,
					l,
					collision,
					isUserAction,
					compactType,
					cols,
				);
			}
		}
	}

	return layout;
}

/**
 * 核心逻辑 - 发生碰撞时，将元素移离碰撞位置。
 * 如果上方有空间则上移，否则下移。
 *
 * @param layout - 要修改的完整布局
 * @param collidesWith - 碰撞的布局项
 * @param itemToMove - 要移动的布局项
 * @param isUserAction - 是否是用户操作
 * @param compactType - 压缩类型
 * @param cols - 列数
 * @returns 修改后的布局
 */
export function moveElementAwayFromCollision(
	layout: Layout,
	collidesWith: LayoutItem,
	itemToMove: LayoutItem,
	isUserAction: boolean | undefined,
	compactType: CompactType,
	cols: number,
): Layout {
	const compactH = compactType === 'horizontal';
	// 非水平模式时进行垂直紧凑排列
	const compactV = compactType === 'vertical';
	const preventCollision = collidesWith.static; // 已经碰撞（静态元素除外）

	// 如果碰撞位置上方有足够空间放置此元素，则移至该处。
	// 仅在主碰撞时执行此操作，级联碰撞中可能导致意外的交换行为。
	if (isUserAction) {
		// 重置 isUserAction 标记，因为已不在主碰撞中。
		isUserAction = false;

		// 创建模拟项以避免在此处修改元素，仅在 moveElement 中修改。
		const fakeItem: LayoutItem = {
			x: compactH ? Math.max(collidesWith.x - itemToMove.w, 0) : itemToMove.x,
			y: compactV ? Math.max(collidesWith.y - itemToMove.h, 0) : itemToMove.y,
			w: itemToMove.w,
			h: itemToMove.h,
			i: '-1',
		};

		const firstCollision = getFirstCollision(layout, fakeItem);
		const collisionNorth =
			firstCollision && firstCollision.y + firstCollision.h > collidesWith.y;
		const collisionWest =
			firstCollision && collidesWith.x + collidesWith.w > firstCollision.x;

		// 无碰撞？如果有空间可以上移，否则按常规下移。
		if (!firstCollision) {
			return moveElement(
				layout,
				itemToMove,
				compactH ? fakeItem.x : undefined,
				compactV ? fakeItem.y : undefined,
				isUserAction,
				preventCollision,
				compactType,
				cols,
			);
		} else if (collisionNorth && compactV) {
			return moveElement(
				layout,
				itemToMove,
				undefined,
				collidesWith.y + 1,
				isUserAction,
				preventCollision,
				compactType,
				cols,
			);
		} else if (collisionNorth && !compactType) {
			collidesWith.y = itemToMove.y;
			itemToMove.y = itemToMove.y + itemToMove.h;

			return layout;
		} else if (collisionWest && compactH) {
			return moveElement(
				layout,
				collidesWith,
				itemToMove.x,
				undefined,
				isUserAction,
				preventCollision,
				compactType,
				cols,
			);
		}
	}

	const newX = compactH ? itemToMove.x + 1 : undefined;
	const newY = compactV ? itemToMove.y + 1 : undefined;

	if (!newX && !newY) {
		return layout;
	}
	return moveElement(
		layout,
		itemToMove,
		compactH ? itemToMove.x + 1 : undefined,
		compactV ? itemToMove.y + 1 : undefined,
		isUserAction,
		preventCollision,
		compactType,
		cols,
	);
}
