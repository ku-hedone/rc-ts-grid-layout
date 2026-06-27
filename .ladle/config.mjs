/** @type {import('@ladle/react').UserConfig} */
export default {
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

      /* 网格项样式 */
      .react-grid-item {
        background: #3b82f6;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 14px;
        border-radius: 4px;
        transition: background-color 0.2s ease;
      }

      .react-grid-item:hover {
        background: #2563eb;
      }

      /* 静态项样式 */
      .react-grid-item.static {
        background: #94a3b8;
        cursor: not-allowed;
      }

      /* 占位符样式 */
      .react-grid-placeholder {
        background: #dbeafe !important;
        border: 2px dashed #3b82f6 !important;
        border-radius: 4px !important;
        opacity: 0.8;
      }

      /* 缩放把手样式 */
      .react-resizable-handle {
        opacity: 0;
        transition: opacity 0.2s ease;
      }

      .react-grid-item:hover .react-resizable-handle {
        opacity: 1;
      }

      .react-resizable-handle::after {
        border-color: white !important;
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
