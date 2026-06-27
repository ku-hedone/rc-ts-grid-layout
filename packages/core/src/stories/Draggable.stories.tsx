/**
 * GridLayout 拖拽功能示例
 */

import type { Story } from '@ladle/react';
import { useState } from 'react';
import { GridLayout } from '../index';
import type { Layout } from '../type';

export const DefaultDraggable: Story = () => {
  const [layout, setLayout] = useState<Layout>([
    { i: 'a', x: 0, y: 0, w: 2, h: 2 },
    { i: 'b', x: 2, y: 0, w: 2, h: 2 },
    { i: 'c', x: 4, y: 0, w: 2, h: 2 },
  ]);

  return (
    <div>
      <h2>默认可拖拽</h2>
      <p>所有项都可以拖拽移动</p>
      <GridLayout
        width={1200}
        layout={layout}
        cols={12}
        rowHeight={30}
        onLayoutChange={setLayout}
      >
        <div key="a">A - 可拖拽</div>
        <div key="b">B - 可拖拽</div>
        <div key="c">C - 可拖拽</div>
      </GridLayout>
    </div>
  );
};

export const DisableDraggable: Story = () => {
  const [layout, setLayout] = useState<Layout>([
    { i: 'a', x: 0, y: 0, w: 2, h: 2 },
    { i: 'b', x: 2, y: 0, w: 2, h: 2 },
    { i: 'c', x: 4, y: 0, w: 2, h: 2 },
  ]);

  return (
    <div>
      <h2>禁用拖拽</h2>
      <p>isDraggable: false - 所有项都不可拖拽</p>
      <GridLayout
        width={1200}
        layout={layout}
        cols={12}
        rowHeight={30}
        isDraggable={false}
        onLayoutChange={setLayout}
      >
        <div key="a">A - 不可拖拽</div>
        <div key="b">B - 不可拖拽</div>
        <div key="c">C - 不可拖拽</div>
      </GridLayout>
    </div>
  );
};

export const DraggableHandle: Story = () => {
  const [layout, setLayout] = useState<Layout>([
    { i: 'a', x: 0, y: 0, w: 3, h: 3 },
    { i: 'b', x: 3, y: 0, w: 3, h: 3 },
  ]);

  return (
    <div>
      <h2>拖拽把手</h2>
      <p>draggableHandle: ".drag-handle" - 只能通过把手拖拽</p>
      <GridLayout
        width={1200}
        layout={layout}
        cols={12}
        rowHeight={30}
        draggableHandle=".drag-handle"
        onLayoutChange={setLayout}
      >
        <div key="a">
          <div className="drag-handle" style={{ background: '#1e40af', padding: '4px 8px', cursor: 'move', marginBottom: '4px' }}>
            拖拽这里
          </div>
          <div>内容区域</div>
        </div>
        <div key="b">
          <div className="drag-handle" style={{ background: '#1e40af', padding: '4px 8px', cursor: 'move', marginBottom: '4px' }}>
            拖拽这里
          </div>
          <div>内容区域</div>
        </div>
      </GridLayout>
    </div>
  );
};

export const DraggableCancel: Story = () => {
  const [layout, setLayout] = useState<Layout>([
    { i: 'a', x: 0, y: 0, w: 3, h: 3 },
    { i: 'b', x: 3, y: 0, w: 3, h: 3 },
  ]);

  return (
    <div>
      <h2>排除拖拽区域</h2>
      <p>draggableCancel: ".no-drag" - 排除指定区域的拖拽</p>
      <GridLayout
        width={1200}
        layout={layout}
        cols={12}
        rowHeight={30}
        draggableCancel=".no-drag"
        onLayoutChange={setLayout}
      >
        <div key="a">
          <div>可拖拽区域</div>
          <input className="no-drag" placeholder="输入框不可拖拽" style={{ width: '100%', padding: '4px' }} />
        </div>
        <div key="b">
          <div>可拖拽区域</div>
          <button className="no-drag">按钮不可拖拽</button>
        </div>
      </GridLayout>
    </div>
  );
};

export const BoundedDraggable: Story = () => {
  const [layout, setLayout] = useState<Layout>([
    { i: 'a', x: 0, y: 0, w: 2, h: 2 },
    { i: 'b', x: 2, y: 0, w: 2, h: 2 },
    { i: 'c', x: 4, y: 0, w: 2, h: 2 },
  ]);

  return (
    <div>
      <h2>边界限制拖拽</h2>
      <p>isBounded: true - 项不能拖出容器边界</p>
      <div style={{ border: '2px solid #e2e8f0', padding: '10px' }}>
        <GridLayout
          width={600}
          layout={layout}
          cols={6}
          rowHeight={30}
          isBounded={true}
          onLayoutChange={setLayout}
        >
          <div key="a">A - 有边界</div>
          <div key="b">B - 有边界</div>
          <div key="c">C - 有边界</div>
        </GridLayout>
      </div>
    </div>
  );
};

export const WithCallbacks: Story = () => {
  const [layout, setLayout] = useState<Layout>([
    { i: 'a', x: 0, y: 0, w: 2, h: 2 },
  ]);
  const [events, setEvents] = useState<string[]>([]);

  const addEvent = (msg: string) => {
    setEvents((prev) => [...prev.slice(-5), msg]);
  };

  return (
    <div>
      <h2>拖拽数回调</h2>
      <p>监听 onDragStart、onDrag、onDragStop 事件</p>
      <GridLayout
        width={1200}
        layout={layout}
        cols={12}
        rowHeight={30}
        onLayoutChange={setLayout}
        onDragStart={(layout, oldItem, newItem) => addEvent(`拖拽开始: ${newItem?.i}`)}
        onDrag={(layout, oldItem, newItem) => addEvent(`拖拽中: [${newItem?.x}, ${newItem?.y}]`)}
        onDragStop={(layout, oldItem, newItem) => addEvent(`拖拽结束: [${newItem?.x}, ${newItem?.y}]`)}
      >
        <div key="a">拖拽我查看事件</div>
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
