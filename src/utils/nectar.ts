export const NECTAR_RAISON_SOCIALE = 'IMMOBILIERE NECTAR';

export const normalizeCompanyName = (value?: string | null): string => (value ?? '').trim().toUpperCase();

export const isNectarRaisonSociale = (value?: string | null): boolean =>
	normalizeCompanyName(value) === NECTAR_RAISON_SOCIALE;
