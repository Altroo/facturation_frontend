'use client';

import React, { useState, ForwardedRef, forwardRef } from 'react';
import type { Theme } from '@mui/material/styles';
import type { TextFieldProps } from '@mui/material/TextField';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import { formatNumberWithSpaces, parseFormattedNumber } from '@/utils/helpers';

type Props = {
	type: React.HTMLInputTypeAttribute;
	id: string;
	value: string | number;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	theme: Theme;
	decimals?: number; // Number of decimal places (default: 2)
	onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
	cssClass?: string;
	helperText?: string;
	error?: boolean;
	placeholder?: string;
	label?: string;
	fullWidth?: boolean;
	size?: 'small' | 'medium';
	disabled?: boolean;
	variant?: 'filled' | 'standard' | 'outlined';
	onClick?: () => void;
	startIcon?: React.ReactNode;
	endIcon?: React.ReactNode;
	slotProps?: TextFieldProps['slotProps'];
};

const FormattedNumberInput = forwardRef<HTMLInputElement, Props>((props: Props, ref: ForwardedRef<HTMLInputElement>) => {
	const { value, onChange, decimals = 2, onBlur, ...restOfProps } = props;
	const [isFocused, setIsFocused] = useState(false);
	const [editValue, setEditValue] = useState('');

	// Determine what to display
	const displayValue = isFocused
		? editValue
		: (value === null || value === undefined || value === '' ? '' : formatNumberWithSpaces(value, decimals));

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const inputValue = e.target.value;
		setEditValue(inputValue);

		// Parse the formatted number and update parent
		const parsed = parseFormattedNumber(inputValue);

		// Create a synthetic event with the parsed value
		const syntheticEvent = {
			...e,
			target: {
				...e.target,
				value: parsed !== null ? String(parsed) : inputValue,
			},
		} as React.ChangeEvent<HTMLInputElement>;

		onChange(syntheticEvent);
	};

	const handleFocus = () => {
		setIsFocused(true);
		// Set edit value to the raw value when focusing
		setEditValue(value === null || value === undefined ? '' : String(value));
	};

	const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
		setIsFocused(false);
		setEditValue('');

		// Call the original onBlur if provided
		if (onBlur) {
			onBlur(e);
		}
	};

	return (
		<CustomTextInput
			{...restOfProps}
			ref={ref}
			value={displayValue}
			onChange={handleChange}
			onBlur={handleBlur}
			slotProps={{
				...restOfProps.slotProps,
				htmlInput: {
					...restOfProps.slotProps?.htmlInput,
					onFocus: handleFocus,
				},
			}}
		/>
	);
});

FormattedNumberInput.displayName = 'FormattedNumberInput';
export default FormattedNumberInput;
