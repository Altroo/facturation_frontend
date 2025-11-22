import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CitiesClass } from '@/models/Classes';
import { ParameterStateInterface } from '@/types/parameterTypes';

const initialState: ParameterStateInterface = {
	cities: [],
};

const parameterSlice = createSlice({
	name: 'parameter',
	initialState: initialState,
	reducers: {
		setCities: (state, action: PayloadAction<Array<CitiesClass>>) => {
			state.cities = action.payload;
		},
	},
});

export const { setCities } = parameterSlice.actions;

export default parameterSlice.reducer;
