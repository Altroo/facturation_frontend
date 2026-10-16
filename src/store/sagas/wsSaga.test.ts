import { eventChannel, runSaga } from 'redux-saga';
import { watchWS } from './wsSaga';
import { initWebsocket } from '@/store/services/ws';
import { getAccessToken } from '@/store/selectors';
import type { Action } from 'redux';
import * as Types from '@/store/actions';
import { setWSMaintenance } from '@/store/slices/wsSlice';
import { initMaintenanceSaga } from '@/store/sagas/_initSaga';

jest.mock('@/store/services/ws', () => ({
	initWebsocket: jest.fn(),
}));

jest.mock('@/store/selectors', () => ({
	getAccessToken: jest.fn(),
}));

jest.mock('@/store/sagas/_initSaga', () => ({
	initMaintenanceSaga: jest.fn(function* () {}),
}));

describe('watchWS saga', () => {
	it('closes the event channel when the watcher is canceled', async () => {
		const unsubscribe = jest.fn();
		const channel = eventChannel<Action>(() => unsubscribe);
		jest.mocked(getAccessToken).mockReturnValue('mock-token');
		jest.mocked(initWebsocket).mockReturnValue(channel);
		const task = runSaga({ getState: () => ({}) }, watchWS);
		task.cancel();
		await task.toPromise();
		expect(unsubscribe).toHaveBeenCalledTimes(1);
	});

	it('closes the event channel if processing a message fails', async () => {
		let emit: (action: Action) => void = () => undefined;
		const unsubscribe = jest.fn();
		const channel = eventChannel<Action>((emitter) => {
			emit = emitter;
			return unsubscribe;
		});
		jest.mocked(getAccessToken).mockReturnValue('mock-token');
		jest.mocked(initWebsocket).mockReturnValue(channel);
		const error = new Error('Message dispatch failed');
		const task = runSaga(
			{
				getState: () => ({}),
				dispatch: () => {
					throw error;
				},
				onError: jest.fn(),
			},
			watchWS,
		);
		emit({ type: 'MOCK_ACTION' });
		await expect(task.toPromise()).rejects.toBe(error);
		expect(unsubscribe).toHaveBeenCalledTimes(1);
	});

	it('should initialize websocket and dispatch actions from the channel', async () => {
		const dispatched: Action[] = [];
		const mockToken = 'mock-token';
		const mockAction: Action = { type: 'MOCK_ACTION' };

		(getAccessToken as jest.Mock).mockReturnValue(mockToken);

		const mockChannel = eventChannel((emit) => {
			const timer = setTimeout(() => emit(mockAction), 10); // emit after saga starts
			return () => clearTimeout(timer);
		});

		(initWebsocket as jest.Mock).mockReturnValue(mockChannel);

		const task = runSaga(
			{
				dispatch: (action: Action) => dispatched.push(action),
				getState: () => ({ auth: { token: mockToken } }),
			},
			watchWS,
		);

		// Cancel after short delay to break infinite loop
		setTimeout(() => task.cancel(), 100);

		await task.toPromise();

		expect(initWebsocket).toHaveBeenCalledWith(expect.any(Function));
		expect(dispatched).toContainEqual(mockAction);
	}, 10000); // Optional: increase timeout to 10s

	it('should call initMaintenanceSaga on WS_RECONNECTED', async () => {
		const dispatched: Action[] = [];
		const mockToken = 'mock-token';
		const mockAction = { type: Types.WS_RECONNECTED };

		(getAccessToken as jest.Mock).mockReturnValue(mockToken);

		const mockChannel = eventChannel((emit) => {
			const timer = setTimeout(() => emit(mockAction), 10);
			return () => clearTimeout(timer);
		});

		(initWebsocket as jest.Mock).mockReturnValue(mockChannel);

		const task = runSaga(
			{
				dispatch: (action: Action) => dispatched.push(action),
				getState: () => ({ auth: { token: mockToken } }),
			},
			watchWS,
		);

		setTimeout(() => task.cancel(), 100);
		await task.toPromise();

		expect(initMaintenanceSaga).toHaveBeenCalled();
	});

	it('should map WS_MAINTENANCE to setWSMaintenance', async () => {
		const dispatched: Action[] = [];
		const mockToken = 'mock-token';
		const mockAction = { type: Types.WS_MAINTENANCE, maintenance: true };

		(getAccessToken as jest.Mock).mockReturnValue(mockToken);

		const mockChannel = eventChannel((emit) => {
			const timer = setTimeout(() => emit(mockAction), 10);
			return () => clearTimeout(timer);
		});

		(initWebsocket as jest.Mock).mockReturnValue(mockChannel);

		const task = runSaga(
			{
				dispatch: (action: Action) => dispatched.push(action),
				getState: () => ({ auth: { token: mockToken } }),
			},
			watchWS,
		);

		setTimeout(() => task.cancel(), 100);
		await task.toPromise();

		expect(initWebsocket).toHaveBeenCalledWith(expect.any(Function));
		expect(dispatched).toContainEqual(setWSMaintenance(true));
	});
});
