/**
 * GridLayout 重叠模式示例
 */

import type { Story } from '@ladle/react';
import { useState } from 'react';
import { GridLayout } from '../index';
import type { Layout } from '../type';

export const AllowOverlap: Story = () => {
  const [layout, setLayout] = useState<Layout>([
    { i: 'a', x: 0, y: 0, w: 3, h: 3 },
    { i: 'b', x: 1, y: 1, w: 3, h: 3 },
    { i: 'c', x: 2, y: 2, w: 3, h: 3 },
  ]);

  return (
    <div>
      <h2>允许重叠</h2>
      <p>allowOverlap: true - 项可以重叠放置</p>
      <p>注意：项可以堆叠在一起</p>
      <GridLayout
        width={1200}
        layout={layout}
        cols={12}
        rowHeight={30}
        allowOverlap={true}
        onLayoutChange={setLayout}
      >
        <div key="a" style={{ opacity: 0.8 }}>A - 可重叠</div>
        <div key="b" style={{ opacity: 0.8 }}>B - 可重叠</div>
        <div key="c" style={{ opacity: 0.8 }}>C - 可重叠</div>
      </GridLayout>
    </div>
  );
};

export const PreventCollisionWithOverlap: Story = () => {
  const [layout, setLayout] = useState<Layout>([
    { i: 'a', x: 0, y: 0, w: 3, h: 3 },
    { i: 'b', x: 4, y: 0, w: 3, h: 3 },
  ]);

  return (
    <div>
      <h2>阻止碰撞（无重叠）</h2>
      <p>preventCollision: true, allowOverlap: false</p>
      <p>拖拽 A 到 B 的位置会被阻止</p>
      <GridLayout
        width={1200}
        layout={layout}
        cols={12}
        rowHeight={30}
        preventCollision={true}
        allowOverlap={false}
        onLayoutChange={setLayout}
      >
        <div key="a">A - 阻止碰撞</div>
        <div key="b">B - 阻止碰撞</div>
      </GridLayout>
    </div>
  );
};

export const NoCompaction: Story = () => {
  const [layout, setLayout] = useState<Layout>([
    { i: 'a', x: 0, y: 0, w: 2, h: 2 },
    { i: 'b', x: 0, y: 4, w: 2, h: 2 },
    { i: 'c', x: 0, y: 8, w: 2, h: 2 },
  ]);

  return (
    <div>
      <h2>无压缩模式</h2>
      <p>compactType: undefined - 项不会自动向上移动填补间隙</p>
      <p>拖拽后项会留在原位，不会自动压缩</p>
      <GridLayout
        width={1200}
        layout={layout}
        cols={12}
        rowHeight={30}
        compactType={undefined}
        onLayoutChange={setLayout}
      >
        <div key="a">A - 无压缩</div>
        <div key="b">B - 无压缩</div>
        <div key="c">C - 无压缩</div>
      </GridLayout>
    </div>
  );
};

export const VerticalCompaction: Story = () => {
  const [layout, setLayout] = useState<Layout>([
    { i: 'a', x: 0, y: 0, w: 2, h: 2 },
    { i: 'b', x: 0, y: 4, w: 2, h: 2 },
    { i: 'c', x: 2, y: 0, w: 2, h: 2 },
  ]);

  return (
    <div>
      <h2>垂直压缩模式</h2>
      <p>compactType: "vertical" - 项会自动向上移动填补间隙</p>
      <p>拖拽 B 后，它会自动向上移动到 A 下方</p>
      <GridLayout
        width={1200}
        layout={layout}
        cols={12}
        rowHeight={30}
        compactType="vertical"
        onLayoutChange={setLayout}
      >
        <div key="a">A - 垂直压缩</div>
        <div key="b">B - 会向上移动</div>
        <div key="c">C - 垂直压缩</div>
      </GridLayout>
    </div>
  );
};

export const HorizontalCompaction: Story = () => {
  const [layout, setLayout] = useState<Layout>([
    { i: 'a', x: 0, y: 0, w: 2, h: 2 },
    { i: 'b', x: 4, y: 0, w: 2, h: 2 },
    { i: 'c', x: 0, y: 2, w: 2, h: 2 },
  ]);

  return (
    <div>
      <h2>水平压缩模式</h2>
      <p>compactType: "horizontal" - 项会自动向左移动填补间隙</p>
      <p>拖拽 B 后，它会自动向左移动到 A 右侧</p>
      <GridLayout
        width={1200}
        layout={layout}
        cols={12}
        rowHeight={30}
        compactType="horizontal"
        onLayoutChange={setLayout}
      >
        <div key="a">A - 水平压缩</div>
        <div key="b">B - 会向左移动</div>
        <div key="c">C - 水平压缩</div>
      </GridLayout>
    </div>
  );
};
