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
import { isEqual } from 'lodash';
import type { FC, ReactNode } from 'react';
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
import type { PartialPosition, Position } from './type';
import type { DroppingPosition } from './type.rgl';

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
		children,
		wrapperProps,
	} = props;

	const ref = useRef<HTMLDivElement>(null);
	const [resizing, setResizing] = useState<Resizing>();
	const [dragging, setDragging] = useState<Dragging>();
	const prevDropPosition = useRef<DroppingPosition>();

	const currentPosition = useRef<Position>();

	useEffect(() => {
		return () => {
			console.log('item unmounted', i);
		};
	}, [i]);

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
				// Call callback with this data
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
			const { dragging } = innerState.current;
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
				setDragging({ top, left });
				const { x, y } = calcXY(innerProps.current.positionParams, top, left, w, h);
				onDrag(i, x, y, {
					e,
					node,
					position: { top, left },
				});
			}
		},
		[h, i, isBounded, onDrag, w],
	);

	const onGridDragStop: InnerDragStopHandler = useCallback(
		(e, { node }) => {
			const { dragging } = innerState.current;
			if (typeof onDragStop === 'function' && dragging) {
				const { left, top } = dragging;
				setDragging(void 0);
				const { x, y } = calcXY(innerProps.current.positionParams, top, left, w, h);
				onDragStop(i, x, y, {
					e,
					node,
					position: { top, left },
				});
			}
		},
		[h, i, onDragStop, w],
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
			const { w, h } = calcWH(
				innerProps.current.positionParams,
				updatedSize.width,
				updatedSize.height,
				x,
				y,
				handle,
			);
			return {
				w: clamp(w, Math.max(minW, 1), maxW),
				h: clamp(h, minH, maxH),
				updatedSize,
			};
		},
		[containerWidth, maxH, maxW, minH, minW, x, y],
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
	// Calculate min/max constraints using our min & maxes
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
		const shouldDrag =
			(dragging && droppingPosition.left !== prevDroppingPosition.left) ||
			droppingPosition.top !== prevDroppingPosition.top;

		if (!dragging) {
			onGridDragStart(droppingPosition.e, {
				node,
			});
		} else if (shouldDrag) {
			const deltaX = droppingPosition.left - dragging.left;
			const deltaY = droppingPosition.top - dragging.top;
			onGridDrag(droppingPosition.e, {
				node,
				deltaX,
				deltaY,
			});
		}
		prevDropPosition.current = droppingPosition;
	}, [dragging, droppingPosition, onGridDrag, onGridDragStart]);

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
				resizeHandles={resizeHandles}
				handle={resizeHandle}>
				{typeof wrapperProps === 'undefined' ? (
					cloneElement(children, {
						ref,
						className: cls,
						style: {
							...props.style,
							...children.props.style,
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
	(prev, next) => fastGridItemPropsEqual(prev, next, isEqual),
);

export default Wrapper;
