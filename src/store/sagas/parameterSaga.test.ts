import { runSaga } from 'redux-saga';
import * as Types from '@/store/actions';
import {
	parameterSetCitiesSaga,
	parameterSetCategoriesSaga,
	parameterSetEmplacementsSaga,
	parameterSetUnitesSaga,
	parameterSetMarquesSaga,
	parameterSetModePaiementSaga,
	parameterSetLivreParSaga,
	watchParameter,
} from '@/store/sagas/parameterSaga';
import {
	setCities,
	setCategories,
	setEmplacements,
	setUnites,
	setMarques,
	setModePaiement,
	setLivrePar,
} from '@/store/slices/parameterSlice';
import {
	CitiesClass,
	CategorieClass,
	EmplacementClass,
	UniteClass,
	MarqueClass,
	ModePaiementClass,
	LivreParClass,
} from '@/models/classes';
import { takeLatest } from 'redux-saga/effects';

describe('parameter sagas', () => {
	it('parameterSetCitiesSaga should dispatch setCities with correct payload', async () => {
		const city1 = new CitiesClass(1, 'Tanger');
		const city2 = new CitiesClass(2, 'Tetouan');

		const payload = { type: Types.PARAMETER_SET_CITIES, data: [city1, city2] };

		const dispatched: unknown[] = [];
		await runSaga(
			{ dispatch: (action: unknown) => dispatched.push(action) },
			parameterSetCitiesSaga,
			payload,
		).toPromise();

		expect(dispatched).toEqual([setCities([city1, city2])]);
	});

	it('parameterSetCategoriesSaga should dispatch setCategories with correct payload', async () => {
		const cat1 = new CategorieClass(1, 'Electronics');
		const cat2 = new CategorieClass(2, 'Furniture');

		const payload = { type: Types.PARAMETER_SET_CATEGORIES, data: [cat1, cat2] };

		const dispatched: unknown[] = [];
		await runSaga(
			{ dispatch: (action: unknown) => dispatched.push(action) },
			parameterSetCategoriesSaga,
			payload,
		).toPromise();

		expect(dispatched).toEqual([setCategories([cat1, cat2])]);
	});

	it('parameterSetEmplacementsSaga should dispatch setEmplacements with correct payload', async () => {
		const emp1 = new EmplacementClass(1, 'Warehouse A');
		const emp2 = new EmplacementClass(2, 'Warehouse B');

		const payload = { type: Types.PARAMETER_SET_EMPLACEMENTS, data: [emp1, emp2] };

		const dispatched: unknown[] = [];
		await runSaga(
			{ dispatch: (action: unknown) => dispatched.push(action) },
			parameterSetEmplacementsSaga,
			payload,
		).toPromise();

		expect(dispatched).toEqual([setEmplacements([emp1, emp2])]);
	});

	it('parameterSetUnitesSaga should dispatch setUnites with correct payload', async () => {
		const u1 = new UniteClass(1, 'Kg');
		const u2 = new UniteClass(2, 'Litre');

		const payload = { type: Types.PARAMETER_SET_UNITES, data: [u1, u2] };

		const dispatched: unknown[] = [];
		await runSaga(
			{ dispatch: (action: unknown) => dispatched.push(action) },
			parameterSetUnitesSaga,
			payload,
		).toPromise();

		expect(dispatched).toEqual([setUnites([u1, u2])]);
	});

	it('parameterSetMarquesSaga should dispatch setMarques with correct payload', async () => {
		const m1 = new MarqueClass(1, 'Brand A');
		const m2 = new MarqueClass(2, 'Brand B');

		const payload = { type: Types.PARAMETER_SET_MARQUES, data: [m1, m2] };

		const dispatched: unknown[] = [];
		await runSaga(
			{ dispatch: (action: unknown) => dispatched.push(action) },
			parameterSetMarquesSaga,
			payload,
		).toPromise();

		expect(dispatched).toEqual([setMarques([m1, m2])]);
	});

	it('parameterSetModePaiementSaga should dispatch setModePaiement with correct payload', async () => {
		const mp1 = new ModePaiementClass(1, 'Cash');
		const mp2 = new ModePaiementClass(2, 'Card');

		const payload = { type: Types.PARAMETER_SET_MODE_PAIEMENT, data: [mp1, mp2] };

		const dispatched: unknown[] = [];
		await runSaga(
			{ dispatch: (action: unknown) => dispatched.push(action) },
			parameterSetModePaiementSaga,
			payload,
		).toPromise();

		expect(dispatched).toEqual([setModePaiement([mp1, mp2])]);
	});

	it('parameterSetLivreParSaga should dispatch setLivrePar with correct payload', async () => {
		const lp1 = new LivreParClass(1, 'Driver A');

		const payload = { type: Types.PARAMETER_SET_LIVRE_PAR, data: [lp1] };

		const dispatched: unknown[] = [];
		await runSaga(
			{ dispatch: (action: unknown) => dispatched.push(action) },
			parameterSetLivreParSaga,
			payload,
		).toPromise();

		expect(dispatched).toEqual([setLivrePar([lp1])]);
	});

	it('watchParameter should register all sagas with takeLatest', () => {
		const gen = watchParameter();

		expect(gen.next().value).toEqual(takeLatest(Types.PARAMETER_SET_CITIES, parameterSetCitiesSaga));
		expect(gen.next().value).toEqual(takeLatest(Types.PARAMETER_SET_CATEGORIES, parameterSetCategoriesSaga));
		expect(gen.next().value).toEqual(takeLatest(Types.PARAMETER_SET_EMPLACEMENTS, parameterSetEmplacementsSaga));
		expect(gen.next().value).toEqual(takeLatest(Types.PARAMETER_SET_UNITES, parameterSetUnitesSaga));
		expect(gen.next().value).toEqual(takeLatest(Types.PARAMETER_SET_MARQUES, parameterSetMarquesSaga));
		expect(gen.next().value).toEqual(takeLatest(Types.PARAMETER_SET_MODE_PAIEMENT, parameterSetModePaiementSaga));
		expect(gen.next().value).toEqual(takeLatest(Types.PARAMETER_SET_LIVRE_PAR, parameterSetLivreParSaga));
	});
});
