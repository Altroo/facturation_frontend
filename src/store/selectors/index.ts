import type { RootState } from '@/store/store';
import type { UserClass } from '@/models/classes';
import type { CompaniesUserCompaniesType } from '@/types/companyTypes';
import type { InitStateToken } from '@/types/_initTypes';

// _Init
export const getInitStateToken = (state: RootState): InitStateToken => state._init.initStateToken;
export const getAccessToken = (state: RootState): string => state._init.initStateToken.access;

// Account
export const getProfilState = (state: RootState): UserClass => state.account.profil;
export const getGroupesState = (state: RootState): Array<string> => state.account.groupes;

// Companies
export const getUserCompaniesState = (state: RootState): Array<CompaniesUserCompaniesType> =>
	state.companies.user_companies;

// WS
export const getWSMaintenanceState = (state: RootState): boolean => state.ws.maintenance;

// Notifications
export const getUnreadNotificationCount = (state: RootState): number => state.notification.unreadCount;
