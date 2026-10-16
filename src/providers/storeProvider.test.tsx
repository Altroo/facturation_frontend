import { StrictMode, useEffect } from 'react';
import { render } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { useStore } from 'react-redux';
import type { SagaIterator, Task } from 'redux-saga';
import { put, take } from 'redux-saga/effects';
import StoreProvider from './storeProvider';
import { makeStore, type SagaStore } from '@/store/store';
import { rootSaga } from '@/store/sagas';

jest.mock('@/store/sagas', () => ({ rootSaga: jest.fn() }));

const useAppStore = useStore.withTypes<SagaStore>();

describe('StoreProvider lifecycle', () => {
	let tasks: Task[];
	let stores: SagaStore[];
	let dispatch: jest.Mock;
	let stopped: jest.Mock;

	beforeEach(() => {
		tasks = [];
		stores = [];
		dispatch = jest.fn();
		stopped = jest.fn();
		jest.mocked(rootSaga).mockImplementation(function* (): SagaIterator {
			try {
				while (true) {
					yield take('TEST_INITIALIZE');
					dispatch();
					yield put({ type: 'TEST_INITIALIZED' });
				}
			} finally {
				stopped();
			}
		});
	});

	const Child = () => {
		const store = useAppStore();
		useEffect(() => {
			stores.push(store);
			if (store.sagaTask) tasks.push(store.sagaTask);
			store.dispatch({ type: 'TEST_INITIALIZE' });
		}, [store]);
		return <div>Facturation</div>;
	};

	it('renders the server HTML without starting any watchers', () => {
		expect(
			renderToString(
				<StoreProvider>
					<Child />
				</StoreProvider>,
			),
		).toContain('Facturation');
		expect(rootSaga).not.toHaveBeenCalled();
	});

	it('does not start watchers when a store is created outside a mounted provider', () => {
		const store = makeStore();
		expect(store.sagaTask).toBeUndefined();
		expect(rootSaga).not.toHaveBeenCalled();
	});

	it('handles child initialization and keeps only one running task after StrictMode replay', () => {
		const view = render(
			<StrictMode>
				<StoreProvider>
					<Child />
				</StoreProvider>
			</StrictMode>,
		);
		try {
			expect(dispatch).toHaveBeenCalledTimes(2);
			expect(tasks).toHaveLength(2);
			expect(tasks[0].isCancelled()).toBe(true);
			expect(tasks[1].isRunning()).toBe(true);
			expect(stopped).toHaveBeenCalledTimes(1);
		} finally {
			view.unmount();
		}
		expect(tasks.every((task) => !task.isRunning())).toBe(true);
		expect(stopped).toHaveBeenCalledTimes(2);
	});

	it('stops the old task and initializes a fresh store on remount', () => {
		const first = render(
			<StoreProvider>
				<Child />
			</StoreProvider>,
		);
		first.unmount();
		const second = render(
			<StoreProvider>
				<Child />
			</StoreProvider>,
		);
		try {
			expect(stores[0]).not.toBe(stores[1]);
			expect(tasks[0].isCancelled()).toBe(true);
			expect(tasks[1].isRunning()).toBe(true);
			expect(dispatch).toHaveBeenCalledTimes(2);
		} finally {
			second.unmount();
		}
		expect(stopped).toHaveBeenCalledTimes(2);
	});
});
