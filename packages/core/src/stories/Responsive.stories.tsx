/**
 * ResponsiveGridLayout 响应式布局示例
 */

import type { Story } from '@ladle/react';
import { ResponsiveGridLayout } from '../index';
import type { Layout } from '../type';

const responsiveLayouts: Record<string, Layout> = {
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
};

export const DefaultResponsive: Story = () => (
  <div>
    <h2>默认响应式布局</h2>
    <p>调整浏览器窗口大小查看不同断点的布局变化</p>
    <p>断点: lg (1200px), md (996px), sm (768px)</p>
    <ResponsiveGridLayout
      layouts={responsiveLayouts}
      breakpoints={{ lg: 1200, md: 996, sm: 768 }}
      cols={{ lg: 12, md: 6, sm: 2 }}
      rowHeight={30}
    >
      <div key="a">A</div>
      <div key="b">B</div>
      <div key="c">C</div>
      <div key="d">D</div>
      <div key="e">E</div>
    </ResponsiveGridLayout>
  </div>
);

export const WithAutoWidth: Story = () => (
  <div>
    <h2>自动宽度响应式</h2>
    <p>使用 ResizeObserverGridLayout 自动测量容器宽度</p>
    <div style={{ resize: 'horizontal', overflow: 'auto', border: '2px solid #e2e8f0', padding: '10px', minWidth: '300px', maxWidth: '100%' }}>
      <ResponsiveGridLayout
        layouts={responsiveLayouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768 }}
        cols={{ lg: 12, md: 6, sm: 2 }}
        rowHeight={30}
        width={800}
      >
        <div key="a">A</div>
        <div key="b">B</div>
        <div key="c">C</div>
        <div key="d">D</div>
        <div key="e">E</div>
      </ResponsiveGridLayout>
    </div>
    <p style={{ marginTop: '8px', fontSize: '14px', color: '#64748b' }}>
      拖动右下角调整容器宽度
    </p>
  </div>
);

export const WithBreakpointCallback: Story = () => {
  return (
    <div>
      <h2>断点变化回调</h2>
      <p>监听 onBreakpointChange 事件</p>
      <ResponsiveGridLayout
        layouts={responsiveLayouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768 }}
        cols={{ lg: 12, md: 6, sm: 2 }}
        rowHeight={30}
        onBreakpointChange={(breakpoint, cols) => {
          console.log(`断点变化: ${breakpoint}, 列数: ${cols}`);
        }}
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

export const WithResponsiveMargin: Story = () => (
  <div>
    <h2>响应式间距</h2>
    <p>margin 和 containerPadding 可以按断点配置</p>
    <ResponsiveGridLayout
      layouts={responsiveLayouts}
      breakpoints={{ lg: 1200, md: 996, sm: 768 }}
      cols={{ lg: 12, md: 6, sm: 2 }}
      rowHeight={30}
      margin={{ lg: [20, 20], md: [15, 15], sm: [10, 10] }}
      containerPadding={{ lg: [20, 20], md: [15, 15], sm: [10, 10] }}
    >
      <div key="a">A</div>
      <div key="b">B</div>
      <div key="c">C</div>
      <div key="d">D</div>
      <div key="e">E</div>
    </ResponsiveGridLayout>
  </div>
);

export const CustomBreakpoints: Story = () => {
  const layouts: Record<string, Layout> = {
    desktop: [
      { i: 'a', x: 0, y: 0, w: 6, h: 3 },
      { i: 'b', x: 6, y: 0, w: 6, h: 3 },
    ],
    tablet: [
      { i: 'a', x: 0, y: 0, w: 4, h: 3 },
      { i: 'b', x: 0, y: 3, w: 4, h: 3 },
    ],
    mobile: [
      { i: 'a', x: 0, y: 0, w: 2, h: 3 },
      { i: 'b', x: 0, y: 3, w: 2, h: 3 },
    ],
  };

  return (
    <div>
      <h2>自定义断点名称</h2>
      <p>使用自定义断点名称: desktop, tablet, mobile</p>
      <ResponsiveGridLayout
        layouts={layouts}
        breakpoints={{ desktop: 1200, tablet: 768, mobile: 480 }}
        cols={{ desktop: 12, tablet: 4, mobile: 2 }}
        rowHeight={30}
      >
        <div key="a">A - 响应式</div>
        <div key="b">B - 响应式</div>
      </ResponsiveGridLayout>
    </div>
  );
};
