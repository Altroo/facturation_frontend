import { InputAdornment, ThemeProvider } from '@mui/material';
import TextField from '@mui/material/TextField';
import type { CustomTextInputProps as Props } from '@/types/uiTypes';

const CustomTextInput = (props: Props) => {
	const { cssClass, theme, startIcon, endIcon, maxLength, ref, ...restOfProps } = props;

	return (
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
};

CustomTextInput.displayName = 'CustomTextInput';
export default CustomTextInput;
