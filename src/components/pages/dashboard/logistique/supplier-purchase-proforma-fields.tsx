'use client';

import LogistiqueParameterSelect from './logistique-parameter-select';

import { purchaseLineFromArticle, withPurchaseLines } from '@/utils/logisticsPurchaseLines';
import CustomAutoCompleteSelect from '@/components/formikElements/customAutoCompleteSelect/customAutoCompleteSelect';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import Controls from '@/styles/dashboard/logistique/logistique-controls.module.sass';
import type { DropDownType } from '@/types/accountTypes';
import type { SupplierPurchaseProformaFieldsProps } from '@/types/supplierPurchaseTypes';
import { PURCHASE_CONDITIONS } from '@/utils/rawData';
import { textInputTheme } from '@/utils/themes';
import {
	Add,
	CalendarToday,
	CheckCircle,
	Delete,
	Description,
	Inventory,
	Notes,
	Payment,
	Public,
	Scale,
} from '@mui/icons-material';
import { Alert, Box, Button, IconButton, Stack, Typography } from '@mui/material';
import FormCard, { full, grid } from './supplier-purchase-form-card';
const inputTheme = textInputTheme();
export default function SupplierPurchaseProformaFields({
	companyId,
	order,
	text,
	date,
	number,
	select,
	formik,
	articles,
	t,
	setSearch,
	errorFor,
	disabled,
	addNewArticle,
	loadingArticles,
	articlesTotal,
	autocomplete,
	checkbox,
	hasAnomaly,
}: SupplierPurchaseProformaFieldsProps) {
	const validated = !!order?.is_proforma_step_complete;
	return (
		<>
			<FormCard key="proforma" title="Proforma fournisseur" icon={<Description color="primary" />}>
				{text('numero_proforma_fournisseur', 'N° de proforma fournisseur', <Description fontSize="small" />, true)}
				{date('date_proforma_fournisseur', 'Date de la proforma fournisseur', true)}
				{number('montant_proforma_fournisseur', 'Montant total fournisseur', <Payment fontSize="small" />, 2, true)}
				{select(
					'devise_proforma_fournisseur',
					'Devise de la proforma fournisseur',
					['MAD', 'EUR', 'USD'],
					<Public fontSize="small" />,
					true,
				)}
				<LogistiqueParameterSelect
					kind="incoterm"
					companyId={companyId}
					value={formik.values.incoterm}
					recordId={formik.values.incoterm === order?.incoterm ? order?.incoterm_record : undefined}
					onChange={(term) => void formik.setFieldValue('incoterm', term)}
					onBlur={() => void formik.setFieldTouched('incoterm', true)}
					error={errorFor('incoterm')}
					disabled={disabled}
				/>
				{number('delai_proforma_jours', 'Délai fournisseur (jours)', <CalendarToday fontSize="small" />, 0, true)}
				{order?.is_proforma_step_complete &&
					order.workflow?.proforma_total_editable &&
					Number(formik.values.montant_proforma_fournisseur) !== Number(order.montant_proforma_fournisseur) &&
					full(<Alert severity="info">Les échéances seront recalculées après approbation de la correction.</Alert>)}
			</FormCard>
			<FormCard key="lignes" title="Articles de la proforma fournisseur" icon={<Inventory color="primary" />}>
				{full(
					<Typography variant="body2" color="text.secondary">
						{validated && !order.workflow?.proforma_lines_editable
							? 'Les quantités et prix d’achat sont verrouillés.'
							: 'Renseignez les quantités et prix d’achat du document fournisseur.'}
					</Typography>,
				)}
				{formik.values.lignes.map((line, index) => {
					const selected = line.article
						? { value: String(line.article), code: `${line.article_reference} : ${line.designation}` }
						: null;
					const options: DropDownType[] = (articles ?? [])
						.filter((article) => article.id)
						.map((article) => ({
							value: String(article.id),
							code: `${article.reference ?? ''} : ${article.designation ?? ''}`,
						}));
					if (selected && !options.some((entry) => entry.value === selected.value)) options.unshift(selected);
					return (
						<Box
							key={index}
							sx={{ gridColumn: { md: '1 / -1' }, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
						>
							<Stack spacing={2}>
								<Box className={Controls.articleSelectorRow}>
									<CustomAutoCompleteSelect
										placeholder={t.logistique.placeholders.article}
										id={`lignes.${index}.article`}
										label="Article : référence et désignation"
										serverFiltered
										items={options}
										value={selected}
										onInputChange={(_, input, reason) => {
											if (reason === 'input') setSearch(input);
										}}
										onChange={(_, entry) => {
											const article = articles.find((item) => String(item.id) === entry?.value);
											const updated = purchaseLineFromArticle(
												article,
												formik.values.devise_proforma_fournisseur,
												line.quantity,
											);
											const next = formik.values.lignes.map((item, position) => (position === index ? updated : item));
											void formik.setValues((previous) => withPurchaseLines(previous, next, articles));
										}}
										onBlur={() => formik.setFieldTouched(`lignes.${index}.article`, true)}
										helperText={errorFor(`lignes.${index}.article`)}
										error={!!errorFor(`lignes.${index}.article`)}
										disabled={disabled || validated}
										required
										fullWidth
										size="small"
										theme={inputTheme}
										startIcon={<Inventory fontSize="small" />}
										endIcon={
											!validated && (
												<Button
													size="small"
													variant="outlined"
													disabled={disabled}
													onClick={() => void addNewArticle()}
													className={Controls.inlineAction}
												>
													{t.common.add}
												</Button>
											)
										}
										noOptionsText={loadingArticles ? 'Recherche en cours…' : 'Aucun article trouvé'}
									/>
									{!validated && (
										<IconButton
											size="small"
											color="error"
											disabled={disabled}
											title={t.common.delete}
											className={Controls.articleDeleteAction}
											aria-label={`Retirer l’article ${index + 1}`}
											onClick={() =>
												formik.setValues((previous) =>
													withPurchaseLines(
														previous,
														previous.lignes.filter((_, position) => position !== index),
														articles,
													),
												)
											}
										>
											<Delete fontSize="small" />
										</IconButton>
									)}
								</Box>
								<Box sx={grid}>
									{number(`lignes.${index}.quantity`, 'Quantité achetée', <Inventory fontSize="small" />, 3, true)}
									{number(
										`lignes.${index}.prix_achat`,
										`Prix unitaire d’achat (${formik.values.devise_proforma_fournisseur})`,
										<Payment fontSize="small" />,
										2,
										true,
									)}
								</Box>
							</Stack>
						</Box>
					);
				})}
				{full(
					<Typography variant="subtitle2">
						Total des articles :{' '}
						{articlesTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
						{formik.values.devise_proforma_fournisseur}
					</Typography>,
				)}
				{formik.values.lignes.length > 0 &&
					formik.values.lignes.every((line) => line.quantity && line.prix_achat) &&
					Number(formik.values.montant_proforma_fournisseur) > 0 &&
					Math.abs(articlesTotal - Number(formik.values.montant_proforma_fournisseur)) >= 0.01 &&
					full(
						<Alert severity="warning">
							Le total des articles diffère du montant de la proforma fournisseur. Vérifiez les quantités, les prix, les
							remises et les frais du document avant de valider.
						</Alert>,
					)}
				{!validated &&
					full(
						<PrimaryLoadingButton
							buttonText="Ajouter un article"
							size="small"
							loading={false}
							active={!disabled}
							inverted
							startIcon={<Add />}
							onClick={() =>
								formik.setFieldValue('lignes', [
									...formik.values.lignes,
									{
										article: null,
										article_reference: '',
										designation: '',
										quantity: '1',
										prix_achat: '',
										expected_emplacement: null,
									},
								])
							}
						/>,
					)}
			</FormCard>
			<FormCard key="controle" title="Conditions d’achat et contrôle" icon={<CheckCircle color="primary" />}>
				{full(
					autocomplete(
						'condition_achat',
						'Conditions d’achat',
						PURCHASE_CONDITIONS.map(([choice, label]) => ({ value: choice, code: label })),
						true,
						<Payment fontSize="small" />,
					),
				)}
				{formik.values.condition_achat === 'advance100' &&
					full(
						<Alert severity={Number(formik.values.montant_proforma_fournisseur) >= 18000 ? 'error' : 'info'}>
							Le paiement intégral d’avance est réservé aux montants inférieurs à 18 000{' '}
							{formik.values.devise_proforma_fournisseur}, sans conversion.
						</Alert>,
					)}
				<LogistiqueParameterSelect
					kind="origine_marchandise"
					companyId={companyId}
					value={formik.values.origine_marchandise}
					recordId={
						formik.values.origine_marchandise === order?.origine_marchandise
							? order?.origine_marchandise_record
							: undefined
					}
					onChange={(term) => void formik.setFieldValue('origine_marchandise', term)}
					onBlur={() => void formik.setFieldTouched('origine_marchandise', true)}
					error={errorFor('origine_marchandise')}
					disabled={disabled}
				/>
				<LogistiqueParameterSelect
					kind="nature_marchandise"
					companyId={companyId}
					value={formik.values.nature_marchandise}
					recordId={
						formik.values.nature_marchandise === order?.nature_marchandise
							? order?.nature_marchandise_record
							: undefined
					}
					onChange={(term) => void formik.setFieldValue('nature_marchandise', term)}
					onBlur={() => void formik.setFieldTouched('nature_marchandise', true)}
					error={errorFor('nature_marchandise')}
					disabled={disabled}
				/>
				{number('poids_net', 'Poids net (kg)', <Scale fontSize="small" />)}
				{number('poids_brut', 'Poids brut (kg)', <Scale fontSize="small" />)}
				{full(
					<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
						{checkbox('ecart_prix_proforma', 'Anomalie de prix')}
						{checkbox('ecart_quantite_proforma', 'Anomalie de quantité')}
						{checkbox('ecart_autre_proforma', 'Autre anomalie')}
					</Stack>,
				)}
				{full(
					text(
						'notes_ecarts_proforma',
						'Détail des anomalies / motif',
						<Notes fontSize="small" />,
						false,
						true,
						undefined,
						!hasAnomaly,
					),
				)}
			</FormCard>
		</>
	);
}
