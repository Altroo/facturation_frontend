import createSagaMiddleware, {Task} from 'redux-saga';
import {combineReducers, configureStore, Store} from "@reduxjs/toolkit";
import {rootSaga} from './sagas';
import _initReducer from './slices/_init/_initSlice';
import accountReducer from './slices/account/accountSlice';
import { accountApi } from './services/account/account';

const SagaMiddleware = createSagaMiddleware({});

const combinedReducers = combineReducers({
  _init: _initReducer,
  account: accountReducer,
  [accountApi.reducerPath]: accountApi.reducer,
});

export interface SagaStore extends Store {
  sagaTask?: Task;
}


const reducers: typeof combinedReducers = (state, action) => {
  return combinedReducers(state, action);
};

export const store: SagaStore = configureStore({
  reducer: reducers,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      thunk: true,
    })
      .concat(accountApi.middleware)
      .prepend(SagaMiddleware),
  devTools: process.env.NODE_ENV !== 'production',
});

store.sagaTask = SagaMiddleware.run(rootSaga);

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof combinedReducers>;
