import { put, takeLatest } from 'redux-saga/effects';
import * as Types from '../actions';
import type { InitStateInterface, InitStateToken } from '@/types/_initTypes';
import { setInitState } from '../slices/_initSlice';
import { Session } from 'next-auth';

export function* initAppSessionTokensSaga(payload: { type: string; session: Session }) {
	const stateToken = {
		user: payload.session.user,
		access: payload.session.accessToken,
		refresh: payload.session.refreshToken,
		access_expiration: payload.session.accessTokenExpiration,
		refresh_expiration: payload.session.refreshTokenExpiration,
	};
	const appToken = {
		initStateToken: stateToken as InitStateToken,
	};
	yield put(setInitState(appToken));
}

export function* refreshAppTokenStatesSaga(payload: { type: string; session: Record<string, unknown> }) {
	const accessToken: string = payload.session['accessToken'] as string;
	const refreshToken: string = payload.session['refreshToken'] as string;
	const accessTokenExpiration = payload.session['accessTokenExpiration'] as string;
	const refreshTokenExpiration = payload.session['refreshTokenExpiration'] as string;
	const userObj: {
		pk: number;
		email: string;
		first_name: string;
		last_name: string;
	} = payload.session['user'] as {
		pk: number;
		email: string;
		first_name: string;
		last_name: string;
	};
	const appToken: InitStateInterface<InitStateToken> = {
		initStateToken: {
			access: accessToken,
			refresh: refreshToken,
			user: {
				pk: userObj.pk as number,
				email: userObj.email as string,
				first_name: userObj.first_name as string,
				last_name: userObj.last_name as string,
			},
			refresh_expiration: accessTokenExpiration,
			access_expiration: refreshTokenExpiration,
		},
	};
	if (appToken) {
		yield put(setInitState(appToken));
	}
}

export function* watchInit() {
	yield takeLatest(Types.INIT_APP_SESSION_TOKENS, initAppSessionTokensSaga);
	yield takeLatest(Types.REFRESH_APP_TOKEN_STATES, refreshAppTokenStatesSaga);
}
