import createSagaMiddleware, { type Task } from 'redux-saga';
import { combineReducers, configureStore, ThunkDispatch } from '@reduxjs/toolkit';
import type { Store, Action } from '@reduxjs/toolkit';
import { rootSaga } from '@/store/sagas';
import _initReducer from '@/store/slices/_initSlice';
import accountReducer from '@/store/slices/accountSlice';
import companiesReducer from '@/store/slices/companiesSlice';
import wsReducer from '@/store/slices/wsSlice';
import { accountApi, profilApi, groupApi, usersApi } from '@/store/services/account';
import { companyApi } from '@/store/services/company';
import { clientApi } from '@/store/services/client';
import {
	citiesApi,
	emplacementApi,
	categorieApi,
	marqueApi,
	uniteApi,
	modePaiementApi,
	livreParApi,
} from '@/store/services/parameter';
import { articleApi } from '@/store/services/article';
import { deviApi } from '@/store/services/devi';
import { factureProFormaApi } from '@/store/services/factureProForma';
import { factureClientApi } from '@/store/services/factureClient';
import { bonDeLivraisonApi } from '@/store/services/bonDeLivraison';
import { reglementApi } from '@/store/services/reglement';
import { dashboardApi } from '@/store/services/dashboard';

const rootReducer = combineReducers({
	_init: _initReducer,
	account: accountReducer,
	companies: companiesReducer,
	ws: wsReducer,
	[accountApi.reducerPath]: accountApi.reducer,
	[profilApi.reducerPath]: profilApi.reducer,
	[groupApi.reducerPath]: groupApi.reducer,
	[usersApi.reducerPath]: usersApi.reducer,
	[companyApi.reducerPath]: companyApi.reducer,
	[clientApi.reducerPath]: clientApi.reducer,
	[articleApi.reducerPath]: articleApi.reducer,
	[citiesApi.reducerPath]: citiesApi.reducer,
	[emplacementApi.reducerPath]: emplacementApi.reducer,
	[categorieApi.reducerPath]: categorieApi.reducer,
	[marqueApi.reducerPath]: marqueApi.reducer,
	[uniteApi.reducerPath]: uniteApi.reducer,
	[modePaiementApi.reducerPath]: modePaiementApi.reducer,
	[livreParApi.reducerPath]: livreParApi.reducer,
	[deviApi.reducerPath]: deviApi.reducer,
	[factureProFormaApi.reducerPath]: factureProFormaApi.reducer,
	[factureClientApi.reducerPath]: factureClientApi.reducer,
	[bonDeLivraisonApi.reducerPath]: bonDeLivraisonApi.reducer,
	[reglementApi.reducerPath]: reglementApi.reducer,
	[dashboardApi.reducerPath]: dashboardApi.reducer,
});

export interface SagaStore extends Store {
	sagaTask?: Task;
}

// If you need a wrapper reducer (e.g. for reset-on-logout):
const reducers = (state: ReturnType<typeof rootReducer> | undefined, action: Action) => {
	return rootReducer(state, action);
};

export const makeStore = (): SagaStore => {
	const sagaMw = createSagaMiddleware();
	const s = configureStore({
		reducer: reducers,
		middleware: (getDefaultMiddleware) =>
			getDefaultMiddleware({
				serializableCheck: {
					// RTK Query uses some non-serializable values in its internal actions
					ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
					// Ignore RTK Query cache metadata paths
					ignoredPaths: [
						'meta.arg',
						'meta.baseQueryMeta',
						'payload.timestamp',
					],
				},
				thunk: true,
			})
				.prepend(sagaMw)
				.concat(
					accountApi.middleware,
					profilApi.middleware,
					groupApi.middleware,
					companyApi.middleware,
					usersApi.middleware,
					clientApi.middleware,
					articleApi.middleware,
					citiesApi.middleware,
					emplacementApi.middleware,
					categorieApi.middleware,
					marqueApi.middleware,
					uniteApi.middleware,
					modePaiementApi.middleware,
					livreParApi.middleware,
					deviApi.middleware,
					factureProFormaApi.middleware,
					factureClientApi.middleware,
					bonDeLivraisonApi.middleware,
					reglementApi.middleware,
					dashboardApi.middleware,
				),
		devTools: process.env.NODE_ENV !== 'production',
	}) as SagaStore;
	s.sagaTask = sagaMw.run(rootSaga);
	return s;
};

// Default singleton for non-SSR usage and tests
export const store: SagaStore = makeStore();

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch & ThunkDispatch<RootState, unknown, Action>;
