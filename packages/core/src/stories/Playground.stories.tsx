/**
 * GridLayout 交互式控制台
 *
 * 通过 Ladle 的 control 功能动态切换各种属性
 */

import type { Story } from '@ladle/react';
import { useState, useCallback } from 'react';
import { GridLayout, ResponsiveGridLayout } from '../index';
import type { Layout, CompactType } from '../type';

// ============================================================================
// 基础交互式控制台
// ============================================================================

export const Playground: Story<{
  cols: number;
  rowHeight: number;
  marginX: number;
  marginY: number;
  compactType: CompactType;
  isDraggable: boolean;
  isResizable: boolean;
  isBounded: boolean;
  preventCollision: boolean;
  allowOverlap: boolean;
  useCSSTransforms: boolean;
  autoSize: boolean;
  maxRows: number;
}> = ({
  cols,
  rowHeight,
  marginX,
  marginY,
  compactType,
  isDraggable,
  isResizable,
  isBounded,
  preventCollision,
  allowOverlap,
  useCSSTransforms,
  autoSize,
  maxRows,
}) => {
  const [layout, setLayout] = useState<Layout>([
    { i: 'a', x: 0, y: 0, w: 2, h: 2 },
    { i: 'b', x: 2, y: 0, w: 2, h: 2 },
    { i: 'c', x: 4, y: 0, w: 2, h: 2 },
    { i: 'd', x: 0, y: 2, w: 4, h: 2 },
    { i: 'e', x: 4, y: 2, w: 2, h: 2 },
  ]);

  return (
    <div>
      <h2>交互式控制台</h2>
      <p>使用右下角的控制面板动态调整属性</p>
      <GridLayout
        width={1200}
        layout={layout}
        cols={cols}
        rowHeight={rowHeight}
        margin={[marginX, marginY]}
        compactType={compactType}
        isDraggable={isDraggable}
        isResizable={isResizable}
        isBounded={isBounded}
        preventCollision={preventCollision}
        allowOverlap={allowOverlap}
        useCSSTransforms={useCSSTransforms}
        autoSize={autoSize}
        maxRows={maxRows}
        onLayoutChange={setLayout}
      >
        <div key="a">A</div>
        <div key="b">B</div>
        <div key="c">C</div>
        <div key="d">D</div>
        <div key="e">E</div>
      </GridLayout>
    </div>
  );
};

Playground.args = {
  cols: 12,
  rowHeight: 30,
  marginX: 10,
  marginY: 10,
  compactType: 'vertical' as CompactType,
  isDraggable: true,
  isResizable: true,
  isBounded: false,
  preventCollision: false,
  allowOverlap: false,
  useCSSTransforms: true,
  autoSize: true,
  maxRows: Infinity,
};

Playground.argTypes = {
  cols: {
    control: { type: 'range', min: 1, max: 24, step: 1 },
    description: '网格列数',
  },
  rowHeight: {
    control: { type: 'range', min: 10, max: 100, step: 5 },
    description: '行高 (px)',
  },
  marginX: {
    control: { type: 'range', min: 0, max: 50, step: 5 },
    description: '水平间距 (px)',
  },
  marginY: {
    control: { type: 'range', min: 0, max: 50, step: 5 },
    description: '垂直间距 (px)',
  },
  compactType: {
    control: { type: 'select', options: ['vertical', 'horizontal', null] },
    description: '压缩类型',
  },
  isDraggable: {
    control: { type: 'boolean' },
    description: '是否可拖拽',
  },
  isResizable: {
    control: { type: 'boolean' },
    description: '是否可缩放',
  },
  isBounded: {
    control: { type: 'boolean' },
    description: '是否限制在容器内',
  },
  preventCollision: {
    control: { type: 'boolean' },
    description: '是否阻止碰撞',
  },
  allowOverlap: {
    control: { type: 'boolean' },
    description: '是否允许重叠',
  },
  useCSSTransforms: {
    control: { type: 'boolean' },
    description: '使用 CSS Transform 定位',
  },
  autoSize: {
    control: { type: 'boolean' },
    description: '自动调整容器高度',
  },
  maxRows: {
    control: { type: 'range', min: 1, max: 50, step: 1 },
    description: '最大行数',
  },
};

// ============================================================================
// 响应式布局控制台
// ============================================================================

export const ResponsivePlayground: Story<{
  lg: number;
  md: number;
  sm: number;
  rowHeight: number;
  compactType: CompactType;
  isDraggable: boolean;
  isResizable: boolean;
}> = ({
  lg,
  md,
  sm,
  rowHeight,
  compactType,
  isDraggable,
  isResizable,
}) => {
  const [layouts, setLayouts] = useState<Record<string, Layout>>({
    lg: [
      { i: 'a', x: 0, y: 0, w: 4, h: 2 },
      { i: 'b', x: 4, y: 0, w: 4, h: 2 },
      { i: 'c', x: 8, y: 0, w: 4, h: 2 },
      { i: 'd', x: 0, y: 2, w: 6, h: 2 },
      { i: 'e', x: 6, y: 2, w: 6, h: 2 },
    ],
    md: [
      { i: 'a', x: 0, y: 0, w: 3, h: 2 },
      { i: 'b', x: 3, y: 0, w: 3, h: 2 },
      { i: 'c', x: 0, y: 2, w: 3, h: 2 },
      { i: 'd', x: 3, y: 2, w: 3, h: 2 },
      { i: 'e', x: 0, y: 4, w: 6, h: 2 },
    ],
    sm: [
      { i: 'a', x: 0, y: 0, w: 2, h: 2 },
      { i: 'b', x: 0, y: 2, w: 2, h: 2 },
      { i: 'c', x: 0, y: 4, w: 2, h: 2 },
      { i: 'd', x: 0, y: 6, w: 2, h: 2 },
      { i: 'e', x: 0, y: 8, w: 2, h: 2 },
    ],
  });

  return (
    <div>
      <h2>响应式布局控制台</h2>
      <p>调整断点列数和属性，观察布局变化</p>
      <ResponsiveGridLayout
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768 }}
        cols={{ lg: lg, md: md, sm: sm }}
        rowHeight={rowHeight}
        compactType={compactType}
        isDraggable={isDraggable}
        isResizable={isResizable}
      >
        <div key="a">A</div>
        <div key="b">B</div>
        <div key="c">C</div>
        <div key="d">D</div>
        <div key="e">E</div>
      </ResponsiveGridLayout>
    </div>
  );
};

ResponsivePlayground.args = {
  lg: 12,
  md: 6,
  sm: 2,
  rowHeight: 30,
  compactType: 'vertical' as CompactType,
  isDraggable: true,
  isResizable: true,
};

ResponsivePlayground.argTypes = {
  lg: {
    control: { type: 'range', min: 1, max: 24, step: 1 },
    description: '大屏列数 (lg)',
  },
  md: {
    control: { type: 'range', min: 1, max: 12, step: 1 },
    description: '中屏列数 (md)',
  },
  sm: {
    control: { type: 'range', min: 1, max: 6, step: 1 },
    description: '小屏列数 (sm)',
  },
  rowHeight: {
    control: { type: 'range', min: 10, max: 100, step: 5 },
    description: '行高 (px)',
  },
  compactType: {
    control: { type: 'select', options: ['vertical', 'horizontal', null] },
    description: '压缩类型',
  },
  isDraggable: {
    control: { type: 'boolean' },
    description: '是否可拖拽',
  },
  isResizable: {
    control: { type: 'boolean' },
    description: '是否可缩放',
  },
};

// ============================================================================
// 缩放把手控制台
// ============================================================================

export const ResizeHandlesPlayground: Story<{
  north: boolean;
  northeast: boolean;
  east: boolean;
  southeast: boolean;
  south: boolean;
  southwest: boolean;
  west: boolean;
  northwest: boolean;
  minW: number;
  maxW: number;
  minH: number;
  maxH: number;
}> = ({
  north,
  northeast,
  east,
  southeast,
  south,
  southwest,
  west,
  northwest,
  minW,
  maxW,
  minH,
  maxH,
}) => {
  const [layout, setLayout] = useState<Layout>([
    { i: 'a', x: 0, y: 0, w: 4, h: 4, minW, maxW, minH, maxH },
  ]);

  const handles = [
    north && 'n',
    northeast && 'ne',
    east && 'e',
    southeast && 'se',
    south && 's',
    southwest && 'sw',
    west && 'w',
    northwest && 'nw',
  ].filter(Boolean) as string[];

  return (
    <div>
      <h2>缩放把手控制台</h2>
      <p>选择启用哪些缩放把手方向，调整最小/最大尺寸</p>
      <p>当前把手: {handles.join(', ') || '无'}</p>
      <GridLayout
        width={1200}
        layout={layout}
        cols={12}
        rowHeight={30}
        resizeHandles={handles as any}
        onLayoutChange={(l) => setLayout(l.map(item => ({ ...item, minW, maxW, minH, maxH })))}
      >
        <div key="a">拖拽角落缩放</div>
      </GridLayout>
    </div>
  );
};

ResizeHandlesPlayground.args = {
  north: false,
  northeast: false,
  east: false,
  southeast: true,
  south: false,
  southwest: false,
  west: false,
  northwest: false,
  minW: 1,
  maxW: 12,
  minH: 1,
  maxH: 12,
};

ResizeHandlesPlayground.argTypes = {
  north: { control: { type: 'boolean' }, description: '北 (上)' },
  northeast: { control: { type: 'boolean' }, description: '东北 (右上)' },
  east: { control: { type: 'boolean' }, description: '东 (右)' },
  southeast: { control: { type: 'boolean' }, description: '东南 (右下)' },
  south: { control: { type: 'boolean' }, description: '南 (下)' },
  southwest: { control: { type: 'boolean' }, description: '西南 (左下)' },
  west: { control: { type: 'boolean' }, description: '西 (左)' },
  northwest: { control: { type: 'boolean' }, description: '西北 (左上)' },
  minW: { control: { type: 'range', min: 1, max: 6, step: 1 }, description: '最小宽度' },
  maxW: { control: { type: 'range', min: 1, max: 12, step: 1 }, description: '最大宽度' },
  minH: { control: { type: 'range', min: 1, max: 6, step: 1 }, description: '最小高度' },
  maxH: { control: { type: 'range', min: 1, max: 12, step: 1 }, description: '最大高度' },
};

// ============================================================================
// 拖放控制台
// ============================================================================

export const DroppingPlayground: Story<{
  dropW: number;
  dropH: number;
  isDroppable: boolean;
}> = ({
  dropW,
  dropH,
  isDroppable,
}) => {
  const [layout, setLayout] = useState<Layout>([
    { i: 'existing', x: 0, y: 0, w: 2, h: 2 },
  ]);

  return (
    <div>
      <h2>拖放控制台</h2>
      <p>调整拖放项的默认尺寸，从下方拖入网格</p>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <div
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('text/plain', 'dropped-item');
          }}
          style={{
            padding: '12px 24px',
            background: '#3b82f6',
            color: 'white',
            borderRadius: '8px',
            cursor: 'grab',
          }}
        >
          拖入网格 ({dropW}x{dropH})
        </div>
      </div>

      <GridLayout
        width={1200}
        layout={layout}
        cols={12}
        rowHeight={30}
        isDroppable={isDroppable}
        droppingItem={{ i: '__dropping__', w: dropW, h: dropH }}
        onLayoutChange={setLayout}
      >
        <div key="existing">已存在</div>
      </GridLayout>
    </div>
  );
};

DroppingPlayground.args = {
  dropW: 2,
  dropH: 2,
  isDroppable: true,
};

DroppingPlayground.argTypes = {
  dropW: { control: { type: 'range', min: 1, max: 6, step: 1 }, description: '拖放项宽度' },
  dropH: { control: { type: 'range', min: 1, max: 6, step: 1 }, description: '拖放项高度' },
  isDroppable: { control: { type: 'boolean' }, description: '启用拖放' },
};

// ============================================================================
// 样式控制台
// ============================================================================

export const StylePlayground: Story<{
  useCSSTransforms: boolean;
  mergeStyle: boolean;
  containerPaddingX: number;
  containerPaddingY: number;
  backgroundColor: string;
  borderRadius: number;
}> = ({
  useCSSTransforms,
  mergeStyle,
  containerPaddingX,
  containerPaddingY,
  backgroundColor,
  borderRadius,
}) => {
  const [layout, setLayout] = useState<Layout>([
    { i: 'a', x: 0, y: 0, w: 3, h: 3 },
    { i: 'b', x: 3, y: 0, w: 3, h: 3 },
    { i: 'c', x: 6, y: 0, w: 3, h: 3 },
    { i: 'd', x: 0, y: 3, w: 6, h: 3 },
    { i: 'e', x: 6, y: 3, w: 3, h: 3 },
  ]);

  return (
    <div>
      <h2>样式控制台</h2>
      <p>调整定位方式、内边距和容器样式</p>
      <GridLayout
        width={1200}
        layout={layout}
        cols={12}
        rowHeight={30}
        useCSSTransforms={useCSSTransforms}
        mergeStyle={mergeStyle}
        containerPadding={[containerPaddingX, containerPaddingY]}
        style={{
          background: backgroundColor,
          borderRadius: `${borderRadius}px`,
          padding: '16px',
        }}
        onLayoutChange={setLayout}
      >
        <div key="a">A</div>
        <div key="b">B</div>
        <div key="c">C</div>
        <div key="d">D</div>
        <div key="e">E</div>
      </GridLayout>
    </div>
  );
};

StylePlayground.args = {
  useCSSTransforms: true,
  mergeStyle: true,
  containerPaddingX: 10,
  containerPaddingY: 10,
  backgroundColor: '#f8fafc',
  borderRadius: 8,
};

StylePlayground.argTypes = {
  useCSSTransforms: { control: { type: 'boolean' }, description: 'CSS Transform 定位' },
  mergeStyle: { control: { type: 'boolean' }, description: '合并容器高度到 style' },
  containerPaddingX: { control: { type: 'range', min: 0, max: 50, step: 5 }, description: '水平内边距' },
  containerPaddingY: { control: { type: 'range', min: 0, max: 50, step: 5 }, description: '垂直内边距' },
  backgroundColor: { control: { type: 'color' }, description: '背景颜色' },
  borderRadius: { control: { type: 'range', min: 0, max: 24, step: 2 }, description: '圆角' },
};

// ============================================================================
// 事件监控控制台
// ============================================================================

export const EventMonitor: Story<{
  logDrag: boolean;
  logResize: boolean;
  logDrop: boolean;
}> = ({
  logDrag,
  logResize,
  logDrop,
}) => {
  const [layout, setLayout] = useState<Layout>([
    { i: 'a', x: 0, y: 0, w: 2, h: 2 },
    { i: 'b', x: 2, y: 0, w: 2, h: 2 },
  ]);
  const [events, setEvents] = useState<Array<{ type: string; time: string; data: string }>>([]);

  const addEvent = useCallback((type: string, data: string) => {
    const time = new Date().toLocaleTimeString();
    setEvents((prev) => [...prev.slice(-20), { type, time, data }]);
  }, []);

  return (
    <div>
      <h2>事件监控控制台</h2>
      <p>选择要监控的事件类型，查看实时事件日志</p>

      <GridLayout
        width={1200}
        layout={layout}
        cols={12}
        rowHeight={30}
        onLayoutChange={setLayout}
        onDragStart={logDrag ? (_, old, item) => addEvent('拖拽开始', `${item?.i} [${item?.x},${item?.y}]`) : undefined}
        onDrag={logDrag ? (_, old, item) => addEvent('拖拽中', `${item?.i} [${item?.x},${item?.y}]`) : undefined}
        onDragStop={logDrag ? (_, old, item) => addEvent('拖拽结束', `${item?.i} [${item?.x},${item?.y}]`) : undefined}
        onResizeStart={logResize ? (_, old, item) => addEvent('缩放开始', `${item?.i} ${item?.w}x${item?.h}`) : undefined}
        onResize={logResize ? (_, old, item) => addEvent('缩放中', `${item?.i} ${item?.w}x${item?.h}`) : undefined}
        onResizeStop={logResize ? (_, old, item) => addEvent('缩放结束', `${item?.i} ${item?.w}x${item?.h}`) : undefined}
        isDroppable={logDrop}
        onDrop={logDrop ? (_, item) => addEvent('放置', `${item?.i} [${item?.x},${item?.y}]`) : undefined}
      >
        <div key="a">A - 拖拽/缩放</div>
        <div key="b">B - 拖拽/缩放</div>
      </GridLayout>

      <div style={{
        marginTop: '16px',
        padding: '16px',
        background: '#1e293b',
        borderRadius: '8px',
        maxHeight: '200px',
        overflow: 'auto',
        fontFamily: 'monospace',
        fontSize: '12px',
      }}>
        <div style={{ color: '#94a3b8', marginBottom: '8px' }}>事件日志：</div>
        {events.length === 0 ? (
          <div style={{ color: '#64748b' }}>暂无事件...</div>
        ) : (
          events.map((e, i) => (
            <div key={i} style={{ color: '#e2e8f0', marginBottom: '4px' }}>
              <span style={{ color: '#64748b' }}>[{e.time}]</span>{' '}
              <span style={{ color: '#60a5fa' }}>{e.type}</span>: {e.data}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

EventMonitor.args = {
  logDrag: true,
  logResize: true,
  logDrop: false,
};

EventMonitor.argTypes = {
  logDrag: { control: { type: 'boolean' }, description: '监控拖拽事件' },
  logResize: { control: { type: 'boolean' }, description: '监控缩放事件' },
  logDrop: { control: { type: 'boolean' }, description: '监控拖放事件' },
};
