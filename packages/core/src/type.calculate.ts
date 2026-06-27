export type PositionParams = {
	margin: readonly [number, number];
	containerPadding?: readonly [number, number] | null;
	containerWidth: number;
	cols: number;
	rowHeight: number;
	maxRows: number;
};
