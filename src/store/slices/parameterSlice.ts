import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CategorieClass, CitiesClass, EmplacementClass, MarqueClass, UniteClass } from '@/models/Classes';
import { ParameterStateInterface } from '@/types/parameterTypes';

const initialState: ParameterStateInterface = {
	cities: [],
	categories: [],
	emplacements: [],
	unites: [],
	marques: [],
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
	},
});

export const { setCities, setCategories, setEmplacements, setMarques, setUnites } = parameterSlice.actions;

export default parameterSlice.reducer;
