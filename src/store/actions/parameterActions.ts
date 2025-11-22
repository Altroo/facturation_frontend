import * as types from './index';
import { CitiesClass } from '@/models/Classes';

export const parameterSetCitiesAction = (props: Array<CitiesClass>) => {
	return {
		type: types.PARAMETER_SET_CITIES,
		data: { ...props },
	};
};
