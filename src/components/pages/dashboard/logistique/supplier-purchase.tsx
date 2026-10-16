'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	Divider,
	Link,
	Stack,
	Typography,
	useMediaQuery,
	useTheme,
} from '@mui/material';
import {
	ArrowBack,
	Business,
	CalendarToday,
	CheckCircle,
	Close,
	Description,
	Edit,
	Email,
	History,
	Inventory,
	LocalShipping,
	Notes,
	Payment,
	Person,
	Send,
} from '@mui/icons-material';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import NoPermission from '@/components/shared/noPermission/noPermission';
import { LogistiqueDocumentsViewCard } from './logistique-documents-card';
import { PurchaseHistory, PurchaseReceipts } from './supplier-purchase-sections';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useAppSelector, useToast } from '@/utils/hooks';
import { getInitStateToken, getUserCompaniesState } from '@/store/selectors';
import { useGetUserCompaniesQuery } from '@/store/services/company';
import {
	useGetLogistiqueQuery,
	usePurchaseActionMutation,
	useStartLogistiquePaymentMutation,
	useSetLogistiqueProofEmailStatusMutation,
	useRetryLogistiquePaymentEmailMutation,
	usePatchLogistiqueStatutMutation,
} from '@/store/services/logistique';
import { useLogistiqueEmailPolling } from './use-logistique-email-polling';
import { extractApiErrorMessage, formatNumberWithSpaces } from '@/utils/helpers';
import { logistiqueManagerRoles } from '@/utils/rawData';
import { LOGISTIQUE_LIST, LOGISTIQUE_EDIT, LOGISTIQUE_SUPPLIERS, LOGISTIQUE_ADD } from '@/utils/routes';
import { listReturnUrl } from '@/utils/listReturn';
import { PURCHASE_CONDITIONS } from '@/utils/supplierPurchaseSchemas';
import type { LogistiqueFormProps, LogistiquePaymentInstallment } from '@/types/logistiqueTypes';
import type { PurchaseFormMode } from '@/types/supplierPurchaseTypes';
import Styles from '@/styles/dashboard/dashboard.module.sass';

const money = (amount: unknown, currency?: string) =>
	`${Number(amount ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency ?? ''}`;
const date = (entry?: string | null) =>
	entry ? new Date(entry.length === 10 ? `${entry}T00:00:00` : entry).toLocaleDateString('fr-FR') : '-';
const dateTime = (entry?: string | null) =>
	entry ? new Date(entry).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '-';
const grid = { display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2 };
function DetailCard({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
	return (
		<Card elevation={2} sx={{ borderRadius: 2 }}>
			<CardContent sx={{ p: { xs: 2, sm: 3 } }}>
				<Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
					{icon}
					<Typography variant="h6" sx={{ fontWeight: 700 }}>
						{title}
					</Typography>
				</Stack>
				<Divider sx={{ mb: 3 }} />
				<Stack spacing={2}>{children}</Stack>
			</CardContent>
		</Card>
	);
}
function InfoRow({ label, value, icon }: { label: string; value: ReactNode; icon?: ReactNode }) {
	return (
		<Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start', py: 1.5, flexWrap: 'wrap' }}>
			<Box sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', minWidth: 40 }}>
				{icon ?? <Description />}
			</Box>
			<Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
				<Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
					{label}
				</Typography>
				<Typography component="div" variant="body1" sx={{ overflowWrap: 'anywhere' }}>
					{value === null || value === undefined || value === '' ? '-' : value}
				</Typography>
			</Stack>
		</Stack>
	);
}

export default function SupplierPurchase({ session, company_id, id }: LogistiqueFormProps) {
	const token = useInitAccessToken(session);
	const router = useRouter();
	const theme = useTheme();
	const mobile = useMediaQuery(theme.breakpoints.down('sm'));
	const { onSuccess, onError } = useToast();
	const userId = useAppSelector(getInitStateToken).user.pk;
	const companyState = useAppSelector(getUserCompaniesState);
	const { data: companies, isLoading: loadingCompanies } = useGetUserCompaniesQuery(undefined, { skip: !token });
	const company = (companies ?? companyState)?.find((entry) => entry.id === company_id);
	const { data: order, isLoading, error, refetch } = useGetLogistiqueQuery({ id: id ?? 0 }, { skip: !token || !id });
	useLogistiqueEmailPolling(order, !!token, refetch);
	const [purchase] = usePurchaseActionMutation();
	const [startPayment] = useStartLogistiquePaymentMutation();
	const [proofSent] = useSetLogistiqueProofEmailStatusMutation();
	const [retryEmail] = useRetryLogistiquePaymentEmailMutation();
	const [globalStatus] = usePatchLogistiqueStatutMutation();
	const [busy, setBusy] = useState(false);
	const [actionError, setActionError] = useState('');
	const [pending, setPending] = useState<'Annulé' | 'Rouvert' | 'Clôture' | 'Livraison client' | null>(null);
	const canManage = !!company?.role && logistiqueManagerRoles.has(company.role);
	const cancelled = order?.statut_global === 'Annulé';
	const active = !!order && !cancelled && order.statut !== 'Clôture';
	const canEdit = canManage && active;
	const responsible = order?.responsable === userId;
	const creator = order?.created_by_user === userId;
	const accounting = company?.role === 'Comptable' && order?.paiement_assigne_a === userId;
	const edit = (mode: PurchaseFormMode, installment?: number) =>
		router.push(
			`${id ? LOGISTIQUE_EDIT(id, company_id) : LOGISTIQUE_ADD(company_id)}&etape=${mode}${installment ? `&echeance_id=${installment}` : ''}`,
		);
	async function run(work: () => Promise<unknown>, message = 'Modifications enregistrées.') {
		if (busy) return;
		setBusy(true);
		setActionError('');
		try {
			await work();
			onSuccess(message);
		} catch (failure) {
			const text = extractApiErrorMessage(failure, 'Impossible de terminer cette action.');
			setActionError(text);
			onError(text);
		} finally {
			setBusy(false);
		}
	}
	const actionButton = (label: string, onClick: () => void, enabled = true, icon: ReactNode = <Edit />) => (
		<Button
			variant="outlined"
			disabled={!enabled || busy}
			loading={busy}
			onClick={onClick}
			type="button"
			startIcon={icon}
			sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' }, maxWidth: '100%' }}
		>
			{label}
		</Button>
	);
	const orderFiles = order
		? (
				[
					['proforma_fournisseur_file', 'Proforma fournisseur'],
					['titre_importation_file', 'Titre d’importation'],
					['documents_originaux_file', 'Documents originaux'],
					['justificatifs_file', 'Justificatifs'],
				] as const
			).map(([field, label]) => ({ field, label, currentUrl: order[field] }))
		: [];
	function supplierProof(item: LogistiquePaymentInstallment) {
		if (!item.paiement_valide_le) return null;
		if (item.preuve_envoyee_fournisseur_le)
			return (
				<Alert severity="success">
					Justificatif transmis au fournisseur le {dateTime(item.preuve_envoyee_fournisseur_le)}.
				</Alert>
			);
		return creator && canManage && !cancelled ? (
			actionButton(
				'Justificatif transmis au fournisseur',
				() => {
					void run(() => proofSent({ id: id!, echeance_id: item.id, email_envoye: true }).unwrap());
				},
				true,
				<Email />,
			)
		) : (
			<Typography variant="body2" color="text.secondary">
				Le créateur du dossier doit transmettre le justificatif au fournisseur.
			</Typography>
		);
	}
	function paymentCard(item: LogistiquePaymentInstallment) {
		const readiness = order?.workflow?.paiements?.find((entry) => entry.id === item.id);
		return (
			<Box key={item.id} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
				<Stack spacing={2}>
					<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between' }}>
						<Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
							{item.declencheur === 'advance' ? 'Avance' : Number(item.pourcentage) < 100 ? 'Solde' : 'Paiement'}{' '}
							{Number(item.pourcentage)} % : {money(item.montant_prevu, item.devise)}
						</Typography>
						<Chip size="small" label={item.statut_traitement} color={item.paiement_valide_le ? 'success' : 'default'} />
					</Stack>
					<Box sx={grid}>
						<InfoRow label="Méthode" value={item.methode_paiement} icon={<Payment />} />
						<InfoRow label="Date d’échéance" value={date(item.date_echeance)} icon={<CalendarToday />} />
					</Box>
					{readiness?.raison_attente && !item.paiement_valide_le && (
						<Alert severity="info">{readiness.raison_attente}</Alert>
					)}
					{!item.demandee_le &&
						!item.paiement_valide_le &&
						responsible &&
						canEdit &&
						actionButton(
							'Transmettre au comptable',
							() => edit('demande_paiement', item.id),
							!!readiness?.demande_possible,
							<Send />,
						)}
					{accounting && active && item.demandee_le && !item.paiement_valide_le && (
						<>
							{item.statut_traitement === 'Paiement à traiter' &&
								actionButton(
									'Commencer le paiement',
									() => {
										void run(() => startPayment({ id: id!, echeance_id: item.id }).unwrap());
									},
									!readiness?.raison_attente,
									<Payment />,
								)}
							{item.statut_traitement === 'Paiement en cours' &&
								actionButton('Enregistrer le paiement', () => edit('paiement', item.id), true, <Payment />)}
							{item.statut_traitement === 'Paiement effectué – Justificatif à joindre' &&
								actionButton(
									'Joindre et valider le justificatif',
									() => edit('justificatif', item.id),
									true,
									<CheckCircle />,
								)}
						</>
					)}
					{item.execution_enregistree_le && (
						<Box sx={grid}>
							<InfoRow label="Montant payé" value={money(item.montant_paye, item.devise)} icon={<Payment />} />
							<InfoRow label="Date du paiement" value={date(item.date_paiement)} icon={<CalendarToday />} />
							<InfoRow label="Référence bancaire" value={item.reference_bancaire} />
							<InfoRow label="Commentaire du paiement" value={item.commentaire} icon={<Notes />} />
						</Box>
					)}
					{item.paiement_valide_le && (
						<>
							<InfoRow
								label="Paiement validé"
								value={`${dateTime(item.paiement_valide_le)} · ${item.paiement_valide_par_name ?? '-'}`}
								icon={<CheckCircle />}
							/>
							{item.justificatif_file && (
								<Link href={item.justificatif_file} target="_blank" rel="noreferrer">
									Ouvrir le justificatif bancaire
								</Link>
							)}
							{item.notification_createur_erreur ? (
								<Alert severity="warning">
									{item.notification_createur_erreur}
									{canManage && !cancelled && (
										<Button
											variant="outlined"
											disabled={busy}
											onClick={() => {
												void run(() =>
													purchase({
														id: id!,
														data: { action: 'relancer_notification', echeance_id: item.id },
													}).unwrap(),
												);
											}}
										>
											Relancer la notification
										</Button>
									)}
								</Alert>
							) : (
								<Typography variant="body2" color="text.secondary">
									{item.notification_createur_envoyee_le
										? 'Le créateur a été prévenu par e-mail.'
										: 'Notification du créateur en cours.'}
								</Typography>
							)}
							{item.declencheur !== 'advance' && supplierProof(item)}
						</>
					)}
				</Stack>
			</Box>
		);
	}
	const bank = order && (
		<DetailCard key="bank" title="Banque et paiement" icon={<Payment color="primary" />}>
			<Box sx={grid}>
				<InfoRow
					label="Conditions d’achat"
					value={PURCHASE_CONDITIONS.find(([choice]) => choice === order.condition_achat)?.[1]}
					icon={<Payment />}
				/>
				<InfoRow
					label="Solde restant"
					value={money(order.solde_restant, order.devise_proforma_fournisseur)}
					icon={<Payment />}
				/>
				<InfoRow label="N° de domiciliation" value={order.numero_domiciliation} />
				<InfoRow label="Banque" value={order.banque} icon={<Business />} />
				<InfoRow
					label="Montant du titre d’importation"
					value={money(order.montant_titre_importation, order.devise_titre_importation)}
					icon={<Payment />}
				/>
				<InfoRow
					label="Date du titre d’importation"
					value={date(order.date_titre_importation)}
					icon={<CalendarToday />}
				/>
				<InfoRow
					label="Statut du titre d’importation"
					value={order.date_validation_titre_importation ? 'Validé' : order.statut_titre_importation}
				/>
				<InfoRow
					label="Validation du titre d’importation"
					value={date(order.date_validation_titre_importation)}
					icon={<CalendarToday />}
				/>
				<InfoRow
					label="Comptable affecté"
					value={
						order.paiement_assigne_a_name ||
						(Number(order.solde_restant) === 0 ? 'Aucun paiement à traiter' : 'Affecté lors de la demande de paiement')
					}
					icon={<Person />}
				/>
				<InfoRow label="Suivi bancaire" value={order.statut_banque_paiement} />
				<InfoRow label="Traitement comptable" value={order.statut_traitement_paiement} />
				<InfoRow label="État du paiement" value={order.statut_paiement} />
			</Box>
			{canEdit &&
				order.statut_paiement === 'Non demandé' &&
				actionButton(
					order.titre_importation_file ? 'Modifier le titre d’importation' : 'Renseigner le titre d’importation',
					() => edit('titre'),
				)}
			{order.demande_paiement_email_statut === 'Échec' && (
				<Alert severity="warning">
					La transmission au comptable a échoué.
					{responsible && canEdit && (
						<Button
							variant="outlined"
							disabled={busy}
							onClick={() => {
								void run(() => retryEmail({ id: id! }).unwrap());
							}}
						>
							Réessayer l’envoi
						</Button>
					)}
				</Alert>
			)}
			{['En attente', 'Envoi en cours'].includes(order.demande_paiement_email_statut) && (
				<Alert severity="info">Transmission au comptable en cours.</Alert>
			)}
			{order.echeancier_paiement?.length ? (
				order.echeancier_paiement.map(paymentCard)
			) : (
				<Typography variant="body2" color="text.secondary">
					Les paiements seront calculés après validation de la proforma fournisseur.
				</Typography>
			)}
		</DetailCard>
	);
	const preparation = order && (
		<DetailCard key="preparation" title="Préparation fournisseur" icon={<LocalShipping color="primary" />}>
			<Box sx={grid}>
				<InfoRow
					label="Début de production confirmé"
					value={date(order.production_confirmee_le)}
					icon={<CheckCircle />}
				/>
				<InfoRow label="Date d’expédition prévue" value={date(order.date_expedition_prevue)} icon={<CalendarToday />} />
			</Box>
			{order.echeancier_paiement
				?.filter((item) => item.declencheur === 'advance' && item.paiement_valide_le)
				.map((item) => (
					<Box key={item.id}>
						<Typography variant="subtitle2" sx={{ mb: 1 }}>
							Justificatif de l’avance de {money(item.montant_paye, item.devise)}
						</Typography>
						{supplierProof(item)}
					</Box>
				))}
			{order.workflow?.raison_preparation && <Alert severity="info">{order.workflow.raison_preparation}</Alert>}
			{canEdit &&
				actionButton(
					'Suivre la production',
					() => edit('production'),
					!!order.is_proforma_step_complete,
					<LocalShipping />,
				)}
		</DetailCard>
	);
	const shipping = order && (
		<DetailCard key="shipping" title="Expédition et documents" icon={<LocalShipping color="primary" />}>
			<Box sx={grid}>
				<InfoRow label="Date réelle d’expédition" value={date(order.date_expedition_reelle)} icon={<CalendarToday />} />
				<InfoRow label="Transport" value={order.transport} icon={<LocalShipping />} />
				<InfoRow label="Documents originaux requis" value={order.documents_originaux_requis ? 'Oui' : 'Non'} />
				<InfoRow label="État des documents originaux" value={order.statut_documents_originaux || 'Non renseigné'} />
			</Box>
			{canEdit &&
				actionButton(
					order.date_expedition_reelle ? 'Modifier les documents d’expédition' : 'Enregistrer l’expédition',
					() => edit('expedition'),
					!!order.production_confirmee_le,
					<LocalShipping />,
				)}
		</DetailCard>
	);
	const transit = order && (
		<DetailCard key="transit" title="Transit et douane" icon={<LocalShipping color="primary" />}>
			<Box sx={grid}>
				<InfoRow label="Arrivée au Maroc" value={date(order.date_arrivee_maroc)} icon={<CalendarToday />} />
				<InfoRow
					label="Documents remis à la banque"
					value={date(order.documents_remis_banque_le)}
					icon={<Description />}
				/>
				<InfoRow label="Transport" value={money(order.cout_transport, order.devise)} />
				<InfoRow label="Frais de transit" value={money(order.frais_transit, order.devise)} />
				<InfoRow label="Droits de douane" value={money(order.frais_douane, order.devise)} />
				<InfoRow label="TVA" value={money(order.tva, order.devise)} />
			</Box>
			{canEdit &&
				actionButton(
					'Modifier le transit et les frais',
					() => edit('transit'),
					!!order.date_expedition_reelle,
					<LocalShipping />,
				)}
		</DetailCard>
	);
	const receipt = order && (
		<DetailCard key="receipt" title="Réception et livraison" icon={<Inventory color="primary" />}>
			<PurchaseReceipts order={order} stockEnabled={!!company?.stock_management_enabled} />
			{canEdit &&
				!order.date_reelle &&
				actionButton(
					'Enregistrer une réception',
					() => edit('reception'),
					!!order.date_expedition_reelle,
					<Inventory />,
				)}
			{canEdit &&
				order.date_reelle &&
				order.statut !== 'Livraison client' &&
				actionButton('Confirmer la livraison', () => setPending('Livraison client'), true, <CheckCircle />)}
		</DetailCard>
	);
	const deferBank = order?.condition_achat === 'documentary100' || order?.condition_achat === 'shipment100';
	const bankAfterReceipt = order?.condition_achat === 'receipt100';
	return (
		<Stack direction="column" sx={{ position: 'relative' }}>
			<NavigationBar title={order ? `Dossier ${order.numero_commande}` : 'Dossier fournisseur'}>
				<main className={`${Styles.main} ${Styles.fixMobile}`}>
					{isLoading || loadingCompanies || !token ? (
						<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
					) : error ? (
						<Alert severity="error">
							{extractApiErrorMessage(error, 'Impossible de charger le dossier.')}
							<Button variant="outlined" onClick={() => refetch()}>
								Réessayer
							</Button>
						</Alert>
					) : !order || !company ? (
						<NoPermission />
					) : (
						<Stack spacing={3} sx={{ p: { xs: 2, md: 3 }, width: '100%' }}>
							<Stack direction={mobile ? 'column' : 'row'} spacing={2} sx={{ pt: 2, justifyContent: 'space-between' }}>
								<Button
									variant="outlined"
									startIcon={<ArrowBack />}
									onClick={() => router.push(listReturnUrl(`${LOGISTIQUE_LIST}?company_id=${company_id}`))}
									sx={{ width: mobile ? '100%' : 'auto' }}
								>
									Retour à la liste
								</Button>
								{canEdit && (
									<Button
										variant="outlined"
										startIcon={<Edit />}
										onClick={() => edit('dossier')}
										sx={{ width: mobile ? '100%' : 'auto' }}
									>
										Modifier le dossier
									</Button>
								)}
							</Stack>
							{actionError && (
								<Alert severity="error" onClose={() => setActionError('')}>
									{actionError}
								</Alert>
							)}
							<Alert severity={order.statut_global === 'En retard' ? 'warning' : 'info'}>
								<Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
									Prochaine action
								</Typography>
								{order.workflow?.prochaine_action}
							</Alert>
							<DetailCard title="Informations du dossier" icon={<Business color="primary" />}>
								<Box sx={grid}>
									<InfoRow label="Référence" value={order.numero_commande} />
									<InfoRow label="Fournisseur" value={order.fournisseur} icon={<Business />} />
									<InfoRow label="E-mail du fournisseur" value={order.fournisseur_email} icon={<Email />} />
									<InfoRow label="Responsable" value={order.responsable_name} icon={<Person />} />
									<InfoRow
										label="Date prévue de fin du dossier"
										value={date(order.date_prevue)}
										icon={<CalendarToday />}
									/>
									<InfoRow label="Phase du dossier" value={order.statut} icon={<LocalShipping />} />
									<InfoRow
										label="État du dossier"
										value={
											<Chip
												label={order.statut_global}
												color={
													order.statut_global === 'En retard'
														? 'warning'
														: order.statut === 'Clôture'
															? 'success'
															: 'info'
												}
												size="small"
											/>
										}
									/>
									<InfoRow
										label="Date de commande client"
										value={date(order.date_commande_client)}
										icon={<CalendarToday />}
									/>
									<InfoRow label="Créé par" value={order.created_by_user_name} icon={<Person />} />
									<InfoRow label="Dossier créé le" value={dateTime(order.date_created)} icon={<CalendarToday />} />
								</Box>
								{canEdit &&
									actionButton(
										'Contacts fournisseurs',
										() => router.push(`${LOGISTIQUE_SUPPLIERS}?company_id=${company_id}`),
										true,
										<Business />,
									)}
							</DetailCard>
							<DetailCard title="Proforma fournisseur et conformité" icon={<Description color="primary" />}>
								<Box sx={grid}>
									<InfoRow label="N° de proforma fournisseur" value={order.numero_proforma_fournisseur} />
									<InfoRow
										label="Date de la proforma"
										value={date(order.date_proforma_fournisseur)}
										icon={<CalendarToday />}
									/>
									<InfoRow
										label="Montant fournisseur"
										value={money(order.montant_proforma_fournisseur, order.devise_proforma_fournisseur)}
										icon={<Payment />}
									/>
									<InfoRow label="Contrôle" value={order.statut_proforma_conformite} icon={<CheckCircle />} />
									<InfoRow label="Incoterm" value={order.incoterm} />
									<InfoRow
										label="Délai fournisseur"
										value={order.delai_proforma_jours == null ? '-' : `${order.delai_proforma_jours} jours`}
										icon={<CalendarToday />}
									/>
								</Box>
								<Box sx={grid}>
									<InfoRow
										label="Total des articles"
										value={money(order.cout_achat, order.devise)}
										icon={<Payment />}
									/>
									<InfoRow label="Origine de la marchandise" value={order.origine_marchandise} />
									<InfoRow label="Nature de la marchandise" value={order.nature_marchandise} />
									<InfoRow label="Poids net (kg)" value={formatNumberWithSpaces(order.poids_net, 2)} />
									<InfoRow label="Poids brut (kg)" value={formatNumberWithSpaces(order.poids_brut, 2)} />
									<InfoRow label="Volume (m³)" value={formatNumberWithSpaces(order.volume, 3)} />
									<InfoRow
										label="Contrôle enregistré"
										value={
											order.proforma_controlee_le
												? `${dateTime(order.proforma_controlee_le)} · ${order.proforma_controlee_par_name ?? '-'}`
												: '-'
										}
										icon={<CheckCircle />}
									/>
									<InfoRow
										label="Proforma validée"
										value={
											order.proforma_validee_le
												? `${dateTime(order.proforma_validee_le)} · ${order.proforma_validee_par_name ?? '-'}`
												: '-'
										}
										icon={<CheckCircle />}
									/>
								</Box>
								{order.lignes?.map((line) => (
									<Box key={line.id} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
										<Typography variant="subtitle2">
											{line.article_reference} : {line.designation}
										</Typography>
										<Typography variant="body2">
											Quantité : {formatNumberWithSpaces(line.quantity, 3)} · Prix unitaire d’achat :{' '}
											{money(line.prix_achat, line.devise_prix_achat)}
										</Typography>
									</Box>
								))}
								<Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
									{[
										['Anomalie de prix', order.ecart_prix_proforma],
										['Anomalie de quantité', order.ecart_quantite_proforma],
										['Autre anomalie', order.ecart_autre_proforma],
									].map(([label, flagged]) => (
										<Chip
											key={String(label)}
											size="small"
											variant="outlined"
											color={flagged ? 'warning' : 'default'}
											label={`${label} : ${flagged ? 'Oui' : 'Non'}`}
										/>
									))}
								</Stack>
								{Math.abs(Number(order.cout_achat) - Number(order.montant_proforma_fournisseur)) > 0.01 && (
									<Alert severity="warning">
										Le total des articles diffère du montant de la proforma fournisseur. Vérifiez les quantités, les
										prix, les remises et les frais du document.
									</Alert>
								)}
								{order.notes_ecarts_proforma && (
									<Alert severity={order.is_proforma_step_complete ? 'info' : 'warning'}>
										{order.notes_ecarts_proforma}
									</Alert>
								)}
								{canEdit &&
									!order.is_proforma_step_complete &&
									actionButton('Contrôler la proforma', () => edit('proforma'), true, <Description />)}
							</DetailCard>
							{!deferBank && !bankAfterReceipt && bank}
							{preparation}
							{shipping}
							{deferBank && bank}
							{transit}
							{receipt}
							{bankAfterReceipt && bank}
							<DetailCard title="Clôture et coût réel" icon={<Payment color="primary" />}>
								<Box sx={grid}>
									<InfoRow label="Coût d’achat" value={money(order.cout_achat, order.devise)} icon={<Payment />} />
									<InfoRow
										label="Livraison locale"
										value={money(order.livraison_locale, order.devise)}
										icon={<LocalShipping />}
									/>
									<InfoRow label="Autres frais" value={money(order.autres_frais, order.devise)} icon={<Payment />} />
									<InfoRow label="Coût total" value={money(order.cout_total, order.devise)} icon={<Payment />} />
								</Box>
								{canEdit && (
									<Stack direction={mobile ? 'column' : 'row'} spacing={2}>
										{actionButton('Modifier les frais', () => edit('couts'))}
										{actionButton(
											'Clôturer le dossier',
											() => setPending('Clôture'),
											!!order.date_reelle && Number(order.solde_restant) === 0,
											<CheckCircle />,
										)}
									</Stack>
								)}
							</DetailCard>
							<LogistiqueDocumentsViewCard items={orderFiles} />
							<DetailCard title="Remarques" icon={<Notes color="primary" />}>
								{order.process_notes?.length ? (
									order.process_notes.map((entry) => (
										<Box key={entry.id}>
											<Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
												{entry.remarque}
											</Typography>
											<Typography variant="caption" color="text.secondary">
												{entry.user_name} · {dateTime(entry.date_created)} · {entry.statut}
											</Typography>
											{entry.fichier && (
												<Link href={entry.fichier} target="_blank" rel="noreferrer" sx={{ display: 'block' }}>
													Voir la pièce jointe
												</Link>
											)}
										</Box>
									))
								) : (
									<Typography variant="body2" color="text.secondary">
										Aucune remarque enregistrée.
									</Typography>
								)}
								{active &&
									(canManage || accounting) &&
									actionButton('Ajouter une remarque', () => edit('remarque'), true, <Notes />)}
							</DetailCard>
							<DetailCard title="Historique" icon={<History color="primary" />}>
								<PurchaseHistory events={order.events} />
							</DetailCard>
							{company.can_change_document_status && order.statut !== 'Clôture' && (
								<Button
									variant="outlined"
									color={cancelled ? 'primary' : 'error'}
									disabled={busy}
									startIcon={cancelled ? <History /> : <Close />}
									onClick={() => setPending(cancelled ? 'Rouvert' : 'Annulé')}
								>
									{cancelled ? 'Rouvrir le dossier' : 'Annuler le dossier'}
								</Button>
							)}
						</Stack>
					)}
					{pending && order && (
						<ActionModals
							title={
								pending === 'Clôture'
									? 'Clôturer le dossier'
									: pending === 'Livraison client'
										? 'Confirmer la livraison'
										: pending === 'Annulé'
											? 'Annuler le dossier'
											: 'Rouvrir le dossier'
							}
							titleIcon={<CheckCircle />}
							body="Confirmez cette action sur le dossier."
							onClose={() => setPending(null)}
							actions={[
								{ text: 'Retour', active: false, onClick: () => setPending(null), icon: <Close />, color: '#6B6B6B' },
								{
									text: 'Confirmer',
									active: true,
									disabled: busy,
									onClick: () => {
										void run(async () => {
											if (pending === 'Annulé' || pending === 'Rouvert')
												await globalStatus({ id: order.id, data: { statut: pending } }).unwrap();
											else await purchase({ id: order.id, data: { action: 'progression', statut: pending } }).unwrap();
											setPending(null);
										});
									},
									icon: <CheckCircle />,
									color: '#1976D2',
								},
							]}
						/>
					)}
				</main>
			</NavigationBar>
		</Stack>
	);
}
