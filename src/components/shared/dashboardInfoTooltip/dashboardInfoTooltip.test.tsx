import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import DashboardInfoTooltip from './dashboardInfoTooltip';

it('shows the explanation on hover with the main dashboard icon button', async () => {
	render(<DashboardInfoTooltip title="Explication du graphique" />);
	const button = screen.getByRole('button', { name: 'Explication du graphique' });
	expect(button).toHaveAttribute('type', 'button');
	expect(button).toHaveClass('MuiIconButton-sizeSmall');
	fireEvent.mouseOver(button);
	expect(await screen.findByRole('tooltip')).toHaveTextContent('Explication du graphique');
});

it('makes the explanation available to keyboard users', async () => {
	const user = userEvent.setup();
	render(<DashboardInfoTooltip title="Détail de l’indicateur" />);
	await user.tab();
	expect(screen.getByRole('button', { name: 'Détail de l’indicateur' })).toHaveFocus();
	expect(await screen.findByRole('tooltip')).toHaveTextContent('Détail de l’indicateur');
});

it.each(['light', 'dark'] as const)('uses the %s theme secondary text color', (mode) => {
	const theme = createTheme({ palette: { mode } });
	render(
		<ThemeProvider theme={theme}>
			<DashboardInfoTooltip title="Explication" />
		</ThemeProvider>,
	);
	expect(screen.getByRole('button', { name: 'Explication' })).toHaveStyle({ color: theme.palette.text.secondary });
});
