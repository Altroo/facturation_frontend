'use client';

import type {
	LogistiqueViewDetailCardProps as DetailCardProps,
	LogistiqueViewInfoRowProps as InfoRowProps,
} from '@/types/logistiqueTypes';
import { Box, Card, CardContent, Divider, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';
import { type FC, isValidElement } from 'react';
export const InfoRow: FC<InfoRowProps> = ({ icon, label, value }) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const displayValue =
		isValidElement(value) || (value !== null && value !== undefined && value.toString().length > 0) ? value : '-';

	return (
		<Stack
			direction="row"
			spacing={2}
			sx={{
				alignItems: 'flex-start',
				py: 1.5,
				flexWrap: 'wrap',
			}}
		>
			<Box sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', minWidth: 40 }}>{icon}</Box>
			<Stack
				direction="row"
				spacing={isMobile ? 0 : 2}
				sx={{
					alignItems: 'center',
					flex: 1,
					flexWrap: 'wrap',
				}}
			>
				<Typography
					sx={{
						fontWeight: 600,
						color: 'text.secondary',
						minWidth: { xs: '100%', sm: 200 },
						wordBreak: 'break-word',
					}}
				>
					{label}
				</Typography>
				<Box sx={{ flex: 1 }}>
					{isValidElement(displayValue) ? (
						displayValue
					) : (
						<Typography sx={{ color: 'text.primary' }}>{displayValue}</Typography>
					)}
				</Box>
			</Stack>
		</Stack>
	);
};

export const DetailCard: FC<DetailCardProps> = ({ title, icon, children }) => (
	<Card elevation={2} sx={{ borderRadius: 2 }}>
		<CardContent sx={{ p: 3 }}>
			<Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
				{icon}
				<Typography variant="h6" sx={{ fontWeight: 700 }}>
					{title}
				</Typography>
			</Stack>
			<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
			{children}
		</CardContent>
	</Card>
);

export const DetailSection: FC<DetailCardProps> = ({ title, icon, children }) => (
	<Box component="section">
		<Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
			{icon}
			<Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
				{title}
			</Typography>
		</Stack>
		{children}
	</Box>
);
