'use client';

import { type ReactNode } from 'react';
import { type Theme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { useColorMode } from '@/providers/themeProvider';
import { applyColorMode } from '@/utils/colorMode';

// Nested input/grid/navigation themes must not reset the user's selected mode.
export const ThemeProvider = ({ theme, children }: { theme: Theme; children: ReactNode }) => {
	const { mode } = useColorMode();
	const scopedTheme = applyColorMode(theme, mode);
	return <MuiThemeProvider theme={scopedTheme}>{children}</MuiThemeProvider>;
};
