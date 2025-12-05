import {
	UserClass,
	GroupClass,
	CompanyClass,
	ClientClass,
	CitiesClass,
	ArticleClass,
	MarqueClass,
	CategorieClass,
	UniteClass,
	EmplacementClass,
	ModePaiementClass,
	ModeReglementClass,
} from './Classes';
import type { TypeArticleType } from '@/types/articleTypes';

describe('UserClass', () => {
	it('creates a user instance with given properties', () => {
		const user = new UserClass(
			1,
			'John',
			'Doe',
			'john@example.com',
			'M',
			null,
			null,
			true,
			true,
			'2023-01-01',
			'2023-01-02',
		);

		expect(user.id).toBe(1);
		expect(user.first_name).toBe('John');
		expect(user.last_name).toBe('Doe');
		expect(user.email).toBe('john@example.com');
		expect(user.gender).toBe('M');
		expect(user.is_staff).toBe(true);
		expect(user.is_active).toBe(true);
		expect(user.date_joined).toBe('2023-01-01');
		expect(user.last_login).toBe('2023-01-02');
	});
});

describe('GroupClass', () => {
	it('creates a group instance with titles', () => {
		const group = new GroupClass(['Admin', 'User']);
		expect(group.group_titles).toEqual(['Admin', 'User']);
	});

	it('creates a group instance with null titles', () => {
		const group = new GroupClass([null]);
		expect(group.group_titles).toEqual([null]);
	});
});

describe('CompanyClass', () => {
	it('creates a company instance with given properties', () => {
		const company = new CompanyClass(
			1,
			'2023-01-01',
			'MyCompany',
			'company@example.com',
			null,
			null,
			null,
			null,
			'10 à 50',
			'M.',
			'Boss',
			'0600000000',
			'123 Street',
			'0500000000',
			'0500000001',
			'www.example.com',
			'ACC123',
			'ICE123',
			'RC123',
			'IF123',
			'TP123',
			'CNSS123',
			[{ pk: 1, role: 'Manager' }],
			[{ id: 1, first_name: 'Jane', last_name: 'Doe', role: 'Admin' }],
		);

		expect(company.id).toBe(1);
		expect(company.raison_sociale).toBe('MyCompany');
		expect(company.nbr_employe).toBe('10 à 50');
		expect(company.civilite_responsable).toBe('M.');
		expect(company.nom_responsable).toBe('Boss');
		expect(company.managed_by).toEqual([{ pk: 1, role: 'Manager' }]);
		expect(company.admins).toEqual([{ id: 1, first_name: 'Jane', last_name: 'Doe', role: 'Admin' }]);
	});
});

describe('ClientClass', () => {
	it('creates a client instance with given properties', () => {
		const client = new ClientClass(
			1,
			'CL001',
			'PP',
			10,
			'MyCompany',
			'456 Avenue',
			5,
			'Tanger',
			'0600000000',
			'client@example.com',
			30,
			'Important client',
			'2023-01-01',
			false,
			'ClientRaison',
			'ACC456',
			'ICE456',
			'RC456',
			'IF456',
			'TP456',
			'CNSS456',
			'0500000002',
			'ClientNom',
			'ClientPrenom',
		);

		expect(client.id).toBe(1);
		expect(client.code_client).toBe('CL001');
		expect(client.client_type).toBe('PP');
		expect(client.company).toBe(10);
		expect(client.company_name).toBe('MyCompany');
		expect(client.ville).toBe(5);
		expect(client.ville_name).toBe('Tanger');
		expect(client.tel).toBe('0600000000');
		expect(client.email).toBe('client@example.com');
		expect(client.delai_de_paiement).toBe(30);
		expect(client.archived).toBe(false);
		expect(client.nom).toBe('ClientNom');
		expect(client.prenom).toBe('ClientPrenom');
	});
});

describe('CitiesClass', () => {
	it('creates a city instance with given properties', () => {
		const city = new CitiesClass(1, 'Tanger');
		expect(city.id).toBe(1);
		expect(city.nom).toBe('Tanger');
	});
});

describe('ArticleClass', () => {
	it('creates an article instance with given properties', () => {
		const article = new ArticleClass(
			1,
			'REF001',
			'Produit' as TypeArticleType,
			10,
			'MyCompany',
			2,
			'BrandX',
			3,
			'CategoryY',
			4,
			'WarehouseZ',
			5,
			'UnitKg',
			'Designation',
			null,
			100,
			150,
			20,
			'Remark',
			'2023-01-01',
			false,
		);

		expect(article.id).toBe(1);
		expect(article.reference).toBe('REF001');
		expect(article.company).toBe(10);
		expect(article.company_name).toBe('MyCompany');
		expect(article.marque_name).toBe('BrandX');
		expect(article.categorie_name).toBe('CategoryY');
		expect(article.emplacement_name).toBe('WarehouseZ');
		expect(article.unite_name).toBe('UnitKg');
		expect(article.designation).toBe('Designation');
		expect(article.prix_achat).toBe(100);
		expect(article.prix_vente).toBe(150);
		expect(article.tva).toBe(20);
		expect(article.date_created).toBe('2023-01-01');
		expect(article.archived).toBe(false);
	});
});

describe('MarqueClass', () => {
	it('creates a marque instance with given properties', () => {
		const marque = new MarqueClass(1, 'BrandA');
		expect(marque.id).toBe(1);
		expect(marque.nom).toBe('BrandA');
	});
});

describe('CategorieClass', () => {
	it('creates a categorie instance with given properties', () => {
		const categorie = new CategorieClass(1, 'CategoryA');
		expect(categorie.id).toBe(1);
		expect(categorie.nom).toBe('CategoryA');
	});
});

describe('UniteClass', () => {
	it('creates a unite instance with given properties', () => {
		const unite = new UniteClass(1, 'Kg');
		expect(unite.id).toBe(1);
		expect(unite.nom).toBe('Kg');
	});
});

describe('EmplacementClass', () => {
	it('creates an emplacement instance with given properties', () => {
		const emplacement = new EmplacementClass(1, 'WarehouseA');
		expect(emplacement.id).toBe(1);
		expect(emplacement.nom).toBe('WarehouseA');
	});
});

describe('ModePaiementClass', () => {
	it('creates a mode paiement instance with given properties', () => {
		const modePaiement = new ModePaiementClass(1, 'Cash');
		expect(modePaiement.id).toBe(1);
		expect(modePaiement.nom).toBe('Cash');
	});
});

describe('ModeReglementClass', () => {
	it('creates a mode reglement instance with given properties', () => {
		const modeReglement = new ModeReglementClass(2, 'Deferred');
		expect(modeReglement.id).toBe(2);
		expect(modeReglement.nom).toBe('Deferred');
	});
});
