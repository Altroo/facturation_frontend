import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type {
	CategorieClass,
	CitiesClass,
	EmplacementClass,
	MarqueClass,
	ModePaiementClass,
	ModeReglementClass,
	UniteClass,
} from '@/models/classes';
import type { ParameterStateInterface } from '@/types/parameterTypes';

const initialState: ParameterStateInterface = {
	cities: [],
	categories: [],
	emplacements: [],
	unites: [],
	marques: [],
	modePaiement: [],
	modeReglement: [],
};

const parameterSlice = createSlice({
	name: 'parameter',
	initialState: initialState,
	reducers: {
		setCities: (state, action: PayloadAction<Array<CitiesClass>>) => {
			state.cities = action.payload;
		},
		setCategories: (state, action: PayloadAction<Array<CategorieClass>>) => {
			state.categories = action.payload;
		},
		setEmplacements: (state, action: PayloadAction<Array<EmplacementClass>>) => {
			state.emplacements = action.payload;
		},
		setUnites: (state, action: PayloadAction<Array<UniteClass>>) => {
			state.unites = action.payload;
		},
		setMarques: (state, action: PayloadAction<Array<MarqueClass>>) => {
			state.marques = action.payload;
		},
		setModeReglement: (state, action: PayloadAction<Array<ModeReglementClass>>) => {
			state.modeReglement = action.payload;
		},
		setModePaiement: (state, action: PayloadAction<Array<ModePaiementClass>>) => {
			state.modePaiement = action.payload;
		},
	},
});

export const { setCities, setCategories, setEmplacements, setMarques, setUnites, setModePaiement, setModeReglement } =
	parameterSlice.actions;

export default parameterSlice.reducer;
