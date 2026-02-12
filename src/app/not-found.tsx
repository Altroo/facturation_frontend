'use client';

import React from 'react';
import { Box, Typography, Button, Paper, Stack } from '@mui/material';
import { SentimentDissatisfied as SadIcon, Home as HomeIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { DASHBOARD } from '@/utils/routes';

/**
 * Custom 404 Not Found page with French messaging.
 * Displayed when a user navigates to a non-existent route.
 */
const NotFound = () => {
	const router = useRouter();

	const handleGoHome = () => {
		router.push(DASHBOARD);
	};

	const handleGoBack = () => {
		router.back();
	};

	return (
		<Box
			sx={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				minHeight: '100vh',
				backgroundColor: 'background.default',
				p: 3,
			}}
		>
			<Paper
				elevation={3}
				sx={{
					p: { xs: 3, sm: 5 },
					maxWidth: 500,
					textAlign: 'center',
					borderRadius: 2,
				}}
			>
				<SadIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />

				<Typography variant="h1" sx={{ fontSize: { xs: '4rem', sm: '6rem' }, fontWeight: 700, color: 'primary.main', mb: 1 }}>
					404
				</Typography>

				<Typography variant="h5" gutterBottom sx={{ fontWeight: 500 }}>
					Page introuvable
				</Typography>

				<Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
					Désolé, la page que vous recherchez n&apos;existe pas ou a été déplacée.
				</Typography>

				<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
					<Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={handleGoBack} size="large">
						Retour
					</Button>
					<Button variant="contained" startIcon={<HomeIcon />} onClick={handleGoHome} size="large">
						Accueil
					</Button>
				</Stack>
			</Paper>
		</Box>
	);
};

export default NotFound;
