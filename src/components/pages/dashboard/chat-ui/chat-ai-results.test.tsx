import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ChatAIResults } from './chat-ai-results';
import type { ChatCard, NavigationTarget } from '@/types/chatAiTypes';

jest.mock('@/utils/hooks', () => ({
	useLanguage: () => ({ language: 'fr', t: jest.requireActual('@/translations').translations.fr }),
}));

const target: NavigationTarget = {
	application: 'facturation',
	resource: 'invoice',
	identifier: 12,
	company_id: 7,
	path: '/dashboard/facture-client/12/?company_id=7',
};
const invoice: ChatCard = {
	type: 'record_list',
	resource: 'invoice',
	items: [{ id: 12, number: 'FAC-012', total_ttc: '120.00', currency: 'MAD', navigation: target }],
};
const confirmation: ChatCard = {
	type: 'confirmation',
	resource: 'invoice',
	action_id: 'action-12',
	operation: 'update',
	record_id: 12,
	company_id: 7,
	label: 'FAC-012',
	before: { remarque: 'Before' },
	changes: { remarque: 'After' },
};

it('renders nothing without cards and explains an empty search result', () => {
	const { container, rerender } = render(<ChatAIResults cards={[]} navigate={jest.fn()} />);
	expect(container).toBeEmptyDOMElement();
	rerender(<ChatAIResults cards={[{ type: 'record_list', items: [] }]} navigate={jest.fn()} />);
	expect(screen.getByText('Aucun résultat trouvé. Précisez votre recherche.')).toBeVisible();
	expect(screen.queryByRole('button')).not.toBeInTheDocument();
});

it('keeps record navigation available while hiding actions without permission', () => {
	const navigate = jest.fn();
	const select = jest.fn();
	const pdf = jest.fn();
	render(
		<ChatAIResults
			cards={[invoice]}
			navigate={navigate}
			select={select}
			pdf={pdf}
			permissions={{ can_update: false, can_delete: false, can_print: false }}
		/>,
	);
	fireEvent.click(screen.getByRole('button', { name: 'Voir' }));
	expect(navigate).toHaveBeenCalledWith(target);
	for (const name of ['Modifier', 'Supprimer', 'PDF'])
		expect(screen.queryByRole('button', { name })).not.toBeInTheDocument();
	expect(select).not.toHaveBeenCalled();
	expect(pdf).not.toHaveBeenCalled();
});

it('sends the exact authorized record and resource to edit, delete, and PDF actions', () => {
	const select = jest.fn();
	const pdf = jest.fn();
	render(
		<ChatAIResults
			cards={[invoice]}
			navigate={jest.fn()}
			select={select}
			pdf={pdf}
			permissions={{ can_update: true, can_delete: true, can_print: true }}
		/>,
	);
	fireEvent.click(screen.getByRole('button', { name: 'Modifier' }));
	expect(select).toHaveBeenLastCalledWith('invoice', 12, 'edit');
	fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));
	expect(select).toHaveBeenLastCalledWith('invoice', 12, 'delete');
	fireEvent.click(screen.getByRole('button', { name: 'PDF' }));
	expect(pdf).toHaveBeenCalledWith(12, 'invoice');
});

it('allows retry after a failed confirmation and marks only a successful action as completed', async () => {
	const confirm = jest.fn().mockRejectedValueOnce(new Error('Request failed')).mockResolvedValueOnce(undefined);
	render(<ChatAIResults cards={[confirmation]} navigate={jest.fn()} confirm={confirm} />);
	fireEvent.click(screen.getByRole('button', { name: 'Vérifier cette action' }));
	expect(confirm).not.toHaveBeenCalled();
	fireEvent.click(screen.getByRole('button', { name: 'Confirmer cette action' }));
	await waitFor(() => expect(screen.getByRole('button', { name: 'Confirmer cette action' })).toBeEnabled());
	expect(confirm).toHaveBeenCalledTimes(1);
	expect(screen.queryByRole('button', { name: 'Action effectuée' })).not.toBeInTheDocument();
	fireEvent.click(screen.getByRole('button', { name: 'Confirmer cette action' }));
	await waitFor(() => expect(screen.getByRole('button', { name: 'Action effectuée' })).toBeDisabled());
	expect(confirm).toHaveBeenCalledTimes(2);
	expect(confirm).toHaveBeenLastCalledWith(confirmation);
});

it('does not offer confirmation for fields outside the supported document contract', () => {
	const confirm = jest.fn();
	render(
		<ChatAIResults cards={[{ ...confirmation, changes: { total_ttc: '0' } }]} navigate={jest.fn()} confirm={confirm} />,
	);
	const review = screen.getByRole('button', { name: 'Vérifier cette action' });
	expect(review).toBeDisabled();
	fireEvent.click(review);
	expect(confirm).not.toHaveBeenCalled();
});
