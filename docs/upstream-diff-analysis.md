# 上游库 (react-grid-layout v2) vs 主仓 差异分析

> 分析日期: 2026-06-26
> 上游库路径: `git-repo/react-grid-layout/`
> 主仓路径: `packages/core/`

---

## 一、缺失的功能模块

### 1.1 约束系统 (constraints.ts) -- 缺失

**上游实现:** `src/core/constraints.ts`

上游库引入了**可组合约束系统**，约束可以在网格级别和项级别同时应用。这是 v2 的核心设计之一。

**缺失内容:**

| 类型/函数 | 说明 |
|-----------|------|
| `ConstraintContext` 接口 | 约束函数的上下文参数 (cols, maxRows, containerWidth, containerHeight, rowHeight, margin, layout) |
| `LayoutConstraint` 接口 | 约束接口，包含 `constrainPosition` 和 `constrainSize` 方法 |
| `gridBounds` 约束 | 确保项在网格边界内 (0 到 cols-w, 0 到 maxRows-h) |
| `minMaxSize` 约束 | 强制执行每项的 minW/maxW/minH/maxH |
| `containerBounds` 约束 | 按实际容器高度计算可见行数约束 |
| `boundedX` 约束 | 仅约束水平方向 |
| `boundedY` 约束 | 仅约束垂直方向 |
| `aspectRatio(ratio)` 工厂 | 保持像素级宽高比 |
| `snapToGrid(stepX, stepY)` 工厂 | 位置吸附到步长倍数 |
| `minSize(minW, minH)` 工厂 | 全局最小尺寸约束 |
| `maxSize(maxW, maxH)` 工厂 | 全局最大尺寸约束 |
| `applyPositionConstraints()` | 链式应用位置约束 |
| `applySizeConstraints()` | 链式应用尺寸约束 |
| `defaultConstraints` | 默认约束栈 `[gridBounds, minMaxSize]` |

**影响:** 用户无法使用可组合的约束系统，无法自定义拖拽/缩放行为约束。

**修复方案:** 新增 `packages/core/src/constraints.ts`，完整移植上游实现。

---

### 1.2 压缩策略接口 (Compactor) -- 缺失

**上游实现:** `src/core/compactors.ts`

上游库将压缩算法抽象为 `Compactor` 接口，支持策略模式。

**缺失内容:**

| 类型/函数 | 说明 |
|-----------|------|
| `Compactor` 接口 | 压缩策略接口，包含 `type`, `allowOverlap`, `preventCollision`, `compact()` |
| `verticalCompactor` | 垂直压缩策略实例 |
| `horizontalCompactor` | 水平压缩策略实例 |
| `noCompactor` | 无压缩策略实例 |
| `verticalOverlapCompactor` | 允许重叠的垂直压缩 |
| `horizontalOverlapCompactor` | 允许重叠的水平压缩 |
| `noOverlapCompactor` | 允许重叠的无压缩 |
| `getCompactor()` 工厂 | 根据 compactType + allowOverlap + preventCollision 返回对应 Compactor |
| `compactItemVertical()` | 可复用的垂直压缩单个 item 函数 |
| `compactItemHorizontal()` | 可复用的水平压缩单个 item 函数 |
| `resolveCompactionCollision()` (导出版) | 带 `hasStatics` 优化参数的碰撞解决函数 |

**影响:** 用户无法自定义压缩策略，无法使用可组合的压缩接口。

**修复方案:** 新增 `packages/core/src/compactors.ts`，将现有 `compact`/`compactItem` 重构为 Compactor 接口实现。

---

### 1.3 位置策略接口 (PositionStrategy) -- 缺失

**上游实现:** `src/core/position.ts`

上游库将 CSS 定位抽象为 `PositionStrategy` 接口。

**缺失内容:**

| 类型/函数 | 说明 |
|-----------|------|
| `PositionStrategy` 接口 | 定位策略接口，包含 `type`, `scale`, `calcStyle()`, `calcDragPosition?()` |
| `transformStrategy` | CSS transform 定位策略实例 |
| `absoluteStrategy` | top/left 定位策略实例 |
| `createScaledStrategy(scale)` | 缩放容器场景的定位策略工厂 |

**影响:** 用户无法自定义定位策略，无法优雅处理缩放容器场景。

**修复方案:** 新增 `packages/core/src/position.ts`，将现有 `setTransform`/`setTopLeft` 重构为 PositionStrategy 接口实现。

---

### 1.4 计算函数缺失

**上游实现:** `src/core/calculate.ts`

**缺失函数:**

| 函数 | 说明 |
|------|------|
| `calcXYRaw()` | 不做 clamp 的像素坐标转网格坐标，配合约束系统使用 |
| `calcWHRaw()` | 不做 clamp 的像素尺寸转网格单位，配合约束系统使用 |
| `calcGridCellDimensions()` | 计算渲染网格背景所需的 cellWidth、cellHeight、offsetX/Y、gapX/Y |
| `GridCellDimensions` 接口 | 网格背景尺寸信息 |
| `GridCellConfig` 接口 | 网格背景计算配置 |

**影响:** 无法配合约束系统使用原始坐标计算，无法渲染网格背景。

**修复方案:** 在 `packages/core/src/calculate.ts` 中补充这三个函数。

---

## 二、算法差异

### 2.1 calcGridItemPosition 边距修正算法 -- 缺失

**上游实现:** `src/core/calculate.ts` 第 135-161 行

**问题:** 上游库在 `calcGridItemPosition` 中有一个**边距修正算法**。由于 `Math.round()` 取整，相邻项之间的实际间距可能与期望 margin 不一致（如 0px 或 2px 而非 1px）。

**上游算法:**
```typescript
// When not dragging or resizing, fix margin inconsistencies caused by rounding.
if (!dragPosition && !resizePosition) {
  if (Number.isFinite(w)) {
    const siblingLeft = Math.round(
      (colWidth + margin[0]) * (x + w) + containerPadding[0]
    );
    const actualMarginRight = siblingLeft - left - width;
    if (actualMarginRight !== margin[0]) {
      width += actualMarginRight - margin[0];
    }
  }
  if (Number.isFinite(h)) {
    const siblingTop = Math.round(
      (rowHeight + margin[1]) * (y + h) + containerPadding[1]
    );
    const actualMarginBottom = siblingTop - top - height;
    if (actualMarginBottom !== margin[1]) {
      height += actualMarginBottom - margin[1];
    }
  }
}
```

**用户代码:** `packages/core/src/utils.item.ts` 的 `calcGridItemPosition` 没有这个修正。

**影响:** 相邻网格项之间的间距可能不一致，出现 0px 或 2px 的间隙。

**修复方案:** 在 `packages/core/src/utils.item.ts` 的 `calcGridItemPosition` 中补充边距修正逻辑。

---

### 2.2 resolveCompactionCollision hasStatics 优化 -- 缺失

**上游实现:** `src/core/compactors.ts` 第 38-76 行

**问题:** 上游版本的 `resolveCompactionCollision` 有一个 `hasStatics` 参数用于优化：
```typescript
// Optimization: break early if past this element, but only if no statics
// are present. Static items can be scattered throughout the layout,
// so we can't assume sort order guarantees no more collisions.
if (!layoutHasStatics && otherItem.y > item.y + item.h) break;
```

**用户代码:** `packages/core/src/utils.ts` 的 `resolveCompactionCollision` 没有这个优化，直接 break：
```typescript
if (otherItem.y > item.y + item.h) break;
```

**影响:** 当布局中有 static 项散布时，可能会错误地跳过碰撞检测，导致布局错误。

**修复方案:** 在 `packages/core/src/utils.ts` 的 `resolveCompactionCollision` 中补充 `hasStatics` 参数和逻辑。

---

### 2.3 gridBounds 约束中的方向性缩放处理 -- 缺失

**上游实现:** `src/core/constraints.ts` 第 52-76 行

**问题:** 上游的 `gridBounds` 约束在 `constrainSize` 中处理了方向性缩放：
```typescript
// For west-side resizes (w, nw, sw), max width is limited by the right edge position
const maxW =
  handle === "w" || handle === "nw" || handle === "sw"
    ? item.x + item.w  // right edge = x + w, can expand left to x=0
    : cols - item.x;   // can expand right to cols
```

**用户代码:** 用户的 `calcWH` 函数虽然处理了 handle 方向，但逻辑略有不同。

**影响:** 西向/北向缩放时的边界约束可能不准确。

**修复方案:** 迁移到约束系统后统一处理。

---

## 三、类型差异

### 3.1 Layout 类型定义

| 属性 | 上游库 | 用户代码 |
|------|--------|----------|
| `Layout` 类型 | `readonly LayoutItem[]` | `LayoutItem[]` |
| `CompactType` 值 | `"horizontal" \| "vertical" \| "wrap" \| null` | `'horizontal' \| 'vertical' \| 'unset' \| undefined` |
| `constraints` 属性 | 存在于 `LayoutItem` | 不存在 |

**影响:**
- `readonly` 有助于防止意外修改
- `null` vs `undefined` 语义不同，`unset` 不是标准值
- 缺少 `constraints` 属性无法使用项级约束

**修复方案:**
1. 将 `Layout` 类型改为 `readonly LayoutItem[]`
2. 将 `CompactType` 的 `'unset'` 改为 `null`
3. 在 `LayoutItem` 中添加 `constraints?: LayoutConstraint[]`

---

### 3.2 缺失的接口

| 接口 | 说明 |
|------|------|
| `Compactor` | 压缩策略接口 |
| `PositionStrategy` | 定位策略接口 |
| `LayoutConstraint` | 布局约束接口 |
| `ConstraintContext` | 约束上下文接口 |
| `GridConfig` | 网格配置接口 |
| `DragConfig` | 拖拽配置接口 |
| `ResizeConfig` | 缩放配置接口 |
| `DropConfig` | 拖放配置接口 |
| `Mutable<T>` | 移除 readonly 的工具类型 |
| `DeepPartial<T>` | 深度可选工具类型 |
| `ArrayElement<T>` | 数组元素提取工具类型 |

**修复方案:** 在 `packages/core/src/type.ts` 中补充这些接口定义。

---

## 四、代码质量问题

### 4.1 调试 console.log 语句

**位置:** `packages/core/src/utils.ts`

- 第 477 行: `console.log(\`Moving element ${l.i} to [${String(x)},${String(y)}] from [${l.x},${l.y}]\`)`
- 第 513 行: `console.log(\`Collision prevented on ${l.i}, reverting.\`)`
- 第 603 行: `console.log(\`Doing reverse collision on ${itemToMove.i} up to [${fakeItem.x},${fakeItem.y}].\`)`

**影响:** 生产环境会输出调试信息，影响性能和用户体验。

**修复方案:** 删除所有调试用的 `console.log` 语句。

---

### 4.2 containerPadding 默认值处理不一致

**上游库:** `src/core/calculate.ts`
```typescript
const { margin, containerPadding, containerWidth, cols } = positionParams;
// containerPadding 在 PositionParams 中是必需的，不是可选的
```

**用户代码:** `packages/core/src/calculate.ts`
```typescript
const paddingX =
  Array.isArray(containerPadding) && containerPadding.length
    ? containerPadding[0]
    : margin[0];
```

**问题:** 用户代码将 `containerPadding` 作为可选参数处理，默认回退到 `margin`。上游库要求调用者显式提供 `containerPadding`。

**影响:** 当 `containerPadding` 未设置时，用户代码会使用 `margin` 作为默认值，这可能与上游行为不一致。

**修复方案:** 统一 `containerPadding` 的处理方式，建议在组件层设置默认值而非在计算函数中。

---

## 五、模块化架构差异

### 5.1 文件组织

| 功能 | 上游库 | 用户代码 |
|------|--------|----------|
| 碰撞检测 | `collision.ts` (独立模块) | `utils.ts` (内联) |
| 压缩算法 | `compactors.ts` (独立模块) | `utils.ts` (内联) |
| 排序逻辑 | `sort.ts` (独立模块) | `utils.ts` (内联) |
| 布局操作 | `layout.ts` (独立模块) | `utils.ts` (内联) |
| 位置计算 | `position.ts` (独立模块) | `utils.ts` + `utils.item.ts` |
| 约束系统 | `constraints.ts` (独立模块) | 不存在 |
| 响应式工具 | `responsive.ts` (独立模块) | `utils.responsive.ts` |

**影响:** 用户代码的 `utils.ts` 过于庞大 (28KB+)，不利于 tree-shaking 和维护。

**修复方案:** 按上游库的模块化结构拆分 `utils.ts`，但保持向后兼容的导出。

---

## 六、优先级排序

### P0 (必须修复)
1. **边距修正算法** -- 影响布局一致性
2. **删除 console.log** -- 影响生产环境
3. **CompactType 值统一** -- `unset` -> `null`

### P1 (建议修复)
4. **约束系统** -- 新增 `constraints.ts`
5. **压缩策略接口** -- 新增 `compactors.ts`
6. **calcXYRaw/calcWHRaw** -- 配合约束系统
7. **resolveCompactionCollision hasStatics 优化** -- 修复 static 项散布时的碰撞检测

### P2 (可选优化)
8. **PositionStrategy 接口** -- 新增 `position.ts`
9. **类型定义补充** -- Layout readonly、缺失接口
10. **模块化拆分** -- 拆分 utils.ts
11. **calcGridCellDimensions** -- 网格背景计算

---

## 七、修复计划

### 阶段一: 关键修复 (P0) ✅ 已完成
- [x] 在 `utils.item.ts` 中补充边距修正算法 (2026-06-26)
- [x] 删除 `utils.ts` 中的 console.log (2026-06-26)
- [x] 统一 CompactType 值为 null (2026-06-26)

### 阶段二: 核心功能 (P1) ✅ 已完成
- [x] 新增 `constraints.ts` 约束系统 (2026-06-26)
- [x] 新增 `compactors.ts` 压缩策略 (2026-06-26)
- [x] 在 `calculate.ts` 中补充 `calcXYRaw`/`calcWHRaw` (2026-06-26)
- [x] 修复 `resolveCompactionCollision` 的 hasStatics 优化 (2026-06-26)

### 阶段三: 架构优化 (P2) ✅ 已完成
- [x] 新增 `position.ts` 位置策略 (2026-06-26)
- [x] 补充类型定义 (2026-06-26)
- [ ] 模块化拆分 utils.ts（暂不执行）
- [x] 补充 `calcGridCellDimensions` (2026-06-26)
