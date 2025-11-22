import { rootSaga } from './index';
import { watchWS } from '@/store/sagas/wsSaga';
import { AllEffect, ForkEffect } from 'redux-saga/effects';

describe('rootSaga', () => {
	it('should spawn watchInit, watchAccount, watchParameter with retry logic, and fork watchWS', () => {
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
		// 4 sagas currently: watchInit, watchAccount, watchWS, watchParameter
		expect(effect.payload).toHaveLength(4);
	});
});
