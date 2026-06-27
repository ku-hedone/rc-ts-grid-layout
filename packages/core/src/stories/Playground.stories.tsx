/**
 * GridLayout Playground
 *
 * 交互式 playground，通过控制面板实时修改所有配置。
 */

import type { ReactNode } from 'react';

import { useState, useMemo } from 'react';

import '../polyfill';
import type { Layout, Compactor, PositionStrategy, LayoutConstraint } from '../type';

import {
  GridLayout,
  verticalCompactor,
  horizontalCompactor,
  noCompactor,
  verticalOverlapCompactor,
  horizontalOverlapCompactor,
  noOverlapCompactor,
  transformStrategy,
  absoluteStrategy,
  defaultConstraints,
  containerBounds,
} from '../index';

type LadleStory<TArgs extends object> = ((args: TArgs) => ReactNode) & {
  args?: Partial<TArgs>;
  argTypes?: Record<string, unknown>;
};

// ─── Compactor 选项映射 ───

const COMPACTORS: Record<string, Compactor> = {
  vertical: verticalCompactor,
  horizontal: horizontalCompactor,
  none: noCompactor,
  'vertical (overlap)': verticalOverlapCompactor,
  'horizontal (overlap)': horizontalOverlapCompactor,
  'none (overlap)': noOverlapCompactor,
};

const POSITION_STRATEGIES: Record<string, PositionStrategy> = {
  transform: transformStrategy,
  absolute: absoluteStrategy,
};

// ─── 主 Playground ───

export const Playground: LadleStory<{
  cols: number;
  rowHeight: number;
  marginX: number;
  marginY: number;
  compactor: string;
  positionStrategy: string;
  isDraggable: boolean;
  isResizable: boolean;
  isBounded: boolean;
  autoSize: boolean;
  maxRows: number;
}> = ({
  cols,
  rowHeight,
  marginX,
  marginY,
  compactor,
  positionStrategy,
  isDraggable,
  isResizable,
  isBounded,
  autoSize,
  maxRows,
}) => {
  const [layout, setLayout] = useState<Layout>([
    { i: 'a', x: 0, y: 0, w: 2, h: 2 },
    { i: 'b', x: 2, y: 0, w: 3, h: 1 },
    { i: 'c', x: 5, y: 0, w: 2, h: 3 },
    { i: 'd', x: 0, y: 2, w: 4, h: 2 },
    { i: 'e', x: 7, y: 0, w: 2, h: 1 },
  ]);

  const selectedCompactor = COMPACTORS[compactor] ?? verticalCompactor;
  const selectedStrategy = POSITION_STRATEGIES[positionStrategy] ?? transformStrategy;

  const constraints = useMemo<LayoutConstraint[]>(
    () => (isBounded ? [...defaultConstraints, containerBounds] : defaultConstraints),
    [isBounded],
  );

  return (
    <div>
      <GridLayout
        width={1200}
        layout={layout}
        gridConfig={{ cols, rowHeight, margin: [marginX, marginY], maxRows }}
        dragConfig={{ enabled: isDraggable }}
        resizeConfig={{ enabled: isResizable }}
        compactor={selectedCompactor}
        positionStrategy={selectedStrategy}
        constraints={constraints}
        autoSize={autoSize}
        onLayoutChange={setLayout}
      >
        {layout.map((item) => (
          <div
            key={item.i}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {item.i.toUpperCase()}
          </div>
        ))}
      </GridLayout>

      <pre
        style={{ marginTop: 16, padding: 12, background: '#f1f5f9', borderRadius: 8, fontSize: 12 }}
      >
        {JSON.stringify(layout, null, 2)}
      </pre>
    </div>
  );
};

Playground.args = {
  cols: 12,
  rowHeight: 30,
  marginX: 10,
  marginY: 10,
  compactor: 'vertical',
  positionStrategy: 'transform',
  isDraggable: true,
  isResizable: true,
  isBounded: false,
  autoSize: true,
  maxRows: Infinity,
};

Playground.argTypes = {
  cols: { control: { type: 'range', min: 1, max: 24, step: 1 } },
  rowHeight: { control: { type: 'range', min: 10, max: 100, step: 5 } },
  marginX: { control: { type: 'range', min: 0, max: 50, step: 2 } },
  marginY: { control: { type: 'range', min: 0, max: 50, step: 2 } },
  compactor: {
    control: { type: 'select' },
    options: Object.keys(COMPACTORS),
  },
  positionStrategy: {
    control: { type: 'select' },
    options: Object.keys(POSITION_STRATEGIES),
  },
  isDraggable: { control: { type: 'boolean' } },
  isResizable: { control: { type: 'boolean' } },
  isBounded: { control: { type: 'boolean' } },
  autoSize: { control: { type: 'boolean' } },
  maxRows: { control: { type: 'range', min: 1, max: 20, step: 1 } },
};

// ─── Dropping Playground ───

export const DroppingPlayground: LadleStory<{
  dropW: number;
  dropH: number;
}> = ({ dropW, dropH }) => {
  const [layout, setLayout] = useState<Layout>([{ i: 'a', x: 0, y: 0, w: 2, h: 2 }]);

  return (
    <div>
      <div
        draggable
        onDragStart={(e) => e.dataTransfer.setData('text/plain', 'new-item')}
        style={{
          display: 'inline-block',
          padding: '8px 16px',
          background: '#3b82f6',
          color: 'white',
          borderRadius: 6,
          cursor: 'grab',
          marginBottom: 12,
        }}
      >
        拖入网格
      </div>

      <GridLayout
        width={1200}
        layout={layout}
        gridConfig={{ cols: 12, rowHeight: 30 }}
        dropConfig={{
          enabled: true,
          defaultItem: { w: dropW, h: dropH, i: '__dropping-elem__' },
        }}
        onLayoutChange={setLayout}
        onDrop={(_layout, item) => {
          if (item) setLayout((prev) => [...prev, { ...item, i: `drop-${Date.now()}` }]);
        }}
      >
        {layout.map((item) => (
          <div
            key={item.i}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {item.i}
          </div>
        ))}
      </GridLayout>
    </div>
  );
};

DroppingPlayground.args = {
  dropW: 2,
  dropH: 2,
};

DroppingPlayground.argTypes = {
  dropW: { control: { type: 'range', min: 1, max: 6, step: 1 } },
  dropH: { control: { type: 'range', min: 1, max: 6, step: 1 } },
};
