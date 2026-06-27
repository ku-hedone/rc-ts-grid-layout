/**
 * GridLayout 基础用法示例
 */

import '../polyfill';
import type { Story } from '@ladle/react';
import { GridLayout } from '../index';
import type { Layout } from '../type';

const basicLayout: Layout = [
  { i: 'a', x: 0, y: 0, w: 2, h: 2 },
  { i: 'b', x: 2, y: 0, w: 2, h: 2 },
  { i: 'c', x: 4, y: 0, w: 2, h: 2 },
  { i: 'd', x: 0, y: 2, w: 4, h: 2 },
  { i: 'e', x: 4, y: 2, w: 2, h: 2 },
];

export const Default: Story = () => (
  <div>
    <h2>基础网格布局</h2>
    <p>默认配置：12 列，行高 30px，可拖拽，可缩放</p>
    <GridLayout
      width={1200}
      layout={basicLayout}
      cols={12}
      rowHeight={30}
    >
      <div key="a">A</div>
      <div key="b">B</div>
      <div key="c">C</div>
      <div key="d">D</div>
      <div key="e">E</div>
    </GridLayout>
  </div>
);

export const WithMargin: Story = () => (
  <div>
    <h2>自定义间距</h2>
    <p>margin: [20, 20] - 项之间的间距为 20px</p>
    <GridLayout
      width={1200}
      layout={basicLayout}
      cols={12}
      rowHeight={30}
      margin={[20, 20]}
    >
      <div key="a">A</div>
      <div key="b">B</div>
      <div key="c">C</div>
      <div key="d">D</div>
      <div key="e">E</div>
    </GridLayout>
  </div>
);

export const WithContainerPadding: Story = () => (
  <div>
    <h2>容器内边距</h2>
    <p>containerPadding: [30, 30] - 容器内边距为 30px</p>
    <GridLayout
      width={1200}
      layout={basicLayout}
      cols={12}
      rowHeight={30}
      containerPadding={[30, 30]}
    >
      <div key="a">A</div>
      <div key="b">B</div>
      <div key="c">C</div>
      <div key="d">D</div>
      <div key="e">E</div>
    </GridLayout>
  </div>
);

export const DifferentCols: Story = () => {
  const layout6: Layout = [
    { i: 'a', x: 0, y: 0, w: 2, h: 2 },
    { i: 'b', x: 2, y: 0, w: 2, h: 2 },
    { i: 'c', x: 4, y: 0, w: 2, h: 2 },
  ];

  return (
    <div>
      <h2>不同列数</h2>
      <p>cols: 6 - 只有 6 列</p>
      <GridLayout
        width={600}
        layout={layout6}
        cols={6}
        rowHeight={30}
      >
        <div key="a">A (2x2)</div>
        <div key="b">B (2x2)</div>
        <div key="c">C (2x2)</div>
      </GridLayout>
    </div>
  );
};

export const AutoSize: Story = () => (
  <div>
    <h2>自动高度</h2>
    <p>autoSize: true - 容器高度根据内容自动调整</p>
    <GridLayout
      width={1200}
      layout={basicLayout}
      cols={12}
      rowHeight={30}
      autoSize={true}
    >
      <div key="a">A</div>
      <div key="b">B</div>
      <div key="c">C</div>
      <div key="d">D</div>
      <div key="e">E</div>
    </GridLayout>
  </div>
);

export const MaxRows: Story = () => {
  const layout: Layout = [
    { i: 'a', x: 0, y: 0, w: 2, h: 2 },
    { i: 'b', x: 2, y: 0, w: 2, h: 2 },
  ];

  return (
    <div>
      <h2>限制最大行数</h2>
      <p>maxRows: 4 - 最多 4 行，超出部分会被限制</p>
      <GridLayout
        width={1200}
        layout={layout}
        cols={12}
        rowHeight={30}
        maxRows={4}
      >
        <div key="a">A</div>
        <div key="b">B</div>
      </GridLayout>
    </div>
  );
};
