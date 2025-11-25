import React from 'react';
import { render, screen } from '@testing-library/react';
import { Desktop, TabletAndMobile } from './clientHelpers';
import useMediaQuery from '@mui/material/useMediaQuery';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Mock MUI useMediaQuery
jest.mock('@mui/material/useMediaQuery');

const theme = createTheme({
	breakpoints: {
		values: { xs: 0, sm: 600, md: 992, lg: 1200, xl: 1536 },
	},
});

describe('MediaQueryComponents (MUI)', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	test('renders Desktop children when media query matches', () => {
		(useMediaQuery as jest.Mock).mockReturnValue(true);

		render(
			<ThemeProvider theme={theme}>
				<Desktop>
					<div>Desktop Content</div>
				</Desktop>
			</ThemeProvider>,
		);

		expect(screen.getByText('Desktop Content')).toBeInTheDocument();
	});

	test('does not render Desktop children when media query does not match', () => {
		(useMediaQuery as jest.Mock).mockReturnValue(false);

		render(
			<ThemeProvider theme={theme}>
				<Desktop>
					<div>Desktop Content</div>
				</Desktop>
			</ThemeProvider>,
		);

		expect(screen.queryByText('Desktop Content')).toBeNull();
	});

	test('renders TabletAndMobile children when media query matches', () => {
		(useMediaQuery as jest.Mock).mockReturnValue(true);

		render(
			<ThemeProvider theme={theme}>
				<TabletAndMobile>
					<div>Mobile Content</div>
				</TabletAndMobile>
			</ThemeProvider>,
		);

		expect(screen.getByText('Mobile Content')).toBeInTheDocument();
	});

	test('does not render TabletAndMobile children when media query does not match', () => {
		(useMediaQuery as jest.Mock).mockReturnValue(false);

		render(
			<ThemeProvider theme={theme}>
				<TabletAndMobile>
					<div>Mobile Content</div>
				</TabletAndMobile>
			</ThemeProvider>,
		);

		expect(screen.queryByText('Mobile Content')).toBeNull();
	});
});
