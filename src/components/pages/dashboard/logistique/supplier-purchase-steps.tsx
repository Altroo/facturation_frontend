'use client';

import { useEffect, useRef } from 'react';
import { Alert, Box, Card, CardContent, Stack, Step, StepButton, Stepper, Typography } from '@mui/material';
import { CheckCircle, Close, Description, Edit } from '@mui/icons-material';
import type { LogistiqueOrder } from '@/types/logistiqueTypes';
import { formatLogistiqueMoney } from '@/utils/helpers';
import { HistoryValue } from './supplier-purchase-sections';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import PrimaryAnchorButton from '@/components/htmlElements/buttons/primaryAnchorButton/primaryAnchorButton';

type Props = {
	order: LogistiqueOrder;
	selected: string;
	userId: number | null;
	canManage: boolean;
	canReview?: boolean;
	busy: boolean;
	onSelect: (step: string) => void;
	onAction: (data: Record<string, unknown>) => Promise<boolean>;
	onEdit: (step: string, approval?: number) => void;
};

export default function SupplierPurchaseSteps({
	order,
	selected,
	userId,
	canManage,
	canReview = false,
	busy,
	onSelect,
	onAction,
	onEdit,
}: Props) {
	const selectedButton = useRef<HTMLButtonElement | null>(null);
	const navigation = useRef<HTMLDivElement | null>(null);
	useEffect(() => {
		const container = navigation.current;
		const button = selectedButton.current;
		if (!container || !button) return;
		container.scrollLeft +=
			button.getBoundingClientRect().left -
			container.getBoundingClientRect().left -
			(container.clientWidth - button.clientWidth) / 2;
	}, [selected]);
	const steps = order.workflow?.etapes ?? [];
	const current = order.workflow?.etape_courante;
	const previous =
		selected !== current && steps.some((step) => step.key === selected && step.completed && step.accessible);
	const requests = (order.change_requests ?? []).filter((request) => request.etape === selected);
	const mine = requests.find(
		(request) => request.demandeur === userId && ['pending', 'approved'].includes(request.statut),
	);
	const reviewer = (userId != null && order.responsable === userId) || canReview;
	const cancelled = order.statut_global === 'Annulé';
	const closed = order.workflow_version === 2 && order.statut === 'Clôture';
	const pending = requests.filter(
		(request) => request.statut === 'pending' && (request.demandeur === userId || reviewer),
	);
	return (
		<Card elevation={2} sx={{ borderRadius: 2, minWidth: 0, flexShrink: 0 }}>
			<CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
				<Stack spacing={2} useFlexGap>
					<Box ref={navigation} sx={{ overflowX: 'auto', p: 1 }}>
						<Stepper
							nonLinear
							activeStep={steps.findIndex((step) => step.key === selected)}
							alternativeLabel
							sx={{
								minWidth: steps.length * 115,
								'& .MuiStepLabel-label': { mt: 1, fontSize: '0.8rem', lineHeight: 1.4 },
								'& .MuiStepButton-root': { m: 0, p: 0, width: '100%' },
							}}
						>
							{steps.map((step) => (
								<Step key={step.key} completed={step.completed}>
									<StepButton
										ref={selected === step.key ? selectedButton : undefined}
										disabled={!step.accessible}
										onClick={() => {
											onSelect(step.key);
										}}
										aria-current={selected === step.key ? 'step' : undefined}
									>
										{step.label}
									</StepButton>
								</Step>
							))}
						</Stepper>
					</Box>
					{previous && !pending.some((request) => request.has_proposal) && (
						<Alert severity="info">
							Étape terminée, affichée en lecture seule. Les modifications proposées seront appliquées après validation.
						</Alert>
					)}
					{previous && canManage && (!mine || (mine.statut === 'pending' && !mine.has_proposal)) && (
						<PrimaryLoadingButton
							buttonText="Proposer une modification"
							size="small"
							loading={false}
							active={!busy}
							inverted
							startIcon={<Edit />}
							onClick={() => onEdit(selected)}
						/>
					)}
					{mine?.statut === 'approved' && canManage && (
						<PrimaryLoadingButton
							buttonText="Effectuer la correction autorisée"
							size="small"
							loading={false}
							active={!busy}
							inverted
							startIcon={<Edit />}
							onClick={() => onEdit(selected, mine.id)}
						/>
					)}
					{pending.map((request) => (
						<Alert severity="info" key={request.id}>
							<Stack spacing={2}>
								<Typography variant="subtitle2">Proposition de {request.demandeur_name}</Typography>
								<Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
									{request.remarque}
								</Typography>
								{request.has_proposal && (
									<Typography variant="body2">
										{cancelled
											? 'Ce dossier est annulé. La demande est suspendue.'
											: closed
												? 'Ce dossier est clôturé. La proposition ne peut plus être appliquée.'
												: reviewer
													? 'Cette proposition attend votre décision. Acceptez-la pour appliquer les modifications au dossier.'
													: `En attente de validation par ${order.responsable_name || 'le responsable du dossier'}.`}
									</Typography>
								)}
								{request.totaux_proposes && (
									<Typography
										variant="body2"
										color={
											request.totaux_proposes.articles === request.totaux_proposes.proforma
												? 'text.primary'
												: 'warning.main'
										}
									>
										Articles proposés :{' '}
										{formatLogistiqueMoney(request.totaux_proposes.articles, request.totaux_proposes.devise)}
										{' · '}Proforma proposée :{' '}
										{formatLogistiqueMoney(request.totaux_proposes.proforma, request.totaux_proposes.devise)}.{' '}
										{request.totaux_proposes.articles === request.totaux_proposes.proforma
											? 'Les deux montants correspondent.'
											: 'Vérifiez les prix, les quantités, les remises et les frais de la proposition.'}
									</Typography>
								)}
								{reviewer && !cancelled && (
									<Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
										{request.has_proposal && !closed && (
											<PrimaryLoadingButton
												buttonText="Accepter"
												size="small"
												loading={busy}
												active={!busy}
												startIcon={<CheckCircle />}
												onClick={() => void onAction({ action: 'approuver_modification', demande_id: request.id })}
											/>
										)}
										<PrimaryLoadingButton
											buttonText="Refuser"
											size="small"
											loading={false}
											active={!busy}
											inverted
											color="error"
											startIcon={<Close />}
											onClick={() => void onAction({ action: 'refuser_modification', demande_id: request.id })}
										/>
									</Stack>
								)}
								{(request.changes ?? []).map((change) => (
									<Stack key={change.field} spacing={1}>
										<Typography variant="subtitle2">{change.label}</Typography>
										<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1 }}>
											<HistoryValue label="Valeur actuelle" value={change.before || 'Non renseigné'} />
											<HistoryValue label="Valeur proposée" value={change.after || 'Non renseigné'} />
										</Box>
										{change.file_url && (
											<PrimaryAnchorButton
												buttonText="Consulter le document proposé"
												nextPage={change.file_url}
												target="_blank"
												rel="noreferrer"
												size="small"
												active
												inverted
												startIcon={<Description fontSize="small" />}
											/>
										)}
									</Stack>
								))}
								{!request.has_proposal && (
									<Typography variant="body2">
										Le demandeur doit renseigner les valeurs à modifier avant la validation.
									</Typography>
								)}
							</Stack>
						</Alert>
					))}
				</Stack>
			</CardContent>
		</Card>
	);
}
