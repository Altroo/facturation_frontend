'use client';

import { useState } from 'react';
import { ThemeProvider, TextField, InputAdornment, IconButton } from '@mui/material';
import { Visibility as VisibilityIcon, VisibilityOff as VisibilityOffIcon } from '@mui/icons-material';
import { useLanguage } from '@/utils/hooks';
import type { CustomPasswordInputProps as Props } from '@/types/uiTypes';

const CustomPasswordInput = (props: Props) => {
	const { cssClass, theme, startIcon, ref, ...restOfProps } = props;
	const [showpassword, setshowpassword] = useState<boolean>(false);
	const { t } = useLanguage();

	const handleClickShowPassword = () => {
		setshowpassword((prevState) => !prevState);
	};

	return (
		<ThemeProvider theme={theme}>
			<TextField
				inputRef={ref}
				{...restOfProps}
				type={showpassword ? 'text' : 'password'}
				id={props.id}
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
				slotProps={{
					input: {
						startAdornment: startIcon ? <InputAdornment position="start">{startIcon}</InputAdornment> : undefined,
						endAdornment: (
							<InputAdornment position="end">
								<IconButton
									aria-label={t.common.togglePasswordVisibility}
									onClick={handleClickShowPassword}
									onMouseDown={(e) => e.preventDefault()}
									edge="end"
								>
									{showpassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
								</IconButton>
							</InputAdornment>
						),
					},
				}}
			/>
		</ThemeProvider>
	);
};

CustomPasswordInput.displayName = 'CustomPasswordInput';

export default CustomPasswordInput;
