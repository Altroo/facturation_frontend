import {all, spawn, call, fork} from 'redux-saga/effects';
import {watchInit} from './_init/_initSaga';
import {watchWS} from './ws/wsSaga';
import { watchAccount } from './account/accountSaga';

const sagas = [
  watchInit,
  watchAccount
];

// spawn : whenever a watcher get's crashed somehow,
// we use spawn to respawn it back. (except it's unblocking)
// fork : for blocking calls.
export function* rootSaga() {
  yield all([...sagas.map(saga =>
      spawn(function* () {
        while (true) {
          try {
            yield call(saga);
          } catch (e) {
            throw new Error('Saga error : ' + e);
          }
        }
      })
    ),
      fork(watchWS),
    ]
  );
}