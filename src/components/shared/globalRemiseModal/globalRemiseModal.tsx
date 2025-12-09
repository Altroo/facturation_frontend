'use client';

import React, { useState } from 'react';
import {
	Button,
	Stack,
	Typography,
	InputAdornment,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
} from '@mui/material';
import { Discount as DiscountIcon } from '@mui/icons-material';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import CustomDropDownSelect from '@/components/formikElements/customDropDownSelect/customDropDownSelect';
import { coordonneeTextInputTheme, customDropdownTheme } from '@/utils/themes';

interface GlobalRemiseModalProps {
	open: boolean;
	onClose: () => void;
	currentType: string;
	currentValue: number;
	onApply: (type: 'Pourcentage' | 'Fixe' | '', value: number) => void;
}

const GlobalRemiseModal: React.FC<GlobalRemiseModalProps> = ({ open, onClose, currentType, currentValue, onApply }) => {
	const [type, setType] = useState<'Pourcentage' | 'Fixe' | ''>(currentType as 'Pourcentage' | 'Fixe' | '');
	const [value, setValue] = useState<number>(currentValue);

	const handleApply = () => {
		onApply(type, value);
	};

	return (
		<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
			<DialogTitle>
				<Stack direction="row" spacing={2} alignItems="center">
					<DiscountIcon color="primary" />
					<Typography variant="h6">Remise globale</Typography>
				</Stack>
			</DialogTitle>
			<DialogContent>
				<Stack spacing={3} sx={{ mt: 2 }}>
					<CustomDropDownSelect
						id="global_remise_type"
						label="Type de remise"
						items={[
							{ value: '', label: 'Aucune' },
							{ value: 'Pourcentage', label: 'Pourcentage (%)' },
							{ value: 'Fixe', label: 'Montant fixe (MAD)' },
						]}
						value={type}
						onChange={(e) => {
							setType(e.target.value as 'Pourcentage' | 'Fixe' | '');
							if (e.target.value === '') setValue(0);
						}}
						theme={customDropdownTheme()}
					/>
					{type && (
						<CustomTextInput
							id="remise_value"
							type="number"
							label={type === 'Pourcentage' ? 'Pourcentage' : 'Montant (MAD)'}
							value={String(value)}
							onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
							fullWidth={true}
							size="small"
							theme={coordonneeTextInputTheme()}
							endIcon={<InputAdornment position="end">{type === 'Pourcentage' ? '%' : 'MAD'}</InputAdornment>}
						/>
					)}
				</Stack>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>Annuler</Button>
				<Button variant="contained" onClick={handleApply} startIcon={<DiscountIcon />}>
					Appliquer
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default GlobalRemiseModal;
