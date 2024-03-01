import { useCallback, useMemo, useState } from 'react';
import _ from 'lodash';
import { ResizeGridLayout } from '@hedone/rc-ts-grid-layout';
import type { Layout, LayoutItem } from '@hedone/rc-ts-grid-layout/typings/type';

const items = 20;
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

const Case = () => {
	const [state, setState] = useState<Layout>(layout);
	const onAddItem = useCallback(() => {
		setState((prev) => [
			...(prev || []),
			{
				i: (prev ? prev.length : 0) + '',
				x: ((prev ? prev.length : 0) * 2) % 12,
				y: Infinity, // puts it at the bottom
				w: 2,
				h: 2,
			},
		]);
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
				verticalCompact={false}>
				{gen()}
			</ResizeGridLayout>
		</div>
	);
};

export default Case;
