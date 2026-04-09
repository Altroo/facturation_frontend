import {
	getAccessToken,
	getGroupesState,
	getInitStateToken,
	getProfilState,
	getUserCompaniesState,
	getWSMaintenanceState,
} from './index';

import { UserClass } from '@/models/classes';
import type { CompaniesUserCompaniesType } from '@/types/companyTypes';

describe('Redux selectors', () => {
	const mockCompanies: CompaniesUserCompaniesType[] = [
		{
			id: 1,
			raison_sociale: 'Alpha Corp',
			role: 'Caissier',
			uses_foreign_currency: false,
		},
		{
			id: 2,
			raison_sociale: 'Beta LLC',
			role: 'Lecture',
			uses_foreign_currency: false,
		},
	];
	const mockState = {
		_init: {
			initStateToken: {
				access: 'mock-access-token',
				refresh: 'mock-refresh-token',
			},
		},
		account: {
			profil: new UserClass(
				1,
				'John',
				'Doe',
				'john.doe@example.com',
				'male',
				null,
				null,
				true,
				true,
				false,
				'2023-01-01T12:00:00Z',
				'2023-12-01T08:30:00Z',
				'2023-12-01T08:30:00Z',
			),
			groupes: ['Caissier', 'Lecture'],
		},
		companies: {
			user_companies: mockCompanies,
		},
		ws: {
			maintenance: true,
		},
	};

	it('getInitStateToken should return the initStateToken object', () => {
		expect(getInitStateToken(mockState)).toEqual({
			access: 'mock-access-token',
			refresh: 'mock-refresh-token',
		});
	});

	it('getAccessToken should return the access token string', () => {
		expect(getAccessToken(mockState)).toBe('mock-access-token');
	});

	it('getProfilState should return a UserClass instance', () => {
		const profil = getProfilState(mockState);
		expect(profil).toBeInstanceOf(UserClass);
		expect(profil.email).toBe('john.doe@example.com');
		expect(profil.is_staff).toBe(true);
	});

	it('getGroupesState should return the groupes array', () => {
		expect(getGroupesState(mockState)).toEqual(['Caissier', 'Lecture']);
	});

	it('getUserCompaniesState should return the user_companies array', () => {
		const companies = getUserCompaniesState(mockState);
		expect(Array.isArray(companies)).toBe(true);
		expect(companies).toEqual(mockCompanies);
		expect(companies[0].raison_sociale).toBe('Alpha Corp');
		expect(companies[1].role).toBe('Lecture');
	});

	it('getWSMaintenanceState should return the maintenance flag', () => {
		expect(getWSMaintenanceState(mockState)).toBe(true);
	});
});
