'use client';

import { useState } from 'react';
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Stack,
	Step,
	StepButton,
	Stepper,
	TextField,
	Typography,
	useMediaQuery,
	useTheme,
} from '@mui/material';
import { Edit, Send } from '@mui/icons-material';
import type { LogistiqueOrder } from '@/types/logistiqueTypes';

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
	const compact = useMediaQuery(useTheme().breakpoints.down('lg'));
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
		<Card elevation={2} sx={{ borderRadius: 2 }}>
			<CardContent sx={{ p: { xs: 2, sm: 3 } }}>
				<Stack spacing={3}>
					<Stepper
						nonLinear
						activeStep={steps.findIndex((step) => step.key === selected)}
						alternativeLabel={!compact}
						orientation={compact ? 'vertical' : 'horizontal'}
					>
						{steps.map((step) => (
							<Step key={step.key} completed={step.completed}>
								<StepButton
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
					{previous && (
						<Alert severity="info">
							Étape terminée, affichée en lecture seule. Toute correction nécessite l’accord du responsable.
						</Alert>
					)}
					{previous && canManage && !mine && !requesting && (
						<Button variant="outlined" startIcon={<Edit />} onClick={() => setRequesting(true)}>
							Demander une modification
						</Button>
					)}
					{previous && requesting && (
						<Stack spacing={2}>
							<TextField
								label="Remarque pour le responsable"
								placeholder="Expliquez la correction à effectuer"
								size="small"
								fullWidth
								multiline
								minRows={3}
								required
								value={remark}
								onChange={(event) => setRemark(event.target.value)}
								disabled={busy}
							/>
							<Box>
								<Button
									variant="contained"
									startIcon={<Send />}
									disabled={busy || !remark.trim()}
									onClick={async () => {
										if (await onAction({ action: 'demander_modification', etape: selected, remarque: remark.trim() })) {
											setRequesting(false);
											setRemark('');
										}
									}}
								>
									Envoyer la demande
								</Button>
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
