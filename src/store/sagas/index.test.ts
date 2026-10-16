import { runSaga, stdChannel, type SagaIterator } from 'redux-saga';
import { fork, put, take } from 'redux-saga/effects';
import { formatSagaError, rootSaga } from './index';
import { watchInit } from '@/store/sagas/_initSaga';
import { watchAccount } from '@/store/sagas/accountSaga';
import { watchCompanies } from '@/store/sagas/companiesSaga';
import { watchWS } from '@/store/sagas/wsSaga';

jest.mock('@/store/sagas/_initSaga', () => ({ watchInit: jest.fn() }));
jest.mock('@/store/sagas/accountSaga', () => ({ watchAccount: jest.fn() }));
jest.mock('@/store/sagas/companiesSaga', () => ({ watchCompanies: jest.fn() }));
jest.mock('@/store/sagas/wsSaga', () => ({ watchWS: jest.fn() }));

describe('rootSaga', () => {
	const names = ['init', 'account', 'companies', 'ws'];
	const watchers = [watchInit, watchAccount, watchCompanies, watchWS] as jest.MockedFunction<() => SagaIterator>[];
	let stopped: string[];

	beforeEach(() => {
		stopped = [];
		watchers.forEach((watcher, index) => {
			const name = names[index];
			watcher.mockImplementation(function* (): SagaIterator {
				try {
					while (true) {
						const action: { fail?: boolean } = yield take(`TEST_${name}`);
						if (action.fail) throw new Error(`${name} failed`);
						yield put({ type: `HANDLED_${name}` });
					}
				} finally {
					stopped.push(name);
				}
			});
		});
	});

	it('keeps all watchers alive and cancels them together with the root', async () => {
		const channel = stdChannel();
		const dispatch = jest.fn();
		const task = runSaga({ channel, dispatch }, rootSaga);
		try {
			for (const name of names) channel.put({ type: `TEST_${name}` });
			expect(dispatch.mock.calls.map(([action]) => action.type)).toEqual(names.map((name) => `HANDLED_${name}`));
			expect(task.isRunning()).toBe(true);
		} finally {
			task.cancel();
			await task.toPromise();
		}
		expect(stopped.sort()).toEqual([...names].sort());
		dispatch.mockClear();
		for (const name of names) channel.put({ type: `TEST_${name}` });
		expect(dispatch).not.toHaveBeenCalled();
	});

	it.each(names)('isolates a failed %s watcher while its siblings continue', async (name) => {
		const channel = stdChannel();
		const dispatch = jest.fn();
		const onError = jest.fn();
		const task = runSaga({ channel, dispatch, onError }, rootSaga);
		try {
			channel.put({ type: `TEST_${name}`, fail: true });
			expect(onError).toHaveBeenCalledWith(new Error(`${name} failed`), expect.anything());
			expect(task.isRunning()).toBe(true);
			for (const sibling of names.filter((value) => value !== name)) {
				channel.put({ type: `TEST_${sibling}` });
				expect(dispatch).toHaveBeenCalledWith({ type: `HANDLED_${sibling}` });
			}
		} finally {
			task.cancel();
			await task.toPromise();
		}
		expect(stopped.sort()).toEqual([...names].sort());
	});

	it('also cancels work forked by a watcher', async () => {
		const cleanup = jest.fn();
		watchers[0].mockImplementation(function* (): SagaIterator {
			yield fork(function* () {
				try {
					yield take('NEVER_FINISHED');
				} finally {
					cleanup();
				}
			});
		});
		const task = runSaga({}, rootSaga);
		task.cancel();
		await task.toPromise();
		expect(cleanup).toHaveBeenCalledTimes(1);
	});

	it('preserves useful details when formatting object saga errors', () => {
		expect(formatSagaError({ error: { status_code: 429, message: 'Trop de requêtes' } })).toBe(
			'{"error":{"status_code":429,"message":"Trop de requêtes"}}',
		);
	});
});
