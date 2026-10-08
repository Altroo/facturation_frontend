import { fireEvent, render, screen } from '@testing-library/react';
import { ChatAIShortcuts } from './ChatAIShortcuts';
import type { ChatShortcut } from './types';

const shortcuts: ChatShortcut[] = [
	{ command: '/stock', title: 'Stock', help: 'Consulter le stock autorisé.', example: '/stock peinture' },
	{
		command: '/logistique',
		title: 'Logistique',
		help: 'Rechercher les dossiers autorisés.',
		example: '/logistique client Atlas',
	},
	{ command: '/articles', title: 'Articles', help: 'Rechercher par désignation.', example: '/articles peinture' },
];

it('renders exactly the backend-authorized catalogue and selects a module', () => {
	const choose = jest.fn();
	render(<ChatAIShortcuts draft="/" shortcuts={shortcuts} choose={choose} />);
	expect(screen.getByRole('button', { name: /\/stock/ })).toBeVisible();
	expect(screen.getByRole('button', { name: /\/logistique/ })).toBeVisible();
	expect(screen.getByRole('button', { name: /\/articles/ })).toBeVisible();
	expect(screen.queryByText('/utilisateurs')).not.toBeInTheDocument();
	expect(screen.queryByText('/supprimer')).not.toBeInTheDocument();
	fireEvent.click(screen.getByRole('button', { name: /\/stock/ }));
	expect(choose).toHaveBeenCalledWith('/stock ');
});

it('filters module prefixes and explains usage in the native UI language', () => {
	render(<ChatAIShortcuts draft="/log" shortcuts={shortcuts} language="en" choose={jest.fn()} />);
	expect(screen.getByText('Assistant shortcuts')).toBeVisible();
	expect(screen.getByRole('button', { name: /\/logistique/ })).toBeVisible();
	expect(screen.queryByRole('button', { name: /\/stock/ })).not.toBeInTheDocument();
	expect(screen.getByText(/Example:/)).toBeVisible();
});
