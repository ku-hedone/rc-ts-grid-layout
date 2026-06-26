import {
	useState,
	useMemo,
	Children,
	useRef,
	memo,
	useCallback,
	useLayoutEffect,
	useEffect,
} from 'react';
import {
	bottom,
	childrenEqual,
	cloneLayoutItem,
	compact,
	fastRGLPropsEqual,
	compactType as genCompactType,
	getAllCollisions,
	getLayoutItem,
	moveElement,
	noop,
	synchronizeLayoutWithChildren,
	withLayoutItem,
} from './utils';
import GridItem from './item';
import { deepEqual } from './equals';
import { calcXY } from './calculate';
import { flushSync } from 'react-dom';
import { layoutClassName } from './constant';
import { isEqual } from 'lodash';
import './grid.css';
import 'react-resizable/css/styles.css';
import type { DragEventHandler, ReactElement, ReactNode, FC } from 'react';
import type { DragNativeEvent, DroppingPosition, RGLProps } from './type.rgl';
import type { CompactType, Layout, LayoutItem } from './type';
import type { ItemProps } from './type.item';
import type { ResizeHandle } from 'react-resizable';

type Rect = Pick<ItemProps, 'w' | 'h' | 'x' | 'y' | 'i'> & {
	from: 'drag' | 'resize';
	static: true;
};

type DragHandler = DragEventHandler<HTMLDivElement>;

const defaultMargin = [10, 10] as [number, number];
const defaultResizeHandles: ResizeHandle[] = ['se'];
const defaultLayout: Layout = [];
const defaultDroppingItem = {
	i: '__dropping-elem__',
	h: 1,
	w: 1,
};

// 场景 1
// wrapper -> layout -> grid-layout
// 计算 next-layout
// 如果 next-layout !== layout
// 回调 onLayoutChange 更新 wrapper 的 layout

// 场景 2
// 更新 wrapper 的 layout
// grid-layout 更新 inner-layout

const GridLayout: FC<RGLProps> = memo(
	({
		innerRef,
		autoSize = true,
		cols = 12,
		className = '',
		style = {},
		draggableHandle = '',
		draggableCancel = '',
		rowHeight = 150,
		maxRows = Infinity, // 无限垂直增长
		layout = defaultLayout,
		margin = defaultMargin,
		isBounded = false,
		isDraggable = true,
		isResizable = true,
		allowOverlap = false,
		isDroppable = false,
		useCSSTransforms = true,
		transformScale = 1,
		verticalCompact = true,
		compactType = 'vertical' as CompactType,
		preventCollision = false,
		droppingItem = defaultDroppingItem,
		resizeHandles = defaultResizeHandles,
		containerPadding,
		children,
		width,
		onLayoutChange = noop,
		onDrop = noop,
		onDropDragOver = noop,
		resizeHandle,
		onDrag = noop,
		onDragStart = noop,
		onDragStop = noop,
		onResizeStart = noop,
		onResize = noop,
		onResizeStop = noop,
		mergeStyle = false,
		attributes = {},
		wrapperProps,
	}) => {
		const lastLayout = useRef<Layout>(layout);
		/**
		 * 上一个布局项
		 */
		const old = useRef<LayoutItem | undefined>(undefined);
		const droppingDOM = useRef<ReactElement | undefined>(undefined);
		const lastRect = useRef<Rect | undefined>(undefined);
		const resizing = useRef(false);
		const dragEnterCount = useRef(0);
		// 缓存上一次的 children，用于浅比较避免不必要的重计算
		const lastChildrenRef = useRef<ReactNode>(children);
		const lastChildrenLayoutRef = useRef<Layout>([]);
		// 最终紧凑类型
		// 兼容 verticalCompact: false 的旧用法
		const innerCompactType = useMemo(
			() =>
				genCompactType({
					compactType,
					verticalCompact,
				}),
			[compactType, verticalCompact],
		);

		// 使用 childrenEqual 进行浅比较，避免 children 引用变化但内容相同时的重计算
		const childrenChanged = !childrenEqual(lastChildrenRef.current, children);
		if (childrenChanged) {
			lastChildrenRef.current = children;
		}

		const latestLayout = useMemo(() => {
			const next = synchronizeLayoutWithChildren(
				layout,
				children,
				cols,
				innerCompactType,
				allowOverlap,
			);
			// 只有当布局真正变化时才返回新对象
			if (childrenEqual(lastChildrenRef.current, children) &&
				lastChildrenLayoutRef.current.length > 0 &&
				lastChildrenLayoutRef.current.length === next.length) {
				// 内容相同，检查布局是否真的变化了
				const layoutChanged = next.some((item, index) => {
					const prev = lastChildrenLayoutRef.current[index];
					return !prev || prev.x !== item.x || prev.y !== item.y ||
						prev.w !== item.w || prev.h !== item.h || prev.i !== item.i;
				});
				if (!layoutChanged) {
					return lastChildrenLayoutRef.current;
				}
			}
			lastChildrenLayoutRef.current = next;
			return next;
		}, [allowOverlap, childrenChanged, cols, innerCompactType, layout]);

		const [droppingPosition, setDroppingPosition] = useState<DroppingPosition>();
		const [innerLayout, setInnerLayout] = useState<Layout>(latestLayout);

		const innerPropsRef = useRef({
			layout: innerLayout,
			compactType: innerCompactType,
		});

		lastLayout.current = layout;

		innerPropsRef.current = {
			layout: innerLayout,
			compactType: innerCompactType,
		};

		const [rect, setRect] = useState<Rect>();
		const [mounted, setMounted] = useState(false);

		const containerHeight = useMemo(() => {
			if (!autoSize) return;
			const nbRow = bottom(innerLayout);
			const containerPaddingY = Array.isArray(containerPadding)
				? containerPadding[1]
				: margin[1];
			return nbRow * rowHeight + (nbRow - 1) * margin[1] + containerPaddingY * 2 + 'px';
		}, [autoSize, containerPadding, innerLayout, margin, rowHeight]);
		// 拖拽或调整大小时生成占位元素
		const placeholder = useMemo(() => {
			if (rect) {
				const { w, h, x, y, i } = rect;
				const cls = `react-grid-placeholder ${
					resizing.current ? 'placeholder-resizing' : ''
				}`.trim();
				return (
					<GridItem
						key="grid-item-placeholder"
						w={w}
						h={h}
						x={x}
						y={y}
						i={i}
						className={cls}
						containerWidth={width}
						cols={cols}
						margin={margin}
						containerPadding={containerPadding}
						maxRows={maxRows}
						rowHeight={rowHeight}
						isDraggable={false}
						isResizable={false}
						isBounded={false}
						useCSSTransforms={useCSSTransforms}
						transformScale={transformScale}>
						<div
							key="item-placeholder"
							{...wrapperProps}
						/>
					</GridItem>
				);
			}
			return null;
		}, [
			cols,
			containerPadding,
			margin,
			maxRows,
			rect,
			rowHeight,
			transformScale,
			useCSSTransforms,
			width,
			wrapperProps,
		]);

		const onLayoutMaybeChanged = useCallback(
			(nextLayout: Layout, prevLayout: Layout) => {
				if (!deepEqual(prevLayout, nextLayout)) {
					// inner 与 outer 的layout 不同时, 应回调父级 onLayoutChange
					onLayoutChange(nextLayout);
				}
			},
			[onLayoutChange],
		);
		// 当 layout 或 children 更新时
		// 移除占位元素
		const removeDroppingPlaceholder = useCallback(() => {
			const nextLayout = compact(
				innerLayout.filter((l) => l.i !== droppingItem.i),
				innerCompactType,
				cols,
				allowOverlap,
			);
			droppingDOM.current = void 0;
			old.current = void 0;
			flushSync(() => {
				setDroppingPosition(void 0);
				setInnerLayout(nextLayout);
			});
		}, [allowOverlap, cols, droppingItem.i, innerCompactType, innerLayout]);

		const preventBrowserNativeAction = useCallback((e: DragNativeEvent) => {
			// 阻止浏览器默认行为
			e.preventDefault();
			e.stopPropagation();
		}, []);
		// 放置事件处理
		const onInnerDrop: DragHandler = useCallback(
			(e) => {
				preventBrowserNativeAction(e);
				const item = innerLayout.find((l) => l.i === droppingItem.i);
				// 放置时重置 dragEnter 计数器
				dragEnterCount.current = 0;
				removeDroppingPlaceholder();
				if (typeof onDrop === 'function') {
					onDrop(innerLayout, item, e);
				} else {
					console.warn('there os no onDrop function');
				}
			},
			[
				droppingItem.i,
				innerLayout,
				onDrop,
				preventBrowserNativeAction,
				removeDroppingPlaceholder,
			],
		);
		// 拖拽离开事件处理
		const onInnerDragLeave: DragHandler = useCallback(
			(e) => {
				preventBrowserNativeAction(e);
				dragEnterCount.current--;
				// onDragLeave 会在布局的每个子元素上触发。
				// 但 dragEnter 和 dragLeave 事件的触发次数
				// 在离开布局容器后会保持平衡，
				// 因此可以通过增减 dragEnter 计数，
				// 当计数为 0 时移除占位元素
				if (dragEnterCount.current === 0) {
					removeDroppingPlaceholder();
				}
			},
			[preventBrowserNativeAction, removeDroppingPlaceholder],
		);
		// 拖拽进入事件处理
		const onInnerDragEnter: DragHandler = useCallback(
			(e) => {
				preventBrowserNativeAction(e);
				dragEnterCount.current++;
			},
			[preventBrowserNativeAction],
		);
		// 拖拽元素时触发，属于浏览器原生拖放 API。
		// 原生事件目标可能是布局容器本身，也可能是布局内的某个元素。
		const onInnerDragOver: DragHandler = useCallback(
			(e) => {
				preventBrowserNativeAction(e);
				// 允许用户自定义放置项，或根据 onDragOver(e: Event) 回调的结果
				// 提前终止放置操作。
				if (typeof onDropDragOver === 'function') {
					const onDragOverResult = onDropDragOver(e);
					if (onDragOverResult === false) {
						if (droppingDOM.current) {
							removeDroppingPlaceholder();
						}
						return false;
					}
					const { w, h, ...dropItem } = { ...droppingItem, ...onDragOverResult };
					const gridRect = e.currentTarget.getBoundingClientRect(); // 获取网格在视口中的位置
					// 计算鼠标相对于网格的位置
					const layerX = e.clientX - gridRect.left;
					const layerY = e.clientY - gridRect.top;
					const position = {
						left: layerX / transformScale,
						top: layerY / transformScale,
						e,
					};
					if (!droppingDOM.current) {
						if (typeof w !== 'undefined' && typeof h !== 'undefined') {
							const calcPosition = calcXY(
								{
									cols,
									margin,
									maxRows,
									rowHeight,
									containerWidth: width,
									containerPadding,
								},
								layerY,
								layerX,
								w,
								h,
							);
							droppingDOM.current = <div key={`drop-dom-${dropItem.i}`} />;
							setDroppingPosition(position);
							setInnerLayout((prev) => [
								...prev,
								{
									...dropItem,
									w,
									h,
									x: calcPosition.x,
									y: calcPosition.y,
									static: false,
									isDraggable: true,
								} as Layout[number],
							]);
						}
					} else {
						if (droppingPosition) {
							const { left, top } = droppingPosition;
							const shouldUpdatePosition = left !== layerX || top !== layerY;
							if (shouldUpdatePosition) {
								setDroppingPosition(position);
							}
						}
					}
				}
			},
			[
				cols,
				containerPadding,
				droppingItem,
				droppingPosition,
				margin,
				maxRows,
				onDropDragOver,
				preventBrowserNativeAction,
				removeDroppingPlaceholder,
				rowHeight,
				transformScale,
				width,
			],
		);

		const onInnerDragStart: Required<ItemProps>['onDragStart'] = useCallback(
			(i, _x, _y, { e, node }) => {
				const item = getLayoutItem(innerPropsRef.current.layout, i);
				if (item) {
					const { w, h, x, y } = item;
					// 创建占位元素（仅用于显示）
					const placeholder: Rect = {
						w,
						h,
						x,
						y,
						from: 'drag',
						i,
						static: true,
					};
					old.current = cloneLayoutItem(item);
					setRect(placeholder);
					lastRect.current = placeholder;
					if (typeof onDragStart === 'function') {
						onDragStart(innerPropsRef.current.layout, item, item, void 0, e, node);
					} else {
						console.warn('there is no onDragStart');
					}
				}
			},
			[onDragStart],
		);

		const onInnerDrag: Required<ItemProps>['onDrag'] = useCallback(
			(i, x, y, { e, node }) => {
				const item = getLayoutItem(innerPropsRef.current.layout, i);
				if (item) {
					/**
					 * 占位元素的矩形信息
					 */
					const nextRect: Rect = {
						w: item.w,
						h: item.h,
						x: item.x,
						y: item.y,
						from: 'drag',
						i,
						static: true,
					};
					// 将元素移动到拖拽位置。
					const isUserAction = true;
					const currentLayout = moveElement(
						innerPropsRef.current.layout,
						item,
						x,
						y,
						isUserAction,
						preventCollision,
						innerPropsRef.current.compactType,
						cols,
						allowOverlap,
					);
					// 使用普通状态更新，让 React 18 自动批处理
					// 移除 flushSync 以避免每帧强制同步渲染
					const nextInnerLayout = allowOverlap
						? currentLayout
						: compact(currentLayout, innerPropsRef.current.compactType, cols);
					if (!isEqual(nextRect, lastRect.current)) {
						setRect(nextRect);
						lastRect.current = nextRect;
					}

					if (!isEqual(innerPropsRef.current.layout, nextInnerLayout)) {
						setInnerLayout(nextInnerLayout);
					}
					if (typeof onDrag === 'function') {
						onDrag(currentLayout, old.current, item, nextRect, e, node);
					} else {
						console.warn('there is no onDrag');
					}
				}
			},
			[preventCollision, cols, allowOverlap, onDrag],
		);
		const onInnerDragStop: Required<ItemProps>['onDragStop'] = useCallback(
			(i, x, y, { e, node }) => {
				if (lastRect.current) {
					const item = getLayoutItem(innerPropsRef.current.layout, i);
					if (item) {
						// 保存拖拽前的 item 信息
						const previousItem = old.current;
						// 将元素移动到此处
						const isUserAction = true;
						const currentLayout = moveElement(
							innerPropsRef.current.layout,
							item,
							x,
							y,
							isUserAction,
							preventCollision,
							innerPropsRef.current.compactType,
							cols,
							allowOverlap,
						);
						const nextLayout = allowOverlap
							? currentLayout
							: compact(currentLayout, innerPropsRef.current.compactType, cols);
						old.current = void 0;
						lastRect.current = void 0;
						flushSync(() => {
							setRect(void 0);
							if (!isEqual(innerPropsRef.current.layout, nextLayout)) {
								setInnerLayout(nextLayout);
							}
						});
						if (typeof onDragStop === 'function') {
							onDragStop(nextLayout, previousItem, item, void 0, e, node);
						} else {
							console.warn('there is no onDragStop');
						}
					}
				}
			},
			[allowOverlap, cols, onDragStop, preventCollision],
		);
		// 调整大小相关逻辑
		const onInnerResizeStart: Required<ItemProps>['onResizeStart'] = useCallback(
			(i, _w, _h, { e, node }) => {
				const item = getLayoutItem(innerPropsRef.current.layout, i);
				if (item) {
					old.current = cloneLayoutItem(item);
					resizing.current = true;
					if (typeof onResizeStart === 'function') {
						onResizeStart(innerPropsRef.current.layout, item, item, void 0, e, node);
					} else {
						console.warn('there is no onResizeStart');
					}
				}
			},
			[onResizeStart],
		);

		const onInnerResize: Required<ItemProps>['onResize'] = useCallback(
			(i, w, h, { e, node, handle }) => {
				let shouldMoveItem = false;
				let x;
				let y;
				const [nextLayout, item] = withLayoutItem(
					innerPropsRef.current.layout,
					i,
					(item) => {
						let hasCollisions;
						x = item.x;
						y = item.y;
						if (['sw', 'w', 'nw', 'n', 'ne'].indexOf(handle) !== -1) {
							if (['sw', 'nw', 'w'].indexOf(handle) !== -1) {
								x = item.x + (item.w - w);
								w = item.x !== x && x < 0 ? item.w : w;
								x = x < 0 ? 0 : x;
							}

							if (['ne', 'n', 'nw'].indexOf(handle) !== -1) {
								y = item.y + (item.h - h);
								h = item.y !== y && y < 0 ? item.h : h;
								y = y < 0 ? 0 : y;
							}
							shouldMoveItem = true;
						}
						// 应使用类似四叉树的结构
						// 以更快地检测碰撞
						if (preventCollision && !allowOverlap) {
							const collisions = getAllCollisions(innerPropsRef.current.layout, {
								...item,
								w,
								h,
								x,
								y,
							}).filter((layoutItem) => layoutItem.i !== item.i);
							hasCollisions = collisions.length > 0;

							// 如果发生碰撞，需要调整占位元素。
							if (hasCollisions) {
								// 如果发生碰撞，重置布局项尺寸
								y = item.y;
								h = item.h;
								x = item.x;
								w = item.w;
								shouldMoveItem = false;
							}
						}

						item.w = w;
						item.h = h;

						return item;
					},
				);
				if (item) {
					// 理论上不会出现，但类型检查要求处理此情况
					let finalLayout = nextLayout;
					if (shouldMoveItem) {
						// 将元素移动到新位置。
						const isUserAction = true;
						finalLayout = moveElement(
							nextLayout,
							item,
							x,
							y,
							isUserAction,
							preventCollision,
							innerPropsRef.current.compactType,
							cols,
							allowOverlap,
						);
					}
					// 创建占位元素（仅用于显示）
					const placeholder: Rect = {
						w: item.w,
						h: item.h,
						x: item.x,
						y: item.y,
						i,
						from: 'resize',
						static: true,
					};
					if (typeof onResize === 'function') {
						onResize(finalLayout, old.current, item, placeholder, e, node);
					} else {
						console.warn('there is no onResize');
					}
					// 使用普通状态更新，让 React 18 自动批处理
					// 移除 flushSync 以避免每帧强制同步渲染
					const nextInnerLayout = allowOverlap
						? finalLayout
						: compact(finalLayout, innerPropsRef.current.compactType, cols);
					// 重新紧凑排列布局并设置拖拽占位元素。
					if (!isEqual(lastRect.current, placeholder)) {
						setRect(placeholder);
						lastRect.current = placeholder;
					}
					if (!isEqual(innerPropsRef.current.layout, nextInnerLayout)) {
						setInnerLayout(nextInnerLayout);
					}
				}
			},
			[allowOverlap, cols, onResize, preventCollision],
		);
		const onInnerResizeStop: Required<ItemProps>['onResizeStop'] = useCallback(
			(i, _w, _h, { e, node }) => {
				const item = getLayoutItem(innerPropsRef.current.layout, i);
				const nextLayout = allowOverlap
					? innerPropsRef.current.layout
					: compact(
							innerPropsRef.current.layout,
							innerPropsRef.current.compactType,
							cols,
						);
				const previousItem = old.current;
				lastRect.current = void 0;
				old.current = void 0;
				resizing.current = false;
				flushSync(() => {
					if (!isEqual(innerPropsRef.current.layout, nextLayout)) {
						setInnerLayout(nextLayout);
					}
					setRect(void 0);
				});
				if (typeof onResizeStop === 'function') {
					onResizeStop(nextLayout, previousItem, item, void 0, e, node);
				} else {
					console.warn('there is no onResizeStop');
				}
			},
			[allowOverlap, cols, onResizeStop],
		);

		const genGridItem = useCallback(
			(child: ReactNode, isDrop?: boolean) => {
				if (child && typeof child === 'object' && 'key' in child) {
					const item = getLayoutItem(innerLayout, String(child.key));
					if (!item) {
						return null;
					}
					// 确定用户可执行的操作。
					// 静态项默认不可操作。
					// 直接定义在网格项上的属性优先级更高。
					const { w, h, x, y, i, minH, minW, maxH, maxW } = item;
					const draggable =
						typeof item.isDraggable === 'boolean'
							? item.isDraggable
							: !item.static && isDraggable;
					const resizable =
						typeof item.isResizable === 'boolean'
							? item.isResizable
							: !item.static && isResizable;
					const resizeHandlesOptions = item.resizeHandles || resizeHandles;
					// 如果父级设置了 isBounded，则子项也继承，除非子项显式设为 false
					const bounded = draggable && isBounded && item.isBounded !== false;
					return (
						<GridItem
							key={`Grid-Item-${child.key}`}
							containerWidth={width}
							cols={cols}
							margin={margin}
							containerPadding={containerPadding}
							maxRows={maxRows}
							rowHeight={rowHeight}
							cancel={draggableCancel}
							handle={draggableHandle}
							onDragStop={onInnerDragStop}
							onDragStart={onInnerDragStart}
							onDrag={onInnerDrag}
							onResizeStart={onInnerResizeStart}
							onResize={onInnerResize}
							onResizeStop={onInnerResizeStop}
							isDraggable={draggable}
							isResizable={resizable}
							isBounded={bounded}
							useCSSTransforms={useCSSTransforms && mounted}
							usePercentages={!mounted}
							transformScale={transformScale}
							w={w}
							h={h}
							x={x}
							y={y}
							i={i}
							minH={minH}
							minW={minW}
							maxH={maxH}
							maxW={maxW}
							static={item.static}
							droppingPosition={isDrop ? droppingPosition : undefined}
							resizeHandles={resizeHandlesOptions}
							resizeHandle={resizeHandle}
							wrapperProps={wrapperProps}>
							{child}
						</GridItem>
					);
				}
				return null;
			},
			[
				cols,
				containerPadding,
				draggableCancel,
				draggableHandle,
				droppingPosition,
				isBounded,
				isDraggable,
				isResizable,
				margin,
				maxRows,
				mounted,
				onInnerDrag,
				onInnerDragStart,
				onInnerDragStop,
				onInnerResize,
				onInnerResizeStart,
				onInnerResizeStop,
				resizeHandle,
				resizeHandles,
				rowHeight,
				transformScale,
				useCSSTransforms,
				width,
				innerLayout,
				wrapperProps,
			],
		);

		const mergedStyle = useMemo(() => {
			if (mergeStyle) {
				return {
					height: containerHeight,
					...style,
				};
			}
			return style;
		}, [mergeStyle, containerHeight, style]);

		const mergedClassName = useMemo(
			() => `${layoutClassName} ${className || ''}`.trimEnd(),
			[className],
		);

		useEffect(() => {
			// 非拖拽或调整大小状态下
			if (!lastRect.current) {
				setInnerLayout(latestLayout);
			}
		}, [latestLayout]);

		// 初始化布局
		useLayoutEffect(() => {
			if (!mounted) {
				setMounted(true);
			}
		}, [mounted]);

		useEffect(() => {
			// const previousLayout = lastLayout.current;
			if (mounted) {
				// 挂载后可能需要回调 layout 变更。
				// 应在修正布局宽度之后执行，
				// 以确保不会以错误的宽度重新渲染。
				onLayoutMaybeChanged(innerLayout, lastLayout.current);
			}
		}, [innerLayout, mounted, onLayoutMaybeChanged]);

		return (
			<div
				ref={innerRef}
				className={mergedClassName}
				style={mergedStyle}
				onDrop={isDroppable ? onInnerDrop : noop}
				onDragLeave={isDroppable ? onInnerDragLeave : noop}
				onDragEnter={isDroppable ? onInnerDragEnter : noop}
				onDragOver={isDroppable ? onInnerDragOver : noop}
				{...attributes}>
				<>
					{Children.map(children, (child) => genGridItem(child))}
					{isDroppable && droppingDOM.current && genGridItem(droppingDOM.current, true)}
					{placeholder}
				</>
			</div>
		);
	},
	(prev, next) =>
		prev.children === next.children && fastRGLPropsEqual(prev, next, isEqual),
);

export default GridLayout;
