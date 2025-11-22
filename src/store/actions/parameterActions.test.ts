import * as types from './index';
import { parameterSetCitiesAction } from './parameterActions';
import { CitiesClass } from '@/models/Classes';

describe('parameterSetCitiesAction', () => {
	it('should create an action with type PARAMETER_SET_CITIES and spread data', () => {
		// Arrange: create mock cities
		const city1 = new CitiesClass(1, 'Paris');
		const city2 = new CitiesClass(2, 'London');
		const props = [city1, city2];

		// Act: call the action creator
		const action = parameterSetCitiesAction(props);

		// Assert: check type and data
		expect(action.type).toBe(types.PARAMETER_SET_CITIES);

		// Because you’re spreading an array into an object, keys will be indices
		expect(action.data).toEqual({
			0: city1,
			1: city2,
		});
	});

	it('should handle empty array input', () => {
		const action = parameterSetCitiesAction([]);
		expect(action.type).toBe(types.PARAMETER_SET_CITIES);
		expect(action.data).toEqual({});
	});
});
