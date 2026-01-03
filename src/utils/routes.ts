// Site root
export const SITE_ROOT = `${process.env.NEXT_PUBLIC_DOMAIN_URL_PREFIX}/`;
// Auth
export const AUTH_LOGIN = `${SITE_ROOT}/login`;
// Auth forgot password
export const AUTH_RESET_PASSWORD = `${SITE_ROOT}/reset-password`;
export const AUTH_RESET_PASSWORD_ENTER_CODE = `${SITE_ROOT}/reset-password/enter-code`;
export const AUTH_RESET_PASSWORD_SET_PASSWORD = `${SITE_ROOT}/reset-password/set-password`;
export const AUTH_RESET_PASSWORD_COMPLETE = `${SITE_ROOT}/reset-password/set-password-complete`;
// dashboard
export const DASHBOARD = `${SITE_ROOT}dashboard`;
// Mon profil
export const DASHBOARD_EDIT_PROFILE = `${SITE_ROOT}dashboard/settings/edit-profile`;
export const DASHBOARD_PASSWORD = `${SITE_ROOT}dashboard/settings/password`;
// Companies
export const COMPANIES_LIST = `${SITE_ROOT}dashboard/companies`;
export const COMPANIES_ADD = `${SITE_ROOT}dashboard/companies/new`;
export const COMPANIES_VIEW = (id: number) => `${SITE_ROOT}dashboard/companies/${id}`;
export const COMPANIES_EDIT = (id: number) => `${SITE_ROOT}dashboard/companies/${id}/edit`;
// Clients
export const CLIENTS_LIST = `${SITE_ROOT}dashboard/clients`;
export const CLIENTS_ADD = (company_id: number) => `${SITE_ROOT}dashboard/clients/new/?company_id=${company_id}`;
export const CLIENTS_ARCHIVED = `${SITE_ROOT}dashboard/clients/archived`;
export const CLIENTS_VIEW = (id: number, company_id: number) =>
	`${SITE_ROOT}dashboard/clients/${id}/?company_id=${company_id}`;
export const CLIENTS_EDIT = (id: number, company_id: number) =>
	`${SITE_ROOT}dashboard/clients/${id}/edit/?company_id=${company_id}`;
// Articles
export const ARTICLES_LIST = `${SITE_ROOT}dashboard/articles`;
export const ARTICLES_ADD = (company_id: number) => `${SITE_ROOT}dashboard/articles/new/?company_id=${company_id}`;
export const ARTICLES_ARCHIVED = `${SITE_ROOT}dashboard/articles/archived`;
export const ARTICLES_VIEW = (id: number, company_id: number) =>
	`${SITE_ROOT}dashboard/articles/${id}/?company_id=${company_id}`;
export const ARTICLES_EDIT = (id: number, company_id: number) =>
	`${SITE_ROOT}dashboard/articles/${id}/edit/?company_id=${company_id}`;
// Devis
export const DEVIS_LIST = `${SITE_ROOT}dashboard/devis`;
export const DEVIS_ADD = (company_id: number) => `${SITE_ROOT}dashboard/devis/new/?company_id=${company_id}`;
export const DEVIS_VIEW = (id: number, company_id: number) =>
	`${SITE_ROOT}dashboard/devis/${id}/?company_id=${company_id}`;
export const DEVIS_EDIT = (id: number, company_id: number) =>
	`${SITE_ROOT}dashboard/devis/${id}/edit/?company_id=${company_id}`;
// Facture Pro Forma
export const FACTURE_PRO_FORMA_LIST = `${SITE_ROOT}dashboard/facture-pro-forma`;
export const FACTURE_PRO_FORMA_ADD = (company_id: number) =>
	`${SITE_ROOT}dashboard/facture-pro-forma/new/?company_id=${company_id}`;
export const FACTURE_PRO_FORMA_VIEW = (id: number, company_id: number) =>
	`${SITE_ROOT}dashboard/facture-pro-forma/${id}/?company_id=${company_id}`;
export const FACTURE_PRO_FORMA_EDIT = (id: number, company_id: number) =>
	`${SITE_ROOT}dashboard/facture-pro-forma/${id}/edit/?company_id=${company_id}`;
// Facture Client
export const FACTURE_CLIENT_LIST = `${SITE_ROOT}dashboard/facture-client`;
export const FACTURE_CLIENT_ADD = (company_id: number) =>
	`${SITE_ROOT}dashboard/facture-client/new/?company_id=${company_id}`;
export const FACTURE_CLIENT_VIEW = (id: number, company_id: number) =>
	`${SITE_ROOT}dashboard/facture-client/${id}/?company_id=${company_id}`;
export const FACTURE_CLIENT_EDIT = (id: number, company_id: number) =>
	`${SITE_ROOT}dashboard/facture-client/${id}/edit/?company_id=${company_id}`;
// Bon de Livraison
export const BON_DE_LIVRAISON_LIST = `${SITE_ROOT}dashboard/bon-de-livraison`;
export const BON_DE_LIVRAISON_ADD = (company_id: number) =>
	`${SITE_ROOT}dashboard/bon-de-livraison/new/?company_id=${company_id}`;
export const BON_DE_LIVRAISON_VIEW = (id: number, company_id: number) =>
	`${SITE_ROOT}dashboard/bon-de-livraison/${id}/?company_id=${company_id}`;
export const BON_DE_LIVRAISON_EDIT = (id: number, company_id: number) =>
	`${SITE_ROOT}dashboard/bon-de-livraison/${id}/edit/?company_id=${company_id}`;
// Reglement
export const REGLEMENTS_LIST = `${SITE_ROOT}dashboard/reglements`;
export const REGLEMENTS_ADD = (company_id: number, facture_client_id?: number) =>
	facture_client_id
		? `${SITE_ROOT}dashboard/reglements/new/?company_id=${company_id}&facture_client_id=${facture_client_id}`
		: `${SITE_ROOT}dashboard/reglements/new/?company_id=${company_id}`;
export const REGLEMENTS_VIEW = (id: number, company_id: number) =>
	`${SITE_ROOT}dashboard/reglements/${id}/?company_id=${company_id}`;
export const REGLEMENTS_EDIT = (id: number, company_id: number) =>
	`${SITE_ROOT}dashboard/reglements/${id}/edit/?company_id=${company_id}`;
// Users
export const USERS_LIST = `${SITE_ROOT}dashboard/users`;
export const USERS_ADD = `${SITE_ROOT}dashboard/users/new`;
export const USERS_VIEW = (id: number) => `${SITE_ROOT}dashboard/users/${id}`;
export const USERS_EDIT = (id: number) => `${SITE_ROOT}dashboard/users/${id}/edit`;
