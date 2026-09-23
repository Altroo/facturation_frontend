'use client';

import { type FC } from 'react';
import { Alert, AlertTitle, Box, Typography } from '@mui/material';
import { Inventory2Outlined as Inventory2OutlinedIcon } from '@mui/icons-material';

const StockDisabledState: FC = () => (
	<Box
		sx={{
			display: 'flex',
			justifyContent: 'center',
			px: { xs: 1, sm: 2, md: 3 },
			py: { xs: 3, md: 5 },
		}}
	>
		<Alert
			severity="warning"
			variant="outlined"
			icon={<Inventory2OutlinedIcon sx={{ fontSize: 40 }} />}
			sx={{
				width: '100%',
				maxWidth: 720,
				borderRadius: 1,
				borderColor: 'warning.light',
				bgcolor: 'rgba(237, 108, 2, 0.04)',
				px: { xs: 2, sm: 3 },
				py: { xs: 2, sm: 2.5 },
				alignItems: 'flex-start',
				'& .MuiAlert-icon': {
					mt: 0.25,
					mr: 2,
				},
				'& .MuiAlert-message': {
					width: '100%',
				},
			}}
		>
			<AlertTitle sx={{ fontSize: 20, fontWeight: 700, mb: 0.75 }}>Gestion de stock désactivée</AlertTitle>
			<Typography variant="body1" sx={{ color: 'text.primary' }}>
				La gestion de stock est désactivée pour cette entreprise.
			</Typography>
		</Alert>
	</Box>
);

export default StockDisabledState;
