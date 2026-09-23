'use client';

import { useState, type ChangeEvent, type FocusEvent } from 'react';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import { formatNumberWithSpaces, parseFormattedNumber } from '@/utils/helpers';
import type { FormattedNumberInputProps as Props } from '@/types/uiTypes';

const FormattedNumberInput = (props: Props) => {
	const { value, onChange, decimals = 2, onBlur, ref, ...restOfProps } = props;
	const [isFocused, setIsFocused] = useState(false);
	const [editValue, setEditValue] = useState('');

	// Determine what to display
	const displayValue = isFocused
		? editValue
		: value === null || value === undefined || value === ''
			? ''
			: formatNumberWithSpaces(value, decimals);

	const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
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
		} as ChangeEvent<HTMLInputElement>;

		onChange(syntheticEvent);
	};

	const handleFocus = () => {
		setIsFocused(true);
		// Parse the value to strip trailing zeros (e.g. "1.00" → "1") so typing feels natural
		const raw = value === null || value === undefined ? '' : String(value);
		const parsed = parseFormattedNumber(raw);
		setEditValue(parsed !== null ? String(parsed) : raw);
	};

	const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
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
};

FormattedNumberInput.displayName = 'FormattedNumberInput';
export default FormattedNumberInput;
