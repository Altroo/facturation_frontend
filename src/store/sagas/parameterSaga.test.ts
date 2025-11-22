import { runSaga } from 'redux-saga';
import { takeLatest } from 'redux-saga/effects';
import * as Types from '@/store/actions';
import { parameterSetCitiesSaga, watchParameter } from '@/store/sagas/parameterSaga';
import { setCities } from '@/store/slices/parameterSlice';
import { CitiesClass } from '@/models/Classes';

describe('parameter sagas', () => {
	it('parameterSetCitiesSaga should dispatch setCities with correct payload', async () => {
		const city1 = new CitiesClass(1, 'Tanger');
		const city2 = new CitiesClass(2, 'Tetouan');

		const payload = {
			type: Types.PARAMETER_SET_CITIES,
			data: [city1, city2],
		};

		const dispatched: unknown[] = [];
		await runSaga(
			{ dispatch: (action: unknown) => dispatched.push(action) },
			parameterSetCitiesSaga,
			payload,
		).toPromise();

		expect(dispatched).toEqual([setCities([city1, city2])]);
	});

	it('watchParameter should register saga with takeLatest', () => {
		const gen = watchParameter();
		expect(gen.next().value).toEqual(takeLatest(Types.PARAMETER_SET_CITIES, parameterSetCitiesSaga));
	});
});
