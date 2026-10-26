import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { LogistiqueOrder } from '@/types/logistiqueTypes';
import SupplierPurchaseSteps from './supplier-purchase-steps';

const order = {
	id: 7,
	responsable: 8,
	workflow: {
		etape_courante: 'titre',
		etapes: [
			{ key: 'dossier', label: 'Dossier', completed: true, accessible: true },
			{ key: 'proforma', label: 'Proforma', completed: true, accessible: true },
			{ key: 'titre', label: 'Titre', completed: false, accessible: true },
			{ key: 'production', label: 'Production', completed: false, accessible: false },
		],
	},
} as LogistiqueOrder;
const props = {
	order,
	selected: 'proforma',
	userId: 4,
	canManage: true,
	busy: false,
	onSelect: jest.fn(),
	onAction: jest.fn(),
	onEdit: jest.fn(),
};
beforeEach(() => {
	jest.clearAllMocks();
	props.onAction.mockResolvedValue(true);
});

it('allows earlier steps and disables future steps', () => {
	render(<SupplierPurchaseSteps {...props} />);
	expect(screen.getByRole('tab', { name: /Production/ })).toBeDisabled();
	fireEvent.click(screen.getByRole('tab', { name: /Dossier/ }));
	expect(props.onSelect).toHaveBeenCalledWith('dossier');
	expect(screen.getByText(/lecture seule/)).toBeInTheDocument();
});

it('requires a remark and submits it with the selected step', async () => {
	render(<SupplierPurchaseSteps {...props} />);
	fireEvent.click(screen.getByRole('button', { name: 'Demander une modification' }));
	const send = screen.getByRole('button', { name: 'Envoyer la demande' });
	expect(send).toBeDisabled();
	fireEvent.change(screen.getByRole('textbox', { name: /Remarque pour le responsable/ }), {
		target: { value: 'Corriger la référence fournisseur' },
	});
	fireEvent.click(send);
	await waitFor(() =>
		expect(props.onAction).toHaveBeenCalledWith({
			action: 'demander_modification',
			etape: 'proforma',
			remarque: 'Corriger la référence fournisseur',
		}),
	);
});

it('only lets the responsible approve and the approved requester open the correction', () => {
	const request = {
		id: 3,
		etape: 'proforma',
		remarque: 'Référence erronée',
		demandeur: 4,
		responsable: 8,
		demandeur_name: 'Demandeur',
		statut: 'pending' as const,
		date_created: '',
	};
	const { rerender } = render(
		<SupplierPurchaseSteps {...props} userId={8} order={{ ...order, change_requests: [request] }} />,
	);
	fireEvent.click(screen.getByRole('button', { name: 'Approuver' }));
	expect(props.onAction).toHaveBeenCalledWith({ action: 'approuver_modification', demande_id: 3 });
	rerender(
		<SupplierPurchaseSteps {...props} order={{ ...order, change_requests: [{ ...request, statut: 'approved' }] }} />,
	);
	fireEvent.click(screen.getByRole('button', { name: 'Effectuer la correction autorisée' }));
	expect(props.onEdit).toHaveBeenCalledWith('proforma', 3);
	rerender(
		<SupplierPurchaseSteps
			{...props}
			userId={9}
			order={{ ...order, change_requests: [{ ...request, statut: 'approved' }] }}
		/>,
	);
	expect(screen.queryByRole('button', { name: 'Effectuer la correction autorisée' })).not.toBeInTheDocument();
});
