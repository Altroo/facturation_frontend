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
	Alert,
} from '@mui/material';
import { Discount as DiscountIcon, Warning as WarningIcon } from '@mui/icons-material';
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

interface ModalState {
	type: 'Pourcentage' | 'Fixe' | '';
	value: number;
	error: string;
}

const GlobalRemiseModal: React.FC<GlobalRemiseModalProps> = ({ open, onClose, currentType, currentValue, onApply }) => {
	const [state, setState] = useState<ModalState>({
		type: (currentType as 'Pourcentage' | 'Fixe' | '') || '',
		value: currentValue || 0,
		error: '',
	});

	const validateValue = (remiseType: string, remiseValue: number): string => {
		if (remiseValue < 0) {
			return 'La remise doit être positive ou nulle';
		}

		if (remiseType === 'Pourcentage' && remiseValue > 100) {
			return 'La remise en pourcentage doit être entre 0 et 100';
		}

		return '';
	};

	const handleValueChange = (newValue: number) => {
		setState((prev) => ({
			...prev,
			value: newValue,
			error: prev.type ? validateValue(prev.type, newValue) : '',
		}));
	};

	const handleTypeChange = (newType: 'Pourcentage' | 'Fixe' | '') => {
		setState((prev) => ({
			...prev,
			type: newType,
			value: newType === '' ? 0 : prev.value,
			error: newType === '' ? '' : prev.value > 0 ? validateValue(newType, prev.value) : '',
		}));
	};

	const handleApply = () => {
		if (!state.type || state.value === 0) {
			onApply('', 0);
			onClose();
			return;
		}

		const validationError = validateValue(state.type, state.value);
		if (validationError) {
			setState((prev) => ({ ...prev, error: validationError }));
			return;
		}

		onApply(state.type, state.value);
		onClose();
	};

	const handleClose = () => {
		setState({
			type: (currentType as 'Pourcentage' | 'Fixe' | '') || '',
			value: currentValue || 0,
			error: '',
		});
		onClose();
	};

	return (
		<Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth key={`${open}-${currentType}-${currentValue}`}>
			<DialogTitle>
				<Stack direction="row" spacing={2} alignItems="center">
					<DiscountIcon color="primary" />
					<Typography variant="h6">Remise globale</Typography>
				</Stack>
			</DialogTitle>
			<DialogContent>
				<Stack spacing={3} sx={{ mt: 2 }}>
					{state.error && (
						<Alert severity="error" icon={<WarningIcon />}>
							{state.error}
						</Alert>
					)}

					<CustomDropDownSelect
						id="global_remise_type"
						label="Type de remise"
						items={[
							{ value: '', code: 'Aucune' },
							{ value: 'Pourcentage', code: 'Pourcentage (%)' },
							{ value: 'Fixe', code: 'Montant fixe (MAD)' },
						]}
						value={state.type}
						onChange={(e) => handleTypeChange(e.target.value as 'Pourcentage' | 'Fixe' | '')}
						theme={customDropdownTheme()}
					/>

					{state.type && (
						<CustomTextInput
							id="remise_value"
							type="number"
							label={state.type === 'Pourcentage' ? 'Pourcentage' : 'Montant (MAD)'}
							value={String(state.value)}
							onChange={(e) => handleValueChange(parseFloat(e.target.value) || 0)}
							fullWidth={true}
							size="small"
							theme={coordonneeTextInputTheme()}
							endIcon={<InputAdornment position="end">{state.type === 'Pourcentage' ? '%' : 'MAD'}</InputAdornment>}
							error={!!state.error}
							helperText={state.error || (state.type === 'Pourcentage' ? 'Entre 0 et 100' : 'Montant positif')}
						/>
					)}
				</Stack>
			</DialogContent>
			<DialogActions>
				<Button onClick={handleClose}>Annuler</Button>
				<Button
					variant="contained"
					onClick={handleApply}
					startIcon={<DiscountIcon />}
					disabled={!!state.error && state.type !== ''}
				>
					Appliquer
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default GlobalRemiseModal;
