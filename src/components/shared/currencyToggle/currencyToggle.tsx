import React from 'react';
import { Box, ToggleButtonGroup, ToggleButton } from '@mui/material';

interface CurrencyToggleProps {
	selectedDevise: 'MAD' | 'EUR' | 'USD';
	onDeviseChange: (devise: 'MAD' | 'EUR' | 'USD') => void;
	usesForeignCurrency: boolean;
}

const CurrencyToggle: React.FC<CurrencyToggleProps> = ({
	selectedDevise,
	onDeviseChange,
	usesForeignCurrency,
}) => {
	if (!usesForeignCurrency) return null;

	return (
		<Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
			<ToggleButtonGroup
				value={selectedDevise}
				exclusive
				onChange={(event: React.MouseEvent<HTMLElement>, newDevise: 'MAD' | 'EUR' | 'USD' | null) => {
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
