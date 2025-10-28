import {RootState} from '../store';

// _Init
export const getInitStateToken = (state: RootState) => state._init.initStateToken;
export const getAccessToken = (state: RootState) => state._init.initStateToken.access;

// Account
export const getUserProfilAvatar = (state: RootState) => state.account.check_account?.picture as string;
export const getUserFirstName = (state: RootState) => state.account.check_account?.first_name as string;
export const getUserLastName = (state: RootState) => state.account.check_account?.last_name as string;
