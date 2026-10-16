import { fireEvent, render, screen, within } from '@testing-library/react';
import { PurchaseHistory, PurchaseReceipts } from './supplier-purchase-sections';
import type { LogistiqueEvent, LogistiqueOrder } from '@/types/logistiqueTypes';

const event = (overrides: Partial<LogistiqueEvent> = {}): LogistiqueEvent => ({
	id: 1,
	action: 'Modification : Coût du transport',
	old_value: '50.00',
	new_value: '0.00',
	note: '',
	user: 1,
	user_name: 'Douae',
	date_created: '2026-10-16T10:00:00Z',
	...overrides,
});

test('history keeps full multiline changes and identifies the author', () => {
	const oldValue = 'Ancien texte '.repeat(40);
	const newValue = 'Première ligne\nNouvelle valeur '.repeat(30);
	render(
		<PurchaseHistory
			events={[
				event({
					old_value: oldValue.slice(0, 255),
					new_value: newValue.slice(0, 255),
					note: `Ancienne valeur :\n${oldValue}\n\nNouvelle valeur :\n${newValue}`,
				}),
			]}
		/>,
	);
	const row = screen.getByRole('listitem');
	expect(within(row).getByText('Douae · Modification')).toBeInTheDocument();
	expect(within(row).getByText('Avant').nextElementSibling?.textContent).toBe(oldValue);
	expect(within(row).getByText('Après').nextElementSibling?.textContent).toBe(newValue);
});

test('clearing a value is visible in history', () => {
	render(<PurchaseHistory events={[event({ new_value: '' })]} />);
	expect(screen.getByText('Après').nextElementSibling).toHaveTextContent('Non renseigné');
});

test('old generic summaries get French titles and older actions remain accessible', () => {
	const entries = Array.from({ length: 21 }, (_, index) =>
		event({
			id: index + 1,
			action: 'Mise à jour achat fournisseur : reception',
			old_value: '',
			new_value: 'Réception locale',
		}),
	);
	render(<PurchaseHistory events={entries} />);
	expect(screen.getAllByRole('listitem')).toHaveLength(8);
	expect(screen.queryByText(/Mise à jour achat fournisseur/)).not.toBeInTheDocument();
	expect(screen.getAllByText('Réception enregistrée')).toHaveLength(8);
	fireEvent.click(screen.getByRole('button', { name: /Voir les actions précédentes/ }));
	expect(screen.getAllByRole('listitem')).toHaveLength(20);
	fireEvent.click(screen.getByRole('button', { name: /Voir les actions précédentes/ }));
	expect(screen.getAllByRole('listitem')).toHaveLength(21);
	expect(screen.queryByRole('button')).not.toBeInTheDocument();
});

const order = {
	statut: 'Réception locale',
	date_reelle: null,
	lignes: [
		{
			id: 1,
			type_article: 'Produit',
			article_reference: 'ART-1',
			designation: 'Canapé',
			quantity: '10.000',
			received_quantity: '4.500',
			remaining_quantity: '5.500',
			expected_emplacement_name: 'Dépôt A',
		},
	],
	receptions: [
		{
			id: 1,
			reference: 'BR-001',
			note: 'Cartons vérifiés.',
			status: 'validated',
			date_created: '2026-10-16T10:00:00Z',
			date_validated: '2026-10-16T10:10:00Z',
			validated_by_name: 'Douae',
		},
	],
} as LogistiqueOrder;

test('partial receipt distinguishes ordered, received and outstanding quantities', () => {
	render(<PurchaseReceipts order={order} stockEnabled />);
	expect(screen.getByText('Réception partielle')).toBeInTheDocument();
	expect(screen.getByText('Commandé').nextElementSibling).toHaveTextContent('10');
	expect(screen.getByText('Reçu').nextElementSibling).toHaveTextContent('4,5');
	expect(screen.getByText('À recevoir').nextElementSibling).toHaveTextContent('5,5');
	expect(screen.getByText(/Validée le .* par Douae/)).toBeInTheDocument();
	expect(screen.getByText('Cartons vérifiés.')).toBeInTheDocument();
});

test('service receipts and disabled stock do not invent stock counters', () => {
	const service = {
		...order,
		lignes: order.lignes?.map((line) => ({ ...line, type_article: 'Service' })),
		receptions: [],
	};
	const { rerender } = render(<PurchaseReceipts order={service} stockEnabled />);
	expect(screen.getByText(/Prestation sans mouvement de stock/)).toBeInTheDocument();
	expect(screen.queryByText('À recevoir')).not.toBeInTheDocument();
	rerender(<PurchaseReceipts order={{ ...order, receptions: [] }} stockEnabled={false} />);
	expect(screen.getByText(/Suivi des stocks désactivé/)).toBeInTheDocument();
	expect(screen.queryByText('Reçu')).not.toBeInTheDocument();
});

test('closure does not falsely claim a client delivery was confirmed', () => {
	render(<PurchaseReceipts order={{ ...order, statut: 'Clôture', date_reelle: '2026-10-16' }} stockEnabled />);
	expect(screen.getByText('Dossier clôturé')).toBeInTheDocument();
	expect(screen.queryByText('Livraison confirmée')).not.toBeInTheDocument();
});

test.each(['Avance 30 % : 3 000,00 USD', 'Échéance 6'])(
	'payment history preserves its recorded snapshot: %s',
	(snapshot) => {
		render(<PurchaseHistory events={[event({ action: 'Démarrage paiement', old_value: '', new_value: snapshot })]} />);
		expect(screen.getByText('Traitement du paiement commencé')).toBeInTheDocument();
		expect(screen.getByText('Paiement concerné').nextElementSibling?.textContent).toBe(snapshot);
	},
);

test('before and after show their own recorded start times', () => {
	const before = '2026-09-14T09:32:00Z';
	const after = '2026-09-14T09:33:00Z';
	render(
		<PurchaseHistory
			events={[
				event({
					action: 'Changement statut Commande & lancement',
					old_value: 'À lancer',
					new_value: 'En cours',
					old_value_since: before,
					new_value_since: after,
					date_created: after,
				}),
			]}
		/>,
	);
	const oldBox = screen.getByText('Avant').parentElement!;
	const newBox = screen.getByText('Après').parentElement!;
	expect(oldBox.querySelector('time')).toHaveAttribute('datetime', before);
	expect(newBox.querySelector('time')).toHaveAttribute('datetime', after);
	for (const box of [oldBox, newBox]) {
		expect(box).toHaveTextContent(/Depuis le 14\/09\/2026 à \d{2}:\d{2}/);
	}
});

test.each([null, undefined, 'invalid-date'])('missing or invalid previous date is explicit: %s', (before) => {
	render(<PurchaseHistory events={[event({ old_value_since: before })]} />);
	const oldBox = screen.getByText('Avant').parentElement!;
	expect(within(oldBox).getByText('Date non renseignée')).toBeInTheDocument();
	expect(oldBox.querySelector('time')).toBeNull();
	expect(screen.getByText('Après').parentElement!.querySelector('time')).toHaveAttribute(
		'datetime',
		'2026-10-16T10:00:00Z',
	);
	expect(screen.queryByText(/Invalid Date/)).not.toBeInTheDocument();
});

test('future planned values do not become predicted status dates', () => {
	const recorded = '2026-10-16T10:00:00Z';
	render(
		<PurchaseHistory
			events={[
				event({
					action: 'Modification : Date d’expédition prévue',
					old_value: '17/10/2026',
					new_value: '20/10/2026',
					old_value_since: '2026-10-15T09:00:00Z',
					new_value_since: recorded,
				}),
			]}
		/>,
	);
	expect(screen.getByText('Après').parentElement!.querySelector('time')).toHaveAttribute('datetime', recorded);
	expect(screen.getByText('20/10/2026')).toBeInTheDocument();
});
