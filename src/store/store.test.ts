import { jest } from '@jest/globals';
import type { Middleware } from '@reduxjs/toolkit';
import type { SagaStore, RootState, AppDispatch } from './store';

// --- Mocks for reducers and RTK Query services ---

jest.mock('@/store/slices/_initSlice', () => ({
	__esModule: true,
	default: (state = { init: true }) => state,
}));
jest.mock('@/store/slices/accountSlice', () => ({
	__esModule: true,
	default: (state = { account: true }) => state,
}));

function makeApiMock(name: string) {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const dummyMiddleware: Middleware = (_storeAPI) => (next) => (action) => next(action);
	return {
		reducerPath: name,
		reducer: (state = {}) => state,
		middleware: dummyMiddleware,
	};
}
jest.mock('@/store/services/account', () => ({
	__esModule: true,
	accountApi: makeApiMock('accountApi'),
	profilApi: makeApiMock('profilApi'),
	groupApi: makeApiMock('groupApi'),
	usersApi: makeApiMock('usersApi'),
}));
jest.mock('@/store/services/company', () => ({
	__esModule: true,
	companyApi: makeApiMock('companyApi'),
}));

jest.mock('@/store/services/client', () => ({
	__esModule: true,
	clientApi: makeApiMock('clientApi'),
}));

// --- Mock rootSaga only (use a lightweight generator) ---
jest.mock('@/store/sagas', () => ({
	__esModule: true,
	// minimal generator that yields nothing important
	rootSaga: function* rootSaga() {
		// yield nothing heavy; single synchronous yield so middleware.run returns a Task
		// If your real rootSaga forks or blocks, mocking it prevents heavy side effects
		// Keep yields simple so run() still returns a Task object created by real middleware
		yield 'MOCK_ROOT';
	},
}));

// --- Import fresh store per test so mocks apply ---
let store: SagaStore;

beforeEach(() => {
	jest.resetModules();
	// require the store fresh so jest.mock above takes effect
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	store = require('./store').store as SagaStore; // adjust path to your actual store
});

describe('Redux Saga Store', () => {
	it('creates store with expected reducers', () => {
		const state: RootState = store.getState();
		expect(state).toHaveProperty('_init');
		expect(state).toHaveProperty('account');
		expect(state).toHaveProperty('accountApi');
		expect(state).toHaveProperty('profilApi');
		expect(state).toHaveProperty('groupApi');
		expect(state).toHaveProperty('usersApi');
		expect(state).toHaveProperty('companyApi');
		expect(state).toHaveProperty('clientApi');
	});

	it('attaches sagaTask after running rootSaga', () => {
		// The real saga middleware sets sagaTask when run is invoked in your store file.
		// Because we used the real middleware and mocked the rootSaga to be lightweight,
		// sagaTask should be a real Task provided by redux-saga and therefore defined.
		expect(store.sagaTask).toBeDefined();
		// Task provides isRunning(); TypeScript knows the real Task shape from redux-saga types.
		expect(store.sagaTask?.isRunning()).toBeDefined();
	});

	it('dispatch works with thunk actions', async () => {
		const thunkAction = (): ((dispatch: AppDispatch) => Promise<void>) => {
			return async (dispatch) => {
				dispatch({ type: 'TEST_ACTION' });
			};
		};

		const dispatch: AppDispatch = store.dispatch;
		await dispatch(thunkAction());
		const result = dispatch({ type: 'CHECK' });
		expect(result).toEqual({ type: 'CHECK' });
	});
});
