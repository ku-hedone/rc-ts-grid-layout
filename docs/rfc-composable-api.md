# RFC: 可组合 API 评估

## 状态

**Draft** — 评估阶段，不直接落地实现。

## 背景

本项目基于 react-grid-layout v1 (JS + Flow) 重构为 TypeScript。v1 采用扁平 props 设计（`compactType`、`allowOverlap`、`preventCollision`、`isBounded` 等）。

上游 v2 引入了可组合接口设计：`Compactor`、`PositionStrategy`、`LayoutConstraint`、`GridConfig` 等。本项目已在内部实现了这些接口（`compactors.ts`、`constraints.ts`、`position.ts`），并通过 `index.ts` 导出。

**核心问题：这些内部接口是否应该作为组件 props 暴露给用户？**

## 当前状态

### 已实现并导出的接口

| 模块 | 导出 | 当前用途 |
|------|------|----------|
| `compactors.ts` | `verticalCompactor`、`horizontalCompactor`、`noCompactor`、`getCompactor()` 等 | grid.tsx 内部使用 `getCompactor()` |
| `constraints.ts` | `gridBounds`、`minMaxSize`、`containerBounds`、`aspectRatio()`、`snapToGrid()` 等 | item.tsx 内部使用 `defaultConstraints` |
| `position.ts` | `transformStrategy`、`absoluteStrategy`、`createScaledStrategy()` | item.tsx 内部使用 `createStyle()` |
| `type.ts` | `GridConfig`、`DragConfig`、`ResizeConfig`、`DropConfig`、`Compactor`、`PositionStrategy`、`LayoutConstraint` | 仅类型定义，组件未接收 |

### 组件当前 props（扁平 API）

```typescript
// GridLayout 当前接收的 props
interface RGLProps {
  cols, rowHeight, margin, containerPadding, maxRows,  // → GridConfig
  isDraggable, draggableHandle, draggableCancel,       // → DragConfig
  isResizable, resizeHandles, resizeHandle,             // → ResizeConfig
  isDroppable, droppingItem, onDropDragOver,            // → DropConfig
  compactType, allowOverlap, preventCollision,          // → Compactor 选择
  useCSSTransforms, transformScale,                     // → PositionStrategy
  isBounded,                                            // → Constraint
  constraints?,                                         // ← 新增（计划 4）
  // ... 回调、children 等
}
```

## 方案对比

### 方案 A：保持扁平 API（推荐）

**不新增组件级 props，保持现有扁平 API。**

理由：
1. **v1 兼容性**：用户从 react-grid-layout 迁移时无需改代码
2. **简单性**：大多数用户不需要自定义 compactor/constraint
3. **内部灵活性**：内部已用 `getCompactor()` / `applyPositionConstraints()` 组合，不影响后续重构
4. **渐进增强**：高级用户可直接导入 `Compactor`/`LayoutConstraint` 实例，在应用层组合

用户使用方式：
```tsx
// 90% 用户：扁平 props
<GridLayout compactType="vertical" allowOverlap={false} />

// 10% 高级用户：导入内部接口
import { verticalCompactor, aspectRatio, applyPositionConstraints } from '@hedone/rc-ts-grid-layout';
// 在应用层组合使用
```

### 方案 B：暴露 config 对象 props

**新增 `gridConfig`、`dragConfig`、`resizeConfig`、`dropConfig` props，与扁平 props 共存。**

```tsx
<GridLayout
  gridConfig={{ cols: 12, rowHeight: 30 }}
  dragConfig={{ enabled: true, bounded: true }}
  compactor={verticalCompactor}
  constraints={[gridBounds, minMaxSize, aspectRatio(16/9)]}
/>
```

风险：
1. **两套 API 共存**：用户困惑用哪个，文档维护成本高
2. **优先级问题**：`compactType` 和 `compactor` 同时存在时谁优先？
3. **破坏性变更风险**：如果未来废弃扁平 props，就是 breaking change

### 方案 C：纯内部实现（最保守）

**所有接口仅内部使用，不暴露任何新 props。**

局限：
- 用户无法自定义 compactor（如实现 wrap 模式）
- 用户无法自定义 constraint（如实现 snap-to-grid）
- 与上游 v2 的可组合设计理念脱节

## 推荐方案

### 方案 A：保持扁平 API + 导出内部接口

**实施策略：新增而非替换**

1. **不新增组件级 config props** — 保持扁平 API
2. **保持现有 `index.ts` 导出** — 高级用户可导入内部接口
3. **新增 `constraints` prop**（已完成）— 唯一新增的组件级接口
4. **文档区分"基础用法"和"高级用法"**

### 已确定的分层

| 层级 | 接口 | 对用户 | 对内部 |
|------|------|--------|--------|
| **组件 props** | `compactType`、`allowOverlap`、`preventCollision`、`isBounded` | ✅ 公开 | 通过 `getCompactor()` 转换 |
| **组件 props** | `constraints` | ✅ 公开（新增） | 传给 GridItem |
| **导出接口** | `Compactor`、`LayoutConstraint`、`PositionStrategy` 类型 | ✅ 可导入 | 内部实现 |
| **导出实例** | `verticalCompactor`、`gridBounds`、`aspectRatio()` 等 | ✅ 可导入 | 内部使用 |
| **内部实现** | `getCompactor()`、`applyPositionConstraints()` | ❌ 不推荐直接用 | grid.tsx/item.tsx 使用 |
| **Config 对象** | `GridConfig`、`DragConfig`、`ResizeConfig`、`DropConfig` | ❌ 仅类型 | 未接入组件 |

### 迁移路径

**从 v1 扁平 props → 使用内部接口：**

```tsx
// 之前：扁平 props
<GridLayout
  compactType="vertical"
  allowOverlap={false}
  preventCollision={true}
  isBounded={true}
/>

// 之后：仍然使用扁平 props（不变）
// 高级场景：导入约束来自定义
import { constraints, aspectRatio } from '@hedone/rc-ts-grid-layout';

<GridLayout
  constraints={[...defaultConstraints, aspectRatio(16/9)]}
  // 其他扁平 props 保持不变
/>
```

**无需迁移的场景：**
- 所有现有扁平 props 继续工作
- `compactType` + `allowOverlap` + `preventCollision` 组合继续工作
- `isBounded` 继续工作（内部映射为 `containerBounds` 约束）

## 不做的事

1. **不废弃扁平 props** — 保持 v1 兼容
2. **不新增 `gridConfig`/`dragConfig`/`resizeConfig`/`dropConfig` props** — 避免两套 API
3. **不暴露 `compactor` 作为组件 props** — 通过 `compactType` 隐式选择
4. **不暴露 `positionStrategy` 作为组件 props** — 通过 `useCSSTransforms` 隐式选择

## 可能的未来演进

如果用户确实需要更细粒度的控制，可以考虑：

1. **`compactor` prop**（替代 `compactType`）— 需要 RFC 讨论
2. **`positionStrategy` prop**（替代 `useCSSTransforms`）— 需要 RFC 讨论
3. **废弃 `verticalCompact: false` 旧用法** — 已通过 `compactType: null` 替代

这些演进应通过独立 RFC 评估，每个单独决策。

## 结论

**当前不引入破坏性 API 变更。** 内部已实现的可组合接口通过 `index.ts` 导出，高级用户可直接导入使用。组件层保持扁平 props 设计，仅新增 `constraints` prop 作为唯一的可组合接口入口。
