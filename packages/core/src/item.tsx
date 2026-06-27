import {
	Children,
	cloneElement,
	memo,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import { DraggableCore } from 'react-draggable';
import { Resizable } from 'react-resizable';
import { fastGridItemPropsEqual, resizeItemInDirection } from './utils';
import { calcGridItemWHPx, calcGridColWidth, calcWH, clamp, calcXY } from './calculate';
import { calcGridItemPosition, createStyle } from './utils.item';
import { deepEqual } from './equals';
import { defaultConstraints, applyPositionConstraints, applySizeConstraints } from './constraints';
import type { CSSProperties, FC, ReactElement, ReactNode, Ref } from 'react';
import type {
	Dragging,
	GenResizeParams,
	GridInnerResizeHandler,
	InnerDragHandler,
	InnerDragStartHandler,
	InnerDragStopHandler,
	ItemProps,
	Resizing,
} from './type.item';
import type { ConstraintContext, LayoutConstraint, PartialPosition, Position } from './type';
import type { DroppingPosition } from './type.rgl';

type GridChildProps = {
	ref?: Ref<HTMLDivElement>;
	className?: string;
	style?: CSSProperties;
};

const GridItem = (props: ItemProps) => {
	const {
		className = '',
		cancel = '',
		handle = '',
		minH = 1,
		minW = 1,
		maxH = Infinity,
		maxW = Infinity,
		transformScale = 1,
		cols,
		containerPadding,
		containerWidth,
		margin,
		maxRows,
		rowHeight,
		onResizeStop,
		onResizeStart,
		onResize,
		i,
		x,
		y,
		onDragStop,
		onDrag,
		onDragStart,
		isResizable,
		isDraggable,
		useCSSTransforms,
		droppingPosition,
		usePercentages,
		w,
		h,
		resizeHandles,
		resizeHandle,
		isBounded,
		constraints = defaultConstraints,
		itemConstraints,
		layout: parentLayout,
		children,
		wrapperProps,
	} = props;

	const ref = useRef<HTMLDivElement>(null);
	const [resizing, setResizing] = useState<Resizing>();
	const [dragging, setDragging] = useState<Dragging>();
	const prevDropPosition = useRef<DroppingPosition | undefined>(undefined);

	const currentPosition = useRef<Position | undefined>(undefined);
	// 拖拽实时位置（ref 驱动，避免每帧触发 React re-render）
	const dragPositionRef = useRef<Dragging | undefined>(undefined);

	const cls = useMemo(
		() =>
			[
				'react-grid-item',
				className,
				props.static ? 'static' : '',
				isDraggable ? 'react-draggable' : '',
				useCSSTransforms ? 'cssTransforms' : '',
				typeof dragging === 'undefined' ? '' : 'react-draggable-dragging',
				typeof droppingPosition === 'undefined' ? '' : 'dropping',
				typeof resizing === 'undefined' ? '' : 'resizing',
			]
				.filter((i) => !!i)
				.join(' ')
				.trim(),
		[
			className,
			dragging,
			resizing,
			droppingPosition,
			isDraggable,
			props.static,
			useCSSTransforms,
		],
	);
	const positionParams = useMemo(() => {
		return {
			cols,
			containerPadding,
			containerWidth,
			margin,
			maxRows,
			rowHeight,
		};
	}, [cols, containerPadding, containerWidth, margin, maxRows, rowHeight]);

	// 约束上下文（供 constraints 系统使用）
	const constraintContext = useMemo<ConstraintContext>(
		() => ({
			cols,
			maxRows,
			containerWidth,
			rowHeight,
			margin,
			containerHeight: 0, // 由 containerBounds 约束使用，item 层不感知
			layout: parentLayout ?? [],
		}),
		[cols, containerWidth, margin, maxRows, parentLayout, rowHeight],
	);

	const position = useMemo(() => {
		const state = resizing ? { resizing } : dragging ? { dragging } : void 0;
		return calcGridItemPosition(positionParams, x, y, w, h, state);
	}, [dragging, h, positionParams, resizing, w, x, y]);

	const innerProps = useRef({
		positionParams,
		position,
	});

	const innerState = useRef({ dragging });

	innerProps.current = {
		positionParams,
		position,
	};
	innerState.current = {
		dragging,
	};

	currentPosition.current = position;

	const onGridDragStart: InnerDragStartHandler = useCallback(
		(e, { node }) => {
			if (typeof onDragStart === 'function') {
				const { offsetParent } = node;
				if (!offsetParent) return;
				const parentRect = offsetParent.getBoundingClientRect();
				const clientRect = node.getBoundingClientRect();
				const position: PartialPosition = {
					top:
						(clientRect.top - parentRect.top) / transformScale + offsetParent.scrollTop,
					left:
						(clientRect.left - parentRect.left) / transformScale +
						offsetParent.scrollLeft,
				};
				setDragging(position);
				dragPositionRef.current = position;
				// 使用此数据调用回调
				const { x, y } = calcXY(
					innerProps.current.positionParams,
					position.top,
					position.left,
					w,
					h,
				);
				onDragStart(i, x, y, {
					e,
					node,
					position,
				});
			}
		},
		[h, i, onDragStart, transformScale, w],
	);

	const onGridDrag: InnerDragHandler = useCallback(
		(e, { node, deltaX, deltaY }) => {
			// 从 dragPositionRef 读取（每帧更新），而非 innerState.current.dragging（拖拽起点）
			const dragging = dragPositionRef.current;
			if (typeof onDrag === 'function' && dragging) {
				let top = dragging.top + deltaY;
				let left = dragging.left + deltaX;
				const { rowHeight, margin, containerWidth } = innerProps.current.positionParams;
				if (isBounded) {
					const { offsetParent } = node;
					if (offsetParent) {
						const bottomBoundary =
							offsetParent.clientHeight - calcGridItemWHPx(h, rowHeight, margin[1]);
						top = clamp(top, 0, bottomBoundary);
						const colWidth = calcGridColWidth(innerProps.current.positionParams);
						const rightBoundary =
							containerWidth - calcGridItemWHPx(w, colWidth, margin[0]);
						left = clamp(left, 0, rightBoundary);
					}
				}
				// ref 驱动：更新 ref + 直接操作 DOM，不触发 React re-render
				dragPositionRef.current = { top, left };
				let { x, y } = calcXY(innerProps.current.positionParams, top, left, w, h);
				// 应用位置约束
				const itemLayout = { i, x, y, w, h, constraints: itemConstraints };
				const constrained = applyPositionConstraints(
					constraints,
					itemLayout,
					x,
					y,
					constraintContext,
				);
				x = constrained.x;
				y = constrained.y;
				// 直接更新 DOM style（跳过 React 渲染链）
				const pos = calcGridItemPosition(
					innerProps.current.positionParams,
					x,
					y,
					w,
					h,
					{ dragging: { top, left } },
				);
				const el = ref.current;
				if (el) {
					Object.assign(
						el.style,
						createStyle(pos, {
							containerWidth,
							usePercentages,
							useCSSTransforms,
						}),
					);
				}
				onDrag(i, x, y, {
					e,
					node,
					position: { top, left },
				});
			}
		},
		[
			constraintContext,
			constraints,
			containerWidth,
			h,
			i,
			isBounded,
			itemConstraints,
			onDrag,
			useCSSTransforms,
			usePercentages,
			w,
		],
	);

	const onGridDragStop: InnerDragStopHandler = useCallback(
		(e, { node }) => {
			const dragPos = dragPositionRef.current ?? innerState.current.dragging;
			if (typeof onDragStop === 'function' && dragPos) {
				const { left, top } = dragPos;
				dragPositionRef.current = void 0;
				setDragging(void 0);
				let { x, y } = calcXY(innerProps.current.positionParams, top, left, w, h);
				// 应用位置约束（确保最终位置合法）
				const itemLayout = { i, x, y, w, h, constraints: itemConstraints };
				const constrained = applyPositionConstraints(
					constraints,
					itemLayout,
					x,
					y,
					constraintContext,
				);
				x = constrained.x;
				y = constrained.y;
				// 恢复 DOM style 到非拖拽的正确位置
				// onGridDrag 直接写入了 DOM，React 可能不会重写（style 值未变时跳过）
				const finalPos = calcGridItemPosition(
					innerProps.current.positionParams,
					x,
					y,
					w,
					h,
				);
				const el = ref.current;
				if (el) {
					Object.assign(
						el.style,
						createStyle(finalPos, {
							containerWidth,
							usePercentages,
							useCSSTransforms,
						}),
					);
				}
				onDragStop(i, x, y, {
					e,
					node,
					position: { top, left },
				});
			}
		},
		[
			constraintContext,
			constraints,
			containerWidth,
			h,
			i,
			itemConstraints,
			onDragStop,
			useCSSTransforms,
			usePercentages,
			w,
		],
	);

	const genResizeParams: GenResizeParams = useCallback(
		(data, position) => {
			const { node, handle } = data;
			let updatedSize = data.size as Position;
			if (node) {
				const { size } = data;
				updatedSize = resizeItemInDirection(
					handle,
					position,
					size as Position,
					containerWidth,
				);
			}
			let { w, h } = calcWH(
				innerProps.current.positionParams,
				updatedSize.width,
				updatedSize.height,
				x,
				y,
				handle,
			);
			// 先用 clamp 兼容旧逻辑
			w = clamp(w, Math.max(minW, 1), maxW);
			h = clamp(h, minH, maxH);
			// 再用 constraints 系统约束（覆盖更复杂的约束如 gridBounds、aspectRatio）
			const itemLayout = { i, x, y, w: w, h: h, constraints: itemConstraints };
			const constrained = applySizeConstraints(
				constraints,
				itemLayout,
				w,
				h,
				handle,
				constraintContext,
			);
			return {
				w: constrained.w,
				h: constrained.h,
				updatedSize,
			};
		},
		[constraintContext, constraints, containerWidth, i, itemConstraints, maxH, maxW, minH, minW, x, y],
	);

	const onGridResize: GridInnerResizeHandler = useCallback(
		(e, data) => {
			const position = currentPosition.current;
			if (position) {
				const nextResize = genResizeParams(data, position);
				if (typeof onResize === 'function' && nextResize) {
					const { node, handle } = data;
					const { w, h, updatedSize: size } = nextResize;
					onResize(i, w, h, { e, node, size, handle });
					setResizing(size);
				}
			}
		},
		[genResizeParams, i, onResize],
	);
	const onGridResizeStart: GridInnerResizeHandler = useCallback(
		(e, data) => {
			const position = currentPosition.current;
			if (position) {
				const nextResize = genResizeParams(data, position);
				if (typeof onResizeStart === 'function' && nextResize) {
					const { w, h, updatedSize: size } = nextResize;
					const { node, handle } = data;
					onResizeStart(i, w, h, { e, node, size, handle });
					setResizing(size);
				}
			}
		},
		[genResizeParams, i, onResizeStart],
	);
	const onGridResizeStop: GridInnerResizeHandler = useCallback(
		(e, data) => {
			const position = currentPosition.current;
			if (position) {
				const nextResize = genResizeParams(data, position);
				if (typeof onResizeStop === 'function' && nextResize) {
					const { w, h, updatedSize: size } = nextResize;
					const { node, handle } = data;
					onResizeStop(i, w, h, { e, node, size, handle });
					setResizing(void 0);
				}
			}
		},
		[genResizeParams, i, onResizeStop],
	);
	const maxPosition = useMemo(
		() => calcGridItemPosition(positionParams, 0, 0, cols, 0),
		[cols, positionParams],
	);
	// 使用最小/最大值计算约束
	const mins = useMemo(
		() => calcGridItemPosition(positionParams, 0, 0, minW, minH),
		[minH, minW, positionParams],
	);

	const maxes = useMemo(
		() => calcGridItemPosition(positionParams, 0, 0, maxW, maxH),
		[maxH, maxW, positionParams],
	);

	const minConstraints: [number, number] = useMemo(
		() => [mins.width, mins.height],
		[mins.height, mins.width],
	);
	const maxConstraints: [number, number] = useMemo(
		() => [Math.min(maxes.width, maxPosition.width), Math.min(maxes.height, Infinity)],
		[maxPosition.width, maxes.height, maxes.width],
	);

	const moveDroppingItem = useCallback(() => {
		if (!droppingPosition) return;
		const node = ref.current;
		if (!node) return;
		const prevDroppingPosition = prevDropPosition.current || { left: 0, top: 0 };
		// 从 ref 读取当前拖拽状态，避免 dragging 作为依赖导致循环
		const currentDragging = dragPositionRef.current ?? innerState.current.dragging;
		const shouldDrag =
			currentDragging &&
			(droppingPosition.left !== prevDroppingPosition.left ||
				droppingPosition.top !== prevDroppingPosition.top);

		if (!currentDragging) {
			onGridDragStart(droppingPosition.e, {
				node,
			});
		} else if (shouldDrag) {
			const deltaX = droppingPosition.left - currentDragging.left;
			const deltaY = droppingPosition.top - currentDragging.top;
			onGridDrag(droppingPosition.e, {
				node,
				deltaX,
				deltaY,
			});
		}
		prevDropPosition.current = droppingPosition;
	}, [droppingPosition, onGridDrag, onGridDragStart]);

	const innerCancel = useMemo(
		() => `.react-resizable-handle ${cancel ? ',' + cancel : ''}`.trim(),
		[cancel],
	);

	useEffect(() => {
		moveDroppingItem();
	}, [moveDroppingItem]);

	return (
		<DraggableCore
			disabled={!isDraggable}
			onStart={onGridDragStart}
			onDrag={onGridDrag}
			onStop={onGridDragStop}
			handle={handle}
			cancel={innerCancel}
			scale={transformScale}
			nodeRef={ref}
			enableUserSelectHack>
			<Resizable
				draggableOpts={{
					disabled: !isResizable,
				}}
				className={isResizable ? undefined : 'react-resizable-hide'}
				width={position.width}
				height={position.height}
				minConstraints={minConstraints}
				maxConstraints={maxConstraints}
				onResizeStop={onGridResizeStop}
				onResizeStart={onGridResizeStart}
				onResize={onGridResize}
				transformScale={transformScale}
				resizeHandles={resizeHandles ? [...resizeHandles] : undefined}
				handle={resizeHandle}>
					{typeof wrapperProps === 'undefined' ? (
						cloneElement(children as ReactElement<GridChildProps>, {
							ref,
							className: cls,
							style: {
								...props.style,
								...(children.props as GridChildProps).style,
								...createStyle(position, {
									containerWidth,
									usePercentages,
								useCSSTransforms,
							}),
						},
					})
				) : (
					<div
						ref={ref}
						className={`${cls} ${wrapperProps.className || ''}`.trim()}
						style={{
							...props.style,
							...wrapperProps.style,
							...createStyle(position, {
								containerWidth,
								usePercentages,
								useCSSTransforms,
							}),
						}}>
						{children}
					</div>
				)}
			</Resizable>
		</DraggableCore>
	);
};

interface WrapperProps extends Omit<ItemProps, 'children'> {
	children: ReactNode;
}

const Wrapper: FC<WrapperProps> = memo(
	({ children, ...props }) => {
		const child = Children.only(children) as ItemProps['children'];
		return <GridItem {...props}>{child}</GridItem>;
	},
	(prev, next) => fastGridItemPropsEqual(prev, next, deepEqual),
);

export default Wrapper;
