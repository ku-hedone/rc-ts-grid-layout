import { deepEqual } from './equals';
import { Children } from 'react';
import type { ReactNode } from 'react';
import type { CompactType, Layout, LayoutItem, Position } from './type';
import type { ResizeHandle } from 'react-resizable';
import type { DroppingPosition } from './type.rgl';

type ResizeHandleFunc = (
	currentSize: Position,
	position: Position,
	containerWidth: number,
) => Position;

/**
 * 返回布局的底部坐标。
 *
 * @param  {Array} layout 布局数组。
 * @return {Number}       底部坐标。
 */
export function bottom(layout: Layout): number {
	let max = 0;
	let bottomY;
	for (let i = 0, len = layout.length; i < len; i++) {
		const current = layout[i];
		if (current) {
			bottomY = current.y + current.h;
			if (bottomY > max) max = bottomY;
		}
	}
	return max;
}

export function cloneLayout(layout: Layout): Layout {
	const newLayout = Array(layout.length);
	for (let i = 0, len = layout.length; i < len; i++) {
		const current = layout[i];
		if (current) {
			newLayout[i] = cloneLayoutItem(current);
		}
	}
	return newLayout;
}

// 修改布局中的某个布局项。返回新布局，不会修改原布局。
// 其他布局项保持不变。
export function modifyLayout(layout: Layout, layoutItem: LayoutItem): Layout {
	const newLayout = Array(layout.length);
	for (let i = 0, len = layout.length; i < len; i++) {
		const current = layout[i];
		if (current) {
			if (layoutItem.i === current.i) {
				newLayout[i] = layoutItem;
			} else {
				newLayout[i] = layout[i];
			}
		}
	}
	return newLayout;
}

// 用于修改布局项的函数。
// 会进行防御性克隆以确保不会修改原布局。
export function withLayoutItem(
	layout: Layout,
	itemKey: string,
	cb: (item: LayoutItem) => LayoutItem,
): [Layout, LayoutItem | undefined] {
	let item = getLayoutItem(layout, itemKey);
	if (!item) return [layout, undefined];
	item = cb(cloneLayoutItem(item)); // 防御性克隆后再修改
	// FIXME 如果已知索引可以更快
	layout = modifyLayout(layout, item);
	return [layout, item];
}

// 快速克隆路径，因为结构是单态的
export function cloneLayoutItem({
	w,
	h,
	x,
	y,
	i,
	minH,
	minW,
	maxH,
	maxW,
	moved,
	isDraggable,
	isResizable,
	resizeHandles,
	isBounded,
	...item
}: LayoutItem): LayoutItem {
	return {
		w,
		h,
		x,
		y,
		i,
		minH,
		minW,
		maxH,
		maxW,
		moved: !!moved,
		static: !!item.static,
		// 这些值可能为 null/undefined
		isDraggable,
		isResizable,
		resizeHandles,
		isBounded,
	};
}

/**
 * 比较 React `children` 比较困难。这是一个有效的比较方式。
 * 可以检测 key、顺序和数量的差异。
 */
export function childrenEqual(a: ReactNode, b: ReactNode): boolean {
	const sameElement = deepEqual(
		Children.map(a, (c) => {
			return c && typeof c === 'object' && 'key' in c ? c.key : void 0;
		}),
		Children.map(b, (c) => {
			return c && typeof c === 'object' && 'key' in c ? c.key : void 0;
		}),
	);
	const sameDataProps = deepEqual(
		Children.map(a, (c) => {
			return c && typeof c === 'object' && 'props' in c && 'data-grid' in c.props
				? c.props['data-grid']
				: void 0;
		}),
		Children.map(b, (c) => {
			return c && typeof c === 'object' && 'props' in c && 'data-grid' in c.props
				? c.props['data-grid']
				: void 0;
		}),
	);
	return sameElement && sameDataProps;
}

export const fastRGLPropsEqual = (
	a: Record<string, unknown>,
	b: Record<string, unknown>,
	isEqualImpl: (a: unknown, b: unknown) => boolean,
) => {
	if (a === b) return true;
	return (
		// 数值类型
		a.width === b.width &&
		a.cols === b.cols &&
		a.rowHeight === b.rowHeight &&
		a.maxRows === b.maxRows &&
		a.transformScale === b.transformScale &&
		// 字符串类型
		a.className === b.className &&
		a.draggableCancel === b.draggableCancel &&
		a.draggableHandle === b.draggableHandle &&
		a.compactType === b.compactType &&
		// 布尔类型
		a.verticalCompact === b.verticalCompact &&
		a.autoSize === b.autoSize &&
		a.isBounded === b.isBounded &&
		a.isDraggable === b.isDraggable &&
		a.isResizable === b.isResizable &&
		a.allowOverlap === b.allowOverlap &&
		a.preventCollision === b.preventCollision &&
		a.useCSSTransforms === b.useCSSTransforms &&
		a.isDroppable === b.isDroppable &&
		// 函数类型
		a.onLayoutChange === b.onLayoutChange &&
		a.onDragStart === b.onDragStart &&
		a.onDrag === b.onDrag &&
		a.onDragStop === b.onDragStop &&
		a.onResizeStart === b.onResizeStart &&
		a.onResize === b.onResize &&
		a.onResizeStop === b.onResizeStop &&
		a.onDrop === b.onDrop &&
		// 数组类型
		isEqualImpl(a.resizeHandles, b.resizeHandles) &&
		isEqualImpl(a.layout, b.layout) &&
		isEqualImpl(a.margin, b.margin) &&
		// 对象类型
		isEqualImpl(a.resizeHandle, b.resizeHandle) &&
		isEqualImpl(a.style, b.style) &&
		isEqualImpl(a.containerPadding, b.containerPadding) &&
		isEqualImpl(a.droppingItem, b.droppingItem) &&
		isEqualImpl(a.innerRef, b.innerRef) &&
		isEqualImpl(a.wrapperProps, b.wrapperProps)
	);
};

// 类似上面的函数，但更简单。
export function fastPositionEqual(a: Position, b: Position): boolean {
	return (
		a.left === b.left && a.top === b.top && a.width === b.width && a.height === b.height
	);
}

/**
 * 检查两个布局项是否碰撞。
 */
export function collides(l1: LayoutItem, l2: LayoutItem): boolean {
	if (l1.i === l2.i) return false; // 同一元素
	if (l1.x + l1.w <= l2.x) return false; // l1 在 l2 左侧
	if (l1.x >= l2.x + l2.w) return false; // l1 在 l2 右侧
	if (l1.y + l1.h <= l2.y) return false; // l1 在 l2 上方
	if (l1.y >= l2.y + l2.h) return false; // l1 在 l2 下方
	return true; // 矩形重叠
}

/**
 * 对布局进行紧凑排列。遍历每个 y 坐标，消除元素间的间隙。
 *
 * 不会修改原始布局项（克隆处理）。创建新的布局数组。
 *
 * @param  {Array} layout 布局。
 * @param  {Boolean} verticalCompact 是否进行垂直紧凑排列。
 * @param  {Boolean} allowOverlap 为 `true` 时允许网格项重叠。
 * @return {Array}       紧凑排列后的布局。
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

const heightWidth = { x: 'w', y: 'h' } as const;
/**
 * 在向下移动元素之前，检查移动是否会导致碰撞，并先移动那些元素。
 */
function resolveCompactionCollision(
	layout: Layout,
	item: LayoutItem,
	moveToCoord: number,
	axis: 'x' | 'y',
) {
	const sizeProp = heightWidth[axis];
	item[axis] += 1;
	const itemIndex = layout
		.map((layoutItem) => {
			return layoutItem.i;
		})
		.indexOf(item.i);

	// 遍历与之碰撞的每个元素。
	for (let i = itemIndex + 1; i < layout.length; i++) {
		const otherItem = layout[i];
		if (otherItem) {
			// 忽略静态元素
			if (otherItem.static) continue;

			// 优化：如果已知超过该元素可以提前退出
			// 因为布局已排序，所以可以这样做
			if (otherItem.y > item.y + item.h) break;

			if (collides(item, otherItem)) {
				resolveCompactionCollision(layout, otherItem, moveToCoord + item[sizeProp], axis);
			}
		}
	}

	item[axis] = moveToCoord;
}
function ensurePositivePosition(item: LayoutItem): LayoutItem {
	// 确保没有负坐标
	item.y = Math.max(item.y, 0);
	item.x = Math.max(item.x, 0);
	return item;
}
/**
 * 对布局中的元素进行紧凑排列。
 *
 * 会修改元素。
 *
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
	let collides = getFirstCollision(compareWith, l);
	// 检查 compactType 是否为 null，以避免在允许重叠时破坏布局。
	while (collides) {
		if (compactH) {
			resolveCompactionCollision(fullLayout, l, collides.x + collides.w, 'x');
		} else {
			resolveCompactionCollision(fullLayout, l, collides.y + collides.h, 'y');
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
		collides = getFirstCollision(compareWith, l);
	}
	return ensurePositivePosition(l);
}

/**
 * 确保布局中的所有元素都在边界内。
 *
 * 会修改布局项。
 *
 * @param  {Array} layout 布局数组。
 * @param  {Number} bounds 列数。
 */
export function correctBounds(layout: Layout, bounds: { cols: number }): Layout {
	const collidesWith = getStatics(layout);
	for (let i = 0, len = layout.length; i < len; i++) {
		const l = layout[i];
		if (l) {
			// 右侧溢出
			if (l.x + l.w > bounds.cols) l.x = bounds.cols - l.w;
			// 左侧溢出
			if (l.x < 0) {
				l.x = 0;
				l.w = bounds.cols;
			}
			if (!l.static) collidesWith.push(l);
			else {
				// 如果是静态元素且与其他静态元素碰撞，必须向下移动。
				// 不能让它们直接重叠。
				while (getFirstCollision(collidesWith, l)) {
					l.y++;
				}
			}
		}
	}
	return layout;
}

/**
 * 根据 ID 获取布局项。便于后续覆写。
 *
 * @param  {Array}  layout 布局数组。
 * @param  {String} id     ID
 * @return {LayoutItem}    对应 ID 的布局项。
 */
export function getLayoutItem(layout: Layout, id: string): LayoutItem | undefined {
	for (let i = 0, len = layout.length; i < len; i++) {
		const current = layout[i];
		if (current && current.i === id) {
			return current;
		}
	}
	return void 0;
}

/**
 * 返回与指定布局项碰撞的第一个元素。
 * 遍历顺序似乎不影响结果，但这可能是不正确的。
 *
 * @param  {Object} layoutItem 布局项。
 * @return {Object|undefined}  碰撞的布局项，或 undefined。
 */
export function getFirstCollision(
	layout: Layout,
	layoutItem: LayoutItem,
): LayoutItem | undefined {
	for (let i = 0, len = layout.length; i < len; i++) {
		const current = layout[i];
		if (current && collides(current, layoutItem)) {
			return current;
		}
	}
}

export function getAllCollisions(
	layout: Layout,
	layoutItem: LayoutItem,
): Array<LayoutItem> {
	return layout.filter((l) => collides(l, layoutItem));
}

/**
 * 获取所有静态元素。
 * @param  {Array} layout 布局对象数组。
 * @return {Array}        静态布局项数组。
 */
export function getStatics(layout: Layout): Array<LayoutItem> {
	return layout.filter((l) => l.static);
}

/**
 * 移动元素。负责处理其他元素的级联移动。
 *
 * 会修改布局项。
 *
 * @param  {Array}      layout            要修改的完整布局。
 * @param  {LayoutItem} l                 要移动的元素。
 * @param  {Number}     [x]               网格单位的 X 坐标。
 * @param  {Number}     [y]               网格单位的 Y 坐标。
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
	// $FlowIgnore 可接受的只读数组修改，因为是最近克隆的
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
		// console.log(
		// 	`Resolving collision between ${l.i} at [${l.x},${l.y}] and ${collision.i} at [${collision.x},${collision.y}]`,
		// );
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
 * @param  {Array} layout            要修改的完整布局。
 * @param  {LayoutItem} collidesWith 碰撞的布局项。
 * @param  {LayoutItem} itemToMove   要移动的布局项。
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

/**
 * 将数字转换为百分比字符串。
 *
 * @param  {Number} num 任意数字
 * @return {String}     百分比字符串。
 */
export function perc(num: number): string {
	return num * 100 + '%';
}

/**
 * 约束网格项尺寸的辅助函数
 */
const constrainWidth = (
	left: number,
	currentWidth: number,
	newWidth: number,
	containerWidth: number,
) => {
	return left + newWidth > containerWidth ? currentWidth : newWidth;
};

const constrainHeight = (top: number, currentHeight: number, newHeight: number) => {
	return top < 0 ? currentHeight : newHeight;
};

const constrainLeft = (left: number) => Math.max(0, left);

const constrainTop = (top: number) => Math.max(0, top);

const resizeNorth: ResizeHandleFunc = (
	currentSize,
	{ left, height, width },
	// _containerWidth,
) => {
	const top = currentSize.top - (height - currentSize.height);

	return {
		left,
		width,
		height: constrainHeight(top, currentSize.height, height),
		top: constrainTop(top),
	};
};

const resizeEast: ResizeHandleFunc = (
	currentSize,
	{ top, left, height, width },
	containerWidth,
) => ({
	top,
	height,
	width: constrainWidth(currentSize.left, currentSize.width, width, containerWidth),
	left: constrainLeft(left),
});

const resizeWest: ResizeHandleFunc = (
	currentSize,
	{ top, height, width },
	containerWidth,
) => {
	const left = currentSize.left - (width - currentSize.width);

	return {
		height,
		width:
			left < 0
				? currentSize.width
				: constrainWidth(currentSize.left, currentSize.width, width, containerWidth),
		top: constrainTop(top),
		left: constrainLeft(left),
	};
};

const resizeSouth: ResizeHandleFunc = (currentSize, { top, left, height, width }) => ({
	width,
	left,
	height: constrainHeight(top, currentSize.height, height),
	top: constrainTop(top),
});

const resizeNorthEast: ResizeHandleFunc = (...args) =>
	resizeNorth(args[0], resizeEast(...args), args[2]);

const resizeNorthWest: ResizeHandleFunc = (...args) =>
	resizeNorth(args[0], resizeWest(...args), args[2]);

const resizeSouthEast: ResizeHandleFunc = (...args) =>
	resizeSouth(args[0], resizeEast(...args), args[2]);

const resizeSouthWest: ResizeHandleFunc = (...args) =>
	resizeSouth(args[0], resizeWest(...args), args[2]);

const ordinalResizeHandlerMap = {
	n: resizeNorth,
	ne: resizeNorthEast,
	e: resizeEast,
	se: resizeSouthEast,
	s: resizeSouth,
	sw: resizeSouthWest,
	w: resizeWest,
	nw: resizeNorthWest,
};

/**
 * 调整元素大小时约束宽度和位置的辅助函数。
 */
export function resizeItemInDirection(
	direction: ResizeHandle,
	currentSize: Position,
	size: Position,
	containerWidth: number,
): Position {
	// 根据类型定义不应该出现这种情况，但不要硬性报错
	const ordinalHandler = ordinalResizeHandlerMap[direction];
	// 只有 react-resizable 返回 异常 的 direction时 才会出现
	if (!ordinalHandler) {
		console.log('!ordinalHandler', size);
		return size;
	}

	const res = ordinalHandler(currentSize, { ...currentSize, ...size }, containerWidth);
	return res;
}

export function setTransform({ top, left, width, height }: Position) {
	// 将无单位值替换为 px
	const translate = `translate(${left}px,${top}px)`;
	return {
		transform: translate,
		WebkitTransform: translate,
		MozTransform: translate,
		msTransform: translate,
		OTransform: translate,
		width: `${width}px`,
		height: `${height}px`,
		position: 'absolute',
	};
}

export function setTopLeft({ top, left, width, height }: Position) {
	return {
		top: `${top}px`,
		left: `${left}px`,
		width: `${width}px`,
		height: `${height}px`,
		position: 'absolute',
	};
}

/**
 * 获取从左上到右下排序的布局项。
 *
 * @return {Array} 布局对象数组。
 * @return {Array}        排序后的布局，静态元素在前。
 */
export function sortLayoutItems(layout: Layout, compactType: CompactType): Layout {
	if (compactType === 'horizontal') return sortLayoutItemsByColRow(layout);
	if (compactType === 'vertical') return sortLayoutItemsByRowCol(layout);
	else return layout;
}

/**
 * 按行升序、列升序排列布局项。
 *
 * 不修改原布局。
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
 * 按列升序、行升序排列布局项。
 *
 * 不修改原布局。
 */
export function sortLayoutItemsByColRow(layout: Layout): Layout {
	return layout.slice(0).sort(function (a, b) {
		if (a.x > b.x || (a.x === b.x && a.y > b.y)) {
			return 1;
		}
		return -1;
	});
}

/**
 * 使用 initialLayout 和 children 作为模板生成布局。
 * 缺失的条目会被添加，多余的会被截断。
 *
 * 不修改 initialLayout。
 *
 * @param  {Array}  initialLayout 通过 props 传入的布局。
 * @param  {String} breakpoint    当前响应式断点。
 * @param  {?String} compact      紧凑排列选项。
 * @return {Array}                工作布局。
 */
export function synchronizeLayoutWithChildren(
	initialLayout: Layout | undefined,
	children: ReactNode,
	cols: number,
	compactType: CompactType,
	allowOverlap?: boolean,
): Layout {
	const innerLayout = initialLayout || [];

	// 为每个子元素生成一个布局项。
	const layout: LayoutItem[] = [];
	Children.forEach(children, (child) => {
		// 子元素可能不存在
		if (typeof child === 'object' && child && 'key' in child && child.key !== null) {
			const exists = getLayoutItem(innerLayout, child.key + '');
			const g = child.props['data-grid'];
			// 如果布局项已存在于初始布局中则不覆盖。
			// 如果有 `data-grid` 属性，优先使用它。
			if (exists && !g) {
				layout.push(cloneLayoutItem(exists));
			} else {
				// 此项有 data-grid 属性，使用它。
				if (g) {
					// FIXME 此处克隆并非必需
					layout.push(cloneLayoutItem({ ...g, i: child.key }));
				} else {
					// 没有提供数据：确保添加到底部
					// FIXME 此处克隆并非必需
					layout.push(
						cloneLayoutItem({
							w: 1,
							h: 1,
							x: 0,
							y: bottom(layout),
							i: String(child.key),
						}),
					);
				}
			}
		}
	});

	// 修正布局。
	const correctedLayout = correctBounds(layout, { cols });
	return allowOverlap ? correctedLayout : compact(correctedLayout, compactType, cols);
}

/**
 * 验证布局。会抛出错误。
 *
 * @param  {Array}  layout        布局项数组。
 * @param  {String} [contextName] 错误上下文名称。
 * @throw  {Error}                验证错误。
 */
export function validateLayout(layout: Layout, contextName = 'Layout'): void {
	const subProps = ['x', 'y', 'w', 'h'] as const;
	if (!Array.isArray(layout)) throw new Error(contextName + ' must be an array!');
	for (let i = 0, len = layout.length; i < len; i++) {
		const item = layout[i];
		if (item) {
			for (let j = 0; j < subProps.length; j++) {
				const props = subProps[j];
				if (props) {
					if (typeof item[props] !== 'number') {
						throw new Error(
							'ReactGridLayout: ' +
								contextName +
								'[' +
								i +
								'].' +
								subProps[j] +
								' must be a number!',
						);
					}
				}
			}
		}
	}
}

// 对 verticalCompact: false 的旧版兼容
export function compactType(props?: {
	verticalCompact: boolean;
	compactType: CompactType;
}): CompactType {
	const { verticalCompact, compactType } = props || {};
	return verticalCompact === false ? null : compactType;
}

export const noop = () => {
	return void 0;
};

export function getIndentationValue<T extends [number, number] | undefined>(
	param: { [key: string]: T } | T,
	breakpoint: string,
): T | undefined {
	if (!param) return void 0;
	return Array.isArray(param) ? param : param[breakpoint];
}

const droppingPositionCompare = (prev?: DroppingPosition, next?: DroppingPosition) => {
	if (prev === next) {
		return true;
	}
	if (typeof prev !== 'undefined' && typeof next !== 'undefined') {
		return prev.left === next.left && prev.top === next.top;
	}
	return false;
};

export const fastGridItemPropsEqual = (
	prev: Record<string, unknown>,
	next: Record<string, unknown>,
	isEqualImpl: (a: unknown, b: unknown) => boolean,
) => {
	// 子元素
	if (prev === next) return true;
	const areDroppingPositionEquals = droppingPositionCompare(
		prev.DroppingPosition as DroppingPosition,
		next.DroppingPosition as DroppingPosition,
	);
	return (
		// 对象类型
		prev.children === next.children &&
		prev.resizeHandle === next.resizeHandle &&
		areDroppingPositionEquals &&
		// 函数类型
		prev.onResizeStart === next.onResizeStart &&
		prev.onResize === next.onResize &&
		prev.onResizeStop === next.onResizeStop &&
		// 数值类型
		prev.x === next.x &&
		prev.y === next.y &&
		prev.w === next.w &&
		prev.h === next.h &&
		prev.minH === next.minH &&
		prev.maxH === next.maxH &&
		prev.minW === next.minW &&
		prev.maxW === next.maxW &&
		prev.cols === next.cols &&
		prev.rowHeight === next.rowHeight &&
		prev.maxRows === next.maxRows &&
		prev.containerWidth === next.containerWidth &&
		// 布尔类型
		prev.isDraggable === next.isDraggable &&
		prev.isResizable === next.isResizable &&
		prev.isBounded === next.isBounded &&
		// 字符串类型
		prev.i === next.i &&
		// 数组类型
		isEqualImpl(prev.containerPadding, next.containerPadding) &&
		isEqualImpl(prev.margin, next.margin)
	);
};
