/**
 * GridLayout 缩放功能示例
 */

import type { Story } from '@ladle/react';
import { useState } from 'react';
import { GridLayout } from '../index';
import type { Layout } from '../type';

export const DefaultResizable: Story = () => {
  const [layout, setLayout] = useState<Layout>([
    { i: 'a', x: 0, y: 0, w: 2, h: 2 },
    { i: 'b', x: 2, y: 0, w: 3, h: 2 },
    { i: 'c', x: 5, y: 0, w: 2, h: 3 },
  ]);

  return (
    <div>
      <h2>默认可缩放</h2>
      <p>所有项都可以通过右下角把手缩放</p>
      <GridLayout
        width={1200}
        layout={layout}
        cols={12}
        rowHeight={30}
        onLayoutChange={setLayout}
      >
        <div key="a">A - 可缩放</div>
        <div key="b">B - 可缩放</div>
        <div key="c">C - 可缩放</div>
      </GridLayout>
    </div>
  );
};

export const DisableResizable: Story = () => {
  const [layout, setLayout] = useState<Layout>([
    { i: 'a', x: 0, y: 0, w: 2, h: 2 },
    { i: 'b', x: 2, y: 0, w: 2, h: 2 },
  ]);

  return (
    <div>
      <h2>禁用缩放</h2>
      <p>isResizable: false - 所有项都不可缩放</p>
      <GridLayout
        width={1200}
        layout={layout}
        cols={12}
        rowHeight={30}
        isResizable={false}
        onLayoutChange={setLayout}
      >
        <div key="a">A - 不可缩放</div>
        <div key="b">B - 不可缩放</div>
      </GridLayout>
    </div>
  );
};

export const MultipleResizeHandles: Story = () => {
  const [layout, setLayout] = useState<Layout>([
    { i: 'a', x: 0, y: 0, w: 3, h: 3 },
    { i: 'b', x: 3, y: 0, w: 3, h: 3 },
  ]);

  return (
    <div>
      <h2>多方向缩放把手</h2>
      <p>resizeHandles: ["s", "e", "se"] - 南、东、东南三个方向可缩放</p>
      <GridLayout
        width={1200}
        layout={layout}
        cols={12}
        rowHeight={30}
        resizeHandles={['s', 'e', 'se']}
        onLayoutChange={setLayout}
      >
        <div key="a">A - 三方向缩放</div>
        <div key="b">B - 三方向缩放</div>
      </GridLayout>
    </div>
  );
};

export const AllResizeHandles: Story = () => {
  const [layout, setLayout] = useState<Layout>([
    { i: 'a', x: 0, y: 0, w: 3, h: 3 },
  ]);

  return (
    <div>
      <h2>全方向缩放把手</h2>
      <p>resizeHandles: ["n", "ne", "e", "se", "s", "sw", "w", "nw"] - 8 个方向都可缩放</p>
      <GridLayout
        width={1200}
        layout={layout}
        cols={12}
        rowHeight={30}
        resizeHandles={['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw']}
        onLayoutChange={setLayout}
      >
        <div key="a">A - 8 方向缩放</div>
      </GridLayout>
    </div>
  );
};

export const MinMaxSize: Story = () => {
  const [layout, setLayout] = useState<Layout>([
    { i: 'a', x: 0, y: 0, w: 2, h: 2, minW: 1, maxW: 4, minH: 1, maxH: 4 },
    { i: 'b', x: 2, y: 0, w: 2, h: 2, minW: 2, minH: 2 },
  ]);

  return (
    <div>
      <h2>最小/最大尺寸限制</h2>
      <p>A: minW=1, maxW=4, minH=1, maxH=4 | B: minW=2, minH=2</p>
      <GridLayout
        width={1200}
        layout={layout}
        cols={12}
        rowHeight={30}
        onLayoutChange={setLayout}
      >
        <div key="a">A - 限制尺寸</div>
        <div key="b">B - 最小 2x2</div>
      </GridLayout>
    </div>
  );
};

export const WithCallbacks: Story = () => {
  const [layout, setLayout] = useState<Layout>([
    { i: 'a', x: 0, y: 0, w: 3, h: 3 },
  ]);
  const [events, setEvents] = useState<string[]>([]);

  const addEvent = (msg: string) => {
    setEvents((prev) => [...prev.slice(-5), msg]);
  };

  return (
    <div>
      <h2>缩放回调</h2>
      <p>监听 onResizeStart、onResize、onResizeStop 事件</p>
      <GridLayout
        width={1200}
        layout={layout}
        cols={12}
        rowHeight={30}
        onLayoutChange={setLayout}
        onResizeStart={(layout, oldItem, newItem) => addEvent(`缩放开始: ${newItem?.i} [${newItem?.w}x${newItem?.h}]`)}
        onResize={(layout, oldItem, newItem) => addEvent(`缩放中: [${newItem?.w}x${newItem?.h}]`)}
        onResizeStop={(layout, oldItem, newItem) => addEvent(`缩放结束: [${newItem?.w}x${newItem?.h}]`)}
      >
        <div key="a">缩放我查看事件</div>
      </GridLayout>
      <div style={{ marginTop: '16px', padding: '12px', background: '#f1f5f9', borderRadius: '8px' }}>
        <strong>事件日志：</strong>
        <ul style={{ margin: '8px 0 0 0', padding: '0 0 0 20px' }}>
          {events.map((e, i) => <li key={i}>{e}</li>)}
        </ul>
      </div>
    </div>
  );
};

export const PreventCollision: Story = () => {
  const [layout, setLayout] = useState<Layout>([
    { i: 'a', x: 0, y: 0, w: 2, h: 2 },
    { i: 'b', x: 3, y: 0, w: 2, h: 2 },
  ]);

  return (
    <div>
      <h2>阻止碰撞</h2>
      <p>preventCollision: true - 缩放时不会与其他项重叠</p>
      <GridLayout
        width={1200}
        layout={layout}
        cols={12}
        rowHeight={30}
        preventCollision={true}
        onLayoutChange={setLayout}
      >
        <div key="a">A - 阻止碰撞</div>
        <div key="b">B - 阻止碰撞</div>
      </GridLayout>
    </div>
  );
};
