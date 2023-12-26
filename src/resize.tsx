import { useLayoutEffect, useRef, useState } from 'react';
import ResponsiveGridLayout from './responsive';
import { layoutClassName } from './constant';
import type { ResponsiveRGLProps } from './type.responsive';


interface ResizeObserverRGLProps extends Omit<ResponsiveRGLProps, 'width'> {
  measureBeforeMount?: boolean;
}

const ResizeObserverGridLayout = ({
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
      if (node instanceof HTMLElement) {
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
    return <div className={cls} style={props.style} ref={ref} />;
  }

  return <ResponsiveGridLayout innerRef={ref} {...props} width={width} />;
};

export default ResizeObserverGridLayout;
