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
  GenResizeParams,
  GridInnerResizeHandler,
  InnerDragHandler,
  InnerDragStartHandler,
  InnerDragStopHandler,
  ItemProps,
} from './type.item';
import type { PartialPosition, Position } from './type';
import type { DroppingPosition } from './type.rgl';

interface Resizing {
  top: number;
  left: number;
  width: number;
  height: number;
}
interface Dragging {
  top: number;
  left: number;
}

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
  } = props;

  const ref = useRef<HTMLDivElement>(null);
  const [resizing, setResizing] = useState<Resizing>();
  const [dragging, setDragging] = useState<Dragging>();
  const prevDropPosition = useRef<DroppingPosition>();

  const currentPosition = useRef<Position>();

  const cls = useMemo(
    () =>
      [
        'react-grid-item',
        children.props.className,
        className,
        props.static ? 'static' : '',
        isDraggable ? 'react-draggable' : '',
        typeof dragging !== 'undefined' ? 'react-draggable-dragging' : '',
        typeof droppingPosition !== 'undefined' ? 'dropping' : '',
        useCSSTransforms ? 'cssTransforms' : '',
      ]
        .filter((i) => !!i)
        .join(' ')
        .trim(),
    [
      children.props.className,
      className,
      dragging,
      droppingPosition,
      isDraggable,
      props.static,
      useCSSTransforms,
    ],
  );

  const positionParams = useMemo(
    () => ({
      cols,
      containerPadding,
      containerWidth,
      margin,
      maxRows,
      rowHeight,
    }),
    [cols, containerPadding, containerWidth, margin, maxRows, rowHeight],
  );

  const position = useMemo(
    () =>
      calcGridItemPosition(positionParams, x, y, w, h, {
        resizing,
        dragging,
      }),
    [dragging, h, positionParams, resizing, w, x, y],
  );

  currentPosition.current = position;

  const onGridDragStart: InnerDragStartHandler = useCallback(
    (e, { node }) => {
      if (typeof onDragStart === 'function') {
        // TODO: this wont work on nested parents
        const { offsetParent } = node;
        if (!offsetParent) return;
        const parentRect = offsetParent.getBoundingClientRect();
        const clientRect = node.getBoundingClientRect();
        const position: PartialPosition = {
          top:
            (clientRect.top - parentRect.top) / transformScale + offsetParent.scrollTop,
          left:
            (clientRect.left - clientRect.top) / transformScale + offsetParent.scrollLeft,
        };
        setDragging(position);
        // Call callback with this data
        const { x, y } = calcXY(positionParams, position.top, position.left, w, h);
        onDragStart(i, x, y, {
          e,
          node,
          position,
        });
      }
    },
    [h, i, onDragStart, positionParams, transformScale, w],
  );

  const onGridDrag: InnerDragHandler = useCallback(
    (e, { node, deltaX, deltaY }) => {
      if (typeof onDrag === 'function') {
        if (!dragging) {
          throw new Error('onDrag called before onDragStart.');
        }
        let top = dragging.top + deltaY;
        let left = dragging.left + deltaX;
        if (isBounded) {
          const { offsetParent } = node;
          if (offsetParent) {
            const bottomBoundary =
              offsetParent.clientHeight - calcGridItemWHPx(h, rowHeight, margin[1]);
            top = clamp(top - containerPadding[1], 0, bottomBoundary);

            const colWidth = calcGridColWidth(positionParams);
            const rightBoundary =
              containerWidth - calcGridItemWHPx(w, colWidth, margin[0]);
            left = clamp(left - containerPadding[0], 0, rightBoundary);
          }
        }
        setDragging({ top, left });
        // Call callback with this data
        const { x, y } = calcXY(
          positionParams,
          top - containerPadding[1],
          left - containerPadding[0],
          w,
          h,
        );
        onDrag(i, x, y, {
          e,
          node,
          position: { top, left },
        });
      }
    },
    [
      containerPadding,
      containerWidth,
      dragging,
      h,
      i,
      isBounded,
      margin,
      onDrag,
      positionParams,
      rowHeight,
      w,
    ],
  );

  const onGridDragStop: InnerDragStopHandler = useCallback(
    (e, { node }) => {
      if (typeof onDragStop === 'function') {
        if (!dragging) {
          throw new Error('onDrag called before onDragStart.');
        }
        const { left, top } = dragging;
        setDragging(void 0);
        const { x, y } = calcXY(
          positionParams,
          top - containerPadding[1],
          left - containerPadding[0],
          w,
          h,
        );
        onDragStop(i, x, y, {
          e,
          node,
          position: { top, left },
        });
      }
    },
    [containerPadding, dragging, h, i, onDragStop, positionParams, w],
  );

  const genResizeParams: GenResizeParams = useCallback(
    (data, position) => {
      const { node, handle } = data;
      let updatedSize = data.size as Position;
      // Only calculate when the resize handle DOM exists.
      if (node) {
        const { size } = data;
        // Clamping of dimensions based on resize direction
        updatedSize = resizeItemInDirection(handle, position, size, containerWidth);
      }
      // Get new XY based on pixel size
      const { w, h } = calcWH(
        positionParams,
        updatedSize.width,
        updatedSize.height,
        x,
        y,
        handle,
      );

      return {
        // Min/max capping.
        w: clamp(w, Math.max(minW, 1), maxW),
        h: clamp(h, minH, maxH),
        updatedSize,
      };
    },
    [containerWidth, maxH, maxW, minH, minW, positionParams, x, y],
  );

  const onGridResize: GridInnerResizeHandler = useCallback(
    (position) => (e, data) => {
      // (e, data) => {
        // const position = currentPosition.current;
        // if (position) {
          const nextResize = genResizeParams(data, position);
          if (typeof onResize === 'function' && nextResize) {
            const { node, handle } = data;
            const { w, h, updatedSize: size } = nextResize;
            onResize(i, w, h, { e, node, size, handle });
            if (i === '3' || i === '1') {
              console.log('onGridResize', size);
            }
            setResizing(size);
          }
        // }
    },
    [genResizeParams, i, onResize],
  );
  const onGridResizeStart: GridInnerResizeHandler = useCallback(
    (position) => (e, data) => {
      // (e, data) => {
      // const position = currentPosition.current;
      // if (position) {
      const nextResize = genResizeParams(data, position);
      if (typeof onResizeStart === 'function' && nextResize) {
        const { w, h, updatedSize: size } = nextResize;
        const { node, handle } = data;
        onResizeStart(i, w, h, { e, node, size, handle });
        setResizing(size);
      }
      // }
    },
    [genResizeParams, i, onResizeStart],
  );
  const onGridResizeStop: GridInnerResizeHandler = useCallback(
    (position) => (e, data) => {
      // (e, data) => {
        // const position = currentPosition.current;
        // if (position) {
      const nextResize = genResizeParams(data, position);
      if (typeof onResizeStop === 'function' && nextResize) {
        const { w, h, updatedSize: size } = nextResize;
        const { node, handle } = data;
        if (i === '3' || i === '1') {
          console.log(i, w, h, { e, node, size, handle }, 'onResizeStop');
        }
        onResizeStop(i, w, h, { e, node, size, handle });
        setResizing(void 0);
      }
        // }

    },
    [genResizeParams, i, onResizeStop],
    // [genResizeParams, i, onResizeStop, position],
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
    () => '.react-resizable-handle' + (cancel ? ',' + cancel : ''),
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
      nodeRef={ref}>
      <Resizable
        draggableOpts={{
          disabled: !isResizable,
        }}
        className={isResizable ? undefined : 'react-resizable-hide'}
        width={position.width}
        height={position.height}
        minConstraints={minConstraints}
        maxConstraints={maxConstraints}
        // onResizeStop={onGridResizeStop}
        // onResizeStart={onGridResizeStart}
        // onResize={onGridResize}
        onResizeStop={onGridResizeStop(position)}
        onResizeStart={onGridResizeStart(position)}
        onResize={onGridResize(position)}
        transformScale={transformScale}
        resizeHandles={resizeHandles}
        handle={resizeHandle}>
        {cloneElement(children, {
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
        })}
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
