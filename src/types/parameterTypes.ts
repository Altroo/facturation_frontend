import type { SagaPayloadType } from '@/types/_initTypes';
import {
	CategorieClass,
	CitiesClass,
	EmplacementClass,
	MarqueClass,
	UniteClass,
	ModePaiementClass,
	LivreParClass,
} from '@/models/classes';

//!- Parameter State
export interface ParameterStateInterface {
	cities: Array<CitiesClass>;
	categories: Array<CategorieClass>;
	emplacements: Array<EmplacementClass>;
	unites: Array<UniteClass>;
	marques: Array<MarqueClass>;
	modePaiement: Array<ModePaiementClass>;
	livrePar: Array<LivreParClass>;
}

export type setCitiesPayloadType = SagaPayloadType<Array<CitiesClass>>;
export type setCategoriesPayloadType = SagaPayloadType<Array<CategorieClass>>;
export type setEmplacementsPayloadType = SagaPayloadType<Array<EmplacementClass>>;
export type setUnitesPayloadType = SagaPayloadType<Array<UniteClass>>;
export type setMarquesPayloadType = SagaPayloadType<Array<MarqueClass>>;
export type setModePaiementPayloadType = SagaPayloadType<Array<ModePaiementClass>>;
export type setLivreParPayloadType = SagaPayloadType<Array<LivreParClass>>;
