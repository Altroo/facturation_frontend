import { type FC, type MouseEvent } from 'react';
import { Box, ToggleButtonGroup, ToggleButton } from '@mui/material';
import type { CurrencyToggleProps } from '@/types/uiTypes';

const CurrencyToggle: FC<CurrencyToggleProps> = ({ selectedDevise, onDeviseChange, usesForeignCurrency }) => {
	if (!usesForeignCurrency) return null;

	return (
		<Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
			<ToggleButtonGroup
				value={selectedDevise}
				exclusive
				onChange={(event: MouseEvent<HTMLElement>, newDevise: 'MAD' | 'EUR' | 'USD' | null) => {
					if (newDevise !== null) {
						onDeviseChange(newDevise);
					}
				}}
				size="small"
				color="primary"
			>
				<ToggleButton value="MAD">MAD</ToggleButton>
				<ToggleButton value="EUR">EUR</ToggleButton>
				<ToggleButton value="USD">USD</ToggleButton>
			</ToggleButtonGroup>
		</Box>
	);
};

export default CurrencyToggle;
