/**
 * 碰撞检测函数
 *
 * 提供网格布局项之间的碰撞检测功能。
 */

import type { Layout, LayoutItem } from './type';

/**
 * 检查两个布局项是否碰撞（AABB 碰撞检测）
 *
 * @param l1 - 第一个布局项
 * @param l2 - 第二个布局项
 * @returns 如果碰撞返回 true
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
 * 返回与指定布局项碰撞的第一个元素
 *
 * @param layout - 布局数组
 * @param layoutItem - 要检测碰撞的布局项
 * @returns 碰撞的布局项，或 undefined
 */
export function getFirstCollision(layout: Layout, layoutItem: LayoutItem): LayoutItem | undefined {
	for (let i = 0, len = layout.length; i < len; i++) {
		const current = layout[i];
		if (current && collides(current, layoutItem)) {
			return current;
		}
	}
}

/**
 * 返回与指定布局项碰撞的所有元素
 *
 * @param layout - 布局数组
 * @param layoutItem - 要检测碰撞的布局项
 * @returns 碰撞的布局项数组
 */
export function getAllCollisions(layout: Layout, layoutItem: LayoutItem): Array<LayoutItem> {
	return layout.filter((l) => collides(l, layoutItem));
}
