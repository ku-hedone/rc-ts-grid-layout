import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		// 测试环境
		environment: 'jsdom',

		// 全局 API
		globals: true,

		// 设置文件
		setupFiles: ['./src/__tests__/setup.ts'],

		// 包含的测试文件
		include: ['src/**/*.{test,spec}.{ts,tsx}'],

		// 排除的文件
		exclude: ['node_modules', 'dist', 'cjs', 'esm'],

		// 覆盖率配置
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: [
				'node_modules/',
				'src/__tests__/',
				'**/*.d.ts',
				'**/*.test.{ts,tsx}',
				'**/*.spec.{ts,tsx}',
			],
		},

		// 类型检查
		typecheck: {
			enabled: true,
			tsconfig: './tsconfig.json',
		},
	},
});
