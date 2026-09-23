'use client';

import Styles from './primaryAnchorButton.module.sass';
import { ThemeProvider, Button } from '@mui/material';
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
}: Props) => {
	return (
		<Link href={nextPage} className={anchorcssClass} scroll={scroll} shallow={shallow} replace={replace} ref={ref}>
			<ThemeProvider theme={getDefaultTheme()}>
				<Button
					onClick={onClick}
					className={[Styles.primaryButtonDisabled, active ? Styles.primaryButtonActive : '', cssClass ?? '']
						.filter(Boolean)
						.join(' ')}
					disabled={!active}
					type={type}
					color="primary"
					startIcon={startIcon}
				>
					{buttonText}
				</Button>
			</ThemeProvider>
		</Link>
	);
};
PrimaryAnchorButton.displayName = 'PrimaryAnchorButton';

export default PrimaryAnchorButton;
