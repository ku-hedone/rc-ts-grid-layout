import { useCallback, useMemo, useState } from 'react';
import _ from 'lodash';
import { ResizeGridLayout } from '@hedone/rc-ts-grid-layout';
import { Layout } from '@hedone/rc-ts-grid-layout/typings/type';

const items = 20;

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

	const onInnerLayoutChange = useCallback((layout: Layout) => {
		setState(layout);
	}, []);

	const gen = useCallback(() => {
		return _.map(_.range(items), (i) => {
			return (
				<div key={i}>
					<span className="text">{i}</span>
				</div>
			);
		});
	}, []);

	const stringifyLayout = useMemo(() => {
		return state.map(function (l) {
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
			</div>
			<ResizeGridLayout
				className="layout"
				layout={state}
				onLayoutChange={onInnerLayoutChange}
				rowHeight={30}
				cols={12}
				preventCollision={false}
				useCSSTransforms>
				{gen()}
			</ResizeGridLayout>
		</div>
	);
};

export default Case;
