'use client';

import { type ChangeEvent } from 'react';
import AiAssistantControl from '@/components/shared/aiAssistantControl/aiAssistantControl';
import { isAiTextField } from '@/utils/aiTextFields';
import { Box, InputAdornment, ThemeProvider } from '@mui/material';
import TextField from '@mui/material/TextField';
import type { CustomTextInputProps as Props } from '@/types/uiTypes';

const CustomTextInput = (props: Props) => {
	const { cssClass, theme, startIcon, endIcon, maxLength, ref, ai, aiContext, ...restOfProps } = props;

	const fieldName = props.name || props.id;
	const showAssistant =
		ai !== false &&
		isAiTextField(fieldName, props.type) &&
		!props.disabled &&
		typeof props.slotProps?.input !== 'function' &&
		!props.slotProps?.input?.readOnly &&
		typeof props.slotProps?.htmlInput !== 'function' &&
		!(props.slotProps?.htmlInput && 'readOnly' in props.slotProps.htmlInput && props.slotProps.htmlInput.readOnly);
	const field = (
		<ThemeProvider theme={theme}>
			<TextField
				{...restOfProps}
				inputRef={ref}
				multiline={props.type === 'textarea'}
				variant={props.variant}
				type={props.type}
				id={props.id}
				name={props.name || props.id}
				value={props.value}
				onChange={props.onChange}
				onBlur={props.onBlur}
				helperText={props.helperText}
				error={props.error}
				placeholder={props.placeholder}
				label={props.label}
				fullWidth={props.fullWidth}
				className={cssClass}
				size={props.size}
				onClick={props.onClick}
				color="primary"
				disabled={props.disabled}
				required={props.required}
				autoComplete={props.autoComplete}
				slotProps={{
					...props.slotProps,
					input: {
						...props.slotProps?.input,
						startAdornment: startIcon ? <InputAdornment position="start">{startIcon}</InputAdornment> : undefined,
						endAdornment: endIcon ? <InputAdornment position="end">{endIcon}</InputAdornment> : undefined,
					},
					htmlInput: {
						...props.slotProps?.htmlInput,
						...(maxLength ? { maxLength } : {}),
					},
				}}
			/>
		</ThemeProvider>
	);
	if (!showAssistant) return field;
	return (
		<Box sx={{ width: props.fullWidth ? '100%' : undefined }}>
			{field}
			<AiAssistantControl
				value={props.value ?? ''}
				context={aiContext || 'form'}
				maxLength={maxLength}
				disabled={props.disabled}
				onApply={(value) => {
					props.onChange({
						target: { name: fieldName, id: props.id, value },
						currentTarget: { name: fieldName, id: props.id, value },
					} as ChangeEvent<HTMLInputElement>);
				}}
			/>
		</Box>
	);
};

CustomTextInput.displayName = 'CustomTextInput';
export default CustomTextInput;
