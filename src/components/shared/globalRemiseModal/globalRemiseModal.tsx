'use client';

import React, { useState } from 'react';
import {
	Alert,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	InputAdornment,
	Stack,
	Typography,
} from '@mui/material';
import { Discount as DiscountIcon, Warning as WarningIcon } from '@mui/icons-material';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import CustomDropDownSelect from '@/components/formikElements/customDropDownSelect/customDropDownSelect';
import { customDropdownTheme, textInputTheme } from '@/utils/themes';
import { useLanguage } from '@/utils/hooks';

interface GlobalRemiseModalProps {
	open: boolean;
	onClose: () => void;
	currentType: string;
	currentValue: number;
	onApply: (type: 'Pourcentage' | 'Fixe' | '', value: number) => void;
	devise?: string;
}

interface ModalState {
	type: 'Pourcentage' | 'Fixe' | '';
	value: number;
	error: string;
}

const MIN_VALUE = 0.01;

const GlobalRemiseModalContent: React.FC<GlobalRemiseModalProps> = ({
	open,
	onClose,
	currentType,
	currentValue,
	onApply,
	devise = 'MAD',
}) => {
	const { t } = useLanguage();
	const [state, setState] = useState<ModalState>({
		type: (currentType as 'Pourcentage' | 'Fixe' | '') || '',
		value: currentType ? currentValue : 0,
		error: '',
	});

	const validateValue = (remiseType: string, remiseValue: number): string => {
		if (remiseValue < MIN_VALUE) {
			return t.globalRemiseModal.errorMin;
		}

		if (remiseType === 'Pourcentage' && remiseValue > 100) {
			return t.globalRemiseModal.errorPercentRange;
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
		setState((prev) => {
			const newValue = newType === '' ? 0 : prev.value <= 0 ? MIN_VALUE : prev.value;
			return {
				...prev,
				type: newType,
				value: newValue,
				error: newType === '' ? '' : validateValue(newType, newValue),
			};
		});
	};

	const handleApply = () => {
		if (!state.type) {
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
		onClose();
	};

	return (
		<Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
			<DialogTitle>
				<Stack
					direction="row"
					spacing={2}
					sx={{
						alignItems: 'center',
					}}
				>
					<DiscountIcon color="primary" />
					<Typography variant="h6">{t.globalRemiseModal.title}</Typography>
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
						label={t.globalRemiseModal.typeLabel}
						items={[
							{ value: '', code: t.globalRemiseModal.typeNone },
							{ value: 'Pourcentage', code: t.globalRemiseModal.typePercent },
							{ value: 'Fixe', code: t.globalRemiseModal.typeFixed(devise) },
						]}
						value={state.type}
						onChange={(e) => handleTypeChange(e.target.value as 'Pourcentage' | 'Fixe' | '')}
						theme={customDropdownTheme()}
					/>

					{state.type && (
						<CustomTextInput
							id="remise_value"
							type="number"
							label={
								state.type === 'Pourcentage'
									? t.globalRemiseModal.valuePercentLabel
									: t.globalRemiseModal.valueAmountLabel(devise)
							}
							value={String(state.value)}
							onChange={(e) => handleValueChange(parseFloat(e.target.value) || 0)}
							fullWidth={true}
							size="small"
							theme={textInputTheme()}
							endIcon={<InputAdornment position="end">{state.type === 'Pourcentage' ? '%' : devise}</InputAdornment>}
							error={!!state.error}
							helperText={
								state.error ||
								(state.type === 'Pourcentage' ? t.globalRemiseModal.helperPercent : t.globalRemiseModal.helperAmount)
							}
						/>
					)}
				</Stack>
			</DialogContent>
			<DialogActions>
				<Button onClick={handleClose}>{t.globalRemiseModal.cancelBtn}</Button>
				<Button
					variant="contained"
					onClick={handleApply}
					startIcon={<DiscountIcon />}
					disabled={!!state.error && state.type !== ''}
				>
					{t.globalRemiseModal.applyBtn}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

const GlobalRemiseModal: React.FC<GlobalRemiseModalProps> = (props) => {
	return (
		<GlobalRemiseModalContent key={props.open ? `${props.currentType}-${props.currentValue}` : 'closed'} {...props} />
	);
};

export default GlobalRemiseModal;
