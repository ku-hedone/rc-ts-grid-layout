# rc-ts-grid-layout

基于 [react-grid-layout](https://github.com/react-grid-layout/react-grid-layout) v1 (JS 版本) 重构为 TypeScript 函数组件实现。

## 特性

- ✅ TypeScript 类型支持
- ✅ React 函数组件 + Hooks
- ✅ 响应式布局支持
- ✅ 拖拽和缩放
- ✅ 碰撞检测和布局压缩
- ✅ 可组合约束系统 (借鉴 v2 设计)
- ✅ 可组合压缩策略 (借鉴 v2 设计)

## 安装

```bash
pnpm add @hedone/rc-ts-grid-layout
```

## 快速开始

```tsx
import { GridLayout } from '@hedone/rc-ts-grid-layout';

const layout = [
  { i: 'a', x: 0, y: 0, w: 2, h: 2 },
  { i: 'b', x: 2, y: 0, w: 2, h: 2 },
];

function App() {
  return (
    <GridLayout
      width={1200}
      layout={layout}
      cols={12}
      rowHeight={30}
    >
      <div key="a">Item A</div>
      <div key="b">Item B</div>
    </GridLayout>
  );
}
```

## 与上游库的关系

| 项目 | 基础 | 说明 |
|------|------|------|
| react-grid-layout v1 | JS 版本 | 原始版本，使用 class 组件 |
| **rc-ts-grid-layout** | v1 JS 版本 | **本项目**，重构为 TypeScript + 函数组件 |
| react-grid-layout v2 | TS 版本 | 在本项目之后发布，采用可组合接口设计 |

本项目参考了 v2 的可组合接口设计（Compactor、PositionStrategy、LayoutConstraint），但保持 v1 API 的向后兼容性。

## 开发

```bash
# 安装依赖
pnpm install

# 类型检查
cd packages/core && pnpm run check

# 构建
cd packages/core && pnpm run build

# 测试
cd packages/core && pnpm run test

# Lint
pnpm run lint

# 格式化
pnpm run fmt
```

## 许可证

MIT
