import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import FactureDevisTotalsCard from './factureDevisTotalsCard';

const theme = createTheme();
const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
	<ThemeProvider theme={theme}>{children}</ThemeProvider>
);

describe('FactureDevisTotalsCard', () => {
	const totals = {
		totalHT: 100,
		totalTVA: 20,
		totalTTC: 120,
		totalTTCApresRemise: 110.5,
	};

	test('renders all labels and formatted values', () => {
		render(<FactureDevisTotalsCard totals={totals} />, { wrapper: Wrapper });

		expect(screen.getByText('TOTAL HT')).toBeInTheDocument();
		expect(screen.getByText('100,00 MAD')).toBeInTheDocument();

		expect(screen.getByText('TOTAL TVA')).toBeInTheDocument();
		expect(screen.getByText('20,00 MAD')).toBeInTheDocument();

		expect(screen.getByText('TOTAL TTC')).toBeInTheDocument();
		expect(screen.getByText('120,00 MAD')).toBeInTheDocument();

		expect(screen.getByText('TOTAL TTC APRES REMISE')).toBeInTheDocument();
		expect(screen.getByText('110,50 MAD')).toBeInTheDocument();
	});

	test('renders correctly when isMobile is true', () => {
		render(<FactureDevisTotalsCard totals={totals} isMobile />, { wrapper: Wrapper });

		// Basic smoke assertions to ensure component renders in mobile mode
		expect(screen.getByText('TOTAL HT')).toBeInTheDocument();
		expect(screen.getByText('TOTAL TTC APRES REMISE')).toBeInTheDocument();
	});

	test('renders four monetary values and at least two h5 headings', () => {
		const { container } = render(<FactureDevisTotalsCard totals={totals} />, { wrapper: Wrapper });

		// Ensure there are exactly four formatted monetary values (e.g. "100,00 MAD" with French formatting)
		const moneyValues = screen.getAllByText(/\d+,\d{2}\s+MAD$/);
		expect(moneyValues).toHaveLength(4);

		// MUI's Typography with variant="h5" typically renders an <h5> element;
		// assert there are at least two such headings (TOTAL TTC and TOTAL TTC APRES REMISE)
		const h5Elements = container.querySelectorAll('h5');
		expect(h5Elements.length).toBeGreaterThanOrEqual(2);
	});
});
