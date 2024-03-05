import { useCallback, useMemo, useRef, useState } from 'react';
import _ from 'lodash';
import { ResizeGridLayout, collides } from '@hedone/rc-ts-grid-layout';
import type { Layout, LayoutItem } from '@hedone/rc-ts-grid-layout/typings/type';

const items = 2;
const resizeHandles = [
	'w',
	'e',
	's',
	'n',
	'sw',
	'nw',
	'se',
	'ne',
] as Required<LayoutItem>['resizeHandles'];

const layout = _.map(new Array(items), (_, i) => {
	const y = Math.ceil(Math.random() * 4) + 1;
	return {
		x: (i * 2) % 12,
		y: Math.floor(i / 6) * y,
		w: 2,
		h: y,
		i: i.toString(),
	};
});

function addItemToLayout(
	currentLayout: Layout,
	item: Pick<LayoutItem, 'i' | 'w' | 'h'>,
	cols: number,
	// compactType: CompactType,
) {
	const finalItem = { ...item, x: 0, y: 0 } as LayoutItem; // 初始化 finalItem 的 x 和 y

	// 为了找到合适的位置，我们需要考虑整个网格
	for (let y = 0; y <= cols - finalItem.h; y++) {
		for (let x = 0; x <= cols - finalItem.w; x++) {
			finalItem.x = x;
			finalItem.y = y;

			// 检查新项目是否与现有项目发生碰撞
			const isColliding = currentLayout.some((layoutItem) =>
				collides(finalItem, layoutItem),
			);
			if (!isColliding) {
				// 找到了合适的位置，将项目添加到布局中
				return [...currentLayout, finalItem];
			}
		}
	}

	// 如果没有找到合适的位置，就在最底部新开一行放置新项目
	const maxY = Math.max(0, ...currentLayout.map((it) => it.y + it.h));
	finalItem.x = 0;
	finalItem.y = maxY;
	return [...currentLayout, finalItem];
}

const Case = () => {
	const count = useRef(2);
	const [state, setState] = useState<Layout>(layout);
	const onAddItem = useCallback(() => {
		setState((prev) => {
			const next = addItemToLayout(
				prev,
				{
					i: ++count.current + '',
					w: 2,
					h: 2,
				},
				12,
			);
			console.log({
				prev,
				next,
			});
			return next;
		});
	}, []);

	const onRemoveItem = useCallback(
		(i: string) => () => {
			setState((prev) => (prev ? prev.filter((item) => item.i !== i) : []));
		},
		[],
	);

	const onInnerLayoutChange = useCallback((layout: Layout) => {
		setState(layout);
	}, []);

	const gen = useCallback(() => {
		return _.map(state, (item) => {
			return (
				<div key={item.i}>
					<span className="text">{item.i}</span>
					<button onClick={onRemoveItem(item.i)}>remove</button>
				</div>
			);
		});
	}, [state, onRemoveItem]);

	const stringifyLayout = useMemo(() => {
		return (state || []).map(function (l) {
			return (
				<div
					className="layoutItem"
					key={l.i}>
					<b>{l.i}</b>: [{l.x}, {l.y}, {l.w}, {l.h}]
				</div>
			);
		});
	}, [state]);

	return (
		<div>
			<div className="layoutJSON">
				Displayed as <code>[x, y, w, h]</code>:
				<div className="columns">{stringifyLayout}</div>
				<button onClick={onAddItem}>add</button>
			</div>
			<ResizeGridLayout
				className="layout"
				layout={state}
				onLayoutChange={onInnerLayoutChange}
				rowHeight={50}
				cols={12}
				resizeHandles={resizeHandles}
				compactType="horizontal">
				{gen()}
			</ResizeGridLayout>
		</div>
	);
};

export default Case;
