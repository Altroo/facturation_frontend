export const NECTAR_RAISON_SOCIALE = 'IMMOBILIERE NECTAR';

export const normalizeCompanyName = (value?: string | null): string => (value ?? '').trim().toUpperCase();

export const isNectarRaisonSociale = (value?: string | null): boolean =>
	normalizeCompanyName(value) === NECTAR_RAISON_SOCIALE;

export const calculateNectarPrixTTC = (prixHT?: number | string | null, tva?: number | string | null): number => {
	const ht = Number(prixHT ?? 0);
	const tvaRate = Number(tva ?? 0);
	if (!Number.isFinite(ht)) return 0;
	return ht * (1 + (Number.isFinite(tvaRate) ? tvaRate : 0) / 100);
};
