import { render, screen } from '@testing-library/react';
import { mockSession } from './stock-test-helpers';
import StockMovementView from './stock-movement-view';

describe('StockMovementView', () => {
	it('renders movement information and traceability cards', () => {
		render(<StockMovementView session={mockSession} company_id={1} id={6} />);

		expect(screen.getByRole('heading', { name: 'Détails du mouvement' })).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: 'Informations du mouvement' })).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: 'Traçabilité' })).toBeInTheDocument();
		expect(screen.getByText('LAMPE-03 — Lampe suspendue')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Voir le stock concerné' })).toBeInTheDocument();
	});
});
