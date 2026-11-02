'use client';

import type { LogistiqueViewDetailCardProps } from '@/types/logistiqueTypes';
import { Box, Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { type ReactNode } from 'react';
export const grid = { display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 };
export default function FormCard({ title, icon, children }: LogistiqueViewDetailCardProps) {
	return (
		<Card elevation={2} sx={{ borderRadius: 2 }}>
			<CardContent sx={{ p: 3 }}>
				<Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
					{icon}
					<Typography variant="h6" sx={{ fontWeight: 700 }}>
						{title}
					</Typography>
				</Stack>
				<Divider sx={{ mb: 3 }} />
				<Box sx={grid}>{children}</Box>
			</CardContent>
		</Card>
	);
}
export const full = (children: ReactNode) => <Box sx={{ gridColumn: { md: '1 / -1' } }}>{children}</Box>;
