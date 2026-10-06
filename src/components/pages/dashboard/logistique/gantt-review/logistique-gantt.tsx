'use client';

import { type FC, useState } from 'react';
import Image from 'next/image';
import {
	Alert,
	Box,
	Button,
	ButtonBase,
	Card,
	CardContent,
	Chip,
	CircularProgress,
	Dialog,
	DialogContent,
	DialogTitle,
	MenuItem,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TextField,
	Typography,
} from '@mui/material';
import { Download, Close, OpenInFull, Save } from '@mui/icons-material';
import CompanyDocumentsWrapperList from '@/components/pages/dashboard/shared/company-documents-list/companyDocumentsWrapperList';
import { useAppSelector } from '@/utils/hooks';
import { getProfilState } from '@/store/selectors';
import { useInitAccessToken } from '@/contexts/InitContext';
import type { SessionProps } from '@/types/_initTypes';
import content from './content.json';
import { REVIEW_DELAYS } from './review-state';
import { useReviewState } from './use-review-state';
import ReviewTimeline from './review-timeline';

type Screenshot = (typeof content.stages)[number]['screenshots'][number];
type Field = (typeof content.common)[number];
const requirementBadges = {
	O: { label: 'Obligatoire', background: '#fee2e2', color: '#991b1b' },
	C: { label: 'Conditionnel', background: '#fef3c7', color: '#92400e' },
	F: { label: 'Facultatif', background: '#dbeafe', color: '#1e40af' },
	A: { label: 'Automatique', background: '#f1f5f9', color: '#475569' },
};

const ReviewContent = ({ companyId, session }: SessionProps & { companyId: number }) => {
	const token = useInitAccessToken(session);
	const { review, ready, loading, loadError, retry, canEdit, saving, dirty, saveError, savedAt, setDecision, save } =
		useReviewState(companyId, !!token);
	const [selected, setSelected] = useState(0);
	const [screenshot, setScreenshot] = useState<Screenshot | null>(null);
	const exportReview = () => {
		const fields = [
			...content.stages.flatMap((stage) =>
				stage.fields.map((field, index) => ({
					step: stage.n,
					field: field.label,
					type: field.type,
					...review.decisions[`${stage.n}-${index}`],
				})),
			),
			...content.common.map((field, index) => ({
				step: 'Commun',
				field: field.label,
				type: field.type,
				...review.decisions[`common-${index}`],
			})),
		];
		const blob = new Blob(
			[
				JSON.stringify(
					{
						titre: 'Revue du module logistique',
						date: new Date().toISOString(),
						...review,
						champs: fields,
						delais: REVIEW_DELAYS.map((delay, index) => ({ etape: index + 1, delai: delay.label })),
					},
					null,
					2,
				),
			],
			{ type: 'application/json' },
		);
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = 'revue-logistique.json';
		link.click();
		setTimeout(() => URL.revokeObjectURL(url), 1000);
	};

	const fieldTable = (fields: Field[], prefix: string) => (
		<TableContainer sx={{ mt: 2 }}>
			<Table size="small" sx={{ minWidth: 950 }} aria-label={`Champs ${prefix}`}>
				<TableHead>
					<TableRow>
						{['Champ', 'Valeur attendue', 'À quoi sert ce champ ?', 'Décision', 'Commentaire'].map((label) => (
							<TableCell key={label} sx={{ fontWeight: 700, bgcolor: 'action.hover' }}>
								{label}
							</TableCell>
						))}
					</TableRow>
				</TableHead>
				<TableBody>
					{fields.map((field, index) => {
						const key = `${prefix}-${index}`;
						const requirement = requirementBadges[field.required[0] as keyof typeof requirementBadges];
						const details = field.required
							.slice(1)
							.replace(/^[, ]+/, '')
							.replace(/\bA\b/g, 'automatique');
						return (
							<TableRow key={key} sx={{ '& td': { verticalAlign: 'top', py: 2 } }}>
								<TableCell sx={{ width: '19%', fontWeight: 600 }}>{field.label}</TableCell>
								<TableCell sx={{ width: '19%' }}>
									{field.type}
									<Box sx={{ mt: 1 }}>
										<Chip
											size="small"
											label={requirement.label}
											sx={{ bgcolor: requirement.background, color: requirement.color, fontWeight: 700 }}
										/>
										{details && (
											<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
												{details.charAt(0).toUpperCase() + details.slice(1)}
											</Typography>
										)}
									</Box>
								</TableCell>
								<TableCell sx={{ width: '30%' }}>
									{field.meaning}
									<Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
										Exemple : {field.example}
									</Typography>
								</TableCell>
								<TableCell>
									<TextField
										select
										size="small"
										disabled={!canEdit || saving}
										label={`Décision : ${field.label}`}
										value={review.decisions[key]?.choice ?? ''}
										onChange={(e) => setDecision(key, { choice: e.target.value })}
										sx={{ width: 150 }}
									>
										<MenuItem value="">À examiner</MenuItem>
										{['Conserver', 'Modifier', 'Supprimer'].map((choice) => (
											<MenuItem key={choice} value={choice}>
												{choice}
											</MenuItem>
										))}
									</TextField>
								</TableCell>
								<TableCell>
									<TextField
										multiline
										minRows={2}
										size="small"
										disabled={!canEdit || saving}
										label={`Commentaire : ${field.label}`}
										value={review.decisions[key]?.note ?? ''}
										onChange={(e) => setDecision(key, { note: e.target.value })}
										slotProps={{ htmlInput: { maxLength: 2000 } }}
										helperText={
											(review.decisions[key]?.note.length ?? 0) >= 2000 ? '2 000 caractères maximum' : undefined
										}
										sx={{ minWidth: 170 }}
									/>
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</TableContainer>
	);

	const loadAlert = (
		<Alert
			severity="error"
			action={
				<Button color="inherit" disabled={loading} onClick={() => retry()}>
					Réessayer
				</Button>
			}
		>
			Impossible de charger la revue enregistrée. Réessayez pour retrouver les décisions et commentaires.
		</Alert>
	);
	if (!ready) return loadError ? loadAlert : <CircularProgress aria-label="Chargement de la revue" />;
	const stage = content.stages[selected];
	return (
		<Stack spacing={3} sx={{ pb: 14, minWidth: 0 }}>
			<Card variant="outlined">
				<CardContent>
					<Stack
						direction={{ xs: 'column', md: 'row' }}
						spacing={2}
						sx={{ justifyContent: 'space-between', alignItems: { md: 'center' } }}
					>
						<Box>
							<Chip label="Revue temporaire" color="warning" size="small" />
							<Typography variant="h5" component="h1" sx={{ mt: 1, fontWeight: 700 }}>
								Le parcours logistique, étape par étape
							</Typography>
							<Typography color="text.secondary" sx={{ mt: 1 }}>
								Choisissez une étape, puis examinez ses champs et ajoutez vos décisions ou commentaires.
							</Typography>
						</Box>
						<Button startIcon={<Download />} variant="outlined" onClick={exportReview} sx={{ flexShrink: 0 }}>
							Exporter ma revue
						</Button>
					</Stack>
					<Typography color="text.secondary" sx={{ mt: 2 }}>
						Enregistrez vos décisions et commentaires : ils seront visibles par les membres de cette société à la
						prochaine ouverture.
					</Typography>
					{loadError && <Box sx={{ mt: 2 }}>{loadAlert}</Box>}
				</CardContent>
			</Card>
			<Card variant="outlined">
				<CardContent>
					<Typography variant="h6" component="h2" gutterBottom>
						Les 8 étapes et leurs délais
					</Typography>
					<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
						1 carreau = 1 jour. X = date d’expédition, repère de l’étape 4. Cliquez sur une étape pour examiner ses
						champs.
					</Typography>
					<ReviewTimeline selected={selected} onSelect={setSelected} />
					<Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
						Le signe // sépare les deux repères : la date d’expédition X n’est pas calculée à partir du lancement.
					</Typography>
				</CardContent>
			</Card>
			<Card variant="outlined">
				<CardContent>
					<Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
						{stage.n}. {stage.title}
					</Typography>
					<Typography sx={{ mt: 1 }} color="text.secondary">
						{stage.role}
					</Typography>
					<Alert severity="info" sx={{ my: 2 }}>
						<strong>Délai : {REVIEW_DELAYS[selected].label}.</strong>
						{selected === 3 && ' Repère X : date d’expédition, utilisée pour lire le délai de l’étape 5.'}
						{selected === 4 && ' X représente la date d’expédition de l’étape 4. Fin de cette étape : X + 3 jours.'}
					</Alert>
					<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
						{[
							['Ce que l’on fait', stage.purpose],
							['Avant de commencer', stage.requires],
							['Résultat attendu', stage.result],
						].map(([title, text]) => (
							<Box key={title} sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 1 }}>
								<Typography sx={{ fontWeight: 700 }} gutterBottom>
									{title}
								</Typography>
								<Typography variant="body2">{text}</Typography>
							</Box>
						))}
					</Box>
					<Typography component="h3" variant="h6" sx={{ mt: 3 }}>
						Champs à examiner
					</Typography>
					{fieldTable(stage.fields, String(stage.n))}
					<Box component="ul" sx={{ pl: 2.5 }}>
						{stage.notes.map((note) => (
							<Typography component="li" key={note} variant="body2" sx={{ my: 1 }}>
								{note}
							</Typography>
						))}
					</Box>
					<Typography component="h3" variant="h6" sx={{ mt: 3 }}>
						Écrans de l’étape
					</Typography>
					<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
						Captures réelles avec données fictives. Cliquez pour agrandir.
					</Typography>
					<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
						{stage.screenshots.map((shot) => (
							<Card key={shot.file} variant="outlined">
								<ButtonBase
									onClick={() => setScreenshot(shot)}
									aria-label={`Agrandir ${shot.file}`}
									sx={{ display: 'block', width: '100%', bgcolor: '#f8fafc' }}
								>
									<Image
										src={`/logistique-review/${encodeURIComponent(shot.file)}`}
										alt={shot.caption}
										width={shot.width}
										height={shot.height}
										unoptimized
										style={{ width: '100%', height: 270, objectFit: 'contain' }}
									/>
								</ButtonBase>
								<CardContent>
									<Typography sx={{ fontWeight: 600 }} variant="body2">
										{shot.file}
									</Typography>
									<Typography variant="body2" color="text.secondary">
										{shot.caption}
									</Typography>
									<Button size="small" startIcon={<OpenInFull />} onClick={() => setScreenshot(shot)}>
										Agrandir
									</Button>
								</CardContent>
							</Card>
						))}
					</Box>
				</CardContent>
			</Card>
			<Card variant="outlined">
				<CardContent>
					<Typography variant="h6" component="h2">
						Informations utilisées à plusieurs étapes
					</Typography>
					{fieldTable(content.common, 'common')}
					<Button
						sx={{ mt: 2 }}
						startIcon={<OpenInFull />}
						onClick={() =>
							setScreenshot({
								file: 'annexe_remarques.png',
								caption: 'Remarques et documents ajoutés au fil de la commande.',
								width: 1312,
								height: 248,
							})
						}
					>
						Voir la capture des remarques
					</Button>
				</CardContent>
			</Card>
			<Card variant="outlined">
				<CardContent>
					<Typography variant="h6" component="h2">
						Les choix à confirmer
					</Typography>
					<TableContainer>
						<Table sx={{ minWidth: 650 }}>
							<TableHead>
								<TableRow>
									{['Sujet', 'Situation actuelle', 'Décision à prendre'].map((label) => (
										<TableCell key={label} sx={{ fontWeight: 700 }}>
											{label}
										</TableCell>
									))}
								</TableRow>
							</TableHead>
							<TableBody>
								{content.decisions.map((row) => (
									<TableRow key={row[0]}>
										{row.map((cell, index) => (
											<TableCell key={index} sx={{ verticalAlign: 'top' }}>
												{cell}
											</TableCell>
										))}
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableContainer>
				</CardContent>
			</Card>
			<Card
				variant="outlined"
				sx={{ position: 'fixed', bottom: 16, right: 24, left: { xs: 16, md: 256 }, zIndex: 10, boxShadow: 2 }}
			>
				{saveError && (
					<Alert severity="error">
						Enregistrement impossible. Vos modifications sont conservées à l’écran. Cliquez sur « Enregistrer » pour
						réessayer.
					</Alert>
				)}
				<Stack
					direction={{ xs: 'column', sm: 'row' }}
					spacing={2}
					sx={{ p: 2, justifyContent: 'space-between', alignItems: { sm: 'center' } }}
				>
					<Typography role="status" variant="body2">
						{saving
							? 'Enregistrement…'
							: dirty
								? 'Modifications non enregistrées'
								: savedAt
									? `Revue enregistrée le ${new Date(savedAt).toLocaleString('fr-FR')}`
									: 'Aucune décision enregistrée pour le moment.'}
						{!canEdit && !loadError && ' — Lecture seule'}
					</Typography>
					{canEdit && (
						<Button variant="contained" startIcon={<Save />} disabled={!dirty || saving} onClick={save}>
							Enregistrer
						</Button>
					)}
				</Stack>
			</Card>
			<Dialog open={!!screenshot} onClose={() => setScreenshot(null)} maxWidth="lg" fullWidth>
				<DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
					{screenshot?.file}
					<Button onClick={() => setScreenshot(null)} startIcon={<Close />}>
						Fermer
					</Button>
				</DialogTitle>
				<DialogContent>
					{screenshot && (
						<>
							<Image
								src={`/logistique-review/${encodeURIComponent(screenshot.file)}`}
								alt={screenshot.caption}
								width={screenshot.width}
								height={screenshot.height}
								unoptimized
								style={{ width: '100%', height: 'auto' }}
							/>
							<Typography sx={{ mt: 2 }}>{screenshot.caption}</Typography>
						</>
					)}
				</DialogContent>
			</Dialog>
		</Stack>
	);
};

const LogistiqueGantt: FC<SessionProps> = ({ session }) => {
	const profile = useAppSelector(getProfilState);
	return (
		<CompanyDocumentsWrapperList session={session} title="Gantt logistique - Revue des champs">
			{({ company_id }) =>
				profile.id ? (
					<ReviewContent key={`${profile.id}-${company_id}`} companyId={company_id} session={session} />
				) : (
					<CircularProgress />
				)
			}
		</CompanyDocumentsWrapperList>
	);
};

export default LogistiqueGantt;
