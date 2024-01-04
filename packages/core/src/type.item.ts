import type { ReactElement, CSSProperties, SyntheticEvent, RefObject } from 'react';
import type { ResizableProps, ResizeCallbackData, ResizeHandle } from 'react-resizable';
import type { DroppingPosition } from './type.rgl';
import type { DraggableEvent, DraggableData } from 'react-draggable';
import type { Position } from './type';

type GridDragEvent = {
  e: DraggableEvent;
  node: HTMLElement;
  position: Pick<Position, 'left' | 'top'>;
};
type GridResizeEvent = {
  e: SyntheticEvent;
  node: HTMLElement;
  size: ResizeCallbackData['size'];
  handle: ResizeCallbackData['handle'];
};

type GridItemCallback<T> = (i: string, w: number, h: number, Data: T) => void;

export interface ItemProps {
  children: ReactElement<{
    className: string;
    style: CSSProperties;
    ref: RefObject<HTMLDivElement>;
  }>;
  cols: number;
  containerWidth: number;
  margin: [number, number];
  containerPadding: [number, number];
  rowHeight: number;
  maxRows: number;

  isDraggable: boolean;
  isResizable: boolean;
  isBounded: boolean;
  static?: boolean;
  useCSSTransforms?: boolean;
  usePercentages?: boolean;
  transformScale: number;
  droppingPosition?: DroppingPosition;

  className?: string;
  style?: CSSProperties;

  cancel?: string;
  handle?: string;

  x: number;
  y: number;
  w: number;
  h: number;

  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
  i: string;

  resizeHandles?: ResizeHandle[];
  resizeHandle?: ResizableProps['handle'];
  /**
   * Each drag movement create a new dragelement and move the element to the dragged location
   * @param {String} i Id of the child
   * @param {Number} x X position of the move
   * @param {Number} y Y position of the move
   * @param {Event} e The mousedown event
   * @param {Element} node The current dragging DOM element
   */
  onDrag?: GridItemCallback<GridDragEvent>;
  /**
   * When dragging starts
   * @param {String} i Id of the child
   * @param {Number} x X position of the move
   * @param {Number} y Y position of the move
   * @param {Event} e The mousedown event
   * @param {Element} node The current dragging DOM element
   */
  onDragStart?: GridItemCallback<GridDragEvent>;
  /**
   * When dragging stops, figure out which position the element is closest to and update its x and y.
   * @param  {String} i Index of the child.
   * @param {Number} x X position of the move
   * @param {Number} y Y position of the move
   * @param {Event} e The mousedown event
   * @param {Element} node The current dragging DOM element
   */
  onDragStop?: GridItemCallback<GridDragEvent>;

  onResize?: GridItemCallback<GridResizeEvent>;
  onResizeStart?: GridItemCallback<GridResizeEvent>;
  onResizeStop?: GridItemCallback<GridResizeEvent>;
}

export type GenResizeParams = (
  data: ResizeCallbackData,
  position: Position,
) => {
  w: number;
  h: number;
  updatedSize: Position;
} | void;

// export type GridInnerResizeHandler = (e: SyntheticEvent<Element, Event>, data: ResizeCallbackData) => void;

export type GridInnerResizeHandler = (
  position: Position,
) => (e: SyntheticEvent<Element, Event>, data: ResizeCallbackData) => void;

export type InnerDragHandler = (e: DraggableEvent, data: Pick<DraggableData, 'node' | 'deltaX' | 'deltaY'>) => void | false;

export type InnerDragStartHandler = (e: DraggableEvent, data: Pick<DraggableData, 'node'>) => void | false;

export type InnerDragStopHandler = (e: DraggableEvent, data: Pick<DraggableData, 'node'>) => void | false;