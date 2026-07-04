import { all, call, fork, spawn } from 'redux-saga/effects';
import { watchInit } from '@/store/sagas/_initSaga';
import { watchWS } from '@/store/sagas/wsSaga';
import { watchAccount } from '@/store/sagas/accountSaga';
import { watchCompanies } from '@/store/sagas/companiesSaga';

const sagas = [watchInit, watchAccount, watchCompanies];

export const formatSagaError = (error: unknown): string => {
	if (error instanceof Error) {
		return error.stack || error.message;
	}

	if (typeof error === 'object' && error !== null) {
		try {
			return JSON.stringify(error);
		} catch {
			return String(error);
		}
	}

	return String(error);
};

// spawn : whenever a watcher get crashed somehow,
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
						throw new Error(`Saga error in ${saga.name || 'anonymous'}: ${formatSagaError(e)}`);
					}
				}
			}),
		),
		fork(watchWS),
	]);
}
