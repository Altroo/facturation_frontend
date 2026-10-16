import z from 'zod';
import type {
	PurchaseFormMode,
	PurchaseFormValues,
	SupplierPurchaseSchemaContext,
} from '../types/supplierPurchaseTypes';

export const PURCHASE_CONDITIONS = [
	['documentary100', '100 % par remise documentaire'],
	['advance30_lc70', '30 % d’avance et 70 % par lettre de crédit (LC)'],
	['advance30_documentary70', '30 % d’avance et 70 % par remise documentaire'],
	['advance100', '100 % d’avance (total inférieur à 18 000)'],
	['advance30_transfer70', '30 % d’avance et 70 % par virement'],
	['receipt100', 'Paiement à la réception'],
	['shipment100', 'Paiement après l’expédition'],
] as const;

const isFile = (value: unknown): value is File => typeof File !== 'undefined' && value instanceof File;
const documentFile = z
	.custom<File>(isFile, {
		error: 'Choisissez un fichier.',
	})
	.refine((file) => !isFile(file) || file.size <= 10 * 1024 * 1024, { error: 'Le fichier ne doit pas dépasser 10 Mo.' })
	.refine((file) => !isFile(file) || /\.(pdf|docx?|xlsx?|png|jpe?g)$/i.test(file.name), {
		error: 'Utilisez un fichier PDF, Word, Excel, JPG ou PNG.',
	})
	.nullable();

const formShape = z.object({
	fournisseur: z.string().default(''),
	fournisseur_email: z.string().default(''),
	marque: z.string().default(''),
	responsable: z.string().default(''),
	date_prevue: z.string().default(''),
	date_commande_client: z.string().default(''),
	numero_proforma_fournisseur: z.string().default(''),
	date_proforma_fournisseur: z.string().default(''),
	montant_proforma_fournisseur: z.string().default(''),
	devise_proforma_fournisseur: z.string().default(''),
	condition_achat: z.string().default(''),
	incoterm: z.string().default(''),
	delai_proforma_jours: z.string().default(''),
	origine_marchandise: z.string().default(''),
	nature_marchandise: z.string().default(''),
	poids_net: z.string().default(''),
	poids_brut: z.string().default(''),
	volume: z.string().default(''),
	ecart_prix_proforma: z.boolean(),
	ecart_quantite_proforma: z.boolean(),
	ecart_autre_proforma: z.boolean(),
	notes_ecarts_proforma: z.string().default(''),
	numero_domiciliation: z.string().default(''),
	banque: z.string().default(''),
	montant_titre_importation: z.string().default(''),
	devise_titre_importation: z.string().default(''),
	date_titre_importation: z.string().default(''),
	date_expedition_prevue: z.string().default(''),
	date_expedition_reelle: z.string().default(''),
	date_arrivee_maroc: z.string().default(''),
	documents_remis_banque_le: z.string().default(''),
	date_reelle: z.string().default(''),
	transport: z.string().default(''),
	documents_originaux_requis: z.boolean(),
	statut_documents_originaux: z.string().default(''),
	cout_transport: z.string().default(''),
	frais_transit: z.string().default(''),
	frais_douane: z.string().default(''),
	tva: z.string().default(''),
	livraison_locale: z.string().default(''),
	autres_frais: z.string().default(''),
	remarque: z.string().default(''),
	note: z.string().default(''),
	reference_reception: z.string().default(''),
	echeance_id: z.string().default(''),
	date_echeance: z.string().default(''),
	date_paiement: z.string().default(''),
	montant_paye: z.string().default(''),
	reference_paiement: z.string().default(''),
	commentaire_paiement: z.string().default(''),
	nom: z.string().default(''),
	email_contact: z.string().default(''),
	lignes: z.array(
		z.object({
			article: z.number().nullable(),
			article_reference: z.string().default(''),
			designation: z.string().default(''),
			quantity: z.string().default(''),
			prix_achat: z.string().default(''),
			expected_emplacement: z.number().nullable(),
		}),
	),
	reception_lignes: z.array(
		z.object({
			logistics_line: z.number(),
			article: z.number(),
			article_reference: z.string().default(''),
			designation: z.string().default(''),
			remaining_quantity: z.string().default(''),
			quantity: z.string().default(''),
			emplacement: z.string().default(''),
		}),
	),
	proforma_fournisseur_file: documentFile,
	titre_importation_file: documentFile,
	documents_originaux_file: documentFile,
	justificatifs_file: documentFile,
	swift_file: documentFile,
	fichier: documentFile,
	decision: z.enum(['control', 'request_correction', 'validate', 'reject']),
	confirmer_production: z.boolean(),
	statut: z.string().default(''),
}) satisfies z.ZodType<PurchaseFormValues>;

/** Full Formik value shape; only the selected action's business fields are required. */
export const getSupplierPurchaseSchema = (mode: PurchaseFormMode, context: SupplierPurchaseSchemaContext = {}) =>
	formShape.superRefine((values, ctx) => {
		const issue = (path: (string | number)[], message: string) => ctx.addIssue({ code: 'custom', path, message });
		const required = (key: keyof PurchaseFormValues, message = 'Ce champ est obligatoire.') => {
			if (!String(values[key] ?? '').trim()) issue([key], message);
		};
		const text = (key: keyof PurchaseFormValues, max: number, mandatory = false) => {
			if (mandatory) required(key);
			if (String(values[key]).length > max) issue([key], `Saisissez au maximum ${max} caractères.`);
		};
		const numeric = (
			value: string,
			path: (string | number)[],
			mandatory = false,
			positive = false,
			decimals = 2,
			max = 9999999999.99,
		) => {
			if (!value.trim()) {
				if (mandatory) issue(path, 'Ce champ est obligatoire.');
				return;
			}
			const pattern = decimals === 0 ? /^\d+$/ : new RegExp(`^\\d+(?:\\.\\d{1,${decimals}})?$`);
			if (
				!pattern.test(value.trim()) ||
				!Number.isFinite(Number(value)) ||
				Number(value) > max ||
				(positive && Number(value) <= 0)
			) {
				issue(path, positive ? 'Saisissez un nombre supérieur à zéro.' : 'Saisissez un nombre positif ou nul.');
			}
		};
		const id = (key: 'responsable' | 'marque' | 'echeance_id', mandatory = true) =>
			numeric(values[key], [key], mandatory, true, 0, Number.MAX_SAFE_INTEGER);
		const email = (key: 'fournisseur_email' | 'email_contact') => {
			if (values[key].trim() && !z.email().safeParse(values[key].trim()).success)
				issue([key], 'Saisissez une adresse e-mail valide.');
		};
		const date = (key: keyof PurchaseFormValues, mandatory = false, actual = false) => {
			const value = String(values[key]);
			if (!value) {
				if (mandatory) required(key);
				return;
			}
			if (!z.iso.date().safeParse(value).success) {
				issue([key], 'Saisissez une date valide.');
				return;
			}
			const now = new Date();
			const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
			if (actual && value > localToday) issue([key], 'Une date réelle ne peut pas être dans le futur.');
		};
		const currency = (key: 'devise_proforma_fournisseur' | 'devise_titre_importation') => {
			if (!['MAD', 'EUR', 'USD'].includes(values[key])) issue([key], 'Choisissez une devise.');
		};
		const costs = (
			keys: ('cout_transport' | 'frais_transit' | 'frais_douane' | 'tva' | 'livraison_locale' | 'autres_frais')[],
		) => {
			keys.forEach((key) => numeric(values[key], [key]));
		};

		if (mode === 'dossier') {
			text('fournisseur', 255, true);
			email('fournisseur_email');
			id('responsable');
			id('marque', false);
			date('date_prevue');
			date('date_commande_client');
		} else if (mode === 'proforma') {
			text('numero_proforma_fournisseur', 120, true);
			date('date_proforma_fournisseur', true);
			numeric(values.montant_proforma_fournisseur, ['montant_proforma_fournisseur'], true, true);
			currency('devise_proforma_fournisseur');
			text('incoterm', 50, true);
			numeric(values.delai_proforma_jours, ['delai_proforma_jours'], true, false, 0, 2147483647);
			if (!PURCHASE_CONDITIONS.some(([code]) => code === values.condition_achat))
				issue(['condition_achat'], 'Choisissez une condition d’achat.');
			if (values.condition_achat === 'advance100' && Number(values.montant_proforma_fournisseur) >= 18000) {
				issue(
					['condition_achat'],
					'Le paiement intégral d’avance est réservé aux montants inférieurs à 18 000 dans la devise choisie.',
				);
			}
			if (!values.proforma_fournisseur_file && !context.existingProformaFile)
				issue(['proforma_fournisseur_file'], 'Joignez la proforma fournisseur.');
			text('origine_marchandise', 255);
			text('nature_marchandise', 255);
			numeric(values.poids_net, ['poids_net'], false, false, 2, 99999999.99);
			numeric(values.poids_brut, ['poids_brut'], false, false, 2, 99999999.99);
			numeric(values.volume, ['volume'], false, false, 3, 9999999.999);
			if (!values.lignes.length) issue(['lignes'], 'Ajoutez les articles de la proforma fournisseur.');
			values.lignes.forEach((line, index) => {
				if (!line.article || !Number.isInteger(line.article) || line.article < 1)
					issue(['lignes', index, 'article'], 'Choisissez un article.');
				numeric(line.quantity, ['lignes', index, 'quantity'], true, true, 3, 9999999.999);
				numeric(line.prix_achat, ['lignes', index, 'prix_achat'], true, false, 2, 99999999.99);
			});
			const anomaly = values.ecart_prix_proforma || values.ecart_quantite_proforma || values.ecart_autre_proforma;
			if (values.decision === 'request_correction' && !anomaly)
				issue(['ecart_autre_proforma'], 'Signalez au moins une anomalie avant de demander une correction.');
			if (values.decision === 'validate' && anomaly)
				issue(['notes_ecarts_proforma'], 'Corrigez les anomalies avant de valider la proforma.');
			if (values.decision === 'request_correction' || values.decision === 'reject')
				required('notes_ecarts_proforma', 'Expliquez les anomalies ou le motif du refus.');
		} else if (mode === 'titre') {
			text('numero_domiciliation', 120, true);
			text('banque', 255, true);
			numeric(values.montant_titre_importation, ['montant_titre_importation'], true, true);
			currency('devise_titre_importation');
			date('date_titre_importation', true);
			if (!values.titre_importation_file && !context.existingTitleFile)
				issue(['titre_importation_file'], 'Joignez le titre d’importation.');
		} else if (mode === 'production') {
			date('date_expedition_prevue', true);
		} else if (mode === 'expedition') {
			date('date_expedition_reelle', true, true);
			text('transport', 100);
		} else if (mode === 'transit') {
			date('date_arrivee_maroc', false, true);
			date('documents_remis_banque_le', false, true);
			if (
				values.date_arrivee_maroc &&
				values.date_expedition_reelle &&
				values.date_arrivee_maroc < values.date_expedition_reelle
			)
				issue(['date_arrivee_maroc'], 'L’arrivée au Maroc doit suivre l’expédition.');
			costs(['cout_transport', 'frais_transit', 'frais_douane', 'tva']);
		} else if (mode === 'reception') {
			text('reference_reception', 80);
			if (context.managedReceipt) {
				if (!values.reception_lignes.some((line) => Number(line.quantity) > 0))
					issue(['reception_lignes'], 'Renseignez au moins une quantité reçue.');
				values.reception_lignes.forEach((line, index) => {
					numeric(line.quantity, ['reception_lignes', index, 'quantity'], false, false, 3, 999999999.999);
					if (Number(line.quantity) > 0) {
						if (Number(line.quantity) > Number(line.remaining_quantity))
							issue(['reception_lignes', index, 'quantity'], 'La quantité reçue dépasse la quantité restante.');
						numeric(
							line.emplacement,
							['reception_lignes', index, 'emplacement'],
							true,
							true,
							0,
							Number.MAX_SAFE_INTEGER,
						);
					}
				});
			} else {
				date('date_reelle', true, true);
				if (values.date_reelle && values.date_expedition_reelle && values.date_reelle < values.date_expedition_reelle)
					issue(['date_reelle'], 'La réception doit suivre l’expédition.');
			}
		} else if (mode === 'couts') {
			costs(['cout_transport', 'frais_transit', 'frais_douane', 'tva', 'livraison_locale', 'autres_frais']);
		} else if (mode === 'demande_paiement') {
			id('echeance_id');
			date('date_echeance', true);
		} else if (mode === 'paiement') {
			id('echeance_id');
			date('date_paiement', true, true);
			numeric(values.montant_paye, ['montant_paye'], true, true);
			if (context.maxPayment !== undefined && Number(values.montant_paye) > context.maxPayment)
				issue(['montant_paye'], 'Le montant payé dépasse le montant restant de cette échéance.');
			text('reference_paiement', 120);
		} else if (mode === 'justificatif') {
			id('echeance_id');
			if (!values.swift_file) issue(['swift_file'], 'Joignez le justificatif bancaire.');
		} else if (mode === 'remarque') {
			required('remarque', 'Renseignez votre remarque.');
		} else if (mode === 'repertoire') {
			text('nom', 255, true);
			email('email_contact');
		}
	});
