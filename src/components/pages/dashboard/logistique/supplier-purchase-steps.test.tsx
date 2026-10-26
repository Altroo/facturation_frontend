import { fireEvent, render, screen } from '@testing-library/react';
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

it('opens the actual step form to propose edits instead of sending a text-only request', () => {
	render(<SupplierPurchaseSteps {...props} />);
	fireEvent.click(screen.getByRole('button', { name: 'Proposer une modification' }));
	expect(props.onEdit).toHaveBeenCalledWith('proforma');
	expect(props.onAction).not.toHaveBeenCalled();
	expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
});

it('shows proposed values to the reviewer and preserves previously granted authorizations', () => {
	const request = {
		id: 3,
		etape: 'proforma',
		remarque: 'Référence erronée',
		demandeur: 4,
		responsable: 8,
		demandeur_name: 'Demandeur',
		has_proposal: true,
		changes: [{ field: 'numero_proforma_fournisseur', label: 'Référence fournisseur', before: 'OLD', after: 'NEW' }],
		statut: 'pending' as const,
		date_created: '',
	};
	const { rerender } = render(
		<SupplierPurchaseSteps {...props} userId={8} order={{ ...order, change_requests: [request] }} />,
	);
	fireEvent.click(screen.getByRole('button', { name: 'Accepter' }));
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

it('prevents opening a proposal while another action is running', () => {
	render(<SupplierPurchaseSteps {...props} busy />);
	const edit = screen.getByRole('button', { name: 'Proposer une modification' });
	expect(edit).toBeDisabled();
	fireEvent.click(edit);
	expect(props.onEdit).not.toHaveBeenCalled();
});

it('lets a company admin review the values and hides decisions from the requester', () => {
	const request = {
		id: 3,
		etape: 'proforma',
		remarque: 'Référence corrigée',
		demandeur: 4,
		responsable: 8,
		demandeur_name: 'Demandeur',
		statut: 'pending' as const,
		date_created: '',
		has_proposal: true,
		changes: [{ field: 'numero_proforma_fournisseur', label: 'Référence', before: 'OLD', after: 'NEW' }],
	};
	const { rerender } = render(<SupplierPurchaseSteps {...props} order={{ ...order, change_requests: [request] }} />);
	expect(screen.getByText('OLD')).toBeInTheDocument();
	expect(screen.getByText('NEW')).toBeInTheDocument();
	expect(screen.queryByRole('button', { name: 'Accepter' })).not.toBeInTheDocument();
	rerender(<SupplierPurchaseSteps {...props} userId={9} canReview order={{ ...order, change_requests: [request] }} />);
	fireEvent.click(screen.getByRole('button', { name: 'Refuser' }));
	expect(props.onAction).toHaveBeenCalledWith({ action: 'refuser_modification', demande_id: 3 });
});
