/**
 * GridLayout 拖放功能示例
 */

import type { Story } from '@ladle/react';
import { useState } from 'react';
import { GridLayout } from '../index';
import type { Layout, LayoutItem } from '../type';

export const BasicDropping: Story = () => {
  const [layout, setLayout] = useState<Layout>([
    { i: 'a', x: 0, y: 0, w: 2, h: 2 },
  ]);
  const [droppedItems, setDroppedItems] = useState<string[]>([]);

  return (
    <div>
      <h2>基础拖放</h2>
      <p>isDroppable: true - 可以从外部拖入元素</p>
      <p>从下方的元素拖入网格区域</p>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <div
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('text/plain', 'item-b');
          }}
          style={{
            padding: '12px 24px',
            background: '#3b82f6',
            color: 'white',
            borderRadius: '8px',
            cursor: 'grab',
          }}
        >
          拖入网格
        </div>
        <div
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('text/plain', 'item-c');
          }}
          style={{
            padding: '12px 24px',
            background: '#10b981',
            color: 'white',
            borderRadius: '8px',
            cursor: 'grab',
          }}
        >
          拖入网格
        </div>
      </div>

      <GridLayout
        width={1200}
        layout={layout}
        cols={12}
        rowHeight={30}
        isDroppable={true}
        onLayoutChange={setLayout}
        onDrop={(layout, item) => {
          if (item) {
            setDroppedItems((prev) => [...prev, item.i]);
          }
        }}
      >
        <div key="a">A - 已存在</div>
      </GridLayout>

      <div style={{ marginTop: '16px', padding: '12px', background: '#f1f5f9', borderRadius: '8px' }}>
        <strong>已拖入的项：</strong> {droppedItems.join(', ') || '无'}
      </div>
    </div>
  );
};

export const CustomDroppingItem: Story = () => {
  const [layout, setLayout] = useState<Layout>([]);

  return (
    <div>
      <h2>自定义拖放项</h2>
      <p>droppingItem: {`{ w: 2, h: 3 }`} - 拖入的项默认大小为 2x3</p>
      <p>从下方拖入网格区域</p>

      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('text/plain', 'custom-item');
        }}
        style={{
          display: 'inline-block',
          padding: '12px 24px',
          background: '#8b5cf6',
          color: 'white',
          borderRadius: '8px',
          cursor: 'grab',
          marginBottom: '16px',
        }}
      >
        拖入网格 (2x3)
      </div>

      <GridLayout
        width={1200}
        layout={layout}
        cols={12}
        rowHeight={30}
        isDroppable={true}
        droppingItem={{ i: '__dropping__', w: 2, h: 3 }}
        onLayoutChange={setLayout}
      />
    </div>
  );
};

export const WithDropCallback: Story = () => {
  const [layout, setLayout] = useState<Layout>([]);
  const [events, setEvents] = useState<string[]>([]);

  const addEvent = (msg: string) => {
    setEvents((prev) => [...prev.slice(-5), msg]);
  };

  return (
    <div>
      <h2>拖放回调</h2>
      <p>监听 onDrop 和 onDropDragOver 事件</p>

      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('text/plain', 'callback-item');
        }}
        style={{
          display: 'inline-block',
          padding: '12px 24px',
          background: '#f59e0b',
          color: 'white',
          borderRadius: '8px',
          cursor: 'grab',
          marginBottom: '16px',
        }}
      >
        拖入网格
      </div>

      <GridLayout
        width={1200}
        layout={layout}
        cols={12}
        rowHeight={30}
        isDroppable={true}
        onLayoutChange={setLayout}
        onDrop={(layout, item) => {
          addEvent(`放置: ${item?.i} at [${item?.x}, ${item?.y}]`);
        }}
        onDropDragOver={(e) => {
          addEvent('拖拽悬停中...');
          return { w: 2, h: 2 };
        }}
      />

      <div style={{ marginTop: '16px', padding: '12px', background: '#f1f5f9', borderRadius: '8px' }}>
        <strong>事件日志：</strong>
        <ul style={{ margin: '8px 0 0 0', padding: '0 0 0 20px' }}>
          {events.map((e, i) => <li key={i}>{e}</li>)}
        </ul>
      </div>
    </div>
  );
};

export const MultipleDropItems: Story = () => {
  const [layout, setLayout] = useState<Layout>([]);

  const widgetTypes = [
    { id: 'chart', label: '图表', color: '#3b82f6', w: 4, h: 3 },
    { id: 'table', label: '表格', color: '#10b981', w: 6, h: 4 },
    { id: 'card', label: '卡片', color: '#f59e0b', w: 2, h: 2 },
    { id: 'text', label: '文本', color: '#8b5cf6', w: 3, h: 2 },
  ];

  return (
    <div>
      <h2>多种拖放项</h2>
      <p>不同类型的组件可以拖入网格</p>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        {widgetTypes.map((widget) => (
          <div
            key={widget.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', widget.id);
            }}
            style={{
              padding: '12px 24px',
              background: widget.color,
              color: 'white',
              borderRadius: '8px',
              cursor: 'grab',
            }}
          >
            {widget.label} ({widget.w}x{widget.h})
          </div>
        ))}
      </div>

      <GridLayout
        width={1200}
        layout={layout}
        cols={12}
        rowHeight={30}
        isDroppable={true}
        onLayoutChange={setLayout}
      />

      <div style={{ marginTop: '16px', padding: '12px', background: '#f1f5f9', borderRadius: '8px' }}>
        <strong>当前布局：</strong>
        <pre style={{ margin: '8px 0 0 0', fontSize: '12px' }}>
          {JSON.stringify(layout, null, 2)}
        </pre>
      </div>
    </div>
  );
};
