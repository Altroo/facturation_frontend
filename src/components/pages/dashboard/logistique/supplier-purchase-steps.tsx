'use client';

import { useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Stack, Step, StepButton, Stepper, Typography } from '@mui/material';
import { Edit, Notes, Send } from '@mui/icons-material';
import type { LogistiqueOrder } from '@/types/logistiqueTypes';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import { textInputTheme } from '@/utils/themes';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';

const inputTheme = textInputTheme();

type Props = {
	order: LogistiqueOrder;
	selected: string;
	userId: number | null;
	canManage: boolean;
	busy: boolean;
	onSelect: (step: string) => void;
	onAction: (data: Record<string, unknown>) => Promise<boolean>;
	onEdit: (step: string, approval: number) => void;
};

export default function SupplierPurchaseSteps({
	order,
	selected,
	userId,
	canManage,
	busy,
	onSelect,
	onAction,
	onEdit,
}: Props) {
	const selectedButton = useRef<HTMLButtonElement | null>(null);
	useEffect(() => {
		selectedButton.current?.scrollIntoView?.({ block: 'nearest', inline: 'center' });
	}, [selected]);
	const [remark, setRemark] = useState('');
	const [requesting, setRequesting] = useState(false);
	const steps = order.workflow?.etapes ?? [];
	const current = order.workflow?.etape_courante;
	const previous =
		selected !== current && steps.some((step) => step.key === selected && step.completed && step.accessible);
	const requests = (order.change_requests ?? []).filter((request) => request.etape === selected);
	const mine = requests.find(
		(request) => request.demandeur === userId && ['pending', 'approved'].includes(request.statut),
	);
	return (
		<Card elevation={2} sx={{ borderRadius: 2, minWidth: 0 }}>
			<CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
				<Stack spacing={2}>
					<Box sx={{ overflowX: 'auto', p: 1 }}>
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
											setRequesting(false);
											setRemark('');
										}}
										aria-current={selected === step.key ? 'step' : undefined}
									>
										{step.label}
									</StepButton>
								</Step>
							))}
						</Stepper>
					</Box>
					{previous && (
						<Alert severity="info">
							Étape terminée, affichée en lecture seule. Toute correction nécessite l’accord du responsable.
						</Alert>
					)}
					{previous && canManage && !mine && !requesting && (
						<Button
							size="small"
							sx={{ alignSelf: 'flex-start' }}
							variant="outlined"
							startIcon={<Edit />}
							onClick={() => setRequesting(true)}
						>
							Demander une modification
						</Button>
					)}
					{previous && requesting && (
						<Stack spacing={2}>
							<CustomTextInput
								id="correction_remarque"
								type="textarea"
								theme={inputTheme}
								startIcon={<Notes fontSize="small" />}
								label="Remarque pour le responsable"
								placeholder="Expliquez la correction à effectuer"
								size="small"
								fullWidth
								minRows={3}
								required
								value={remark}
								onChange={(event) => setRemark(event.target.value)}
								disabled={busy}
							/>
							<Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
								<PrimaryLoadingButton
									buttonText="Envoyer la demande"
									type="button"
									startIcon={<Send />}
									active={!busy && !!remark.trim()}
									loading={busy}
									onClick={async () => {
										if (await onAction({ action: 'demander_modification', etape: selected, remarque: remark.trim() })) {
											setRequesting(false);
											setRemark('');
										}
									}}
								/>
							</Box>
						</Stack>
					)}
					{mine?.statut === 'pending' && <Alert severity="info">Votre demande attend l’accord du responsable.</Alert>}
					{mine?.statut === 'approved' && canManage && (
						<Button variant="outlined" startIcon={<Edit />} disabled={busy} onClick={() => onEdit(selected, mine.id)}>
							Effectuer la correction autorisée
						</Button>
					)}
					{requests
						.filter((request) => request.statut === 'pending' && order.responsable === userId)
						.map((request) => (
							<Alert severity="warning" key={request.id}>
								<Stack spacing={1}>
									<Typography variant="subtitle2">Demande de {request.demandeur_name}</Typography>
									<Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
										{request.remarque}
									</Typography>
									<Stack direction="row" spacing={1}>
										<Button
											disabled={busy}
											onClick={() => void onAction({ action: 'approuver_modification', demande_id: request.id })}
										>
											Approuver
										</Button>
										<Button
											color="error"
											disabled={busy}
											onClick={() => void onAction({ action: 'refuser_modification', demande_id: request.id })}
										>
											Refuser
										</Button>
									</Stack>
								</Stack>
							</Alert>
						))}
				</Stack>
			</CardContent>
		</Card>
	);
}
