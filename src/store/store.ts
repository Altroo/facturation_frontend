import createSagaMiddleware, { Task } from "redux-saga";
import { combineReducers, configureStore, Store, Action, ThunkDispatch } from "@reduxjs/toolkit";
import { rootSaga } from "@/store/sagas";
import _initReducer from "@/store/slices/_init/_initSlice";
import accountReducer from "@/store/slices/account/accountSlice";
import { accountApi, profilApi } from "@/store/services/account/account";

const sagaMiddleware = createSagaMiddleware();

const rootReducer = combineReducers({
  _init: _initReducer,
  account: accountReducer,
  [accountApi.reducerPath]: accountApi.reducer,
  [profilApi.reducerPath]: profilApi.reducer,
});

export interface SagaStore extends Store {
  sagaTask?: Task;
}

// If you need a wrapper reducer (e.g. for reset-on-logout):
const reducers = (state: ReturnType<typeof rootReducer> |
  undefined, action: Action) => {
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
      .prepend(sagaMiddleware),
  devTools: process.env.NODE_ENV !== "production",
});

store.sagaTask = sagaMiddleware.run(rootSaga);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch & ThunkDispatch<RootState, unknown, Action>;
