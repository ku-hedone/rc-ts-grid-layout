// Polyfill for process.env in browser environment
if (typeof window !== 'undefined' && typeof window.process === 'undefined') {
  (window as any).process = {
    env: {
      NODE_ENV: 'development',
    },
    platform: 'browser',
    version: '',
    browser: true,
  };
}
