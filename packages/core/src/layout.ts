/**
 * 布局操作函数
 *
 * 提供布局的查询、克隆、修改、验证等功能。
 */

import { Children } from 'react';
import type { ReactNode } from 'react';
import type { CompactType, Layout, LayoutItem } from './type';
import { getStatics, getFirstCollision } from './collision';
import { sortLayoutItems } from './sort';
import { compact } from './movement';

/**
 * 返回布局的底部坐标（所有项的 y+h 最大值）
 *
 * @param layout - 布局数组
 * @returns 底部坐标
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

/**
 * 克隆整个布局
 *
 * @param layout - 布局数组
 * @returns 克隆后的布局
 */
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

/**
 * 修改布局中的某个布局项。返回新布局，不会修改原布局。
 * 其他布局项保持不变。
 *
 * @param layout - 布局数组
 * @param layoutItem - 要替换的布局项
 * @returns 新布局
 */
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

/**
 * 用于修改布局项的函数。
 * 会进行防御性克隆以确保不会修改原布局。
 *
 * @param layout - 布局数组
 * @param itemKey - 要修改的项的 ID
 * @param cb - 修改回调函数
 * @returns [新布局, 修改后的项]
 */
export function withLayoutItem(
	layout: Layout,
	itemKey: string,
	cb: (item: LayoutItem) => LayoutItem,
): [Layout, LayoutItem | undefined] {
	let item = getLayoutItem(layout, itemKey);
	if (!item) return [layout, undefined];
	item = cb(cloneLayoutItem(item)); // 防御性克隆后再修改
	layout = modifyLayout(layout, item);
	return [layout, item];
}

/**
 * 快速克隆单个布局项
 *
 * @param item - 要克隆的布局项
 * @returns 克隆后的布局项
 */
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
		// 这些可以是 null/undefined
		isDraggable,
		isResizable,
		resizeHandles,
		isBounded,
	};
}

/**
 * 根据 ID 获取布局项
 *
 * @param layout - 布局数组
 * @param id - 布局项 ID
 * @returns 对应的布局项，或 undefined
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
 * 获取所有静态元素
 *
 * @param layout - 布局数组
 * @returns 静态布局项数组
 */
export function getStatics(layout: Layout): Array<LayoutItem> {
	return layout.filter((l) => l.static);
}

/**
 * 确保布局中的所有元素都在边界内。
 *
 * 会修改布局项。
 *
 * @param layout - 布局数组
 * @param bounds - 边界配置（cols）
 * @returns 修正后的布局
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
 * 使用 initialLayout 和 children 作为模板生成布局。
 * 缺失的条目会被添加，多余的会被截断。
 *
 * 不修改 initialLayout。
 *
 * @param initialLayout - 通过 props 传入的布局
 * @param children - React 子元素
 * @param cols - 列数
 * @param compactType - 压缩类型
 * @param allowOverlap - 是否允许重叠
 * @returns 工作布局
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
					layout.push(cloneLayoutItem({ ...g, i: child.key }));
				} else {
					// 没有提供数据：确保添加到底部
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
 * @param layout - 布局项数组
 * @param contextName - 错误上下文名称
 * @throws {Error} 验证错误
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
								].' +
								props +
								' must be a number! Current value: ' +
								String(item[props]),
						);
					}
				}
			}
		}
	}
}
