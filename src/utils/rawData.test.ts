import {
	acceptedDocumentTypes,
	dashboardChartColors,
	dashboardPieColors,
	dataGridPageSizes,
	documentFields,
	emptyCompanies,
	genderItemsList,
	getTranslatedLogistiqueMacroSteps,
	globalErrorKeys,
	importTitleFields,
	logistiqueChartColors,
	logistiqueCurrencyItemsList,
	logistiqueEmptyValues,
	logistiqueManagerRoles,
	logistiquePieColors,
	logistiqueProformaDecisionItems,
	nbrEmployeFilterOptions,
	nbrEmployeItemsList,
	passwordResetCodeFields,
	pmRequired,
	ppRequired,
	publicPaths,
	reglementStatusFilterOptions,
	stockAdjustmentMovementItems,
	stockInventoryStatusOptions,
	stockMovementOptions,
	stockMovementViewOptions,
	stockReceiptStatusOptions,
	stockStateOptions,
	valueLessFilterOperators,
	civiliteItemsList,
	devisFactureStatusItemsList,
	bonDeLivraisonStatusItemsList,
	remiseTypeItemsList,
	logistiqueGlobalStatusItemsList,
	logistiqueLegacyStatusStepIndex,
	logistiqueLegacyWorkflowStatusItemsList,
	logistiqueImportTitleStatusItemsList,
	logistiqueLaunchStatusItemsList,
	logistiquePaymentMethodItemsList,
	logistiquePaymentStatusItemsList,
	logistiqueProformaStatusItemsList,
} from './rawData';
import { translations } from '@/translations';

describe('items lists', () => {
	describe('genderItemsList', () => {
		it('has two entries with correct codes and values', () => {
			expect(genderItemsList).toHaveLength(2);

			expect(genderItemsList[0]).toEqual({ code: 'H', value: 'Homme' });
			expect(genderItemsList[1]).toEqual({ code: 'F', value: 'Femme' });

			const codes = genderItemsList.map((i) => i.code);
			expect(codes).toEqual(['H', 'F']);

			const values = genderItemsList.map((i) => i.value);
			expect(values).toEqual(['Homme', 'Femme']);
		});

		it('contains unique codes', () => {
			const codes = genderItemsList.map((i) => i.code);
			const unique = Array.from(new Set(codes));
			expect(unique).toHaveLength(codes.length);
		});
	});

	describe('nbrEmployeItemsList', () => {
		it('has expected options and preserves order', () => {
			const expected = [
				{ code: '1 à 5', value: '1 à 5' },
				{ code: '5 à 10', value: '5 à 10' },
				{ code: '10 à 50', value: '10 à 50' },
				{ code: '50 à 100', value: '50 à 100' },
				{ code: 'plus que 100', value: 'plus que 100' },
			];

			expect(nbrEmployeItemsList).toEqual(expected);
			expect(nbrEmployeItemsList.map((i) => i.code)).toEqual(expected.map((e) => e.code));
		});

		it('all entries have non-empty code and value strings', () => {
			for (const it of nbrEmployeItemsList) {
				expect(typeof it.code).toBe('string');
				expect(it.code.length).toBeGreaterThan(0);
				expect(typeof it.value).toBe('string');
				expect(it.value.length).toBeGreaterThan(0);
			}
		});
	});

	describe('civiliteItemsList', () => {
		it('includes empty option and common salutations in expected order', () => {
			const expected = [
				{ code: '', value: '' },
				{ code: 'M.', value: 'M.' },
				{ code: 'Mme', value: 'Mme' },
				{ code: 'Mlle', value: 'Mlle' },
			];

			expect(civiliteItemsList).toEqual(expected);
		});

		it('first item is the empty placeholder', () => {
			expect(civiliteItemsList[0]).toEqual({ code: '', value: '' });
		});
	});

	describe('devisStatusItemsList', () => {
		it('includes the expected statuses in order with empty placeholder first', () => {
			const expected = [
				{ code: '', value: '' },
				{ code: 'Brouillon', value: 'Brouillon' },
				{ code: 'Envoyé', value: 'Envoyé' },
				{ code: 'Accepté', value: 'Accepté' },
				{ code: 'Refusé', value: 'Refusé' },
				{ code: 'Annulé', value: 'Annulé' },
				{ code: 'Expiré', value: 'Expiré' },
			];

			expect(devisFactureStatusItemsList).toEqual(expected);
			expect(devisFactureStatusItemsList.map((i) => i.code)).toEqual(expected.map((e) => e.code));
		});

		it('first item is the empty placeholder', () => {
			expect(devisFactureStatusItemsList[0]).toEqual({ code: '', value: '' });
		});

		it('all non-placeholder entries have non-empty code and value strings', () => {
			for (let i = 1; i < devisFactureStatusItemsList.length; i++) {
				const it = devisFactureStatusItemsList[i];
				expect(typeof it.code).toBe('string');
				expect(it.code.length).toBeGreaterThan(0);
				expect(typeof it.value).toBe('string');
				expect(it.value.length).toBeGreaterThan(0);
			}
		});
	});

	describe('bonDeLivraisonStatusItemsList', () => {
		it('includes all devis/facture statuses plus Facturé status', () => {
			const expected = [
				{ code: '', value: '' },
				{ code: 'Brouillon', value: 'Brouillon' },
				{ code: 'Envoyé', value: 'Envoyé' },
				{ code: 'Accepté', value: 'Accepté' },
				{ code: 'Refusé', value: 'Refusé' },
				{ code: 'Annulé', value: 'Annulé' },
				{ code: 'Expiré', value: 'Expiré' },
				{ code: 'Facturé', value: 'Facturé' },
			];

			expect(bonDeLivraisonStatusItemsList).toEqual(expected);
		});

		it('includes Facturé status not present in devisFactureStatusItemsList', () => {
			const factureCode = bonDeLivraisonStatusItemsList.find((item) => item.code === 'Facturé');
			expect(factureCode).toBeDefined();
			expect(factureCode?.value).toBe('Facturé');

			const notInDevis = devisFactureStatusItemsList.find((item) => item.code === 'Facturé');
			expect(notInDevis).toBeUndefined();
		});

		it('first item is the empty placeholder', () => {
			expect(bonDeLivraisonStatusItemsList[0]).toEqual({ code: '', value: '' });
		});
	});

	describe('remiseTypeItemsList', () => {
		it('includes expected options and preserves order', () => {
			const expected = [
				{ code: '', value: '' },
				{ code: 'Pourcentage', value: 'Pourcentage' },
				{ code: 'Fixe', value: 'Fixe' },
			];

			expect(remiseTypeItemsList).toEqual(expected);
			expect(remiseTypeItemsList.map((i) => i.code)).toEqual(expected.map((e) => e.code));
		});

		it('first item is the empty placeholder', () => {
			expect(remiseTypeItemsList[0]).toEqual({ code: '', value: '' });
		});

		it('all non-placeholder entries have non-empty code and value strings', () => {
			for (let i = 1; i < remiseTypeItemsList.length; i++) {
				const it = remiseTypeItemsList[i];
				expect(typeof it.code).toBe('string');
				expect(it.code.length).toBeGreaterThan(0);
				expect(typeof it.value).toBe('string');
				expect(it.value.length).toBeGreaterThan(0);
			}
		});
	});

	describe('logistique workflow items', () => {
		it('stores the optimized global statuses in specification order', () => {
			expect(logistiqueGlobalStatusItemsList).toEqual([
				'Brouillon',
				'À lancer',
				'En cours',
				'En attente externe',
				'Bloqué',
				'En retard',
				'À clôturer',
				'Clôturé',
				'Annulé',
				'Rouvert',
			]);
		});

		it('centralizes payment and import-title choices', () => {
			expect(logistiquePaymentStatusItemsList).toEqual(['Non demandé', 'En attente', 'Validé']);
			expect(logistiqueImportTitleStatusItemsList).toEqual([
				'À préparer',
				"Titre d'import validé – En attente de paiement",
			]);
			expect(logistiquePaymentMethodItemsList).toEqual(['', 'LC', 'Virement', 'Remise documentaire']);
		});

		it('keeps legacy stages writable and maps downstream progress', () => {
			expect(logistiqueLegacyWorkflowStatusItemsList).not.toContain('Annulé');
			expect(logistiqueLegacyStatusStepIndex.Production).toBe(3);
			expect(logistiqueLegacyStatusStepIndex['Exp\u00e9dition']).toBe(4);
			expect(logistiqueLegacyStatusStepIndex.Transit).toBe(5);
			expect(logistiqueLegacyStatusStepIndex['Livraison client']).toBe(7);
			expect(logistiqueLegacyStatusStepIndex['Cl\u00f4ture']).toBe(8);
		});

		it('stores the supplier proforma statuses in specification order', () => {
			expect(logistiqueProformaStatusItemsList).toEqual([
				'En attente',
				'En contrôle',
				'Correction demandée',
				'Validée',
				'Refusée',
			]);
		});

		it('stores every order and launch substatus in specification order', () => {
			expect(logistiqueLaunchStatusItemsList).toEqual([
				'À lancer',
				'En cours',
				'En attente proforma',
				'Bloquée',
				'Terminée',
			]);
		});
	});
});

describe('shared raw data', () => {
	it('keeps employee and payment filter options aligned with their stored values', () => {
		expect(nbrEmployeFilterOptions.map(({ value, label }) => ({ value, label }))).toEqual(
			nbrEmployeItemsList.map(({ code }) => ({ value: code, label: code })),
		);
		expect(nbrEmployeFilterOptions.every(({ color }) => color === 'default')).toBe(true);
		expect(reglementStatusFilterOptions).toEqual([
			{ value: 'Valide', label: 'Valide', color: 'success' },
			{ value: 'Annulé', label: 'Annulé', color: 'error' },
		]);
	});

	it('provides the logistics document and management choices used by both form and view', () => {
		expect([...logistiqueManagerRoles]).toEqual(['Caissier', 'Commercial', 'Logistique']);
		expect(documentFields).toEqual([
			'titre_importation_file',
			'proforma_fournisseur_file',
			'justificatifs_file',
			'swift_file',
			'documents_originaux_file',
		]);
		expect(acceptedDocumentTypes.split(',')).toEqual([
			'.pdf',
			'.doc',
			'.docx',
			'.xls',
			'.xlsx',
			'.jpg',
			'.jpeg',
			'.png',
		]);
		expect(importTitleFields).toEqual([
			'numero_domiciliation',
			'banque',
			'montant_titre_importation',
			'devise_titre_importation',
			'date_titre_importation',
			'methode_paiement',
			'avance_pourcentage',
			'titre_importation_file',
		]);
	});

	it('keeps logistics decisions, currencies, and initial form values coherent', () => {
		expect(logistiqueCurrencyItemsList).toEqual(['MAD', 'EUR', 'USD']);
		expect(logistiqueProformaDecisionItems).toEqual(['En contrôle', 'Correction demandée', 'Validée', 'Refusée']);
		expect(logistiqueEmptyValues).toMatchObject({
			proformas: [],
			devise: 'MAD',
			statut: 'Réception commande',
			statut_titre_importation: 'À préparer',
			titre_importation_file: null,
			proforma_fournisseur_file: null,
			documents_originaux_file: null,
		});
		for (const field of documentFields) expect(logistiqueEmptyValues[field]).toBeNull();
	});

	it('provides consistent stock movement and status options', () => {
		expect(stockAdjustmentMovementItems.map(({ value }) => value)).toEqual(['adjustment', 'opening']);
		expect(stockMovementOptions.map(({ value, label }) => ({ value, label }))).toEqual(stockMovementViewOptions);
		expect(new Set(stockMovementOptions.map(({ value }) => value)).size).toBe(stockMovementOptions.length);
		expect(stockInventoryStatusOptions.map(({ value }) => value)).toEqual(['draft', 'validated', 'cancelled']);
		expect(stockReceiptStatusOptions.map(({ value }) => value)).toEqual(['draft', 'validated', 'cancelled']);
		expect(stockStateOptions.map(({ id }) => id)).toEqual(['disponible', 'minimum', 'a_approvisionner']);
	});

	it('holds the shared input, error, filter, and pagination contracts', () => {
		expect(passwordResetCodeFields).toEqual(['one', 'two', 'three', 'four', 'five', 'six']);
		expect([...globalErrorKeys]).toEqual(['detail', 'error', 'globalError', 'message', 'non_field_errors']);
		expect([...valueLessFilterOperators]).toEqual(['isEmpty', 'isNotEmpty']);
		expect([...dataGridPageSizes]).toEqual([5, 10, 25, 50, 100]);
	});

	it('keeps dashboard and logistics chart palettes complete', () => {
		expect(dashboardPieColors).toHaveLength(8);
		expect(new Set(dashboardPieColors).size).toBe(dashboardPieColors.length);
		expect(dashboardPieColors).toContain(dashboardChartColors.primary);
		expect(logistiquePieColors).toEqual([
			logistiqueChartColors.primary,
			logistiqueChartColors.success,
			logistiqueChartColors.warning,
			logistiqueChartColors.error,
			logistiqueChartColors.info,
			logistiqueChartColors.secondary,
			logistiqueChartColors.neutral,
			logistiqueChartColors.brown,
		]);
	});

	it('keeps validation field lists and public routes available', () => {
		expect(emptyCompanies).toEqual([]);
		expect(pmRequired).toEqual(['raison_sociale', 'ville', 'ICE', 'delai_de_paiement']);
		expect(ppRequired).toEqual(['nom', 'prenom', 'adresse', 'ville', 'delai_de_paiement']);
		expect(publicPaths).toEqual([
			'/login',
			'/reset-password',
			'/reset-password/enter-code',
			'/reset-password/set-password',
			'/reset-password/set-password-complete',
			'/sso/start',
			'/sso/callback',
		]);
	});

	it('builds logistics macro steps from the selected language', () => {
		for (const t of Object.values(translations)) {
			expect(getTranslatedLogistiqueMacroSteps(t)).toEqual([
				t.logistique.macroStepCommandLaunch,
				t.logistique.macroStepProforma,
				t.logistique.macroStepPayment,
				t.logistique.macroStepSupplierPreparation,
				t.logistique.macroStepShipping,
				t.logistique.macroStepCustoms,
				t.logistique.macroStepDelivery,
				t.logistique.macroStepClosing,
			]);
		}
	});
});
