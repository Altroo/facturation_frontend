'use client';

import * as React from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { getDefaultTheme } from '@/utils/themes';

const ThemeRegistry = ({ children }: { children: React.ReactNode }) => {
	return (
		<ThemeProvider theme={getDefaultTheme()}>
			<CssBaseline />
			{children}
		</ThemeProvider>
	);
};

export default ThemeRegistry;
