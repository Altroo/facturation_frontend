import React from 'react';
import { Card, CardContent, Grid, Box, Typography } from '@mui/material';
import { formatNumberWithSpaces } from '@/utils/helpers';

interface TotalsCardProps {
	totals: {
		totalHT: number;
		totalTVA: number;
		totalTTC: number;
		totalTTCApresRemise: number;
	};
	devise?: string;
	isMobile?: boolean;
}

const FactureDevisTotalsCard: React.FC<TotalsCardProps> = ({ totals, devise = 'MAD', isMobile = false }) => {
	const items = [
		{
			label: 'TOTAL HT',
			value: `${formatNumberWithSpaces(totals.totalHT, 2)} ${devise}`,
			variant: 'h6' as const,
			weight: 800,
		},
		{
			label: 'TOTAL TVA',
			value: `${formatNumberWithSpaces(totals.totalTVA, 2)} ${devise}`,
			variant: 'h6' as const,
			weight: 800,
		},
		{
			label: 'TOTAL TTC',
			value: `${formatNumberWithSpaces(totals.totalTTC, 2)} ${devise}`,
			variant: 'h5' as const,
			weight: 900,
			color: 'primary' as const,
		},
		{
			label: 'TOTAL TTC APRES REMISE',
			value: `${formatNumberWithSpaces(totals.totalTTCApresRemise, 2)} ${devise}`,
			variant: 'h5' as const,
			weight: 900,
			color: 'primary' as const,
		},
	];

	return (
		<Card elevation={3} sx={{ borderRadius: 2, bgcolor: 'primary.50' }}>
			<CardContent sx={{ p: 3 }}>
				<Grid container spacing={2} alignItems="center" justifyContent={isMobile ? 'center' : 'space-between'}>
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
								<Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
									{item.label}
								</Typography>
								<Typography variant={item.variant} fontWeight={item.weight} color={item.color ?? 'text.secondary'}>
									{item.value}
								</Typography>
							</Box>
						</Grid>
					))}
				</Grid>
			</CardContent>
		</Card>
	);
};

export default FactureDevisTotalsCard;
