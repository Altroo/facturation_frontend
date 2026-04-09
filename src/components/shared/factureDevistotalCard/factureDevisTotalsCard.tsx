import React from 'react';
import { Box, Card, CardContent, Grid, Skeleton, Typography } from '@mui/material';
import { formatNumberWithSpaces } from '@/utils/helpers';
import { useLanguage } from '@/utils/hooks';

interface TotalsCardProps {
	totals: {
		totalHT: number;
		totalTVA: number;
		totalTTC: number;
		totalTTCApresRemise: number;
	};
	devise?: string;
	isMobile?: boolean;
	isLoading?: boolean;
}

const FactureDevisTotalsCard: React.FC<TotalsCardProps> = ({
	totals,
	devise = 'MAD',
	isMobile = false,
	isLoading = false,
}) => {
	const { t } = useLanguage();
	const items = [
		{
			label: t.totalsCard.totalHT,
			value: `${formatNumberWithSpaces(totals.totalHT, 2)} ${devise}`,
			variant: 'h6' as const,
			weight: 800,
		},
		{
			label: t.totalsCard.totalTVA,
			value: `${formatNumberWithSpaces(totals.totalTVA, 2)} ${devise}`,
			variant: 'h6' as const,
			weight: 800,
		},
		{
			label: t.totalsCard.totalTTC,
			value: `${formatNumberWithSpaces(totals.totalTTC, 2)} ${devise}`,
			variant: 'h5' as const,
			weight: 900,
			color: 'primary' as const,
		},
		{
			label: t.totalsCard.totalTTCApresRemise,
			value: `${formatNumberWithSpaces(totals.totalTTCApresRemise, 2)} ${devise}`,
			variant: 'h5' as const,
			weight: 900,
			color: 'primary' as const,
		},
	];

	return (
		<Card elevation={3} sx={{ borderRadius: 2, bgcolor: 'primary.50' }}>
			<CardContent sx={{ p: 3 }}>
				<Grid
					container
					spacing={2}
					sx={{
						alignItems: 'center',
						justifyContent: isMobile ? 'center' : 'space-between',
					}}
				>
					{items.map((item) => (
						<Grid key={item.label} size={{ xs: 12, sm: 6, md: 6, lg: 3 }}>
							<Box
								sx={{
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
									justifyContent: 'center',
									textAlign: 'center',
									px: 1,
								}}
							>
								<Typography
									variant="subtitle2"
									sx={{
										fontWeight: 600,
										color: 'text.secondary',
										mb: 0.5,
									}}
								>
									{item.label}
								</Typography>
								{isLoading ? (
									<Skeleton
										variant="text"
										width={100}
										sx={{ fontSize: item.variant === 'h5' ? '1.5rem' : '1.25rem' }}
									/>
								) : (
									<Typography
										variant={item.variant}
										color={item.color ?? 'text.secondary'}
										sx={{
											fontWeight: item.weight,
										}}
									>
										{item.value}
									</Typography>
								)}
							</Box>
						</Grid>
					))}
				</Grid>
			</CardContent>
		</Card>
	);
};

export default FactureDevisTotalsCard;
