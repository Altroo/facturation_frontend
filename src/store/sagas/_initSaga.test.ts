import { runSaga } from 'redux-saga';
import * as Types from '../actions';
import { initAppSessionTokensSaga, refreshAppTokenStatesSaga, watchInit } from './_initSaga';
import { setInitState } from '../slices/_initSlice';
import type { Session } from 'next-auth';
import type { InitStateInterface, InitStateToken } from '@/types/_initTypes';
import { takeLatest } from 'redux-saga/effects';

describe('init sagas', () => {
	it('initAppSessionTokensSaga should dispatch setInitState with correct payload', async () => {
		const mockSession: Session = {
			user: {
				pk: 1,
				email: 'test@example.com',
				first_name: 'John',
				last_name: 'Doe',
				id: '',
				emailVerified: null,
				name: '',
			},
			accessToken: 'access-token',
			refreshToken: 'refresh-token',
			accessTokenExpiration: '2025-01-01',
			refreshTokenExpiration: '2025-01-02',
			expires: '2025-01-03',
		};

		const dispatched: unknown[] = [];
		await runSaga(
			{
				dispatch: (action: unknown) => dispatched.push(action),
			},
			initAppSessionTokensSaga,
			{ type: Types.INIT_APP_SESSION_TOKENS, session: mockSession },
		).toPromise();

		const expectedToken: InitStateToken = {
			user: mockSession.user,
			access: mockSession.accessToken,
			refresh: mockSession.refreshToken,
			access_expiration: mockSession.accessTokenExpiration,
			refresh_expiration: mockSession.refreshTokenExpiration,
		};

		const expectedAppToken: InitStateInterface<InitStateToken> = {
			initStateToken: expectedToken,
		};

		expect(dispatched).toEqual([setInitState(expectedAppToken)]);
	});

	it('refreshAppTokenStatesSaga should dispatch setInitState with correct payload', async () => {
		const mockPayload = {
			type: Types.REFRESH_APP_TOKEN_STATES,
			session: {
				accessToken: 'new-access-token',
				refreshToken: 'new-refresh-token',
				accessTokenExpiration: '2025-02-01',
				refreshTokenExpiration: '2025-02-02',
				user: {
					pk: 2,
					email: 'jane@example.com',
					first_name: 'Jane',
					last_name: 'Smith',
				},
			},
		};

		const dispatched: unknown[] = [];
		await runSaga(
			{
				dispatch: (action: unknown) => dispatched.push(action),
			},
			refreshAppTokenStatesSaga,
			mockPayload,
		).toPromise();

		const expectedAppToken: InitStateInterface<InitStateToken> = {
			initStateToken: {
				access: 'new-access-token',
				refresh: 'new-refresh-token',
				user: {
					pk: 2,
					email: 'jane@example.com',
					first_name: 'Jane',
					last_name: 'Smith',
				},
				refresh_expiration: '2025-02-01',
				access_expiration: '2025-02-02',
			},
		};

		expect(dispatched).toEqual([setInitState(expectedAppToken)]);
	});

	it('watchInit should register sagas with takeLatest', () => {
		const gen = watchInit();
		expect(gen.next().value).toEqual(takeLatest(Types.INIT_APP_SESSION_TOKENS, initAppSessionTokensSaga));
		expect(gen.next().value).toEqual(takeLatest(Types.REFRESH_APP_TOKEN_STATES, refreshAppTokenStatesSaga));
	});
});
