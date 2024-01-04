import { useLayoutEffect, useRef, useState } from 'react';
import GridLayout from './grid';
import { layoutClassName } from './constant';
import type { RGLProps } from './type.rgl';

interface ResizeObserverRGLProps extends Omit<RGLProps, 'width'> {
	measureBeforeMount?: boolean;
}

const ResizeGridLayout = ({
	measureBeforeMount = false,
	...props
}: ResizeObserverRGLProps) => {
	const ref = useRef<HTMLDivElement>(null);
	const mounted = useRef(false);
	const resizeObserver = useRef<ResizeObserver>();

	const [width, setWidth] = useState(1280);

	useLayoutEffect(() => {
		mounted.current = true;
		resizeObserver.current = new ResizeObserver((entries) => {
			const node = ref.current;
			if (node instanceof HTMLElement && entries[0]) {
				setWidth(entries[0].contentRect.width);
			}
		});
		const node = ref.current;
		if (node instanceof HTMLElement) {
			resizeObserver.current.observe(node);
		}
		return () => {
			mounted.current = false;
			if (resizeObserver.current) {
				if (node instanceof HTMLElement) {
					resizeObserver.current.unobserve(node);
				}
				resizeObserver.current.disconnect();
			}
		};
	});

	const cls = `${props.className || ''} ${layoutClassName}`.trim();

	if (measureBeforeMount && !mounted.current) {
		return (
			<div
				className={cls}
				style={props.style}
				ref={ref}
			/>
		);
	}

	return (
		<GridLayout
			innerRef={ref}
			{...props}
			width={width}
		/>
	);
};

export default ResizeGridLayout;
