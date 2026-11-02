import { render, screen } from '@testing-library/react';
import { InfoRow } from './logistique-detail-card';

it('shows zero as a real value and uses the fallback only for missing details', () => {
	const { rerender } = render(<InfoRow icon={null} label="Quantité" value={0} />);
	expect(screen.getByText('0')).toBeInTheDocument();
	expect(screen.queryByText('-')).not.toBeInTheDocument();
	rerender(<InfoRow icon={null} label="Quantité" value={null} />);
	expect(screen.getByText('-')).toBeInTheDocument();
});

it('keeps document links interactive rather than converting them to text', () => {
	render(<InfoRow icon={null} label="Document" value={<a href="/proof.pdf">Justificatif</a>} />);
	expect(screen.getByRole('link', { name: 'Justificatif' })).toHaveAttribute('href', '/proof.pdf');
});
