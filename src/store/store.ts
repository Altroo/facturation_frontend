import createSagaMiddleware, { Task } from 'redux-saga';
import { combineReducers, configureStore, Store, Action, ThunkDispatch } from '@reduxjs/toolkit';
import { rootSaga } from '@/store/sagas';
import _initReducer from '@/store/slices/_initSlice';
import accountReducer from '@/store/slices/accountSlice';
import parameterReducer from '@/store/slices/parameterSlice';
import companiesReducer from '@/store/slices/companiesSlice';
import { accountApi, profilApi, groupApi, usersApi } from '@/store/services/account';
import { companyApi } from '@/store/services/company';
import { clientApi } from '@/store/services/client';
import { citiesApi } from '@/store/services/parameter';

const sagaMiddleware = createSagaMiddleware();

const rootReducer = combineReducers({
	_init: _initReducer,
	account: accountReducer,
	parameter: parameterReducer,
	companies: companiesReducer,
	[accountApi.reducerPath]: accountApi.reducer,
	[profilApi.reducerPath]: profilApi.reducer,
	[groupApi.reducerPath]: groupApi.reducer,
	[usersApi.reducerPath]: usersApi.reducer,
	[companyApi.reducerPath]: companyApi.reducer,
	[clientApi.reducerPath]: clientApi.reducer,
	[citiesApi.reducerPath]: citiesApi.reducer,
});

export interface SagaStore extends Store {
	sagaTask?: Task;
}

// If you need a wrapper reducer (e.g. for reset-on-logout):
const reducers = (state: ReturnType<typeof rootReducer> | undefined, action: Action) => {
	return rootReducer(state, action);
};

export const store: SagaStore = configureStore({
	reducer: reducers,
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: false,
			thunk: true,
		})
			.concat(accountApi.middleware)
			.concat(profilApi.middleware)
			.concat(groupApi.middleware)
			.concat(companyApi.middleware)
			.concat(usersApi.middleware)
			.concat(clientApi.middleware)
			.concat(citiesApi.middleware)
			.prepend(sagaMiddleware),
	devTools: process.env.NODE_ENV !== 'production',
});

store.sagaTask = sagaMiddleware.run(rootSaga);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch & ThunkDispatch<RootState, unknown, Action>;
