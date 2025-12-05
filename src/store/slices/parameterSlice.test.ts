import reducer, {
	setCities,
	setCategories,
	setEmplacements,
	setUnites,
	setMarques,
	setModePaiement,
	setModeReglement,
} from '@/store/slices/parameterSlice';
import {
	CitiesClass,
	CategorieClass,
	EmplacementClass,
	UniteClass,
	MarqueClass,
	ModePaiementClass,
	ModeReglementClass,
} from '@/models/Classes';

describe('parameterSlice', () => {
	const initialState = {
		cities: [],
		categories: [],
		emplacements: [],
		unites: [],
		marques: [],
		modeReglement: [],
		modePaiement: [],
	};

	it('should return the initial state', () => {
		expect(reducer(undefined, { type: 'unknown' })).toEqual(initialState);
	});

	it('should handle setCities', () => {
		const city1 = new CitiesClass(1, 'Tanger');
		const city2 = new CitiesClass(2, 'Tetouan');

		const newState = reducer(initialState, setCities([city1, city2]));

		expect(newState.cities).toEqual([city1, city2]);
	});

	it('should handle setCategories', () => {
		const cat1 = new CategorieClass(1, 'Electronics');
		const cat2 = new CategorieClass(2, 'Furniture');

		const newState = reducer(initialState, setCategories([cat1, cat2]));

		expect(newState.categories).toEqual([cat1, cat2]);
	});

	it('should handle setEmplacements', () => {
		const emp1 = new EmplacementClass(1, 'Warehouse A');
		const emp2 = new EmplacementClass(2, 'Warehouse B');

		const newState = reducer(initialState, setEmplacements([emp1, emp2]));

		expect(newState.emplacements).toEqual([emp1, emp2]);
	});

	it('should handle setUnites', () => {
		const u1 = new UniteClass(1, 'Kg');
		const u2 = new UniteClass(2, 'Litre');

		const newState = reducer(initialState, setUnites([u1, u2]));

		expect(newState.unites).toEqual([u1, u2]);
	});

	it('should handle setMarques', () => {
		const m1 = new MarqueClass(1, 'Brand A');
		const m2 = new MarqueClass(2, 'Brand B');

		const newState = reducer(initialState, setMarques([m1, m2]));

		expect(newState.marques).toEqual([m1, m2]);
	});

	it('should handle setModePaiement', () => {
		const mp1 = new ModePaiementClass(1, 'Cash');
		const mp2 = new ModePaiementClass(2, 'Card');

		const newState = reducer(initialState, setModePaiement([mp1, mp2]));

		expect(newState.modePaiement).toEqual([mp1, mp2]);
	});

	it('should handle setModeRegelement', () => {
		const mr1 = new ModeReglementClass(1, 'Immediate');
		const mr2 = new ModeReglementClass(2, 'Deferred');

		const newState = reducer(initialState, setModeReglement([mr1, mr2]));

		expect(newState.modeReglement).toEqual([mr1, mr2]);
	});
});
