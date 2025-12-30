import * as types from './index';
import {
	CategorieClass,
	CitiesClass,
	EmplacementClass,
	MarqueClass,
	UniteClass,
	ModePaiementClass,
	ModeReglementClass,
	LivreParClass,
} from '@/models/classes';

export const parameterSetCitiesAction = (props: Array<CitiesClass>) => {
	return {
		type: types.PARAMETER_SET_CITIES,
		data: props,
	};
};

export const parameterSetCategoriesAction = (props: Array<CategorieClass>) => {
	return {
		type: types.PARAMETER_SET_CATEGORIES,
		data: props,
	};
};

export const parameterSetEmplacementsAction = (props: Array<EmplacementClass>) => {
	return {
		type: types.PARAMETER_SET_EMPLACEMENTS,
		data: props,
	};
};

export const parameterSetUnitesAction = (props: Array<UniteClass>) => {
	return {
		type: types.PARAMETER_SET_UNITES,
		data: props,
	};
};

export const parameterSetMarquesAction = (props: Array<MarqueClass>) => {
	return {
		type: types.PARAMETER_SET_MARQUES,
		data: props,
	};
};

export const parameterSetModePaiementAction = (props: Array<ModePaiementClass>) => {
	return {
		type: types.PARAMETER_SET_MODE_PAIEMENT,
		data: props,
	};
};

export const parameterSetModeReglementAction = (props: Array<ModeReglementClass>) => {
	return {
		type: types.PARAMETER_SET_MODE_REGLEMENT,
		data: props,
	};
};

export const parameterSetLivreParAction = (props: Array<LivreParClass>) => {
	return {
		type: types.PARAMETER_SET_LIVRE_PAR,
		data: props,
	};
};
