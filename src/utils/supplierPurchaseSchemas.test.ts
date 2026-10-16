import { prepareDataForValidation } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import { getSupplierPurchaseSchema } from './supplierPurchaseSchemas';
import type {
	PurchaseFormMode,
	PurchaseFormValues,
	SupplierPurchaseSchemaContext,
} from '@/types/supplierPurchaseTypes';

const emptyValues = (): PurchaseFormValues => ({
	fournisseur_record: '',
	fournisseur: '',
	fournisseur_email: '',
	marque: '',
	responsable: '',
	date_prevue: '',
	date_commande_client: '',
	numero_proforma_fournisseur: '',
	date_proforma_fournisseur: '',
	montant_proforma_fournisseur: '',
	devise_proforma_fournisseur: '',
	condition_achat: '',
	incoterm: '',
	delai_proforma_jours: '',
	origine_marchandise: '',
	nature_marchandise: '',
	poids_net: '',
	poids_brut: '',
	volume: '',
	notes_ecarts_proforma: '',
	numero_domiciliation: '',
	banque: '',
	montant_titre_importation: '',
	devise_titre_importation: '',
	date_titre_importation: '',
	date_expedition_prevue: '',
	date_expedition_reelle: '',
	date_arrivee_maroc: '',
	documents_remis_banque_le: '',
	date_reelle: '',
	transport: '',
	statut_documents_originaux: '',
	cout_transport: '',
	frais_transit: '',
	frais_douane: '',
	tva: '',
	livraison_locale: '',
	autres_frais: '',
	remarque: '',
	note: '',
	reference_reception: '',
	echeance_id: '',
	date_echeance: '',
	date_paiement: '',
	montant_paye: '',
	reference_paiement: '',
	commentaire_paiement: '',
	nom: '',
	email_contact: '',
	statut: '',
	ecart_prix_proforma: false,
	ecart_quantite_proforma: false,
	ecart_autre_proforma: false,
	documents_originaux_requis: false,
	confirmer_production: false,
	decision: 'control',
	lignes: [],
	reception_lignes: [],
	proforma_fournisseur_file: null,
	titre_importation_file: null,
	documents_originaux_file: null,
	justificatifs_file: null,
	swift_file: null,
	fichier: null,
});

// Formik converts empty strings to undefined before calling validationSchema.
const validate = (mode: PurchaseFormMode, values: PurchaseFormValues, context: SupplierPurchaseSchemaContext = {}) =>
	toFormikValidationSchema(getSupplierPurchaseSchema(mode, context)).validate(prepareDataForValidation(values));

const past = '2020-01-15';
const validCases: Array<[PurchaseFormMode, Partial<PurchaseFormValues>, SupplierPurchaseSchemaContext?]> = [
	['dossier', { fournisseur: 'Fournisseur test', responsable: '1' }],
	[
		'proforma',
		{
			numero_proforma_fournisseur: 'PF-001',
			date_proforma_fournisseur: past,
			montant_proforma_fournisseur: '10',
			devise_proforma_fournisseur: 'USD',
			condition_achat: 'receipt100',
			incoterm: 'FOB',
			delai_proforma_jours: '3',
			lignes: [
				{
					article: 1,
					article_reference: '',
					designation: '',
					quantity: '1',
					prix_achat: '10',
					expected_emplacement: null,
				},
			],
		},
		{ existingProformaFile: true },
	],
	[
		'titre',
		{
			numero_domiciliation: 'TI-001',
			banque: 'Banque test',
			montant_titre_importation: '10',
			devise_titre_importation: 'USD',
			date_titre_importation: past,
		},
		{ existingTitleFile: true },
	],
	['production', { date_expedition_prevue: past }],
	['expedition', { date_expedition_reelle: past }],
	['transit', {}],
	['reception', { date_reelle: past }, { managedReceipt: false }],
	[
		'reception',
		{
			reception_lignes: [
				{
					logistics_line: 1,
					article: 1,
					article_reference: '',
					designation: '',
					remaining_quantity: '2',
					quantity: '1',
					emplacement: '1',
				},
			],
		},
		{ managedReceipt: true },
	],
	['couts', {}],
	['demande_paiement', { echeance_id: '1', date_echeance: past }],
	['paiement', { echeance_id: '1', date_paiement: past, montant_paye: '10' }, { maxPayment: 10 }],
	['justificatif', { echeance_id: '1', swift_file: new File(['proof'], 'preuve.pdf', { type: 'application/pdf' }) }],
	['remarque', { remarque: 'Réception confirmée.' }],
	['repertoire', { nom: 'Fournisseur test' }],
];

it.each(validCases.map(([mode, changes, context = {}]) => [mode, changes, context] as const))(
	'%s accepts its required fields while other steps remain empty',
	async (mode, changes, context) => {
		await expect(validate(mode, { ...emptyValues(), ...changes }, context)).resolves.toBeUndefined();
	},
);

it('only reports the missing dossier fields in French after Formik normalization', async () => {
	await expect(validate('dossier', emptyValues())).rejects.toMatchObject({
		inner: [
			{ path: 'fournisseur', message: 'Ce champ est obligatoire.' },
			{ path: 'responsable', message: 'Ce champ est obligatoire.' },
		],
	});
});

it('keeps an invalid optional email visible instead of treating it as empty', async () => {
	await expect(
		validate('dossier', { ...emptyValues(), fournisseur: 'Test', responsable: '1', fournisseur_email: 'invalid' }),
	).rejects.toMatchObject({
		inner: [{ path: 'fournisseur_email', message: 'Saisissez une adresse e-mail valide.' }],
	});
});

it('still requires a selected article quantity when its empty value becomes undefined', async () => {
	const [, changes, context] = validCases[1];
	await expect(
		validate('proforma', { ...emptyValues(), ...changes, lignes: [{ ...changes.lignes![0], quantity: '' }] }, context),
	).rejects.toMatchObject({
		inner: [{ path: 'lignes.0.quantity', message: 'Ce champ est obligatoire.' }],
	});
});
