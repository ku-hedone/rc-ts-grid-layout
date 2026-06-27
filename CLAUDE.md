# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目

rc-ts-grid-layout: 基于 react-grid-layout **v1 (JS + Flow)** 版本进行整理、修复 bug 后，重构为 TypeScript 函数组件实现。

**重要说明：**
- 本项目的基准是 react-grid-layout v1 (JS + Flow)，不是 v2
- v1 经过整理和 bug 修复后，形成了本项目的基础架构
- 后续参考了 react-grid-layout v2 (TS 版本) 的可组合接口设计（Compactor、PositionStrategy、LayoutConstraint）
- 由于基准不同，本项目与 v2 存在较大差异

## 技术栈

- TypeScript 5.x
- React 18+，函数组件 + hooks
- pnpm workspace monorepo
- Vite（playground 开发服务器）
- react-draggable / react-resizable（拖拽/缩放底层依赖）

## 原则

基于 react-grid-layout v1 (JS + Flow) 整理修复后重构为 TypeScript。后续参考 `git-repo/react-grid-layout/` (v2) 的可组合接口设计，但保持 v1 的核心架构和 API 兼容性。

## 命令

```bash
# 安装依赖
pnpm install

# 类型检查（核心包）
cd packages/core && pnpm run check

# 构建核心包（CJS + ESM + 类型声明）
cd packages/core && pnpm run build

# 清理构建产物
cd packages/core && pnpm run clean

# 启动 playground 开发服务器
cd playground && pnpm run dev

# Lint 检查（oxlint）
pnpm run lint

# 自动修复 lint 问题
pnpm run lint:fix

# 格式化代码（oxfmt）
pnpm run fmt

# 检查格式化
pnpm run fmt:check
```

**禁止使用 `npx`、`yarn`、`npm`。** 所有命令通过 `pnpm run` 执行。

## Lint & Format

本项目使用 **oxlint** 和 **oxfmt** 替代 ESLint 和 Prettier：

- **oxlint**: 高性能 JavaScript/TypeScript linter，基于 Rust 实现
- **oxfmt**: 高性能代码格式化工具

配置文件：
- `.oxlintrc.json` - oxlint 配置
- `.oxfmt.json` - oxfmt 配置

## 测试

### 单元测试（Vitest）

```bash
# 运行所有单元测试
cd packages/core && pnpm run test

# 监听模式
cd packages/core && pnpm run test:watch

# 运行覆盖率测试
cd packages/core && pnpm run test:coverage

# 打开测试 UI
cd packages/core && pnpm run test:ui
```

### E2E 测试（Playwright）

```bash
# 运行所有 E2E 测试
cd playground && pnpm run test:e2e

# 打开测试 UI
cd playground && pnpm run test:e2e:ui

# 调试模式
cd playground && pnpm run test:e2e:debug
```

### 测试覆盖率

```bash
# 生成覆盖率报告
cd packages/core && pnpm run test:coverage

# 查看 HTML 报告
open packages/core/coverage/index.html
```

## 组件文档（Ladle）

```bash
# 启动 Ladle 文档服务器
pnpm run ladle

# 构建静态文档
pnpm run ladle:build
```

故事文件位于 `packages/core/src/stories/` 目录：
- `Basic.stories.tsx` - 基础用法
- `Draggable.stories.tsx` - 拖拽功能
- `Resizable.stories.tsx` - 缩放功能
- `Responsive.stories.tsx` - 响应式布局
- `Static.stories.tsx` - 静态项
- `Overlap.stories.tsx` - 重叠模式
- `Dropping.stories.tsx` - 拖放功能
- `CustomStyle.stories.tsx` - 自定义样式

## Monorepo

| 包 | 职责 |
|---|------|
| `packages/core` | 核心网格布局库（`@hedone/rc-ts-grid-layout`） |
| `packages/tsconfig` | 共享 TypeScript 配置 |
| `playground` | 演示和开发测试 |

## 架构

### 核心包 (`packages/core/src/`)

四层组件架构：

```
ResizeObserverGridLayout / ResizeGridLayout  ← 宽度自适应层（ResizeObserver）
        ↓
    ResponsiveGridLayout                     ← 响应式层（断点切换）
        ↓
        GridLayout                           ← 核心层（layout 状态、拖拽/缩放逻辑）
        ↓
        GridItem                             ← 元素层（单个网格项的交互）
```

### 关键文件

| 文件 | 职责 |
|------|------|
| `grid.tsx` | GridLayout 核心组件，管理 layout 状态、拖拽/缩放/拖放事件 |
| `item.tsx` | GridItem 组件，封装 DraggableCore + Resizable |
| `responsive.tsx` | ResponsiveGridLayout，按断点切换 layout/cols |
| `resize.tsx` | ResizeObserverGridLayout，自动测量容器宽度 |
| `resize.grid.tsx` | ResizeGridLayout，非响应式版本 |
| `utils.ts` | 核心算法：碰撞检测、布局压缩、元素移动、排序 |
| `calculate.ts` | 像素/网格坐标转换 |
| `utils.item.ts` | GridItem 定位计算和样式生成 |
| `equals.ts` | 深比较库（从 fast-equals 移植） |

### 类型定义

| 文件 | 职责 |
|------|------|
| `type.ts` | 基础类型：LayoutItem、Layout、Position、CompactType |
| `type.rgl.ts` | GridLayout 组件 Props 类型 |
| `type.item.ts` | GridItem 组件 Props 类型 |
| `type.responsive.ts` | 响应式布局类型 |
| `type.calculate.ts` | 计算参数类型 |

### 数据流

```
ResizeObserver 测量宽度
    ↓
响应式组件确定断点和 cols
    ↓
GridLayout 管理 layout 状态
    ↓
GridItem 渲染每个元素并处理交互
    ↓
回调 onLayoutChange 通知外部
```

### 核心算法

- **碰撞检测**: `collides()` AABB 碰撞检测
- **布局压缩**: `compact()` / `compactItem()` 向上/向左压缩
- **元素移动**: `moveElement()` 处理碰撞推移
- **边界修正**: `correctBounds()` 确保不超出列数
- **坐标转换**: `calcXY()` / `calcWH()` 像素 ↔ 网格单位

## 上游参考

`git-repo/react-grid-layout/` 是 react-grid-layout v2 (TS 版本) 的本地副本（只读参考）。

- **本项目基准**: react-grid-layout v1 (JS + Flow)，经过整理和 bug 修复
- **上游 v2**: 在本项目之后发布，采用了全新的可组合接口设计
- **差异较大**: 由于基准不同（v1 vs v2），两个项目存在较大架构差异
- 已从 v2 借鉴了部分可组合接口设计（约束系统、压缩策略、位置策略）
- 详细差异分析见 `docs/upstream-diff-analysis.md`

## 规则

- 禁止使用 `npx`，所有命令通过 `pnpm run` 执行
- 类型检查：`cd packages/core && pnpm run check`
- 构建：`cd packages/core && pnpm run build`
- 组件使用 `memo` 包裹，自定义比较函数使用 `fastRGLPropsEqual`
- 关键路径使用 `flushSync` 确保 DOM 同步更新
- `console.log` 仅用于开发调试，提交前必须删除
