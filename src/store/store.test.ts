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
jest.mock('@/store/slices/parameterSlice', () => ({
	__esModule: true,
	default: (state = { parameter: true }) => state,
}));
jest.mock('@/store/slices/companiesSlice', () => ({
	__esModule: true,
	default: (state = { companies: true }) => state,
}));

function makeApiMock(name: string) {
	const dummyMiddleware: Middleware = () => (next) => (action) => next(action);
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
jest.mock('@/store/services/article', () => ({
	__esModule: true,
	articleApi: makeApiMock('articleApi'),
}));
jest.mock('@/store/services/parameter', () => ({
	__esModule: true,
	citiesApi: makeApiMock('citiesApi'),
	emplacementApi: makeApiMock('emplacementApi'),
	categorieApi: makeApiMock('categorieApi'),
	marqueApi: makeApiMock('marqueApi'),
	uniteApi: makeApiMock('uniteApi'),
	modeReglementApi: makeApiMock('modeReglementApi'),
	modePaiementApi: makeApiMock('modePaiementApi'),
}));
jest.mock('@/store/services/devi', () => ({
	__esModule: true,
	deviApi: makeApiMock('deviApi'),
}));
jest.mock('@/store/services/factureProForma', () => ({
	__esModule: true,
	factureProFormaApi: makeApiMock('factureProFormaApi'),
}));
// Added mock for factureClient service
jest.mock('@/store/services/factureClient', () => ({
	__esModule: true,
	factureClientApi: makeApiMock('factureClientApi'),
}));

// --- Mock rootSaga only (use a lightweight generator) ---
jest.mock('@/store/sagas', () => ({
	__esModule: true,
	rootSaga: function* rootSaga() {
		// Infinite loop to keep the task running
		while (true) {
			yield 'MOCK_ROOT_TICK';
		}
	},
}));

// --- Import fresh store per test so mocks apply ---
let store: SagaStore;

beforeEach(() => {
	jest.resetModules();
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	store = require('./store').store as SagaStore;
});

describe('Redux Saga Store', () => {
	it('creates store with expected reducers', () => {
		const state: RootState = store.getState();
		expect(state).toHaveProperty('_init');
		expect(state).toHaveProperty('account');
		expect(state).toHaveProperty('parameter');
		expect(state).toHaveProperty('companies');
		expect(state).toHaveProperty('accountApi');
		expect(state).toHaveProperty('profilApi');
		expect(state).toHaveProperty('groupApi');
		expect(state).toHaveProperty('usersApi');
		expect(state).toHaveProperty('companyApi');
		expect(state).toHaveProperty('clientApi');
		expect(state).toHaveProperty('articleApi');
		expect(state).toHaveProperty('citiesApi');
		expect(state).toHaveProperty('emplacementApi');
		expect(state).toHaveProperty('categorieApi');
		expect(state).toHaveProperty('marqueApi');
		expect(state).toHaveProperty('uniteApi');
		expect(state).toHaveProperty('modeReglementApi');
		expect(state).toHaveProperty('modePaiementApi');
		expect(state).toHaveProperty('deviApi');
		expect(state).toHaveProperty('factureProFormaApi');
		expect(state).toHaveProperty('factureClientApi');
	});

	it('attaches sagaTask after running rootSaga', () => {
		expect(store.sagaTask).toBeDefined();
		expect(typeof store.sagaTask?.isRunning).toBe('function');
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

	it('dispatches plain actions correctly', () => {
		const action = { type: 'PLAIN_ACTION' };
		const result = store.dispatch(action);
		expect(result).toEqual(action);
	});
});
