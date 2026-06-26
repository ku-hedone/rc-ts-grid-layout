/**
 * 测试设置文件
 *
 * 在所有测试运行前执行，用于配置测试环境。
 */

import '@testing-library/jest-dom';

// 模拟 ResizeObserver
class ResizeObserverMock {
	observe() {}
	unobserve() {}
	disconnect() {}
}

window.ResizeObserver = ResizeObserverMock;

// 模拟 getBoundingClientRect
Element.prototype.getBoundingClientRect = function () {
	return {
		x: 0,
		y: 0,
		width: 0,
		height: 0,
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
		toJSON: () => {},
	};
};

// 模拟 offsetParent
Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
	get() {
		return this.parentNode || null;
	},
});

// 模拟 offsetLeft/offsetTop
Object.defineProperty(HTMLElement.prototype, 'offsetLeft', {
	get() {
		return 0;
	},
});

Object.defineProperty(HTMLElement.prototype, 'offsetTop', {
	get() {
		return 0;
	},
});
