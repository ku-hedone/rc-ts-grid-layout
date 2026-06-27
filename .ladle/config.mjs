/** @type {import('@ladle/react').UserConfig} */
export default {
  stories: 'packages/core/src/stories/**/*.stories.{js,jsx,ts,tsx}',
  vite: {
    define: {
      'process.env.NODE_ENV': '"development"',
      'process.env': '{}',
    },
    esbuild: {
      define: {
        'process.env.NODE_ENV': '"development"',
      },
    },
  },
  addons: {
    a11y: {
      enabled: false,
    },
    action: {
      enabled: true,
      defaultState: [],
    },
    control: {
      enabled: true,
      defaultState: {},
    },
    ladle: {
      enabled: true,
    },
    mode: {
      enabled: true,
      defaultState: 'full',
    },
    msw: {
      enabled: false,
    },
    rtl: {
      enabled: false,
      defaultState: false,
    },
    source: {
      enabled: true,
      defaultState: true,
    },
    theme: {
      enabled: true,
      defaultState: 'light',
    },
    width: {
      enabled: true,
      options: {
        xsmall: 414,
        small: 640,
        medium: 768,
        large: 1024,
        xlarge: 1280,
      },
      defaultState: 0,
    },
  },
  appendToHead: `
    <style>
      /* 自定义 Ladle 主题样式 */
      :root {
        --ladle-bg-primary: #ffffff;
        --ladle-bg-secondary: #f8fafc;
        --ladle-bg-tertiary: #f1f5f9;
        --ladle-text-primary: #0f172a;
        --ladle-text-secondary: #475569;
        --ladle-border: #e2e8f0;
        --ladle-accent: #3b82f6;
        --ladle-accent-hover: #2563eb;
        --ladle-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
        --ladle-radius: 8px;
      }

      [data-theme="dark"] {
        --ladle-bg-primary: #0f172a;
        --ladle-bg-secondary: #1e293b;
        --ladle-bg-tertiary: #334155;
        --ladle-text-primary: #f8fafc;
        --ladle-text-secondary: #94a3b8;
        --ladle-border: #334155;
        --ladle-accent: #60a5fa;
        --ladle-accent-hover: #3b82f6;
        --ladle-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3);
      }

      /* 全局样式 */
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        background: white;
        padding: 20px;
        overflow: scroll;
      }

      /* 网格布局容器 */
      .react-grid-layout {
        position: relative;
        transition: height 200ms ease;
        background: #eee;
        min-height: 100px;
      }

      /* 网格项基础样式 */
      .react-grid-item {
        box-sizing: border-box;
        background: #ccc;
        border: 1px solid black;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 14px;
        transition: all 200ms ease;
        transition-property: left, top;
      }

      /* CSS Transform 模式 */
      .react-grid-item.cssTransforms {
        transition-property: transform;
      }

      /* 网格项拖拽中 */
      .react-grid-item.react-draggable-dragging {
        transition: none;
        z-index: 3;
        will-change: transform;
        background: #bbb;
      }

      /* 网格项缩放中 */
      .react-grid-item.resizing {
        z-index: 1;
        will-change: width, height;
        opacity: 0.9;
      }

      /* 静态项样式 */
      .react-grid-item.static {
        background: #cce;
        cursor: not-allowed;
      }

      /* 占位符样式 */
      .react-grid-placeholder {
        background: red;
        opacity: 0.2;
        transition-duration: 100ms;
        z-index: 2;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        -o-user-select: none;
        user-select: none;
      }

      /* 缩放把手样式 */
      .react-resizable-handle {
        position: absolute;
        width: 20px;
        height: 20px;
      }

      .react-resizable-handle::after {
        content: '';
        position: absolute;
        right: 3px;
        bottom: 3px;
        width: 6px;
        height: 6px;
        border-right: 2px solid rgba(0, 0, 0, 0.4);
        border-bottom: 2px solid rgba(0, 0, 0, 0.4);
      }

      .react-resizable-handle-se {
        bottom: 0;
        right: 0;
        cursor: se-resize;
      }

      .react-resizable-handle-sw {
        bottom: 0;
        left: 0;
        cursor: sw-resize;
      }

      .react-resizable-handle-ne {
        top: 0;
        right: 0;
        cursor: ne-resize;
      }

      .react-resizable-handle-nw {
        top: 0;
        left: 0;
        cursor: nw-resize;
      }

      .react-resizable-handle-w,
      .react-resizable-handle-e {
        top: 50%;
        margin-top: -10px;
        cursor: ew-resize;
      }

      .react-resizable-handle-w {
        left: 0;
      }

      .react-resizable-handle-e {
        right: 0;
      }

      .react-resizable-handle-n,
      .react-resizable-handle-s {
        left: 50%;
        margin-left: -10px;
        cursor: ns-resize;
      }

      .react-resizable-handle-n {
        top: 0;
      }

      .react-resizable-handle-s {
        bottom: 0;
      }

      /* 故事容器 */
      .ladle-story {
        background: var(--ladle-bg-primary) !important;
        border-radius: var(--ladle-radius) !important;
        box-shadow: var(--ladle-shadow) !important;
        margin: 16px !important;
        padding: 24px !important;
        border: 1px solid var(--ladle-border) !important;
      }

      /* 控制面板样式 */
      .ladle-addons {
        background: var(--ladle-bg-primary) !important;
        border: 1px solid var(--ladle-border) !important;
        border-radius: var(--ladle-radius) !important;
        box-shadow: var(--ladle-shadow) !important;
      }
    </style>
  `,
};
