import { describe, expect, it } from 'vitest';
import * as publicApi from '../index';
import {
	defaultDragConfig,
	defaultDropConfig,
	defaultGridConfig,
	defaultResizeConfig,
} from '../type';

describe('public api', () => {
	it('exports the main components and utility modules', () => {
		expect(publicApi.GridLayout).toBeDefined();
		expect(publicApi.ResponsiveGridLayout).toBeDefined();
		expect(publicApi.ResizeGridLayout).toBeDefined();
		expect(publicApi.ResizeResponsiveGridLayout).toBeDefined();
		expect(publicApi.collides).toBeTypeOf('function');
		expect(publicApi.compact).toBeTypeOf('function');
		expect(publicApi.setTransform).toBeTypeOf('function');
		expect(publicApi.verticalCompactor.type).toBe('vertical');
	});

	it('provides default runtime configs', () => {
		expect(defaultGridConfig).toEqual({
			cols: 12,
			rowHeight: 150,
			margin: [10, 10],
			containerPadding: null,
			maxRows: Infinity,
		});
		expect(defaultDragConfig).toEqual({
			enabled: true,
			bounded: false,
			threshold: 3,
		});
		expect(defaultResizeConfig).toEqual({
			enabled: true,
			handles: ['se'],
		});
		expect(defaultDropConfig).toEqual({
			enabled: false,
			defaultItem: { w: 1, h: 1, i: '__dropping-elem__' },
		});
	});
});
