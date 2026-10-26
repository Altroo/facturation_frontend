'use client';

import Styles from './primaryAnchorButton.module.sass';
import { Button } from '@mui/material';
import { ThemeProvider } from '@/providers/scopedThemeProvider';
import Link from 'next/link';
import { getDefaultTheme } from '@/utils/themes';
import type { PrimaryAnchorButtonProps as Props } from '@/types/uiTypes';

const PrimaryAnchorButton = ({
	ref,
	buttonText,
	active,
	nextPage,
	startIcon,
	onClick,
	anchorcssClass,
	cssClass,
	scroll,
	shallow,
	replace,
	type,
	size = 'medium',
	iconOnly,
	inverted,
	target,
	rel,
	download,
}: Props) => {
	return (
		<Link
			href={nextPage}
			className={anchorcssClass}
			scroll={scroll}
			shallow={shallow}
			replace={replace}
			ref={ref}
			target={target}
			rel={rel}
			download={download}
			aria-label={iconOnly ? buttonText : undefined}
		>
			<ThemeProvider theme={getDefaultTheme()}>
				<Button
					onClick={onClick}
					className={[
						Styles.primaryButtonDisabled,
						active ? (inverted ? Styles.primaryButtonInverse : Styles.primaryButtonActive) : '',
						size === 'small' ? Styles.compact : '',
						iconOnly ? Styles.iconOnly : '',
						cssClass ?? '',
					]
						.filter(Boolean)
						.join(' ')}
					disabled={!active}
					type={type}
					color="primary"
					size={size}
					aria-label={iconOnly ? buttonText : undefined}
					startIcon={iconOnly ? undefined : startIcon}
				>
					{iconOnly ? startIcon : buttonText}
				</Button>
			</ThemeProvider>
		</Link>
	);
};
PrimaryAnchorButton.displayName = 'PrimaryAnchorButton';

export default PrimaryAnchorButton;
