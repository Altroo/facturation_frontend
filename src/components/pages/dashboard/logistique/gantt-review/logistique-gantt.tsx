'use client';

import { type FC, type PointerEvent, useEffect, useRef, useState } from 'react';
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
	useMediaQuery,
} from '@mui/material';
import { Download, RestartAlt, Close, OpenInFull } from '@mui/icons-material';
import CompanyDocumentsWrapperList from '@/components/pages/dashboard/shared/company-documents-list/companyDocumentsWrapperList';
import { useAppSelector } from '@/utils/hooks';
import { getProfilState } from '@/store/selectors';
import type { SessionProps } from '@/types/_initTypes';
import content from './content.json';
import {
	dateAt,
	dayOffset,
	initialReview,
	parseReview,
	updateSchedule,
	validDate,
	type FieldDecision,
	type ReviewState,
	type ReviewTask,
} from './schedule';

const ROW_HEIGHT = 48;
const HEADER_HEIGHT = 40;
const formatDate = (iso: string) =>
	new Date(iso).toLocaleDateString('fr-FR', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' });
type Screenshot = (typeof content.stages)[number]['screenshots'][number];
type Field = (typeof content.common)[number];
type Drag = { index: number; mode: 'move' | 'resize'; x: number; tasks: ReviewTask[] };

const ReviewContent = ({ storageKey }: { storageKey: string }) => {
	const labelWidth = useMediaQuery('(max-width:600px)') ? 190 : 270;
	const [review, setReview] = useState<ReviewState>(initialReview);
	const [ready, setReady] = useState(false);
	const [storageError, setStorageError] = useState(false);
	const [selected, setSelected] = useState(0);
	const [dayWidth, setDayWidth] = useState(32);
	const [screenshot, setScreenshot] = useState<Screenshot | null>(null);
	const [resetOpen, setResetOpen] = useState(false);
	const drag = useRef<Drag | null>(null);

	useEffect(() => {
		try {
			const saved = localStorage.getItem(storageKey);
			if (saved) {
				const parsed = parseReview(JSON.parse(saved));
				if (parsed) setReview(parsed);
				else setStorageError(true);
			}
		} catch {
			setStorageError(true);
		}
		setReady(true);
	}, [storageKey]);

	useEffect(() => {
		if (!ready) return;
		try {
			localStorage.setItem(storageKey, JSON.stringify(review));
		} catch {
			setStorageError(true);
		}
	}, [ready, review, storageKey]);

	const updateTask = (index: number, change: Partial<ReviewTask>) =>
		setReview((previous) => ({ ...previous, tasks: updateSchedule(previous.tasks, index, change) }));
	const startDrag = (event: PointerEvent<HTMLButtonElement>, index: number, mode: Drag['mode']) => {
		if (event.button !== 0) return;
		setSelected(index);
		drag.current = { index, mode, x: event.clientX, tasks: review.tasks };
		event.currentTarget.setPointerCapture(event.pointerId);
	};
	const moveDrag = (event: PointerEvent<HTMLButtonElement>) => {
		const current = drag.current;
		if (!current) return;
		const delta = Math.round((event.clientX - current.x) / dayWidth);
		const task = current.tasks[current.index];
		const change = current.mode === 'move' ? { offset: task.offset + delta } : { duration: task.duration + delta };
		setReview((previous) => ({ ...previous, tasks: updateSchedule(current.tasks, current.index, change) }));
	};
	const stopDrag = () => {
		drag.current = null;
	};
	const cancelDrag = () => {
		const current = drag.current;
		if (current) setReview((previous) => ({ ...previous, tasks: current.tasks }));
		stopDrag();
	};
	const setDecision = (key: string, change: Partial<FieldDecision>) =>
		setReview((previous) => ({
			...previous,
			decisions: {
				...previous.decisions,
				[key]: { ...(previous.decisions[key] ?? { choice: '', note: '' }), ...change },
			},
		}));
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
					{ titre: 'Revue du module logistique', date: new Date().toISOString(), ...review, champs: fields },
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
						{['Champ', 'Type et exigence', 'Signification et exemple', 'Décision', 'Commentaire'].map((label) => (
							<TableCell key={label} sx={{ fontWeight: 700, bgcolor: 'action.hover' }}>
								{label}
							</TableCell>
						))}
					</TableRow>
				</TableHead>
				<TableBody>
					{fields.map((field, index) => {
						const key = `${prefix}-${index}`;
						return (
							<TableRow key={key} sx={{ '& td': { verticalAlign: 'top', py: 2 } }}>
								<TableCell sx={{ width: '19%', fontWeight: 600 }}>{field.label}</TableCell>
								<TableCell sx={{ width: '19%' }}>
									{field.type}
									<Typography variant="body2" color="primary" sx={{ mt: 1, fontWeight: 600 }}>
										{field.required}
									</Typography>
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
										label={`Commentaire : ${field.label}`}
										value={review.decisions[key]?.note ?? ''}
										onChange={(e) => setDecision(key, { note: e.target.value })}
										slotProps={{ htmlInput: { maxLength: 2000 } }}
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

	if (!ready) return <CircularProgress aria-label="Chargement de la revue" />;
	const stage = content.stages[selected];
	const task = review.tasks[selected];
	const days = Math.max(35, review.tasks[7].offset + review.tasks[7].duration + 3);
	return (
		<Stack spacing={3} sx={{ pb: 4, minWidth: 0 }}>
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
								Sélectionnez une étape pour examiner ses prérequis, ses champs et ses captures.
							</Typography>
						</Box>
						<Button startIcon={<Download />} variant="outlined" onClick={exportReview} sx={{ flexShrink: 0 }}>
							Exporter ma revue
						</Button>
					</Stack>
					<Alert severity="info" sx={{ mt: 2 }}>
						Planning illustratif à valider. Les dates et les décisions sont enregistrées dans ce navigateur, pour votre
						compte et cette société. Elles ne modifient pas les dossiers logistiques.
					</Alert>
					{storageError && (
						<Alert severity="warning" sx={{ mt: 1 }}>
							La sauvegarde locale est indisponible ou illisible. Exportez votre revue pour conserver vos décisions.
						</Alert>
					)}
				</CardContent>
			</Card>
			<Card variant="outlined">
				<CardContent>
					<Stack
						direction={{ xs: 'column', sm: 'row' }}
						spacing={2}
						sx={{ mb: 2, alignItems: { sm: 'center' }, flexWrap: 'wrap' }}
					>
						<TextField
							type="date"
							size="small"
							label="Début du planning"
							value={review.start}
							slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: '2000-01-01', max: '2100-01-01' } }}
							onChange={(e) => {
								const value = e.target.value;
								if (validDate(value) && value >= '2000-01-01' && value <= '2100-01-01')
									setReview((previous) => ({ ...previous, start: value }));
							}}
						/>
						<TextField
							select
							label="Échelle"
							size="small"
							value={dayWidth}
							onChange={(e) => setDayWidth(Number(e.target.value))}
							sx={{ minWidth: 130 }}
						>
							<MenuItem value={18}>Compacte</MenuItem>
							<MenuItem value={32}>Normale</MenuItem>
							<MenuItem value={48}>Détaillée</MenuItem>
						</TextField>
						<Button startIcon={<RestartAlt />} onClick={() => setResetOpen(true)}>
							Réinitialiser les dates
						</Button>
					</Stack>
					<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
						Glissez une barre pour la déplacer, ou son bord droit pour changer sa durée. Au clavier : sélectionnez une
						barre, puis utilisez les flèches gauche/droite. Une étape commence après la précédente ; les étapes
						suivantes se décalent si nécessaire.
					</Typography>
					<Box
						sx={{ overflowX: 'auto', border: 1, borderColor: 'divider', borderRadius: 1, typography: 'body2' }}
						data-testid="review-gantt"
					>
						<Box sx={{ position: 'relative', width: labelWidth + days * dayWidth }}>
							<Box
								sx={{
									display: 'flex',
									height: HEADER_HEIGHT,
									bgcolor: 'action.hover',
									borderBottom: 1,
									borderColor: 'divider',
								}}
							>
								<Box
									sx={{
										width: labelWidth,
										flexShrink: 0,
										px: 2,
										py: 1,
										position: 'sticky',
										left: 0,
										bgcolor: 'background.paper',
										zIndex: 3,
										fontWeight: 700,
									}}
								>
									Étape
								</Box>
								{Array.from({ length: days }, (_, i) => (
									<Box
										key={i}
										sx={{
											width: dayWidth,
											flexShrink: 0,
											fontSize: 10,
											textAlign: 'center',
											pt: 1,
											borderLeft: 1,
											borderColor: 'divider',
										}}
										title={formatDate(dateAt(review.start, i))}
									>
										{i % (dayWidth === 18 ? 5 : 3) === 0
											? dateAt(review.start, i).slice(5).split('-').reverse().join('/')
											: ''}
									</Box>
								))}
							</Box>
							<svg
								aria-hidden="true"
								width={days * dayWidth}
								height={8 * ROW_HEIGHT}
								style={{
									position: 'absolute',
									left: labelWidth,
									top: HEADER_HEIGHT,
									pointerEvents: 'none',
									zIndex: 1,
									overflow: 'visible',
								}}
							>
								<defs>
									<marker id="review-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
										<path d="M0,0 L6,3 L0,6" fill="#64748b" />
									</marker>
								</defs>
								{review.tasks.slice(1).map((next, i) => {
									const x = (review.tasks[i].offset + review.tasks[i].duration) * dayWidth;
									return (
										<path
											key={i}
											d={`M ${x - 2} ${i * ROW_HEIGHT + 24} H ${x + 8} V ${(i + 1) * ROW_HEIGHT + 24} H ${next.offset * dayWidth + 1}`}
											fill="none"
											stroke="#64748b"
											strokeWidth="1.5"
											markerEnd="url(#review-arrow)"
										/>
									);
								})}
							</svg>
							{content.stages.map((item, i) => (
								<Box
									key={item.n}
									sx={{
										display: 'flex',
										height: ROW_HEIGHT,
										borderBottom: 1,
										borderColor: 'divider',
										bgcolor: selected === i ? 'action.selected' : 'background.paper',
									}}
								>
									<ButtonBase
										onClick={() => setSelected(i)}
										aria-pressed={selected === i}
										sx={{
											width: labelWidth,
											flexShrink: 0,
											px: 2,
											position: 'sticky',
											left: 0,
											zIndex: 3,
											bgcolor: 'background.paper',
											justifyContent: 'flex-start',
											textAlign: 'left',
											borderRight: 1,
											borderColor: 'divider',
										}}
									>
										<Box
											component="span"
											sx={{ width: 9, height: 9, mr: 1, borderRadius: '50%', bgcolor: item.color, flexShrink: 0 }}
										/>
										<Typography variant="body2" sx={{ fontWeight: selected === i ? 700 : 400 }}>
											{item.n}. {item.title}
										</Typography>
									</ButtonBase>
									<Box
										sx={{
											position: 'relative',
											width: days * dayWidth,
											backgroundImage: 'linear-gradient(to right, rgba(128,128,128,.15) 1px, transparent 1px)',
											backgroundSize: `${dayWidth}px 100%`,
										}}
									>
										<Box
											sx={{
												position: 'absolute',
												left: review.tasks[i].offset * dayWidth,
												top: 8,
												height: 32,
												width: review.tasks[i].duration * dayWidth,
												display: 'flex',
												bgcolor: item.color,
												borderRadius: 1,
												zIndex: 2,
												outline: selected === i ? '2px solid' : undefined,
												outlineColor: 'text.primary',
												outlineOffset: 2,
											}}
										>
											<ButtonBase
												aria-label={`Déplacer l’étape ${item.n} : ${item.title}`}
												data-testid={`gantt-bar-${item.n}`}
												onClick={() => setSelected(i)}
												onPointerDown={(e) => startDrag(e, i, 'move')}
												onPointerMove={moveDrag}
												onPointerUp={stopDrag}
												onPointerCancel={cancelDrag}
												onLostPointerCapture={stopDrag}
												onKeyDown={(e) => {
													if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
														e.preventDefault();
														updateTask(i, { offset: review.tasks[i].offset + (e.key === 'ArrowRight' ? 1 : -1) });
													}
												}}
												sx={{
													flex: 1,
													minWidth: 0,
													color: 'white',
													fontSize: 12,
													whiteSpace: 'nowrap',
													overflow: 'hidden',
													px: 0.5,
													cursor: 'grab',
													touchAction: 'none',
													'&.Mui-focusVisible': { outline: '3px solid #111' },
												}}
												title={`${item.title} : ${formatDate(dateAt(review.start, review.tasks[i].offset))} - ${formatDate(dateAt(review.start, review.tasks[i].offset + review.tasks[i].duration - 1))}`}
											>
												{review.tasks[i].duration * dayWidth > 65
													? `${review.tasks[i].duration} j`
													: review.tasks[i].duration}
											</ButtonBase>
											<ButtonBase
												aria-label={`Modifier la durée de l’étape ${item.n}`}
												onPointerDown={(e) => startDrag(e, i, 'resize')}
												onPointerMove={moveDrag}
												onPointerUp={stopDrag}
												onPointerCancel={cancelDrag}
												onLostPointerCapture={stopDrag}
												onKeyDown={(e) => {
													if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
														e.preventDefault();
														updateTask(i, { duration: review.tasks[i].duration + (e.key === 'ArrowRight' ? 1 : -1) });
													}
												}}
												sx={{
													width: 12,
													flexShrink: 0,
													color: 'white',
													bgcolor: 'rgba(0,0,0,.15)',
													cursor: 'ew-resize',
													touchAction: 'none',
												}}
											>
												⋮
											</ButtonBase>
										</Box>
									</Box>
								</Box>
							))}
						</Box>
					</Box>
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
					<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ my: 3 }}>
						<TextField
							size="small"
							type="date"
							label="Début de l’étape"
							value={dateAt(review.start, task.offset)}
							slotProps={{
								inputLabel: { shrink: true },
								htmlInput: {
									min: dateAt(
										review.start,
										selected ? review.tasks[selected - 1].offset + review.tasks[selected - 1].duration : 0,
									),
								},
							}}
							onChange={(e) => {
								if (validDate(e.target.value))
									updateTask(selected, { offset: dayOffset(review.start, e.target.value) });
							}}
						/>
						<TextField
							size="small"
							type="number"
							label="Durée (jours calendaires)"
							value={task.duration}
							slotProps={{ htmlInput: { min: 1, max: 90 } }}
							onChange={(e) => {
								if (e.target.value) updateTask(selected, { duration: Number(e.target.value) });
							}}
						/>
						<TextField
							size="small"
							label="Fin de l’étape"
							value={formatDate(dateAt(review.start, task.offset + task.duration - 1))}
							slotProps={{ input: { readOnly: true } }}
						/>
					</Stack>
					<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
						{[
							['Ce que l’on fait', stage.purpose],
							['Prérequis', stage.requires],
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
					<Typography variant="body2" color="text.secondary">
						O : obligatoire · C : conditionnel · F : facultatif · A : automatique. Les précisions indiquent quand chaque
						règle s’applique.
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
						Champs communs et valeurs reprises
					</Typography>
					{fieldTable(content.common, 'common')}
					<Button
						sx={{ mt: 2 }}
						startIcon={<OpenInFull />}
						onClick={() =>
							setScreenshot({
								file: 'annexe_remarques.png',
								caption: 'Remarques et pièces jointes transversales du dossier.',
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
						Les arbitrages à préparer
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
			<Dialog open={resetOpen} onClose={() => setResetOpen(false)}>
				<DialogTitle>Réinitialiser le planning illustratif ?</DialogTitle>
				<DialogContent>
					<Typography>Les décisions et commentaires sur les champs sont conservés.</Typography>
					<Stack direction="row" spacing={2} sx={{ mt: 3 }}>
						<Button onClick={() => setResetOpen(false)}>Annuler</Button>
						<Button
							variant="contained"
							onClick={() => {
								setReview((previous) => ({ ...initialReview(), decisions: previous.decisions }));
								setResetOpen(false);
							}}
						>
							Réinitialiser
						</Button>
					</Stack>
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
					<ReviewContent
						key={`${profile.id}-${company_id}`}
						storageKey={`logistique-review-v1-${profile.id}-${company_id}`}
					/>
				) : (
					<CircularProgress />
				)
			}
		</CompanyDocumentsWrapperList>
	);
};

export default LogistiqueGantt;
