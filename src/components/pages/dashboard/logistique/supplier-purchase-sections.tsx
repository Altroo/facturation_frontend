'use client';

import { useState } from 'react';
import { Box, Button, Chip, Divider, Stack, Typography } from '@mui/material';
import { AddCircleOutlined, Edit, Inventory, LocalShipping, Payment, Place, SwapHoriz } from '@mui/icons-material';
import type { LogistiqueEvent, LogistiqueOrder } from '@/types/logistiqueTypes';

const quantity = (value: number | string) => Number(value).toLocaleString('fr-FR', { maximumFractionDigits: 3 });
const timestamp = (value: string) =>
	new Date(value).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
const summaryTitles: Record<string, string> = {
	dossier: 'Dossier mis à jour',
	proforma: 'Contrôle de la proforma enregistré',
	titre: 'Titre d’importation enregistré',
	progression: 'Avancement du dossier enregistré',
	reception: 'Réception enregistrée',
	relancer_notification: 'Notification du créateur relancée',
};

const actionTitles: Record<string, string> = {
	'Validation paiement': 'Paiement validé',
	'Enregistrement exécution paiement': 'Paiement enregistré',
	'Démarrage paiement': 'Traitement du paiement commencé',
	'Suivi manuel e-mail fournisseur': 'Suivi de la transmission du justificatif au fournisseur',
	'E-mail Service Comptable envoyé': 'Demande de paiement envoyée au comptable',
};
const valueLabels: Record<string, string> = {
	'Réception de marchandises': 'Bon de réception',
	'Création du dossier fournisseur': 'Numéro du dossier',
	'Enregistrement exécution paiement': 'Montant payé',
	'Démarrage paiement': 'Paiement concerné',
	'E-mail Service Comptable envoyé': 'Destinataire',
};

function eventDetails(entry: LogistiqueEvent) {
	const modification = entry.action.startsWith('Modification : ');
	const legacySummary = entry.action.startsWith('Mise à jour achat fournisseur : ');
	const legacyAction = entry.action.slice('Mise à jour achat fournisseur : '.length);
	const title = modification
		? entry.action.slice('Modification : '.length)
		: legacySummary
			? summaryTitles[legacyAction] || 'Dossier mis à jour'
			: actionTitles[entry.action] || entry.action;
	// Long changes are stored in the note in full, alongside truncated old/new values.
	const fullChange =
		modification && entry.note.match(/^Ancienne valeur :\n([\s\S]*?)\n\nNouvelle valeur :\n([\s\S]*)$/);
	return {
		title,
		modification,
		oldValue: fullChange ? fullChange[1] : entry.old_value,
		newValue: fullChange ? fullChange[2] : entry.new_value,
		valueLabel: valueLabels[entry.action] || 'Détail de l’action',
		note: fullChange ? '' : entry.note,
		legacySummary,
	};
}

function EventIcon({ action }: { action: string }) {
	const text = action.toLowerCase();
	if (text.includes('création')) return <AddCircleOutlined fontSize="small" />;
	if (text.includes('paiement') || text.includes('banc') || text.includes('coût')) return <Payment fontSize="small" />;
	if (text.includes('réception')) return <Inventory fontSize="small" />;
	if (text.includes('expédition') || text.includes('production')) return <LocalShipping fontSize="small" />;
	if (text.includes('statut') || text.includes('phase')) return <SwapHoriz fontSize="small" />;
	return <Edit fontSize="small" />;
}

export function PurchaseHistory({ events = [] }: { events?: LogistiqueEvent[] }) {
	const [limit, setLimit] = useState(8);
	const ordered = [...events].sort((a, b) => Date.parse(b.date_created) - Date.parse(a.date_created) || b.id - a.id);
	if (!ordered.length)
		return (
			<Typography variant="body2" color="text.secondary">
				Aucune action enregistrée.
			</Typography>
		);
	return (
		<>
			<Typography variant="body2" color="text.secondary">
				Les actions les plus récentes apparaissent en premier.
			</Typography>
			<Box component="ol" sx={{ m: 0, p: 0, listStyle: 'none' }}>
				{ordered.slice(0, limit).map((entry, index, visible) => {
					const details = eventDetails(entry);
					return (
						<Box component="li" key={entry.id} sx={{ display: 'flex', gap: { xs: 1.5, sm: 2 }, minWidth: 0 }}>
							<Stack sx={{ alignItems: 'center', flexShrink: 0, width: 32 }}>
								<Box
									sx={{
										width: 32,
										height: 32,
										display: 'grid',
										placeItems: 'center',
										borderRadius: '50%',
										bgcolor: 'action.hover',
										color: 'primary.main',
									}}
								>
									<EventIcon action={entry.action} />
								</Box>
								{index < visible.length - 1 && (
									<Box sx={{ flex: 1, borderLeft: '1px solid', borderColor: 'divider', my: 0.5 }} />
								)}
							</Stack>
							<Stack spacing={1} sx={{ minWidth: 0, flex: 1, pb: index < visible.length - 1 ? 3 : 0 }}>
								<Stack
									direction={{ xs: 'column', sm: 'row' }}
									spacing={0.5}
									sx={{ justifyContent: 'space-between', alignItems: { sm: 'baseline' } }}
								>
									<Typography variant="subtitle2" sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}>
										{details.title}
									</Typography>
									<Typography
										component="time"
										dateTime={entry.date_created}
										variant="caption"
										color="text.secondary"
										sx={{ flexShrink: 0 }}
									>
										{timestamp(entry.date_created)}
									</Typography>
								</Stack>
								<Typography variant="caption" color="text.secondary">
									{entry.user_name || 'Auteur non renseigné'}
									{details.modification ? ' · Modification' : ''}
								</Typography>
								{(details.oldValue || details.newValue) && (
									<Box
										sx={{
											display: 'grid',
											gridTemplateColumns: {
												xs: '1fr',
												sm: details.oldValue || details.modification ? '1fr 1fr' : '1fr',
											},
											gap: 1,
										}}
									>
										{(details.oldValue || details.modification) && (
											<HistoryValue
												label="Avant"
												value={details.oldValue || 'Non renseigné'}
												since={entry.old_value_since}
												showDate
											/>
										)}
										<HistoryValue
											label={
												details.oldValue || details.modification
													? 'Après'
													: details.legacySummary
														? 'Étape du dossier'
														: details.valueLabel
											}
											value={details.newValue || 'Non renseigné'}
											since={entry.new_value_since ?? entry.date_created}
											showDate={!!(details.oldValue || details.modification)}
										/>
									</Box>
								)}
								{details.note && (
									<Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
										{details.note}
									</Typography>
								)}
							</Stack>
						</Box>
					);
				})}
			</Box>
			{limit < ordered.length && (
				<Button variant="outlined" onClick={() => setLimit((current) => current + 12)} sx={{ alignSelf: 'flex-start' }}>
					Voir les actions précédentes ({ordered.length - limit})
				</Button>
			)}
		</>
	);
}

function HistoryValue({
	label,
	value,
	since,
	showDate = false,
}: {
	label: string;
	value: string;
	since?: string | null;
	showDate?: boolean;
}) {
	const date = since ? new Date(since) : null;
	const recorded = date !== null && Number.isFinite(date.getTime());
	return (
		<Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1, minWidth: 0 }}>
			<Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 0.5 }}>
				{label}
			</Typography>
			<Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
				{value}
			</Typography>
			{showDate && (
				<Typography
					variant="caption"
					color="text.secondary"
					component={recorded ? 'time' : 'div'}
					dateTime={recorded ? since! : undefined}
					sx={{ display: 'block', mt: 0.75 }}
				>
					{recorded
						? `Depuis le ${date.toLocaleDateString('fr-FR')} à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
						: 'Date non renseignée'}
				</Typography>
			)}
		</Box>
	);
}

export function PurchaseReceipts({ order, stockEnabled }: { order: LogistiqueOrder; stockEnabled: boolean }) {
	const delivered = order.statut === 'Livraison client';
	const closed = order.statut === 'Clôture';
	const managedLines =
		order.lignes?.filter((line) => stockEnabled && (line.type_article ?? 'Produit').toLowerCase() === 'produit') ?? [];
	const hasReceived = managedLines.some((line) => Number(line.received_quantity) > 0);
	return (
		<>
			<Stack
				direction={{ xs: 'column', sm: 'row' }}
				spacing={1.5}
				sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' } }}
			>
				<Stack spacing={0.5}>
					<Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
						{order.date_reelle ? 'Réception complète' : hasReceived ? 'Réception partielle' : 'Réception en attente'}
					</Typography>
					<Typography variant="body2" color="text.secondary">
						{order.date_reelle
							? `Reçue le ${new Date(`${order.date_reelle}T00:00:00`).toLocaleDateString('fr-FR')}`
							: 'Enregistrez les marchandises au fur et à mesure de leur arrivée.'}
					</Typography>
				</Stack>
				<Chip
					size="small"
					variant="outlined"
					color={delivered || closed ? 'success' : 'default'}
					label={closed ? 'Dossier clôturé' : delivered ? 'Livraison confirmée' : 'Livraison à confirmer'}
				/>
			</Stack>
			<Stack divider={<Divider />} spacing={2}>
				{order.lignes?.map((line) => {
					const managed = stockEnabled && (line.type_article ?? 'Produit').toLowerCase() === 'produit';
					return (
						<Box
							key={line.id}
							sx={{
								display: 'grid',
								gridTemplateColumns: {
									xs: 'repeat(3, minmax(0, 1fr))',
									sm: 'minmax(0, 2fr) repeat(3, minmax(70px, 0.6fr))',
								},
								gap: 2,
								alignItems: 'start',
								py: 1,
							}}
						>
							<Stack spacing={0.75} sx={{ minWidth: 0, gridColumn: { xs: '1 / -1', sm: managed ? 'auto' : '1 / -1' } }}>
								<Typography variant="caption" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
									{line.article_reference}
								</Typography>
								<Typography variant="subtitle2" sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>
									{line.designation}
								</Typography>
								{managed ? (
									<Stack direction="row" spacing={0.5} sx={{ alignItems: 'flex-start', color: 'text.secondary' }}>
										<Place sx={{ fontSize: 16, mt: 0.25 }} />
										<Typography variant="caption" sx={{ overflowWrap: 'anywhere' }}>
											Emplacement prévu : {line.expected_emplacement_name || 'Non renseigné'}
										</Typography>
									</Stack>
								) : (
									<Typography variant="body2" color="text.secondary">
										Quantité commandée : {quantity(line.quantity)} ·{' '}
										{(line.type_article ?? 'Produit').toLowerCase() === 'service'
											? 'Prestation sans mouvement de stock'
											: 'Suivi des stocks désactivé'}
									</Typography>
								)}
							</Stack>
							{managed &&
								(
									[
										['Commandé', line.quantity],
										['Reçu', line.received_quantity],
										['À recevoir', line.remaining_quantity],
									] as const
								).map(([label, value]) => (
									<Stack key={label} spacing={0.75} sx={{ textAlign: { xs: 'left', sm: 'right' }, minWidth: 0 }}>
										<Typography variant="caption" color="text.secondary">
											{label}
										</Typography>
										<Typography
											variant="subtitle1"
											sx={{
												fontWeight: 700,
												fontVariantNumeric: 'tabular-nums',
												overflowWrap: 'anywhere',
												color: label === 'À recevoir' && Number(value) > 0 ? 'warning.dark' : 'text.primary',
											}}
										>
											{quantity(value)}
										</Typography>
									</Stack>
								))}
						</Box>
					);
				})}
			</Stack>
			{!!order.receptions?.length && (
				<Stack spacing={2} sx={{ pt: 1 }}>
					<Divider />
					<Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
						Bons de réception
					</Typography>
					{order.receptions.map((receipt) => (
						<Stack
							key={receipt.id}
							spacing={0.75}
							sx={{
								borderLeft: '3px solid',
								borderColor: receipt.status === 'validated' ? 'success.main' : 'divider',
								pl: 2,
								minWidth: 0,
							}}
						>
							<Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
								<Typography variant="subtitle2" sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>
									{receipt.reference || `Réception n° ${receipt.id}`}
								</Typography>
								<Chip
									size="small"
									variant="outlined"
									color={
										receipt.status === 'validated' ? 'success' : receipt.status === 'cancelled' ? 'error' : 'default'
									}
									label={
										receipt.status === 'validated'
											? 'Validée'
											: receipt.status === 'cancelled'
												? 'Annulée'
												: 'Brouillon'
									}
								/>
							</Stack>
							<Typography variant="caption" color="text.secondary">
								{receipt.status === 'validated' && receipt.date_validated
									? `Validée le ${timestamp(receipt.date_validated)}${receipt.validated_by_name ? ` par ${receipt.validated_by_name}` : ''}`
									: `Créée le ${timestamp(receipt.date_created)}${receipt.created_by_name ? ` par ${receipt.created_by_name}` : ''}`}
							</Typography>
							{receipt.note && (
								<Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
									{receipt.note}
								</Typography>
							)}
						</Stack>
					))}
				</Stack>
			)}
		</>
	);
}
