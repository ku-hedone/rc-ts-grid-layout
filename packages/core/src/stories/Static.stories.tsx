/**
 * GridLayout 静态项示例
 */

import type { Story } from '@ladle/react';
import { useState } from 'react';
import { GridLayout } from '../index';
import type { Layout } from '../type';

export const StaticItems: Story = () => {
  const [layout, setLayout] = useState<Layout>([
    { i: 'a', x: 0, y: 0, w: 2, h: 2, static: true },
    { i: 'b', x: 2, y: 0, w: 2, h: 2 },
    { i: 'c', x: 4, y: 0, w: 2, h: 2 },
    { i: 'd', x: 0, y: 2, w: 4, h: 2, static: true },
    { i: 'e', x: 4, y: 2, w: 2, h: 2 },
  ]);

  return (
    <div>
      <h2>静态项</h2>
      <p>static: true - 项不可拖拽、不可缩放，其他项会绕开它</p>
      <p>灰色项为静态项</p>
      <GridLayout
        width={1200}
        layout={layout}
        cols={12}
        rowHeight={30}
        onLayoutChange={setLayout}
      >
        <div key="a" style={{ background: '#94a3b8' }}>A - 静态</div>
        <div key="b">B - 可拖拽</div>
        <div key="c">C - 可拖拽</div>
        <div key="d" style={{ background: '#94a3b8' }}>D - 静态</div>
        <div key="e">E - 可拖拽</div>
      </GridLayout>
    </div>
  );
};

export const MixedStaticDraggable: Story = () => {
  const [layout, setLayout] = useState<Layout>([
    { i: 'header', x: 0, y: 0, w: 12, h: 2, static: true },
    { i: 'sidebar', x: 0, y: 2, w: 3, h: 6, static: true },
    { i: 'content', x: 3, y: 2, w: 9, h: 6 },
    { i: 'footer', x: 0, y: 8, w: 12, h: 2, static: true },
  ]);

  return (
    <div>
      <h2>混合静态和可拖拽项</h2>
      <p>典型的页面布局：Header、Sidebar、Content、Footer</p>
      <GridLayout
        width={1200}
        layout={layout}
        cols={12}
        rowHeight={30}
        onLayoutChange={setLayout}
      >
        <div key="header" style={{ background: '#1e293b', color: 'white' }}>Header - 静态</div>
        <div key="sidebar" style={{ background: '#334155', color: 'white' }}>Sidebar - 静态</div>
        <div key="content">Content - 可拖拽</div>
        <div key="footer" style={{ background: '#1e293b', color: 'white' }}>Footer - 静态</div>
      </GridLayout>
    </div>
  );
};

export const PerItemDraggable: Story = () => {
  const [layout, setLayout] = useState<Layout>([
    { i: 'a', x: 0, y: 0, w: 2, h: 2, isDraggable: false },
    { i: 'b', x: 2, y: 0, w: 2, h: 2, isDraggable: true },
    { i: 'c', x: 4, y: 0, w: 2, h: 2 },
  ]);

  return (
    <div>
      <h2>单项拖拽控制</h2>
      <p>isDraggable 可以在单项级别覆盖全局设置</p>
      <p>A: isDraggable=false (不可拖拽) | B: isDraggable=true (可拖拽) | C: 默认</p>
      <GridLayout
        width={1200}
        layout={layout}
        cols={12}
        rowHeight={30}
        isDraggable={false}
        onLayoutChange={setLayout}
      >
        <div key="a" style={{ background: '#94a3b8' }}>A - 不可拖拽</div>
        <div key="b">B - 可拖拽</div>
        <div key="c">C - 默认不可拖拽</div>
      </GridLayout>
    </div>
  );
};

export const PerItemResizable: Story = () => {
  const [layout, setLayout] = useState<Layout>([
    { i: 'a', x: 0, y: 0, w: 2, h: 2, isResizable: false },
    { i: 'b', x: 2, y: 0, w: 2, h: 2, isResizable: true },
    { i: 'c', x: 4, y: 0, w: 2, h: 2 },
  ]);

  return (
    <div>
      <h2>单项缩放控制</h2>
      <p>isResizable 可以在单项级别覆盖全局设置</p>
      <p>A: isResizable=false (不可缩放) | B: isResizable=true (可缩放) | C: 默认</p>
      <GridLayout
        width={1200}
        layout={layout}
        cols={12}
        rowHeight={30}
        isResizable={false}
        onLayoutChange={setLayout}
      >
        <div key="a" style={{ background: '#94a3b8' }}>A - 不可缩放</div>
        <div key="b">B - 可缩放</div>
        <div key="c">C - 默认不可缩放</div>
      </GridLayout>
    </div>
  );
};

export const PerItemResizeHandles: Story = () => {
  const [layout, setLayout] = useState<Layout>([
    { i: 'a', x: 0, y: 0, w: 3, h: 3, resizeHandles: ['se'] },
    { i: 'b', x: 3, y: 0, w: 3, h: 3, resizeHandles: ['s', 'e', 'se'] },
    { i: 'c', x: 6, y: 0, w: 3, h: 3, resizeHandles: ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'] },
  ]);

  return (
    <div>
      <h2>单项缩放把手</h2>
      <p>resizeHandles 可以在单项级别配置</p>
      <p>A: 仅东南 | B: 南、东、东南 | C: 全方向</p>
      <GridLayout
        width={1200}
        layout={layout}
        cols={12}
        rowHeight={30}
        onLayoutChange={setLayout}
      >
        <div key="a">A - 仅东南</div>
        <div key="b">B - 三方向</div>
        <div key="c">C - 全方向</div>
      </GridLayout>
    </div>
  );
};
