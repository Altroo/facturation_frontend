describe('routes constants', () => {
	const ORIG_ENV = process.env.NEXT_PUBLIC_DOMAIN_URL_PREFIX;

	beforeEach(() => {
		jest.resetModules();
		process.env.NEXT_PUBLIC_DOMAIN_URL_PREFIX = 'https://example.com';
	});

	afterEach(() => {
		process.env.NEXT_PUBLIC_DOMAIN_URL_PREFIX = ORIG_ENV;
		jest.resetModules();
	});

	it('constructs SITE_ROOT from NEXT_PUBLIC_DOMAIN_URL_PREFIX with trailing slash', () => {
		// require relative path to routes file
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const routes = require('./routes');
		expect(routes.SITE_ROOT).toBe('https://example.com/');
	});

	it('exports auth routes based on SITE_ROOT', () => {
		const {
			SITE_ROOT,
			AUTH_LOGIN,
			AUTH_RESET_PASSWORD,
			AUTH_RESET_PASSWORD_ENTER_CODE,
			AUTH_RESET_PASSWORD_SET_PASSWORD,
			AUTH_RESET_PASSWORD_COMPLETE,
			// eslint-disable-next-line @typescript-eslint/no-require-imports
		} = require('./routes');

		expect(AUTH_LOGIN).toBe(`${SITE_ROOT}/login`);
		expect(AUTH_RESET_PASSWORD).toBe(`${SITE_ROOT}/reset-password`);
		expect(AUTH_RESET_PASSWORD_ENTER_CODE).toBe(`${SITE_ROOT}/reset-password/enter-code`);
		expect(AUTH_RESET_PASSWORD_SET_PASSWORD).toBe(`${SITE_ROOT}/reset-password/set-password`);
		expect(AUTH_RESET_PASSWORD_COMPLETE).toBe(`${SITE_ROOT}/reset-password/set-password-complete`);
	});

	it('exports dashboard and profile routes', () => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const { SITE_ROOT, DASHBOARD, DASHBOARD_EDIT_PROFILE, DASHBOARD_PASSWORD } = require('./routes');

		expect(DASHBOARD).toBe(`${SITE_ROOT}dashboard`);
		expect(DASHBOARD_EDIT_PROFILE).toBe(`${SITE_ROOT}dashboard/settings/edit-profile`);
		expect(DASHBOARD_PASSWORD).toBe(`${SITE_ROOT}dashboard/settings/password`);
	});

	it('exports companies routes and functions', () => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const { SITE_ROOT, COMPANIES_LIST, COMPANIES_ADD, COMPANIES_VIEW, COMPANIES_EDIT } = require('./routes');

		expect(COMPANIES_LIST).toBe(`${SITE_ROOT}dashboard/companies`);
		expect(COMPANIES_ADD).toBe(`${SITE_ROOT}dashboard/companies/new`);

		expect(typeof COMPANIES_VIEW).toBe('function');
		expect(typeof COMPANIES_EDIT).toBe('function');

		expect(COMPANIES_VIEW(5)).toBe(`${SITE_ROOT}dashboard/companies/5`);
		expect(COMPANIES_EDIT(12)).toBe(`${SITE_ROOT}dashboard/companies/12/edit`);
	});

	it('exports users routes and functions', () => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const { SITE_ROOT, USERS_LIST, USERS_ADD, USERS_VIEW, USERS_EDIT } = require('./routes');

		expect(USERS_LIST).toBe(`${SITE_ROOT}dashboard/users`);
		expect(USERS_ADD).toBe(`${SITE_ROOT}dashboard/users/new`);

		expect(typeof USERS_VIEW).toBe('function');
		expect(typeof USERS_EDIT).toBe('function');

		expect(USERS_VIEW(3)).toBe(`${SITE_ROOT}dashboard/users/3`);
		expect(USERS_EDIT(7)).toBe(`${SITE_ROOT}dashboard/users/7/edit`);
	});

	it('reacts to different NEXT_PUBLIC_DOMAIN_URL_PREFIX values', () => {
		process.env.NEXT_PUBLIC_DOMAIN_URL_PREFIX = 'http://localhost:3000/base';
		jest.resetModules();
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const { SITE_ROOT, DASHBOARD } = require('./routes');

		expect(SITE_ROOT).toBe('http://localhost:3000/base/');
		expect(DASHBOARD).toBe('http://localhost:3000/base/dashboard');
	});
	it('exports clients routes and functions', () => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const { SITE_ROOT, CLIENTS_LIST, CLIENTS_ADD, CLIENTS_ARCHIVED, CLIENTS_VIEW, CLIENTS_EDIT } = require('./routes');

		expect(CLIENTS_LIST).toBe(`${SITE_ROOT}dashboard/clients`);
		expect(typeof CLIENTS_ADD).toBe('function');
		expect(CLIENTS_ADD(42)).toBe(`${SITE_ROOT}dashboard/clients/new/?company_id=42`);

		expect(CLIENTS_ARCHIVED).toBe(`${SITE_ROOT}dashboard/clients/archived`);

		expect(typeof CLIENTS_VIEW).toBe('function');
		expect(typeof CLIENTS_EDIT).toBe('function');

		expect(CLIENTS_VIEW(5, 99)).toBe(`${SITE_ROOT}dashboard/clients/5/?company_id=99`);
		expect(CLIENTS_EDIT(7, 123)).toBe(`${SITE_ROOT}dashboard/clients/7/edit/?company_id=123`);
	});
	it('exports articles routes and functions', () => {
		const {
			SITE_ROOT,
			ARTICLES_LIST,
			ARTICLES_ADD,
			ARTICLES_ARCHIVED,
			ARTICLES_VIEW,
			ARTICLES_EDIT,
			// eslint-disable-next-line @typescript-eslint/no-require-imports
		} = require('./routes');

		expect(ARTICLES_LIST).toBe(`${SITE_ROOT}dashboard/articles`);
		expect(typeof ARTICLES_ADD).toBe('function');
		expect(ARTICLES_ADD(42)).toBe(`${SITE_ROOT}dashboard/articles/new/?company_id=42`);

		expect(ARTICLES_ARCHIVED).toBe(`${SITE_ROOT}dashboard/articles/archived`);

		expect(typeof ARTICLES_VIEW).toBe('function');
		expect(typeof ARTICLES_EDIT).toBe('function');

		expect(ARTICLES_VIEW(5, 99)).toBe(`${SITE_ROOT}dashboard/articles/5/?company_id=99`);
		expect(ARTICLES_EDIT(7, 123)).toBe(`${SITE_ROOT}dashboard/articles/7/edit/?company_id=123`);
	});

	it('exports devis routes and functions', () => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const { SITE_ROOT, DEVIS_LIST, DEVIS_ADD, DEVIS_VIEW, DEVIS_EDIT } = require('./routes');

		expect(DEVIS_LIST).toBe(`${SITE_ROOT}dashboard/devis`);
		expect(typeof DEVIS_ADD).toBe('function');
		expect(DEVIS_ADD(42)).toBe(`${SITE_ROOT}dashboard/devis/new/?company_id=42`);

		expect(typeof DEVIS_VIEW).toBe('function');
		expect(typeof DEVIS_EDIT).toBe('function');

		expect(DEVIS_VIEW(5, 99)).toBe(`${SITE_ROOT}dashboard/devis/5/?company_id=99`);
		expect(DEVIS_EDIT(7, 123)).toBe(`${SITE_ROOT}dashboard/devis/7/edit/?company_id=123`);
	});

	it('exports pro forma routes and functions', () => {
		const {
			SITE_ROOT,
			FACTURE_PRO_FORMA_LIST,
			FACTURE_PRO_FORMA_ADD,
			FACTURE_PRO_FORMA_VIEW,
			FACTURE_PRO_FORMA_EDIT,
			// eslint-disable-next-line @typescript-eslint/no-require-imports
		} = require('./routes');

		expect(FACTURE_PRO_FORMA_LIST).toBe(`${SITE_ROOT}dashboard/facture-pro-forma`);
		expect(typeof FACTURE_PRO_FORMA_ADD).toBe('function');
		expect(FACTURE_PRO_FORMA_ADD(42)).toBe(`${SITE_ROOT}dashboard/facture-pro-forma/new/?company_id=42`);

		expect(typeof FACTURE_PRO_FORMA_VIEW).toBe('function');
		expect(typeof FACTURE_PRO_FORMA_EDIT).toBe('function');

		expect(FACTURE_PRO_FORMA_VIEW(5, 99)).toBe(`${SITE_ROOT}dashboard/facture-pro-forma/5/?company_id=99`);
		expect(FACTURE_PRO_FORMA_EDIT(7, 123)).toBe(`${SITE_ROOT}dashboard/facture-pro-forma/7/edit/?company_id=123`);
	});

	it('exports facture client routes and functions', () => {
		const {
			SITE_ROOT,
			FACTURE_CLIENT_LIST,
			FACTURE_CLIENT_ADD,
			FACTURE_CLIENT_VIEW,
			FACTURE_CLIENT_EDIT,
			// eslint-disable-next-line @typescript-eslint/no-require-imports
		} = require('./routes');

		expect(FACTURE_CLIENT_LIST).toBe(`${SITE_ROOT}dashboard/facture-client`);
		expect(typeof FACTURE_CLIENT_ADD).toBe('function');
		expect(FACTURE_CLIENT_ADD(42)).toBe(`${SITE_ROOT}dashboard/facture-client/new/?company_id=42`);

		expect(typeof FACTURE_CLIENT_VIEW).toBe('function');
		expect(typeof FACTURE_CLIENT_EDIT).toBe('function');

		expect(FACTURE_CLIENT_VIEW(5, 99)).toBe(`${SITE_ROOT}dashboard/facture-client/5/?company_id=99`);
		expect(FACTURE_CLIENT_EDIT(7, 123)).toBe(`${SITE_ROOT}dashboard/facture-client/7/edit/?company_id=123`);
	});

	it('exports bon de livraison routes and functions', () => {
		const {
			SITE_ROOT,
			BON_DE_LIVRAISON_LIST,
			BON_DE_LIVRAISON_ADD,
			BON_DE_LIVRAISON_VIEW,
			BON_DE_LIVRAISON_EDIT,
			BON_DE_LIVRAISON_UNINVOICED,
			// eslint-disable-next-line @typescript-eslint/no-require-imports
		} = require('./routes');

		expect(BON_DE_LIVRAISON_LIST).toBe(`${SITE_ROOT}dashboard/bon-de-livraison`);
		expect(typeof BON_DE_LIVRAISON_ADD).toBe('function');
		expect(BON_DE_LIVRAISON_ADD(42)).toBe(`${SITE_ROOT}dashboard/bon-de-livraison/new/?company_id=42`);

		expect(typeof BON_DE_LIVRAISON_VIEW).toBe('function');
		expect(typeof BON_DE_LIVRAISON_EDIT).toBe('function');

		expect(BON_DE_LIVRAISON_VIEW(5, 99)).toBe(`${SITE_ROOT}dashboard/bon-de-livraison/5/?company_id=99`);
		expect(BON_DE_LIVRAISON_EDIT(7, 123)).toBe(`${SITE_ROOT}dashboard/bon-de-livraison/7/edit/?company_id=123`);
		expect(BON_DE_LIVRAISON_UNINVOICED).toBe(`${SITE_ROOT}dashboard/bon-de-livraison/uninvoiced`);
	});

	it('exports facture client unpaid route', () => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const { SITE_ROOT, FACTURE_CLIENT_UNPAID } = require('./routes');

		expect(FACTURE_CLIENT_UNPAID).toBe(`${SITE_ROOT}dashboard/facture-client/unpaid`);
	});

	it('exports reglement routes and functions', () => {
		const {
			SITE_ROOT,
			REGLEMENTS_LIST,
			REGLEMENTS_ADD,
			REGLEMENTS_VIEW,
			REGLEMENTS_EDIT,
			// eslint-disable-next-line @typescript-eslint/no-require-imports
		} = require('./routes');

		expect(REGLEMENTS_LIST).toBe(`${SITE_ROOT}dashboard/reglements`);
		expect(typeof REGLEMENTS_ADD).toBe('function');
		expect(REGLEMENTS_ADD(42)).toBe(`${SITE_ROOT}dashboard/reglements/new/?company_id=42`);
		expect(REGLEMENTS_ADD(42, 10)).toBe(
			`${SITE_ROOT}dashboard/reglements/new/?company_id=42&facture_client_id=10`
		);

		expect(typeof REGLEMENTS_VIEW).toBe('function');
		expect(typeof REGLEMENTS_EDIT).toBe('function');

		expect(REGLEMENTS_VIEW(5, 99)).toBe(`${SITE_ROOT}dashboard/reglements/5/?company_id=99`);
		expect(REGLEMENTS_EDIT(7, 123)).toBe(`${SITE_ROOT}dashboard/reglements/7/edit/?company_id=123`);
	});

	describe('PDF routes', () => {
		const ORIG_API_URL = process.env.NEXT_PUBLIC_ROOT_API_URL;

		beforeEach(() => {
			process.env.NEXT_PUBLIC_ROOT_API_URL = 'https://api.example.com';
			jest.resetModules();
		});

		afterEach(() => {
			process.env.NEXT_PUBLIC_ROOT_API_URL = ORIG_API_URL;
			jest.resetModules();
		});

		it('exports devis PDF route function', () => {
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			const { DEVIS_PDF } = require('./routes');

			expect(typeof DEVIS_PDF).toBe('function');
			expect(DEVIS_PDF(5, 99, 'avec_remise')).toBe(
				'https://api.example.com/devi/pdf/fr/5/?company_id=99&type=avec_remise'
			);
			expect(DEVIS_PDF(10, 50, 'sans_remise', 'en')).toBe(
				'https://api.example.com/devi/pdf/en/10/?company_id=50&type=sans_remise'
			);
			expect(DEVIS_PDF(15, 75, 'avec_unite', 'fr')).toBe(
				'https://api.example.com/devi/pdf/fr/15/?company_id=75&type=avec_unite'
			);
		});

		it('exports facture client PDF route function', () => {
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			const { FACTURE_CLIENT_PDF } = require('./routes');

			expect(typeof FACTURE_CLIENT_PDF).toBe('function');
			expect(FACTURE_CLIENT_PDF(5, 99, 'avec_remise')).toBe(
				'https://api.example.com/facture_client/pdf/fr/5/?company_id=99&type=avec_remise'
			);
		});

		it('exports facture pro forma PDF route function', () => {
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			const { FACTURE_PRO_FORMA_PDF } = require('./routes');

			expect(typeof FACTURE_PRO_FORMA_PDF).toBe('function');
			expect(FACTURE_PRO_FORMA_PDF(5, 99, 'avec_remise')).toBe(
				'https://api.example.com/facture_proforma/pdf/fr/5/?company_id=99&type=avec_remise'
			);
		});

		it('exports bon de livraison PDF route function', () => {
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			const { BON_DE_LIVRAISON_PDF } = require('./routes');

			expect(typeof BON_DE_LIVRAISON_PDF).toBe('function');
			expect(BON_DE_LIVRAISON_PDF(5, 99, 'normal')).toBe(
				'https://api.example.com/bon_de_livraison/pdf/fr/5/?company_id=99&type=normal'
			);
			expect(BON_DE_LIVRAISON_PDF(10, 50, 'quantity_only', 'en')).toBe(
				'https://api.example.com/bon_de_livraison/pdf/en/10/?company_id=50&type=quantity_only'
			);
			expect(BON_DE_LIVRAISON_PDF(15, 75, 'avec_unite', 'fr')).toBe(
				'https://api.example.com/bon_de_livraison/pdf/fr/15/?company_id=75&type=avec_unite'
			);
		});

		it('exports reglement PDF route function', () => {
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			const { REGLEMENT_PDF } = require('./routes');

			expect(typeof REGLEMENT_PDF).toBe('function');
			expect(REGLEMENT_PDF(5, 99)).toBe('https://api.example.com/reglement/pdf/fr/5/?company_id=99');
		});
	});
});
