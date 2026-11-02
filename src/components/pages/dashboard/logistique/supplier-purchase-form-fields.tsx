'use client';

import SupplierPurchaseProformaFields from './supplier-purchase-proforma-fields';

import CustomAutoCompleteSelect from '@/components/formikElements/customAutoCompleteSelect/customAutoCompleteSelect';
import CustomDropDownSelect from '@/components/formikElements/customDropDownSelect/customDropDownSelect';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import FormattedNumberInput from '@/components/formikElements/formattedNumberInput/formattedNumberInput';
import type { DropDownType } from '@/types/accountTypes';
import type { PurchaseFormValues, SupplierPurchaseFormFieldsProps } from '@/types/supplierPurchaseTypes';
import { formatLocalDate } from '@/utils/helpers';
import {
	logistiqueManagerRoles,
	logistiquePaymentMethodItemsList,
	MOROCCAN_BANKS,
	purchaseFormTitles as titles,
} from '@/utils/rawData';
import { textInputTheme } from '@/utils/themes';
import {
	Business,
	CalendarToday,
	Description,
	Email,
	Inventory,
	LocalShipping,
	Notes,
	Payment,
	Person,
	Public,
} from '@mui/icons-material';
import { Alert, Box, Checkbox, FormControlLabel, InputAdornment, Stack, Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { getIn } from 'formik';
import { useRouter, useSearchParams } from 'next/navigation';
import { type ReactNode } from 'react';
import FormCard, { full, grid } from './supplier-purchase-form-card';
const inputTheme = textInputTheme();
const value = (input: unknown) => (input == null ? '' : String(input));
export default function SupplierPurchaseFormFields({
	attempted,
	formik,
	t,
	disabled,
	isCorrection,
	responsibles,
	order,
	locations,
	mode,
	id,
	numberPreview,
	numberPreviewError,
	suppliers,
	filteredBrands,
	brands,
	articles,
	setSearch,
	addNewArticle,
	loadingArticles,
	hasAnomaly,
	transitAfterReceipt,
	managedReceipt,
	installment,
}: SupplierPurchaseFormFieldsProps) {
	const query = useSearchParams();
	const router = useRouter();
	const errorFor = (name: string) =>
		attempted || getIn(formik.touched, name) ? (getIn(formik.errors, name) as string | undefined) : undefined;
	const placeholderFor = (name: string, label: string) =>
		t.logistique.placeholders[name.split('.').at(-1) ?? name] ?? label;
	const text = (
		name: string,
		label: string,
		icon: ReactNode = <Description fontSize="small" />,
		required = false,
		multiline = false,
		helper?: string,
		readOnly = false,
	) => (
		<CustomTextInput
			id={name}
			name={name}
			type={multiline ? 'textarea' : 'text'}
			label={label}
			placeholder={placeholderFor(name, label)}
			value={value(getIn(formik.values, name))}
			onChange={formik.handleChange(name)}
			onBlur={formik.handleBlur(name)}
			helperText={errorFor(name) ?? helper}
			error={!!errorFor(name)}
			required={required}
			disabled={disabled || (readOnly && (name === 'notes_ecarts_proforma' || !isCorrection))}
			fullWidth
			size="small"
			theme={inputTheme}
			startIcon={icon}
			minRows={multiline ? 3 : undefined}
			ai={multiline}
		/>
	);
	const number = (
		name: string,
		label: string,
		icon: ReactNode = <Payment fontSize="small" />,
		decimals = 2,
		required = false,
	) => (
		<FormattedNumberInput
			id={name}
			type="text"
			label={label}
			placeholder={placeholderFor(name, label)}
			value={value(getIn(formik.values, name))}
			onChange={formik.handleChange(name)}
			onBlur={formik.handleBlur(name)}
			helperText={errorFor(name)}
			error={!!errorFor(name)}
			required={required}
			disabled={disabled}
			fullWidth
			size="small"
			theme={inputTheme}
			startIcon={icon}
			decimals={decimals}
		/>
	);
	const date = (name: string, label: string, required = false, helper?: string, readOnly = false) => (
		<DatePicker
			label={label}
			value={getIn(formik.values, name) ? new Date(`${getIn(formik.values, name)}T00:00:00`) : null}
			onChange={(entry) => {
				void formik.setFieldValue(name, entry && !Number.isNaN(entry.getTime()) ? formatLocalDate(entry) : '');
			}}
			format="dd/MM/yyyy"
			disabled={disabled || (readOnly && !isCorrection)}
			slotProps={{
				textField: {
					size: 'small',
					fullWidth: true,
					required,
					error: !!errorFor(name),
					helperText: errorFor(name) ?? helper,
					onBlur: () => formik.setFieldTouched(name, true),
					slotProps: {
						input: {
							startAdornment: (
								<InputAdornment position="start">
									<CalendarToday fontSize="small" color="action" />
								</InputAdornment>
							),
						},
					},
				},
			}}
		/>
	);
	const select = (
		name: string,
		label: string,
		items: string[],
		icon: ReactNode = <Description fontSize="small" />,
		required = false,
	) => (
		<CustomDropDownSelect
			id={name}
			label={label}
			placeholder={placeholderFor(name, label)}
			items={items}
			value={value(getIn(formik.values, name))}
			onChange={(event) => formik.setFieldValue(name, event.target.value)}
			onBlur={() => formik.setFieldTouched(name, true)}
			helperText={errorFor(name)}
			error={!!errorFor(name)}
			required={required}
			disabled={disabled}
			size="small"
			theme={inputTheme}
			startIcon={icon}
		/>
	);
	const autocomplete = (
		name: string,
		label: string,
		items: DropDownType[],
		required = false,
		icon: ReactNode = <Description fontSize="small" />,
	) => (
		<CustomAutoCompleteSelect
			id={name}
			label={label}
			placeholder={placeholderFor(name, label)}
			items={items}
			value={items.find((item) => String(item.value) === value(getIn(formik.values, name))) ?? null}
			onChange={(_, entry) => formik.setFieldValue(name, entry?.value ?? '')}
			onBlur={() => formik.setFieldTouched(name, true)}
			helperText={errorFor(name)}
			error={!!errorFor(name)}
			required={required}
			disabled={disabled}
			fullWidth
			size="small"
			theme={inputTheme}
			startIcon={icon}
			noOptionsText="Aucune option disponible"
		/>
	);
	const checkbox = (name: keyof PurchaseFormValues, label: string) => (
		<FormControlLabel
			label={label}
			control={
				<Checkbox
					size="small"
					checked={!!formik.values[name]}
					disabled={disabled}
					onChange={(_, checked) => formik.setFieldValue(name, checked)}
				/>
			}
		/>
	);
	const articlesTotal = formik.values.lignes.reduce(
		(sum, line) => sum + (Number(line.quantity) || 0) * (Number(line.prix_achat) || 0),
		0,
	);
	const responsibleItems: DropDownType[] = responsibles
		.filter((entry) => logistiqueManagerRoles.has(entry.role))
		.map((entry) => ({
			value: String(entry.id),
			code: entry.label,
		}));
	if (!responsibleItems.some((entry) => entry.value === formik.values.responsable))
		responsibleItems.push({ value: formik.values.responsable, code: order?.responsable_name ?? 'Vous-même' });
	const locationItems: DropDownType[] = locations.map((entry) => ({ value: String(entry.id), code: entry.nom }));
	const decisionLabels: Record<string, string> = {
		control: 'Enregistrer le contrôle',
		request_correction: 'Demander une correction',
		validate: 'Valider la proforma',
		reject: 'Refuser la proforma',
	};
	const decisionItems: DropDownType[] = Object.entries(decisionLabels).map(([choice, label]) => ({
		value: choice,
		code: label,
	}));
	const sections: ReactNode[] = [];
	if (mode === 'dossier')
		sections.push(
			<FormCard key="dossier" title="Informations du dossier" icon={<Business color="primary" />}>
				<CustomTextInput
					id="numero_commande"
					type="text"
					label={t.logistique.colNumero}
					placeholder={t.logistique.placeholders.numero_commande}
					value={id ? (order?.numero_commande ?? '') : (numberPreview?.numero_commande ?? '')}
					onChange={() => undefined}
					helperText={!id && numberPreviewError ? t.logistique.numberPreviewError : undefined}
					disabled
					fullWidth
					size="small"
					theme={inputTheme}
					startIcon={<Description fontSize="small" />}
				/>
				<CustomAutoCompleteSelect
					id="fournisseur_record"
					label="Fournisseur enregistré"
					placeholder={t.logistique.placeholders.fournisseur_record}
					items={suppliers.map((supplier) => ({ value: String(supplier.id), code: supplier.nom }))}
					value={
						suppliers
							.filter((supplier) => String(supplier.id) === formik.values.fournisseur_record)
							.map((supplier) => ({ value: String(supplier.id), code: supplier.nom }))[0] ?? null
					}
					onChange={(_, entry) => {
						void formik.setFieldValue('fournisseur_record', entry?.value ?? '');
						const supplier = suppliers.find((supplier) => String(supplier.id) === entry?.value);
						if (supplier) {
							void formik.setFieldValue('fournisseur', supplier.nom);
							void formik.setFieldValue('fournisseur_email', supplier.email);
							if (!supplier.marques?.includes(Number(formik.values.marque))) void formik.setFieldValue('marque', '');
						}
					}}
					disabled={disabled}
					fullWidth
					size="small"
					theme={inputTheme}
					startIcon={<Business fontSize="small" />}
					noOptionsText="Aucun fournisseur enregistré"
					helperText="Choisissez un fournisseur du répertoire ou saisissez son nom ci-dessous."
				/>
				{text('fournisseur', 'Fournisseur', <Business fontSize="small" />, true)}
				<CustomAutoCompleteSelect
					id="marque"
					label="Marque"
					placeholder={t.logistique.placeholders.marque}
					items={filteredBrands.map((brand) => ({ value: String(brand.id), code: brand.nom }))}
					value={
						brands
							.filter((brand) => String(brand.id) === formik.values.marque)
							.map((brand) => ({ value: String(brand.id), code: brand.nom }))[0] ?? null
					}
					onChange={(_, entry) => {
						void formik.setFieldValue('marque', entry?.value ?? '');
					}}
					onBlur={() => formik.setFieldTouched('marque', true)}
					disabled={disabled}
					fullWidth
					size="small"
					theme={inputTheme}
					startIcon={<Business fontSize="small" />}
					noOptionsText="Aucune marque enregistrée"
				/>
				{text('fournisseur_email', 'E-mail du fournisseur', <Email fontSize="small" />)}
				{autocomplete('responsable', 'Responsable du dossier', responsibleItems, true, <Person fontSize="small" />)}
			</FormCard>,
		);
	if (mode === 'proforma')
		sections.push(
			<SupplierPurchaseProformaFields
				key="proforma"
				text={text}
				date={date}
				number={number}
				select={select}
				formik={formik}
				articles={articles}
				t={t}
				setSearch={setSearch}
				errorFor={errorFor}
				disabled={disabled}
				addNewArticle={addNewArticle}
				loadingArticles={loadingArticles}
				articlesTotal={articlesTotal}
				autocomplete={autocomplete}
				checkbox={checkbox}
				hasAnomaly={hasAnomaly}
				decisionItems={decisionItems}
			/>,
		);
	if (mode === 'titre')
		sections.push(
			<FormCard key="titre" title="Informations du titre d’importation" icon={<Description color="primary" />}>
				{full(
					<Typography variant="body2" color="text.secondary">
						Joignez le titre d’importation ci-dessous. Les informations lues sont proposées dans les champs ;
						vérifiez-les avant d’enregistrer.
					</Typography>,
				)}
				{text('numero_domiciliation', 'N° de domiciliation', <Description fontSize="small" />, true)}
				{autocomplete(
					'banque',
					'Banque',
					[...new Set([...MOROCCAN_BANKS, ...(formik.values.banque ? [formik.values.banque] : [])])].map((bank) => ({
						value: bank,
						code: bank,
					})),
					true,
					<Business fontSize="small" />,
				)}
				{number('montant_titre_importation', 'Montant du titre d’importation', <Payment fontSize="small" />, 2, true)}
				{select(
					'devise_titre_importation',
					'Devise du titre d’importation',
					['MAD', 'EUR', 'USD'],
					<Public fontSize="small" />,
					true,
				)}
				{date('date_titre_importation', 'Date du titre d’importation', true)}
			</FormCard>,
		);
	if (mode === 'production')
		sections.push(
			<FormCard key="production" title="Préparation fournisseur" icon={<LocalShipping color="primary" />}>
				{date('date_expedition_prevue', 'Date d’expédition prévue', true, 'Date annoncée par le fournisseur.')}
				{!order?.production_confirmee_le &&
					checkbox('confirmer_production', 'Le fournisseur a confirmé le début de production')}
				{full(
					text(
						'remarque',
						'Remarque sur le retard',
						<Notes fontSize="small" />,
						false,
						true,
						'Expliquez le retard si la date d’expédition prévue a été dépassée.',
					),
				)}
			</FormCard>,
		);
	if (mode === 'expedition')
		sections.push(
			<FormCard key="expedition" title="Expédition et documents" icon={<LocalShipping color="primary" />}>
				{date('date_expedition_reelle', 'Date réelle d’expédition', true, undefined, !!order?.date_expedition_reelle)}
				{text(
					'transport',
					'Transport',
					<LocalShipping fontSize="small" />,
					false,
					false,
					'Par exemple : maritime, aérien ou routier.',
				)}
				{checkbox('documents_originaux_requis', 'Documents originaux requis')}
				{formik.values.documents_originaux_requis &&
					select('statut_documents_originaux', 'État des documents originaux', [
						'Demandé',
						'Réceptionné',
						'Retourné pour correction',
						'Refusé',
					])}
				{full(text('remarque', 'Remarque sur l’expédition / le retard', <Notes fontSize="small" />, false, true))}
			</FormCard>,
		);
	if (mode === 'transit')
		sections.push(
			<FormCard key="transit" title="Transit et douane" icon={<LocalShipping color="primary" />}>
				{transitAfterReceipt
					? full(
							<Alert severity="info">
								Le dossier reste à l’étape « {order?.statut} ». Vous pouvez compléter les informations de transit et les
								pièces jointes.
							</Alert>,
						)
					: select('statut', 'Phase du dossier', ['Transit', 'Dédouanement'], <LocalShipping fontSize="small" />, true)}
				{date('date_arrivee_maroc', 'Date d’arrivée au Maroc', false, undefined, !!order?.date_arrivee_maroc)}
				{date(
					'documents_remis_banque_le',
					'Documents remis à la banque le',
					false,
					undefined,
					!!order?.documents_remis_banque_le,
				)}
				{number('cout_transport', `Transport (${order?.devise})`, <LocalShipping fontSize="small" />)}
				{number('frais_transit', `Frais de transit (${order?.devise})`, <LocalShipping fontSize="small" />)}
				{number('frais_douane', `Droits de douane (${order?.devise})`)}
				{number('tva', `TVA (${order?.devise})`)}
				{full(text('remarque', 'Remarque', <Notes fontSize="small" />, false, true))}
			</FormCard>,
		);
	if (mode === 'reception')
		sections.push(
			<FormCard key="reception" title="Réception des marchandises" icon={<Inventory color="primary" />}>
				{isCorrection &&
					managedReceipt &&
					full(
						<CustomAutoCompleteSelect
							id="correction-reception"
							startIcon={<Inventory fontSize="small" />}
							label="Réception à corriger"
							placeholder="Sélectionnez la réception"
							noOptionsText="Aucune réception"
							items={(order?.receptions ?? []).map((entry) => ({
								value: String(entry.id),
								code: entry.reference || `Réception ${entry.id}`,
							}))}
							value={(() => {
								const entry = order?.receptions?.find(
									(receipt) => receipt.id === Number(query.get('reception_id') ?? order?.receptions?.[0]?.id),
								);
								return entry ? { value: String(entry.id), code: entry.reference || `Réception ${entry.id}` } : null;
							})()}
							onChange={(_, entry) => {
								if (entry) {
									const url = new URL(window.location.href);
									url.searchParams.set('reception_id', entry.value);
									router.replace(url.pathname + url.search);
								}
							}}
							fullWidth
							size="small"
							theme={inputTheme}
							disabled={disabled}
						/>,
					)}
				{isCorrection &&
					managedReceipt &&
					full(
						<Alert severity="info">
							La référence et la note peuvent être corrigées. Les quantités validées restent enregistrées dans les
							mouvements de stock.
						</Alert>,
					)}
				{managedReceipt &&
					full(
						text(
							'reference_reception',
							'Référence de réception',
							<Description fontSize="small" />,
							false,
							false,
							'Référence du bon de réception ou du document reçu, si disponible.',
						),
					)}
				{managedReceipt
					? (isCorrection ? [] : formik.values.reception_lignes).map((line, index) => (
							<Box key={line.logistics_line} sx={{ gridColumn: { md: '1 / -1' } }}>
								<Stack spacing={2}>
									{text(
										`reception_lignes.${index}.designation`,
										'Article reçu',
										<Inventory fontSize="small" />,
										false,
										false,
										`Référence : ${line.article_reference} · Restant : ${line.remaining_quantity}`,
										true,
									)}
									<Box sx={grid}>
										{number(
											`reception_lignes.${index}.quantity`,
											'Quantité reçue maintenant',
											<Inventory fontSize="small" />,
											3,
										)}
										{autocomplete(
											`reception_lignes.${index}.emplacement`,
											'Emplacement de réception',
											locationItems,
											false,
											<Inventory fontSize="small" />,
										)}
									</Box>
								</Stack>
							</Box>
						))
					: date('date_reelle', 'Date réelle de réception', true)}
				{full(text('note', 'Note de réception', <Notes fontSize="small" />, false, true))}
			</FormCard>,
		);
	if (mode === 'couts')
		sections.push(
			<FormCard key="couts" title="Coûts du dossier" icon={<Payment color="primary" />}>
				{number('cout_transport', `Transport (${order?.devise})`, <LocalShipping fontSize="small" />)}
				{number('frais_transit', `Frais de transit (${order?.devise})`)}
				{number('frais_douane', `Droits de douane (${order?.devise})`)}
				{number('tva', `TVA (${order?.devise})`)}
				{number('livraison_locale', `Livraison locale (${order?.devise})`, <LocalShipping fontSize="small" />)}
				{number('autres_frais', `Autres frais (${order?.devise})`)}
				{full(text('remarque', 'Remarque sur les frais', <Notes fontSize="small" />, false, true))}
			</FormCard>,
		);
	if (['demande_paiement', 'paiement', 'justificatif'].includes(mode))
		sections.push(
			<FormCard key="paiement" title={titles[mode]} icon={<Payment color="primary" />}>
				{isCorrection &&
					full(
						<CustomAutoCompleteSelect
							id="correction-echeance"
							startIcon={<Payment fontSize="small" />}
							noOptionsText="Aucun paiement validé"
							label="Paiement à corriger"
							placeholder="Sélectionnez le paiement"
							items={(order?.echeancier_paiement ?? [])
								.filter(
									(entry) =>
										entry.paiement_valide_le &&
										(entry.declencheur === 'advance' ? 'paiement' : 'solde') ===
											(query.get('etape_correction') ?? 'paiement'),
								)
								.map((entry) => ({
									value: String(entry.id),
									code: `${entry.montant_paye} ${entry.devise} · ${entry.reference_bancaire || 'Sans référence'}`,
								}))}
							value={
								installment
									? {
											value: String(installment.id),
											code: `${installment.montant_paye} ${installment.devise} · ${installment.reference_bancaire || 'Sans référence'}`,
										}
									: null
							}
							onChange={(_, entry) => {
								if (entry) {
									const url = new URL(window.location.href);
									url.searchParams.set('echeance_id', entry.value);
									router.replace(url.pathname + url.search);
								}
							}}
							fullWidth
							size="small"
							theme={inputTheme}
						/>,
					)}
				{full(
					<Alert severity="info">
						{installment
							? `${Number(installment.pourcentage)} % : ${Number(installment.montant_prevu).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} ${installment.devise} par ${installment.methode_paiement}`
							: 'Échéance introuvable. Retournez au dossier.'}
					</Alert>,
				)}
				{mode === 'demande_paiement' && date('date_echeance', 'Date d’échéance', true)}
				{mode === 'paiement' && (
					<>
						{!isCorrection && date('date_paiement', 'Date du paiement effectué', true)}
						{!isCorrection &&
							select(
								'methode_paiement',
								'Méthode de paiement',
								logistiquePaymentMethodItemsList.filter((method) => method !== ''),
								<Payment fontSize="small" />,
								true,
							)}
						{!isCorrection &&
							number('montant_paye', `Montant payé (${installment?.devise})`, <Payment fontSize="small" />, 2, true)}
						{text('reference_paiement', 'Référence bancaire', <Description fontSize="small" />)}
						{full(text('commentaire_paiement', 'Commentaire', <Notes fontSize="small" />, false, true))}
					</>
				)}
				{mode === 'justificatif' &&
					full(
						<Typography variant="body2">
							Joignez le justificatif du paiement effectué. Le créateur du dossier sera prévenu après validation.
						</Typography>,
					)}
			</FormCard>,
		);
	if (mode === 'remarque')
		sections.push(
			<FormCard key="remarque" title="Remarque sur le dossier" icon={<Notes color="primary" />}>
				{full(text('remarque', 'Remarque', <Notes fontSize="small" />, true, true))}
			</FormCard>,
		);

	return <>{sections}</>;
}
