import type { SagaPayloadType } from '@/types/_initTypes';
import { CategorieClass, CitiesClass, EmplacementClass, MarqueClass, UniteClass } from '@/models/Classes';

//!- Parameter State
export interface ParameterStateInterface {
	cities: Array<CitiesClass>;
	categories: Array<CategorieClass>;
	emplacements: Array<EmplacementClass>;
	unites: Array<UniteClass>;
	marques: Array<MarqueClass>;
}

export type setCitiesPayloadType = SagaPayloadType<Array<CitiesClass>>;
export type setCategoriesPayloadType = SagaPayloadType<Array<CategorieClass>>;
export type setEmplacementsPayloadType = SagaPayloadType<Array<EmplacementClass>>;
export type setUnitesPayloadType = SagaPayloadType<Array<UniteClass>>;
export type setMarquesPayloadType = SagaPayloadType<Array<MarqueClass>>;
