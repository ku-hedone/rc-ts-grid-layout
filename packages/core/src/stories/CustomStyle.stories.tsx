/**
 * GridLayout 自定义样式示例
 */

import type { Story } from '@ladle/react';
import { useState } from 'react';
import { GridLayout } from '../index';
import type { Layout } from '../type';

export const CustomClassName: Story = () => {
  const [layout, setLayout] = useState<Layout>([
    { i: 'a', x: 0, y: 0, w: 2, h: 2 },
    { i: 'b', x: 2, y: 0, w: 2, h: 2 },
  ]);

  return (
    <div>
      <h2>自定义类名</h2>
      <p>className: "custom-grid" - 添加自定义类名</p>
      <style>{`
        .custom-grid {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          padding: 16px;
        }
        .custom-grid .react-grid-item {
          background: rgba(255, 255, 255, 0.9);
          color: #1e293b;
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
      `}</style>
      <GridLayout
        width={1200}
        layout={layout}
        cols={12}
        rowHeight={30}
        className="custom-grid"
        onLayoutChange={setLayout}
      >
        <div key="a">A</div>
        <div key="b">B</div>
      </GridLayout>
    </div>
  );
};

export const CustomStyle: Story = () => {
  const [layout, setLayout] = useState<Layout>([
    { i: 'a', x: 0, y: 0, w: 2, h: 2 },
    { i: 'b', x: 2, y: 0, w: 2, h: 2 },
  ]);

  return (
    <div>
      <h2>自定义样式</h2>
      <p>style 属性 - 添加内联样式</p>
      <GridLayout
        width={1200}
        layout={layout}
        cols={12}
        rowHeight={30}
        style={{
          background: '#fef3c7',
          border: '2px solid #f59e0b',
          borderRadius: '12px',
          padding: '16px',
        }}
        onLayoutChange={setLayout}
      >
        <div key="a">A</div>
        <div key="b">B</div>
      </GridLayout>
    </div>
  );
};

export const MergeStyle: Story = () => {
  const [layout, setLayout] = useState<Layout>([
    { i: 'a', x: 0, y: 0, w: 2, h: 2 },
    { i: 'b', x: 2, y: 0, w: 2, h: 2 },
    { i: 'c', x: 0, y: 2, w: 4, h: 2 },
  ]);

  return (
    <div>
      <h2>合并样式</h2>
      <p>mergeStyle: true - 容器高度会自动合并到 style 中</p>
      <GridLayout
        width={1200}
        layout={layout}
        cols={12}
        rowHeight={30}
        mergeStyle={true}
        style={{
          background: '#ecfdf5',
          border: '2px solid #10b981',
          borderRadius: '12px',
          padding: '16px',
        }}
        onLayoutChange={setLayout}
      >
        <div key="a">A</div>
        <div key="b">B</div>
        <div key="c">C</div>
      </GridLayout>
    </div>
  );
};

export const UseCSSTransforms: Story = () => {
  const [layout, setLayout] = useState<Layout>([
    { i: 'a', x: 0, y: 0, w: 2, h: 2 },
    { i: 'b', x: 2, y: 0, w: 2, h: 2 },
  ]);

  return (
    <div>
      <h2>CSS Transform 定位</h2>
      <p>useCSSTransforms: true (默认) - 使用 CSS transform 定位，性能更好</p>
      <GridLayout
        width={1200}
        layout={layout}
        cols={12}
        rowHeight={30}
        useCSSTransforms={true}
        onLayoutChange={setLayout}
      >
        <div key="a">A - transform</div>
        <div key="b">B - transform</div>
      </GridLayout>
    </div>
  );
};

export const UseTopLeft: Story = () => {
  const [layout, setLayout] = useState<Layout>([
    { i: 'a', x: 0, y: 0, w: 2, h: 2 },
    { i: 'b', x: 2, y: 0, w: 2, h: 2 },
  ]);

  return (
    <div>
      <h2>Top/Left 定位</h2>
      <p>useCSSTransforms: false - 使用 top/left 定位，适用于打印场景</p>
      <GridLayout
        width={1200}
        layout={layout}
        cols={12}
        rowHeight={30}
        useCSSTransforms={false}
        onLayoutChange={setLayout}
      >
        <div key="a">A - top/left</div>
        <div key="b">B - top/left</div>
      </GridLayout>
    </div>
  );
};

export const DarkTheme: Story = () => {
  const [layout, setLayout] = useState<Layout>([
    { i: 'a', x: 0, y: 0, w: 2, h: 2 },
    { i: 'b', x: 2, y: 0, w: 2, h: 2 },
    { i: 'c', x: 4, y: 0, w: 2, h: 2 },
  ]);

  return (
    <div>
      <h2>深色主题</h2>
      <p>自定义深色主题样式</p>
      <style>{`
        .dark-theme {
          background: #1e293b;
          border-radius: 12px;
          padding: 16px;
        }
        .dark-theme .react-grid-item {
          background: #334155;
          color: #f8fafc;
          border: 1px solid #475569;
          border-radius: 8px;
        }
        .dark-theme .react-grid-item:hover {
          background: #475569;
        }
        .dark-theme .react-grid-placeholder {
          background: #3b82f6 !important;
          border: 2px dashed #60a5fa !important;
          opacity: 0.5;
        }
      `}</style>
      <GridLayout
        width={1200}
        layout={layout}
        cols={12}
        rowHeight={30}
        className="dark-theme"
        onLayoutChange={setLayout}
      >
        <div key="a">A</div>
        <div key="b">B</div>
        <div key="c">C</div>
      </GridLayout>
    </div>
  );
};

export const GridLayoutWithCards: Story = () => {
  const [layout, setLayout] = useState<Layout>([
    { i: 'card1', x: 0, y: 0, w: 4, h: 4 },
    { i: 'card2', x: 4, y: 0, w: 4, h: 4 },
    { i: 'card3', x: 8, y: 0, w: 4, h: 4 },
    { i: 'card4', x: 0, y: 4, w: 6, h: 4 },
    { i: 'card5', x: 6, y: 4, w: 6, h: 4 },
  ]);

  const cardStyle: React.CSSProperties = {
    background: 'white',
    borderRadius: '8px',
    padding: '16px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  };

  return (
    <div>
      <h2>卡片布局</h2>
      <p>典型的仪表盘卡片布局</p>
      <GridLayout
        width={1200}
        layout={layout}
        cols={12}
        rowHeight={30}
        margin={[16, 16]}
        containerPadding={[0, 0]}
        onLayoutChange={setLayout}
      >
        <div key="card1" style={cardStyle}>
          <h3 style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>销售总额</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>¥126,560</p>
          <span style={{ color: '#10b981', fontSize: '12px' }}>↑ 12.5%</span>
        </div>
        <div key="card2" style={cardStyle}>
          <h3 style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>订单数量</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>1,284</p>
          <span style={{ color: '#10b981', fontSize: '12px' }}>↑ 8.2%</span>
        </div>
        <div key="card3" style={cardStyle}>
          <h3 style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>用户数量</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>28,453</p>
          <span style={{ color: '#ef4444', fontSize: '12px' }}>↓ 2.1%</span>
        </div>
        <div key="card4" style={cardStyle}>
          <h3 style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>转化率</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>3.24%</p>
          <span style={{ color: '#10b981', fontSize: '12px' }}>↑ 0.5%</span>
        </div>
        <div key="card5" style={cardStyle}>
          <h3 style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>平均订单金额</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>¥98.50</p>
          <span style={{ color: '#64748b', fontSize: '12px' }}>持平</span>
        </div>
      </GridLayout>
    </div>
  );
};
