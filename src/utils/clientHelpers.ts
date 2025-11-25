'use client';

import { ReactNode } from 'react';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

type MediaQueryProps = {
	children: ReactNode;
};

/**
 * Desktop: only screen and (min-width: 992px)
 * Matches your original Desktop component.
 */
export const Desktop = ({ children }: MediaQueryProps) => {
	const theme = useTheme();
	// noSsr avoids hydration mismatch
	const isDesktop = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true });
	return isDesktop ? children : null;
};

/**
 * TabletAndMobile: only screen and (max-width: 991px)
 * Matches your original TabletAndMobile component.
 */
export const TabletAndMobile = ({ children }: MediaQueryProps) => {
	const theme = useTheme();
	const isTabletMobile = useMediaQuery(theme.breakpoints.down('md'), { noSsr: true });
	return isTabletMobile ? children : null;
};
