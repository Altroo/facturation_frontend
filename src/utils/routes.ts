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
export const CLIENTS_ADD = (company_id: number) => `${SITE_ROOT}dashboard/clients/new/${company_id}`;
export const CLIENTS_ARCHIVED = `${SITE_ROOT}dashboard/clients/archived`;
export const CLIENTS_VIEW = (id: number, company_id: number) => `${SITE_ROOT}dashboard/clients/${id}/${company_id}`;
export const CLIENTS_EDIT = (id: number, company_id: number) =>
	`${SITE_ROOT}dashboard/clients/${id}/${company_id}/edit`;
// Users
export const USERS_LIST = `${SITE_ROOT}dashboard/users`;
export const USERS_ADD = `${SITE_ROOT}dashboard/users/new`;
export const USERS_VIEW = (id: number) => `${SITE_ROOT}dashboard/users/${id}`;
export const USERS_EDIT = (id: number) => `${SITE_ROOT}dashboard/users/${id}/edit`;
