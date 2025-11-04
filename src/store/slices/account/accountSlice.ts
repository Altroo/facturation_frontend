import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AccountStateInterface } from '@/types/account/accountTypes';
import { GroupClass, UserClass } from '@/models/account/UserClass';

const initialState: AccountStateInterface = {
	profil: {},
	groupes: {},
};

const accountSlice = createSlice({
	name: 'account',
	initialState: initialState,
	reducers: {
		setProfil: (state, action: PayloadAction<UserClass>) => {
			state.profil = action.payload;
		},
		setGroupes: (state, action: PayloadAction<GroupClass>) => {
			state.groupes = action.payload;
		},
		setWSUserAvatar: (state, action: PayloadAction<{ avatar: string }>) => {
			// payload has user_avatar
			state.profil.avatar = action.payload.avatar;
		},
	},
});

export const { setProfil, setGroupes, setWSUserAvatar } = accountSlice.actions;

export default accountSlice.reducer;
