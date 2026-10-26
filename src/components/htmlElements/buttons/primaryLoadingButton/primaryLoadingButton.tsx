import { type FC } from 'react';
import { Button } from '@mui/material';
import { ThemeProvider } from '@/providers/scopedThemeProvider';
import Styles from './primaryLoadingButton.module.sass';
import { getDefaultTheme } from '@/utils/themes';
import type { PrimaryLoadingButtonProps as Props } from '@/types/uiTypes';

const PrimaryLoadingButton: FC<Props> = ({
	buttonText,
	active,
	loading,
	inverted,
	size = 'medium',
	color = 'primary',
	iconOnly,
	cssClass,
	className,
	startIcon,
	children,
	ref,
	type = 'button',
	...buttonProps
}) => (
	<ThemeProvider theme={getDefaultTheme()}>
		<Button
			{...buttonProps}
			ref={ref}
			loading={loading}
			className={[
				Styles.primaryButtonDisabled,
				active ? (inverted ? Styles.primaryButtonInverse : Styles.primaryButtonActive) : '',
				size === 'small' ? Styles.compact : '',
				iconOnly ? Styles.iconOnly : '',
				color === 'error' ? Styles.error : color === 'warning' ? Styles.warning : '',
				cssClass,
				className,
			]
				.filter(Boolean)
				.join(' ')}
			disabled={!active}
			type={type}
			size={size}
			color={color}
			aria-label={buttonProps['aria-label'] ?? (iconOnly ? buttonText : undefined)}
			startIcon={iconOnly ? undefined : startIcon}
		>
			{iconOnly ? startIcon : buttonText}
			{children}
		</Button>
	</ThemeProvider>
);

export default PrimaryLoadingButton;
