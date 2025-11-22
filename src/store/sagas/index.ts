import { all, spawn, call, fork } from 'redux-saga/effects';
import { watchInit } from '@/store/sagas/_initSaga';
import { watchWS } from '@/store/sagas/wsSaga';
import { watchAccount } from '@/store/sagas/accountSaga';
import { watchParameter } from '@/store/sagas/parameterSaga';

const sagas = [watchInit, watchAccount, watchParameter];

// spawn : whenever a watcher get's crashed somehow,
// we use spawn to respawn it back. (except it's unblocking)
// fork : for blocking calls.
export function* rootSaga() {
	yield all([
		...sagas.map((saga) =>
			spawn(function* () {
				while (true) {
					try {
						yield call(saga);
					} catch (e) {
						throw new Error('Saga error : ' + e);
					}
				}
			}),
		),
		fork(watchWS),
	]);
}
