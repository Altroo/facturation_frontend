import type { RootState } from '@/store/store';
import {
	UserClass,
	CitiesClass,
	CategorieClass,
	EmplacementClass,
	UniteClass,
	MarqueClass,
	ModePaiementClass,
	ModeReglementClass,
	LivreParClass,
} from '@/models/classes';
import type { CompaniesUserCompaniesType } from '@/types/companyTypes';
import type { InitStateToken } from '@/types/_initTypes';

// _Init
export const getInitStateToken = (state: RootState): InitStateToken => state._init.initStateToken;
export const getAccessToken = (state: RootState): string => state._init.initStateToken.access;

// Account
export const getProfilState = (state: RootState): UserClass => state.account.profil;
export const getGroupesState = (state: RootState): Array<string> => state.account.groupes;

// Parameter
export const getCitiesState = (state: RootState): Array<CitiesClass> => state.parameter.cities;
export const getCategoriesState = (state: RootState): Array<CategorieClass> => state.parameter.categories;
export const getEmplacementsState = (state: RootState): Array<EmplacementClass> => state.parameter.emplacements;
export const getUnitesState = (state: RootState): Array<UniteClass> => state.parameter.unites;
export const getMarquesState = (state: RootState): Array<MarqueClass> => state.parameter.marques;
export const getModePaiementState = (state: RootState): Array<ModePaiementClass> => state.parameter.modePaiement;
export const getModeReglementState = (state: RootState): Array<ModeReglementClass> => state.parameter.modeReglement;
export const getLivreParState = (state: RootState): Array<LivreParClass> => state.parameter.livrePar;
// Companies
export const getUserCompaniesState = (state: RootState): Array<CompaniesUserCompaniesType> =>
	state.companies.user_companies;
