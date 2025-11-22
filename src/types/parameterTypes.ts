import type { SagaPayloadType } from '@/types/_initTypes';
import { CitiesClass } from '@/models/Classes';

//!- Parameter State
export interface ParameterStateInterface {
	cities: Array<CitiesClass>;
}

export type setCitiesPayloadType = SagaPayloadType<Array<CitiesClass>>;
