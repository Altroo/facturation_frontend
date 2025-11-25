import {
	getInitStateToken,
	getAccessToken,
	getProfilState,
	getGroupesState,
	getCitiesState,
	getUserCompaniesState,
} from './index';

import { UserClass, CitiesClass } from '@/models/Classes';
import type { CompaniesUserCompaniesType } from '@/types/companyTypes';

describe('Redux selectors', () => {
	const mockCompanies: CompaniesUserCompaniesType[] = [
		{ id: 1, raison_sociale: 'Alpha Corp', role: 'Admin' },
		{ id: 2, raison_sociale: 'Beta LLC', role: 'Manager' },
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
				'2023-01-01T12:00:00Z',
				'2023-12-01T08:30:00Z',
			),
			groupes: ['admin', 'editor'],
		},
		parameter: {
			cities: [new CitiesClass(1, 'Tanger'), new CitiesClass(2, 'Tetouan')],
		},
		companies: {
			user_companies: mockCompanies,
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
		expect(getGroupesState(mockState)).toEqual(['admin', 'editor']);
	});

	it('getCitiesState should return the cities array', () => {
		const cities = getCitiesState(mockState);
		expect(Array.isArray(cities)).toBe(true);
		expect(cities[0]).toBeInstanceOf(CitiesClass);
		expect(cities.map((c) => c.nom)).toEqual(['Tanger', 'Tetouan']);
	});

	it('getUserCompaniesState should return the user_companies array', () => {
		const companies = getUserCompaniesState(mockState);
		expect(Array.isArray(companies)).toBe(true);
		expect(companies).toEqual(mockCompanies);
		expect(companies[0].raison_sociale).toBe('Alpha Corp');
		expect(companies[1].role).toBe('Manager');
	});
});
