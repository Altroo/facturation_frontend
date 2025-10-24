import createSagaMiddleware, {Task} from 'redux-saga';
import {combineReducers, configureStore, Store} from "@reduxjs/toolkit";
import {rootSaga} from './sagas';
import _initReducer from './slices/_init/_initSlice';

const SagaMiddleware = createSagaMiddleware({});

const combinedReducers = combineReducers({
  _init: _initReducer,
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
    }).prepend(SagaMiddleware),
  devTools: process.env.NODE_ENV !== 'production',
});

store.sagaTask = SagaMiddleware.run(rootSaga);

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof combinedReducers>;
