import * as types from './index';
import {
	parameterSetModePaiementAction,
	parameterSetModeReglementAction,
	parameterSetCitiesAction,
	parameterSetCategoriesAction,
	parameterSetEmplacementsAction,
	parameterSetUnitesAction,
	parameterSetMarquesAction,
} from './parameterActions';
import {
	CitiesClass,
	CategorieClass,
	EmplacementClass,
	UniteClass,
	MarqueClass,
	ModePaiementClass,
	ModeReglementClass,
} from '@/models/classes';

describe('parameterActions', () => {
	it('parameterSetCitiesAction should create an action with type PARAMETER_SET_CITIES and array data', () => {
		const city1 = new CitiesClass(1, 'Paris');
		const city2 = new CitiesClass(2, 'London');
		const props = [city1, city2];

		const action = parameterSetCitiesAction(props);

		expect(action.type).toBe(types.PARAMETER_SET_CITIES);
		expect(action.data).toEqual([city1, city2]);
	});

	it('parameterSetCategoriesAction should create an action with type PARAMETER_SET_CATEGORIES and array data', () => {
		const cat1 = new CategorieClass(1, 'Electronics');
		const cat2 = new CategorieClass(2, 'Furniture');
		const props = [cat1, cat2];

		const action = parameterSetCategoriesAction(props);

		expect(action.type).toBe(types.PARAMETER_SET_CATEGORIES);
		expect(action.data).toEqual([cat1, cat2]);
	});

	it('parameterSetEmplacementsAction should create an action with type PARAMETER_SET_EMPLACEMENTS and array data', () => {
		const emp1 = new EmplacementClass(1, 'Warehouse A');
		const emp2 = new EmplacementClass(2, 'Warehouse B');
		const props = [emp1, emp2];

		const action = parameterSetEmplacementsAction(props);

		expect(action.type).toBe(types.PARAMETER_SET_EMPLACEMENTS);
		expect(action.data).toEqual([emp1, emp2]);
	});

	it('parameterSetUnitesAction should create an action with type PARAMETER_SET_UNITES and array data', () => {
		const u1 = new UniteClass(1, 'Kg');
		const u2 = new UniteClass(2, 'Litre');
		const props = [u1, u2];

		const action = parameterSetUnitesAction(props);

		expect(action.type).toBe(types.PARAMETER_SET_UNITES);
		expect(action.data).toEqual([u1, u2]);
	});

	it('parameterSetMarquesAction should create an action with type PARAMETER_SET_MARQUES and array data', () => {
		const m1 = new MarqueClass(1, 'Brand A');
		const m2 = new MarqueClass(2, 'Brand B');
		const props = [m1, m2];

		const action = parameterSetMarquesAction(props);

		expect(action.type).toBe(types.PARAMETER_SET_MARQUES);
		expect(action.data).toEqual([m1, m2]);
	});

	it('should handle empty array input for cities', () => {
		const action = parameterSetCitiesAction([]);
		expect(action.type).toBe(types.PARAMETER_SET_CITIES);
		expect(action.data).toEqual([]);
	});

	it('parameterSetModePaiementAction should create an action with type PARAMETER_SET_MODE_PAIEMENT and array data', () => {
		const mp1 = new ModePaiementClass(1, 'Cash');
		const mp2 = new ModePaiementClass(2, 'Card');
		const props = [mp1, mp2];

		const action = parameterSetModePaiementAction(props);

		expect(action.type).toBe(types.PARAMETER_SET_MODE_PAIEMENT);
		expect(action.data).toEqual([mp1, mp2]);
	});

	it('parameterSetModeRegelementAction should create an action with type PARAMETER_SET_MODE_REGELEMENT and array data', () => {
		const mr1 = new ModeReglementClass(1, 'Immediate');
		const mr2 = new ModeReglementClass(2, 'Deferred');
		const props = [mr1, mr2];

		const action = parameterSetModeReglementAction(props);

		expect(action.type).toBe(types.PARAMETER_SET_MODE_REGLEMENT);
		expect(action.data).toEqual([mr1, mr2]);
	});
});
