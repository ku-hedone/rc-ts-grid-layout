import type { ResizeHandle } from 'react-resizable';

export type LayoutItem = {
	w: number;
	h: number;
	x: number;
	y: number;
	i: string;
	minW?: number;
	minH?: number;
	maxW?: number;
	maxH?: number;
	moved?: boolean;
	static?: boolean;
	isDraggable?: boolean;
	isResizable?: boolean;
	resizeHandles?: ResizeHandle[]; // 缩放把手方向数组
	isBounded?: boolean;
};
export type Layout = LayoutItem[];

export type Position = {
	left: number;
	top: number;
	width: number;
	height: number;
};

export type PartialPosition = { left: number; top: number };

export type CompactType = 'horizontal' | 'vertical' | null | undefined;
