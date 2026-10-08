import { useState } from 'react';
import { Box, Chip, Divider, Paper, Stack, Typography } from '@mui/material';
import {
	AccountBalanceWalletOutlined,
	DeleteOutlined,
	EditOutlined,
	OpenInNew,
	PictureAsPdfOutlined,
	ReceiptLongOutlined,
	People,
	Payment,
	RequestQuote,
	Inventory2Outlined,
	LocalShippingOutlined,
} from '@mui/icons-material';
import TextButton from '@/components/htmlElements/buttons/textButton/textButton';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import DashboardStatCard from '@/components/shared/dashboardStatCard/dashboardStatCard';
import type { ChatCard, ChatRecord, NavigationTarget } from './types';
import styles from './chat-ai.module.sass';
import { formatNumberWithSpaces } from '@/utils/helpers';
import { useLanguage } from '@/utils/hooks';
import {
	logistiqueGlobalStatusItemsList,
	logistiqueLegacyWorkflowStatusItemsList,
	stockInventoryStatusOptions,
	stockMovementViewOptions,
	stockReceiptStatusOptions,
	stockStateOptions,
} from '@/utils/rawData';

const documentDate = (value?: string | null) => {
	if (!value) return '';
	const date = new Date(value);
	return Number.isNaN(date.getTime())
		? '—'
		: new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(
				date,
			);
};

const metricLabels: Record<string, string> = {
	invoiced_net_ttc: 'Facturé TTC − avoirs',
	collected: 'Encaissements validés',
	outstanding: 'Solde restant',
	invoice_count: 'Nombre de factures',
};
const labels: Record<string, string> = {
	invoice: 'Facture',
	quote: 'Devis',
	proforma: 'Facture pro forma',
	credit_note: 'Facture d’avoir',
	delivery_note: 'Bon de livraison',
	client: 'Client',
	payment: 'Règlement',
	article: 'Article',
	user: 'Utilisateur',
	stock_balance: 'Stock',
	stock_movement: 'Mouvement de stock',
	stock_receipt: 'Réception de stock',
	stock_inventory: 'Inventaire',
	logistics_order: 'Dossier logistique',
};
const selectableResources = new Set(['invoice', 'quote', 'client', 'proforma', 'credit_note', 'delivery_note']);
const printableResources = new Set(['invoice', 'quote', 'proforma', 'credit_note', 'delivery_note']);
const resourceLabel = (resource?: string) =>
	resource && Object.hasOwn(labels, resource) ? labels[resource] : 'Document';
type EditableField = 'remarque' | 'termes_paiement' | 'date_echeance' | 'raison_sociale' | 'nom' | 'prenom' | 'adresse';
const editableFields: Record<string, readonly EditableField[]> = {
	invoice: ['remarque', 'termes_paiement', 'date_echeance'],
	quote: ['remarque', 'date_echeance'],
	proforma: ['remarque', 'termes_paiement', 'date_echeance'],
	credit_note: ['remarque'],
	delivery_note: ['remarque', 'date_echeance'],
	client: ['raison_sociale', 'nom', 'prenom', 'adresse'],
};
const validConfirmation = (card: ChatCard) => {
	if (!card.resource || !Object.hasOwn(editableFields, card.resource)) return false;
	const changes = card.changes ?? {};
	if (typeof changes !== 'object' || Array.isArray(changes)) return false;
	const fields = Object.keys(changes);
	if (card.operation === 'delete') return fields.length === 0;
	return (
		card.operation === 'update' &&
		fields.length > 0 &&
		fields.every(
			(field) =>
				editableFields[card.resource!].includes(field as EditableField) &&
				(typeof changes[field] === 'string' || changes[field] === null),
		)
	);
};
const confirmationFields = (card: ChatCard) =>
	validConfirmation(card)
		? editableFields[card.resource!].filter((field) => Object.hasOwn(card.changes ?? {}, field))
		: [];
const invalidConfirmationText =
	'Cette action contient un champ non pris en charge. Ouvrez la fiche pour effectuer la modification.';
const recordStatus = (resource: string | undefined, record: ChatRecord) => {
	const status = record.payment_status || record.status;
	if (resource === 'stock_balance') return stockStateOptions.find((option) => option.id === status)?.nom;
	if (resource === 'stock_movement') return stockMovementViewOptions.find((option) => option.value === status)?.label;
	if (resource === 'stock_receipt') return stockReceiptStatusOptions.find((option) => option.value === status)?.label;
	if (resource === 'stock_inventory')
		return stockInventoryStatusOptions.find((option) => option.value === status)?.label;
	if (resource === 'logistics_order')
		return [...logistiqueLegacyWorkflowStatusItemsList, 'Annulé'].find((option) => option === status);
	if (resource === 'payment') return ['Valide', 'Annulé'].find((option) => option === status);
	return status;
};
const DetailText = ({ label, value }: { label: string; value?: string | null }) =>
	value === undefined || value === null || value === '' ? null : (
		<Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>
			{label} : {value}
		</Typography>
	);
const quantity = (value?: string) => (value === undefined ? undefined : formatNumberWithSpaces(value, 3));
const RecordDetails = ({ resource, record }: { resource?: string; record: ChatRecord }) => {
	const { t } = useLanguage();
	return (
		<Stack spacing={0.5} sx={{ mt: 0.5 }}>
			{resource === 'article' && (
				<>
					<DetailText label={t.articles.colDesignation} value={record.designation} />
					<DetailText
						label={t.articles.colType}
						value={
							record.type_article === 'Produit'
								? t.articles.typeProduit
								: record.type_article === 'Service'
									? t.articles.typeService
									: undefined
						}
					/>
					{record.archived && (
						<Typography variant="caption" color="text.secondary">
							{t.common.archived}
						</Typography>
					)}
					<DetailText
						label={record.sale_label === 'price_excl_tax' ? t.articles.colPrixHT : t.articles.colPrixVente}
						value={
							record.sale_amount === undefined
								? undefined
								: `${formatNumberWithSpaces(record.sale_amount)} ${record.sale_currency ?? ''}`
						}
					/>
					<DetailText
						label={t.articles.colPrixAchat}
						value={
							record.purchase_amount === undefined
								? undefined
								: `${formatNumberWithSpaces(record.purchase_amount)} ${record.purchase_currency ?? ''}`
						}
					/>
				</>
			)}
			{resource === 'user' && (
				<>
					<DetailText label={t.users.colEmail} value={record.email} />
					<DetailText
						label={t.users.colAdmin}
						value={record.is_staff === undefined ? undefined : record.is_staff ? t.users.filterOui : t.users.filterNon}
					/>
					<DetailText
						label={t.users.colActive}
						value={
							record.is_active === undefined ? undefined : record.is_active ? t.users.activeChip : t.users.inactiveChip
						}
					/>
				</>
			)}
			{(resource === 'stock_balance' || resource === 'stock_movement') && (
				<DetailText label="Désignation" value={record.product_name} />
			)}
			{resource?.startsWith('stock_') && <DetailText label="Emplacement" value={record.location} />}
			{resource === 'stock_balance' && (
				<>
					<DetailText label="Physique" value={quantity(record.physical_quantity)} />
					<DetailText label="Réservé" value={quantity(record.reserved_quantity)} />
					<DetailText label="Disponible" value={quantity(record.available_quantity)} />
					<DetailText label="Entrant" value={quantity(record.incoming_quantity)} />
					<DetailText label="Projeté" value={quantity(record.projected_quantity)} />
					<DetailText label="Minimum" value={quantity(record.stock_minimum)} />
				</>
			)}
			{resource === 'stock_movement' && (
				<>
					<DetailText label="Quantité" value={quantity(record.quantity)} />
					<DetailText label="Stock après mouvement" value={quantity(record.balance_after)} />
				</>
			)}
			{resource === 'stock_receipt' && <DetailText label="Dossier logistique" value={record.logistics_number} />}
			{(resource === 'stock_receipt' || resource === 'logistics_order') && (
				<DetailText label={t.logistique.colFournisseur} value={record.supplier} />
			)}
			{(resource === 'stock_receipt' || resource === 'stock_inventory') && (
				<DetailText label="Date de validation" value={documentDate(record.date_validated)} />
			)}
			{resource === 'logistics_order' && (
				<>
					<DetailText
						label="Statut global"
						value={logistiqueGlobalStatusItemsList.find((status) => status === record.global_status)}
					/>
					<DetailText label={t.logistique.fieldDatePrevue} value={documentDate(record.date_expected)} />
					<DetailText label={t.logistique.fieldDateReelle} value={documentDate(record.date_received)} />
				</>
			)}
			{['stock_receipt', 'stock_inventory', 'logistics_order'].includes(resource ?? '') &&
				record.lines?.slice(0, 10).map((line) => (
					<Box key={line.id} sx={{ borderTop: 1, borderColor: 'divider', pt: 0.5 }}>
						<DetailText label="Référence" value={line.reference} />
						<DetailText label="Désignation" value={line.product_name} />
						<DetailText label="Emplacement" value={line.location} />
						{resource === 'stock_inventory' ? (
							<>
								<DetailText label="Quantité attendue" value={quantity(line.expected_quantity)} />
								<DetailText label="Quantité comptée" value={quantity(line.counted_quantity)} />
							</>
						) : (
							<>
								<DetailText
									label={resource === 'stock_receipt' ? 'Quantité reçue' : 'Quantité'}
									value={quantity(line.quantity)}
								/>
								{resource === 'logistics_order' && (
									<>
										<DetailText label="Client" value={line.client} />
										<DetailText label={t.logistique.receivedQuantity} value={quantity(line.received_quantity)} />
									</>
								)}
							</>
						)}
					</Box>
				))}
			{record.has_more_lines && (
				<Typography variant="caption" color="text.secondary">
					D’autres lignes sont disponibles dans la fiche.
				</Typography>
			)}
		</Stack>
	);
};
type Props = {
	cards: ChatCard[];
	navigate: (target: NavigationTarget) => void;
	confirm?: (card: ChatCard) => Promise<void>;
	pdf?: (id: number, resource?: string) => void;
	select?: (resource: string, identifier: number, operation: 'edit' | 'delete') => void;
	permissions?: { can_update: boolean; can_delete: boolean; can_print: boolean };
};

export const ChatAIResults = ({ cards, navigate, confirm, pdf, select, permissions }: Props) => {
	const { t } = useLanguage();
	const fieldLabels: Record<EditableField, string> = {
		remarque: t.documentForm.remarqueLabel,
		termes_paiement: t.documentForm.fieldTermesPaiementLabel,
		date_echeance: t.documentForm.fieldDateEcheanceLabel,
		raison_sociale: t.clients.fieldRaisonSociale,
		nom: t.clients.fieldNom,
		prenom: t.clients.fieldPrenom,
		adresse: t.clients.fieldAdresse,
	};
	const [confirmed, setConfirmed] = useState<Set<string>>(new Set());
	const [pending, setPending] = useState<ChatCard | null>(null);
	const [sending, setSending] = useState(false);
	const perform = async () => {
		if (!pending?.action_id || !confirm || sending || !validConfirmation(pending)) return;
		setSending(true);
		try {
			await confirm(pending);
			setConfirmed((old) => new Set(old).add(pending.action_id!));
			setPending(null);
		} finally {
			setSending(false);
		}
	};
	return (
		<Stack spacing={1.5}>
			{cards.map((card, index) => (
				<Box key={index}>
					{card.items && (
						<>
							<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
								{card.items.length
									? `${card.items.length} résultat${card.items.length > 1 ? 's' : ''}`
									: 'Aucun résultat trouvé. Précisez votre recherche.'}
							</Typography>
							{card.items.map((record) => (
								<Paper variant="outlined" key={record.id} className={styles.result}>
									<Stack direction="row" sx={{ gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
										{card.resource === 'client' || card.resource === 'user' ? (
											<People fontSize="small" color="primary" />
										) : card.resource === 'payment' ? (
											<Payment fontSize="small" color="primary" />
										) : card.resource === 'quote' ? (
											<RequestQuote fontSize="small" color="primary" />
										) : card.resource === 'logistics_order' ? (
											<LocalShippingOutlined fontSize="small" color="primary" />
										) : card.resource === 'article' || card.resource?.startsWith('stock_') ? (
											<Inventory2Outlined fontSize="small" color="primary" />
										) : (
											<ReceiptLongOutlined fontSize="small" color="primary" />
										)}
										<Box sx={{ minWidth: 0, flex: 1 }}>
											<Typography variant="caption" color="text.secondary">
												{resourceLabel(card.resource || (card.type === 'invoice' ? 'invoice' : ''))}
											</Typography>
											<Typography variant="body2" sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>
												{card.resource === 'payment'
													? `Facture ${record.number}`
													: record.number || record.name || record.code}
											</Typography>
										</Box>
										{recordStatus(card.resource, record) && (
											<Chip size="small" variant="outlined" label={recordStatus(card.resource, record)} />
										)}
									</Stack>
									{record.client && (
										<Typography variant="body2" sx={{ mt: 1 }}>
											{record.client}
										</Typography>
									)}
									<RecordDetails resource={card.resource} record={record} />
									{(record.date || record.total_ttc !== undefined || record.amount !== undefined) && (
										<Stack direction="row" sx={{ justifyContent: 'space-between', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
											<Typography variant="caption" color="text.secondary">
												{documentDate(record.date)}
											</Typography>
											{(record.total_ttc !== undefined || record.amount !== undefined) && (
												<Typography variant="body2" sx={{ fontWeight: 600 }}>
													{formatNumberWithSpaces(record.total_ttc ?? record.amount)} {record.currency}
												</Typography>
											)}
										</Stack>
									)}
									{record.outstanding && (
										<Typography variant="caption" color="text.secondary">
											Reste à payer : {formatNumberWithSpaces(record.outstanding)} {record.currency}
										</Typography>
									)}
									<Divider sx={{ my: 1 }} />
									<Stack direction="row" sx={{ gap: 0.5, flexWrap: 'wrap' }}>
										{record.navigation && (
											<TextButton
												cssClass={styles.resultAction}
												buttonText="Voir"
												startIcon={<OpenInNew fontSize="small" />}
												onClick={() => navigate(record.navigation!)}
											/>
										)}
										{permissions?.can_update && select && selectableResources.has(card.resource || '') && (
											<TextButton
												cssClass={styles.resultAction}
												buttonText="Modifier"
												startIcon={<EditOutlined fontSize="small" />}
												onClick={() => select(card.resource!, record.id, 'edit')}
											/>
										)}
										{permissions?.can_delete && select && selectableResources.has(card.resource || '') && (
											<TextButton
												cssClass={styles.resultAction}
												buttonText="Supprimer"
												startIcon={<DeleteOutlined fontSize="small" />}
												onClick={() => select(card.resource!, record.id, 'delete')}
											/>
										)}
										{permissions?.can_print &&
											printableResources.has(card.resource || (card.type === 'invoice' ? 'invoice' : '')) && (
												<TextButton
													cssClass={styles.resultAction}
													buttonText="PDF"
													startIcon={<PictureAsPdfOutlined fontSize="small" />}
													onClick={() => pdf?.(record.id, card.resource)}
												/>
											)}
									</Stack>
								</Paper>
							))}
						</>
					)}
					{card.has_more && (
						<Typography variant="caption">D’autres résultats existent. Précisez votre recherche.</Typography>
					)}
					{card.type === 'financial_summary' && (
						<>
							<DashboardStatCard
								icon={<AccountBalanceWalletOutlined />}
								label={metricLabels[card.metric || ''] || 'Synthèse'}
								value={`${formatNumberWithSpaces(card.value, card.metric === 'invoice_count' ? 0 : 2)} ${card.metric === 'invoice_count' ? '' : card.currency}`}
								color="#00897B"
							/>
							<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
								{documentDate(card.period?.from)} → {documentDate(card.period?.to)} · Calcul du tableau de bord
							</Typography>
						</>
					)}
					{card.type === 'confirmation_status' && card.message && (
						<Paper variant="outlined" className={styles.result}>
							<Typography variant="body2">{card.message}</Typography>
						</Paper>
					)}
					{card.type === 'confirmation' && card.action_id && (
						<Paper variant="outlined" className={styles.result}>
							<Typography variant="body2" sx={{ fontWeight: 600 }}>
								{card.operation === 'delete' ? 'Supprimer' : 'Modifier'} {resourceLabel(card.resource).toLowerCase()}{' '}
								{card.label}
							</Typography>
							{confirmationFields(card).map((field) => (
								<Typography key={field} variant="body2">
									{fieldLabels[field]} : {card.before?.[field] || '—'} → {card.changes?.[field] || '—'}
								</Typography>
							))}
							<Typography variant="caption" color="text.secondary">
								{validConfirmation(card) ? 'Vérifiez le document avant de confirmer.' : invalidConfirmationText}
							</Typography>
							<TextButton
								cssClass={styles.resultAction}
								buttonText={confirmed.has(card.action_id) ? 'Action effectuée' : 'Vérifier cette action'}
								disabled={confirmed.has(card.action_id) || !validConfirmation(card) || !confirm}
								onClick={() => setPending(card)}
							/>
						</Paper>
					)}
					{card.type === 'pdf' && card.invoice_id && (
						<TextButton
							cssClass={styles.resultAction}
							buttonText={`Télécharger le PDF ${card.number || ''}`}
							startIcon={<PictureAsPdfOutlined />}
							onClick={() => pdf?.(card.invoice_id!)}
						/>
					)}
					{card.target && (
						<TextButton
							cssClass={styles.resultAction}
							buttonText="Ouvrir la page"
							startIcon={<OpenInNew />}
							onClick={() => navigate(card.target!)}
						/>
					)}
					{card.documents?.map((doc) => (
						<Typography key={doc.document_id} variant="caption" color="text.secondary" sx={{ display: 'block' }}>
							Source : {doc.title}
						</Typography>
					))}
				</Box>
			))}
			{pending && (
				<ActionModals
					title={`${pending.operation === 'delete' ? 'Supprimer' : 'Modifier'} ${pending.label}`}
					titleIcon={pending.operation === 'delete' ? <DeleteOutlined /> : <EditOutlined />}
					titleIconColor={pending.operation === 'delete' ? '#C62828' : '#0D070B'}
					body={
						!validConfirmation(pending)
							? invalidConfirmationText
							: pending.warning || 'Cette modification sera enregistrée sous votre identité.'
					}
					onClose={() => {
						if (!sending) setPending(null);
					}}
					fullWidth
					maxWidth="xs"
					actions={[
						{ text: 'Annuler', active: false, disabled: sending, onClick: () => setPending(null) },
						{
							text: sending ? 'En cours…' : 'Confirmer cette action',
							active: true,
							disabled: sending || !validConfirmation(pending),
							color: pending.operation === 'delete' ? '#C62828' : '#0D070B',
							onClick: () => {
								void perform().catch(() => {});
							},
						},
					]}
				>
					{confirmationFields(pending).map((field) => (
						<Box key={field} sx={{ mt: 1 }}>
							<Typography variant="caption">{fieldLabels[field]}</Typography>
							<Typography variant="body2">
								{pending.before?.[field] || '—'} → {pending.changes?.[field] || '—'}
							</Typography>
						</Box>
					))}
				</ActionModals>
			)}
		</Stack>
	);
};
