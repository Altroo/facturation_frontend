import {
	getInitStateToken,
	getAccessToken,
	getProfilState,
	getGroupesState,
	getCitiesState,
	getUserCompaniesState,
	getModePaiementState,
	getCategoriesState,
	getEmplacementsState,
	getUnitesState,
	getMarquesState,
	getLivreParState,
} from './index';

import {
	UserClass,
	CitiesClass,
	ModePaiementClass,
	CategorieClass,
	EmplacementClass,
	UniteClass,
	MarqueClass,
	LivreParClass,
} from '@/models/classes';
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
	const mockCategories = [new CategorieClass(1, 'Cat1'), new CategorieClass(2, 'Cat2')];
	const mockEmplacements = [new EmplacementClass(1, 'Emp1'), new EmplacementClass(2, 'Emp2')];
	const mockUnites = [new UniteClass(1, 'Unit1'), new UniteClass(2, 'Unit2')];
	const mockMarques = [new MarqueClass(1, 'Brand1'), new MarqueClass(2, 'Brand2')];
	const mockModePaiement = [new ModePaiementClass(1, 'Cash'), new ModePaiementClass(2, 'Card')];
	const mockLivrePar = [new LivreParClass(1, 'Altroo'), new LivreParClass(2, 'Yooy')];
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
		parameter: {
			cities: [new CitiesClass(1, 'Tanger'), new CitiesClass(2, 'Tetouan')],
			categories: mockCategories,
			emplacements: mockEmplacements,
			unites: mockUnites,
			marques: mockMarques,
			modePaiement: mockModePaiement,
			livrePar: mockLivrePar,
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
		expect(getGroupesState(mockState)).toEqual(['Caissier', 'Lecture']);
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
		expect(companies[1].role).toBe('Lecture');
	});

	it('getCategoriesState should return the categories array', () => {
		const categories = getCategoriesState(mockState);
		expect(Array.isArray(categories)).toBe(true);
		expect(categories[0]).toBeInstanceOf(CategorieClass);
		expect(categories.map((c) => c.nom)).toEqual(['Cat1', 'Cat2']);
	});

	it('getEmplacementsState should return the emplacements array', () => {
		const emplacements = getEmplacementsState(mockState);
		expect(Array.isArray(emplacements)).toBe(true);
		expect(emplacements[0]).toBeInstanceOf(EmplacementClass);
		expect(emplacements.map((e) => e.nom)).toEqual(['Emp1', 'Emp2']);
	});

	it('getUnitesState should return the unites array', () => {
		const unites = getUnitesState(mockState);
		expect(Array.isArray(unites)).toBe(true);
		expect(unites[0]).toBeInstanceOf(UniteClass);
		expect(unites.map((u) => u.nom)).toEqual(['Unit1', 'Unit2']);
	});

	it('getMarquesState should return the marques array', () => {
		const marques = getMarquesState(mockState);
		expect(Array.isArray(marques)).toBe(true);
		expect(marques[0]).toBeInstanceOf(MarqueClass);
		expect(marques.map((m) => m.nom)).toEqual(['Brand1', 'Brand2']);
	});

	it('getModePaiementState should return the modePaiement array', () => {
		const modePaiement = getModePaiementState(mockState);
		expect(Array.isArray(modePaiement)).toBe(true);
		expect(modePaiement[0]).toBeInstanceOf(ModePaiementClass);
		expect(modePaiement.map((m) => m.nom)).toEqual(['Cash', 'Card']);
	});

	it('getLivreParState should return the livrePar array', () => {
		const livrePar = getLivreParState(mockState);
		expect(Array.isArray(livrePar)).toBe(true);
		expect(livrePar[0]).toBeInstanceOf(LivreParClass);
		expect(livrePar.map((m) => m.nom)).toEqual(['Altroo', 'Yooy']);
	});
});
