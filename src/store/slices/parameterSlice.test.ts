import reducer, { setCities } from '@/store/slices/parameterSlice';
import { CitiesClass } from '@/models/Classes';

describe('parameterSlice', () => {
	it('should return the initial state', () => {
		const initialState = { cities: [] };
		expect(reducer(undefined, { type: 'unknown' })).toEqual(initialState);
	});

	it('should handle setCities', () => {
		const city1 = new CitiesClass(1, 'Tanger');
		const city2 = new CitiesClass(2, 'Tetouan');
		const previousState = { cities: [] };

		const newState = reducer(previousState, setCities([city1, city2]));

		expect(newState.cities).toEqual([city1, city2]);
	});
});
