'use client';

import React from 'react';
import { Box, Card, CardContent, Skeleton, Stack, Typography } from '@mui/material';

interface DashboardStatCardProps {
	icon: React.ReactNode;
	label: string;
	value: string;
	color: string;
	valueColor?: string;
	isLoading?: boolean;
	testId?: string;
}

const DashboardStatCard: React.FC<DashboardStatCardProps> = ({
	icon,
	label,
	value,
	color,
	valueColor,
	isLoading = false,
	testId,
}) => (
	<Card
		elevation={2}
		data-testid={testId}
		sx={{
			height: '100%',
			position: 'relative',
			overflow: 'hidden',
			'&::before': {
				content: '""',
				position: 'absolute',
				top: 0,
				left: 0,
				width: 4,
				height: '100%',
				bgcolor: color,
			},
		}}
	>
		<CardContent sx={{ pl: 2.5 }}>
			<Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1 }}>
				<Box sx={{ color, display: 'flex' }}>{icon}</Box>
				<Typography
					variant="caption"
					sx={{
						color: 'text.secondary',
						textTransform: 'uppercase',
						letterSpacing: 0.8,
					}}
				>
					{label}
				</Typography>
			</Stack>
			{isLoading ? (
				<Skeleton variant="text" width="70%" sx={{ fontSize: '2rem' }} />
			) : (
				<Typography variant="h5" sx={{ fontWeight: 700, color: valueColor ?? 'text.primary', wordBreak: 'break-word' }}>
					{value}
				</Typography>
			)}
		</CardContent>
	</Card>
);

export default DashboardStatCard;