import { formatSagaError, rootSaga } from './index';
import { watchWS } from '@/store/sagas/wsSaga';
import { AllEffect, ForkEffect } from 'redux-saga/effects';

describe('rootSaga', () => {
	it('should spawn watchInit, watchAccount, watchCompanies with retry logic, and fork watchWS', () => {
		const generator = rootSaga();
		const effect = generator.next().value as AllEffect<ForkEffect>;

		expect(effect).toMatchObject({
			'@@redux-saga/IO': true,
			combinator: true,
			type: 'ALL',
			payload: expect.arrayContaining([
				// Spawned sagas with retry logic (detached)
				expect.objectContaining({
					type: 'FORK',
					payload: expect.objectContaining({
						detached: true,
					}),
				}),
				expect.objectContaining({
					type: 'FORK',
					payload: expect.objectContaining({
						detached: true,
					}),
				}),
				// Forked watchWS saga
				expect.objectContaining({
					type: 'FORK',
					payload: expect.objectContaining({
						fn: watchWS,
					}),
				}),
			]),
		});
		// 4 sagas currently:
		// watchInit, watchAccount, watchCompanies, watchWS
		expect(effect.payload).toHaveLength(4);
	});

	it('should preserve useful details when formatting object saga errors', () => {
		expect(
			formatSagaError({
				error: {
					status_code: 429,
					message: 'Trop de requêtes',
				},
			}),
		).toBe('{"error":{"status_code":429,"message":"Trop de requêtes"}}');
	});
});
