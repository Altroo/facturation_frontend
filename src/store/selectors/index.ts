import type { RootState } from '@/store/store';
import { UserClass } from '@/models/Classes';

// _Init
export const getInitStateToken = (state: RootState) => state._init.initStateToken;
export const getAccessToken = (state: RootState) => state._init.initStateToken.access;

// Account
export const getProfilState = (state: RootState): UserClass => state.account.profil;
export const getGroupesState = (state: RootState): Array<string> => state.account.groupes;
