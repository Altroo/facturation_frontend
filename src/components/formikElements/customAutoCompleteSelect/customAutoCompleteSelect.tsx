import React from 'react';
import TextField, { type TextFieldProps } from '@mui/material/TextField';
import { ThemeProvider } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';
import type { DropDownType } from '@/types/accountTypes';
import { Autocomplete, InputAdornment } from '@mui/material';

type Props = {
	id: string;
	label: string;
	items: Array<DropDownType>;
	theme: Theme;
	value: DropDownType | null;
	noOptionsText: string;
	fullWidth?: boolean;
	onChange?: (event: React.SyntheticEvent, newValue: DropDownType | null) => void;
	onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
	helperText?: string;
	error?: boolean;
	disabled?: boolean;
	startIcon?: React.ReactNode;
	endIcon?: React.ReactNode;
	slotProps?: TextFieldProps['slotProps'];
};

const CustomAutoCompleteSelect: React.FC<Props> = ({
	id,
	label,
	items,
	theme,
	value,
	fullWidth,
	onChange,
	disabled,
	slotProps,
	startIcon,
	endIcon,
	noOptionsText,
	onBlur,
	error,
	helperText,
}) => {
	return (
		<ThemeProvider theme={theme}>
			<Autocomplete
				id={id}
				fullWidth={fullWidth}
				noOptionsText={noOptionsText}
				options={items}
				getOptionLabel={(option) => option.code}
				getOptionKey={(option) => option.value}
				filterOptions={(options, state) =>
					options.filter((opt) => opt.code.toLowerCase().includes(state.inputValue.toLowerCase()))
				}
				value={value}
				onChange={onChange}
				disabled={disabled}
				isOptionEqualToValue={(option, val) => option.value === val.value}
				onBlur={onBlur}
				renderInput={(params) => (
					<TextField
						{...params}
						label={label}
						error={error}
						helperText={helperText}
						slotProps={{
							...slotProps,
							input: {
								...params.InputProps,
								...slotProps?.input,
								startAdornment: (
									<>
										{startIcon && <InputAdornment position="start">{startIcon}</InputAdornment>}
										{params.InputProps.startAdornment}
									</>
								),
								endAdornment: (
									<>
										{params.InputProps.endAdornment}
										{endIcon && <InputAdornment position="end">{endIcon}</InputAdornment>}
									</>
								),
							},
						}}
					/>
				)}
			/>
		</ThemeProvider>
	);
};

export default CustomAutoCompleteSelect;
