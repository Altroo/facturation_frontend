import { Box, ButtonBase, Typography } from '@mui/material';
import content from './content.json';
import { REVIEW_DELAYS } from './review-state';

const beforeShipmentHours = REVIEW_DELAYS.slice(0, 4).reduce((sum, delay) => sum + delay.hours, 0);
const afterShipmentHours = REVIEW_DELAYS.slice(4).reduce((sum, delay) => sum + delay.hours, 0);
// Both sections use the same day width. The break leaves the shipment date unspecified.
const columns = `250px 190px minmax(252px, ${beforeShipmentHours}fr) 36px minmax(400px, ${afterShipmentHours}fr)`;
const elapsed = (hours: number) => {
	const days = Math.floor(hours / 24);
	const remainder = hours % 24;
	return [days ? `${days} j` : '', remainder ? `${remainder} h` : ''].filter(Boolean).join(' ');
};
const positionLabel = (index: number, hours: number) => {
	const origin = index < 4 ? 'Lancement' : 'X';
	return hours ? `${origin} + ${elapsed(hours)}` : origin;
};

const TimeAxis = ({ hours, title, origin }: { hours: number; title: string; origin: string }) => (
	<Box sx={{ minWidth: 0 }}>
		<Typography variant="body2" sx={{ fontWeight: 700, mb: 1.5 }}>
			{title}
		</Typography>
		<Box sx={{ position: 'relative', height: 23 }}>
			{Array.from({ length: Math.floor(hours / 24) + 1 }, (_, day) => (
				<Typography
					key={day}
					component="span"
					sx={{
						position: 'absolute',
						left: `${((day * 24) / hours) * 100}%`,
						transform: day === 0 ? 'none' : 'translateX(-100%)',
						fontSize: 11,
						whiteSpace: 'nowrap',
						color: 'text.secondary',
					}}
				>
					{day === 0 ? origin : `+ ${day} j`}
				</Typography>
			))}
		</Box>
	</Box>
);

const ReviewTimeline = ({ selected, onSelect }: { selected: number; onSelect: (index: number) => void }) => (
	<Box sx={{ overflowX: 'auto' }} data-testid="review-gantt">
		<Box sx={{ minWidth: 1160 }}>
			<Box
				sx={{
					display: 'grid',
					gridTemplateColumns: columns,
					px: 2,
					pt: 2,
					bgcolor: 'action.hover',
					alignItems: 'start',
				}}
			>
				<Typography variant="body2" sx={{ fontWeight: 700 }}>
					Étape
				</Typography>
				<Typography variant="body2" sx={{ fontWeight: 700 }}>
					Délai
				</Typography>
				<TimeAxis hours={beforeShipmentHours} title="Depuis le lancement" origin="Début" />
				<Typography aria-hidden="true" sx={{ textAlign: 'center', color: 'text.secondary' }}>
					{'//'}
				</Typography>
				<TimeAxis hours={afterShipmentHours} title="Depuis l’expédition" origin="X" />
			</Box>
			{content.stages.map((stage, index) => {
				const delay = REVIEW_DELAYS[index];
				const before = REVIEW_DELAYS.slice(index < 4 ? 0 : 4, index).reduce((sum, item) => sum + item.hours, 0);
				const period = `${positionLabel(index, before)} → ${positionLabel(index, before + delay.hours)}`;
				return (
					<ButtonBase
						key={stage.n}
						data-testid={`gantt-step-${stage.n}`}
						aria-pressed={selected === index}
						title={period}
						aria-label={`${stage.n}. ${stage.title}. ${delay.label}. ${period}. Voir les champs.`}
						onClick={() => onSelect(index)}
						sx={{
							width: '100%',
							display: 'grid',
							gridTemplateColumns: columns,
							textAlign: 'left',
							px: 2,
							minHeight: 62,
							borderBottom: 1,
							borderColor: 'divider',
							bgcolor: selected === index ? 'action.selected' : 'background.paper',
							'&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: -2 },
						}}
					>
						<Typography variant="body2" sx={{ fontWeight: selected === index ? 700 : 400, pr: 2 }}>
							{stage.n}. {stage.title}
						</Typography>
						<Typography variant="body2" sx={{ fontWeight: 700, pr: 2 }}>
							{delay.label}
						</Typography>
						{[beforeShipmentHours, afterShipmentHours].map((hours, section) => (
							<Box
								key={section}
								sx={{
									gridColumn: section === 0 ? 3 : 5,
									gridRow: 1,
									height: '100%',
									position: 'relative',
									borderRight: 1,
									borderColor: 'divider',
									backgroundImage: (theme) =>
										`linear-gradient(to right, ${theme.palette.divider} 1px, transparent 1px)`,
									backgroundSize: `${(24 / hours) * 100}% 100%`,
								}}
							>
								{section === (index < 4 ? 0 : 1) && (
									<>
										<Box
											data-testid={`gantt-bar-${stage.n}`}
											aria-hidden="true"
											sx={{
												position: 'absolute',
												top: 10,
												left: `${(before / hours) * 100}%`,
												width: `${(delay.hours / hours) * 100}%`,
												minWidth: 3,
												height: 24,
												bgcolor: stage.color,
												borderRadius: 0.5,
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												color: '#fff',
												fontSize: 12,
												fontWeight: 700,
											}}
										>
											{delay.hours >= 24 && `${delay.hours / 24} j`}
										</Box>{' '}
										{(index === 0 || index === 4) && (
											<Typography
												component="span"
												sx={{
													position: 'absolute',
													top: 38,
													left: 0,
													whiteSpace: 'nowrap',
													fontSize: 11,
													fontWeight: 600,
												}}
											>
												{index === 0 ? '1 heure' : 'X → X + 3 jours'}
											</Typography>
										)}
									</>
								)}
							</Box>
						))}
					</ButtonBase>
				);
			})}
		</Box>
	</Box>
);

export default ReviewTimeline;
