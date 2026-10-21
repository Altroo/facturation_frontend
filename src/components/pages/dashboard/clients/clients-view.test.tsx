import { type ReactNode, type ReactElement } from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ClientsViewClient from './clients-view';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import { useGetClientHistoryQuery, useGetClientQuery } from '@/store/services/client';
import '@testing-library/jest-dom';
import type { AppSession } from '@/types/_initTypes';
import { useRouter } from 'next/navigation';
import { useAppSelector, useToast } from '@/utils/hooks';
import { fetchPdfBlob } from '@/utils/apiHelpers';

// Router mock
jest.mock('next/navigation', () => ({
	useRouter: jest.fn(),
	usePathname: jest.fn(() => '/mock-path'),
}));

// RTK Query mock
jest.mock('@/store/services/client', () => {
	const actual = jest.requireActual('@/store/services/client');
	return { ...actual, useGetClientHistoryQuery: jest.fn(), useGetClientQuery: jest.fn() };
});

jest.mock('@/utils/apiHelpers', () => ({
	...jest.requireActual('@/utils/apiHelpers'),
	fetchPdfBlob: jest.fn(),
}));

// InitContext mock
jest.mock('@/contexts/InitContext', () => ({
	useInitAccessToken: () => 'test-token',
}));

jest.mock('@/components/layouts/navigationBar/navigationBar', () => ({
	__esModule: true,
	default: ({ children }: { children?: ReactNode }) => <div data-testid="navigation-bar">{children}</div>,
}));

// Selector mock
jest.mock('@/utils/hooks', () => {
	const { translations } = jest.requireActual('@/translations');
	return {
		useAppDispatch: () => jest.fn(),
		useAppSelector: jest.fn(),
		useToast: jest.fn(() => ({ onSuccess: jest.fn(), onError: jest.fn() })),
		useLanguage: () => ({ language: 'fr' as const, setLanguage: jest.fn(), t: translations.fr }),
		useIsClient: () => true,
	};
});

const mockSession: AppSession = {
	accessToken: 'mock-token',
	refreshToken: 'mock-refresh-token',
	accessTokenExpiration: '2099-12-31T23:59:59Z',
	refreshTokenExpiration: '2099-12-31T23:59:59Z',
	expires: '2099-12-31T23:59:59Z',
	user: {
		accessToken: 'mock-token',
		pk: 1,
		email: 'test@example.com',
		first_name: 'Test',
		last_name: 'User',
		id: '',
		emailVerified: null,
		name: '',
	},
};

const renderWithProviders = (ui: ReactElement) => render(<Provider store={store}>{ui}</Provider>);

const defaultProps = { session: mockSession, company_id: 1, id: 123 };

const mockClientPM = {
	client_type: 'PM',
	code_client: 'C123',
	raison_sociale: 'TestCorp',
	email: 'pm@example.com',
	tel: '111222333',
	numero_du_compte: 'ACC123',
	ICE: 'ICE123',
	registre_de_commerce: 'RC123',
	identifiant_fiscal: 'IF123',
	taxe_professionnelle: 'TP123',
	CNSS: 'CNSS123',
	ville_name: 'Casablanca',
	delai_de_paiement: 30,
	remarque: 'Client remark',
};

const mockClientPP = {
	client_type: 'PP',
	code_client: 'C456',
	nom: 'Doe',
	prenom: 'John',
	adresse: '123 Street',
	email: 'pp@example.com',
	tel: '987654321',
};

const emptyHistory = {
	devis: [],
	factures: [],
	avoirs: [],
	reglements: [],
};

describe('ClientsViewClient', () => {
	const mockPush = jest.fn();
	const mockBack = jest.fn();

	beforeEach(() => {
		(useRouter as jest.Mock).mockReturnValue({
			push: mockPush,
			back: mockBack,
			replace: jest.fn(),
			refresh: jest.fn(),
			forward: jest.fn(),
			prefetch: jest.fn(),
		});

		// Default: Caissier role
		(useAppSelector as jest.Mock).mockReturnValue([{ id: 1, role: 'Caissier' }]);
		(useGetClientHistoryQuery as jest.Mock).mockReturnValue({
			isLoading: false,
			data: emptyHistory,
		});
	});

	afterEach(() => {
		jest.clearAllMocks();
		jest.restoreAllMocks();
		jest.useRealTimers();
	});

	it('renders loading state', () => {
		(useGetClientQuery as jest.Mock).mockReturnValue({
			isLoading: true,
			data: undefined,
			error: undefined,
		});

		renderWithProviders(<ClientsViewClient {...defaultProps} />);
		expect(screen.getByTestId('api-loader')).toBeInTheDocument();
	});

	it('renders error state', () => {
		(useGetClientQuery as jest.Mock).mockReturnValue({
			isLoading: false,
			data: undefined,
			error: { status: 500, data: { details: { message: ['Erreur serveur'] } } },
		});

		renderWithProviders(<ClientsViewClient {...defaultProps} />);
		expect(screen.getByText(/Erreur serveur/)).toBeInTheDocument();
	});

	it('renders PM client details', () => {
		(useGetClientQuery as jest.Mock).mockReturnValue({
			isLoading: false,
			error: undefined,
			data: mockClientPM,
		});

		renderWithProviders(<ClientsViewClient {...defaultProps} />);
		expect(screen.getByText('Identité du client')).toBeInTheDocument();
		expect(screen.getByText('Code client')).toBeInTheDocument();
		expect(screen.getByText('C123')).toBeInTheDocument();
		expect(screen.getByText('Raison sociale')).toBeInTheDocument();
		expect(screen.getByText('TestCorp')).toBeInTheDocument();
		expect(screen.getByText('Ville')).toBeInTheDocument();
		expect(screen.getByText('Casablanca')).toBeInTheDocument();
	});

	it('renders PP client details', () => {
		(useGetClientQuery as jest.Mock).mockReturnValue({
			isLoading: false,
			error: undefined,
			data: mockClientPP,
		});

		renderWithProviders(<ClientsViewClient {...defaultProps} />);
		expect(screen.getByText('Nom')).toBeInTheDocument();
		expect(screen.getByText('Doe')).toBeInTheDocument();
		expect(screen.getByText('Prénom')).toBeInTheDocument();
		expect(screen.getByText('John')).toBeInTheDocument();
		expect(screen.getByText('Adresse')).toBeInTheDocument();
		expect(screen.getByText('123 Street')).toBeInTheDocument();
	});

	// 🔥 Added navigation + permissions tests
	it('navigates back to list when "Liste des clients" button is clicked', () => {
		(useGetClientQuery as jest.Mock).mockReturnValue({
			isLoading: false,
			error: undefined,
			data: mockClientPM,
		});

		renderWithProviders(<ClientsViewClient {...defaultProps} />);
		fireEvent.click(screen.getByText('Liste des clients', { selector: 'button' }));
		expect(mockPush).toHaveBeenCalledWith('/dashboard/clients?company_id=1');
		expect(mockBack).not.toHaveBeenCalled();
	});

	it('shows and navigates with "Modifier" button when role is Caissier', () => {
		(useGetClientQuery as jest.Mock).mockReturnValue({
			isLoading: false,
			error: undefined,
			data: mockClientPM,
		});

		renderWithProviders(<ClientsViewClient {...defaultProps} />);
		const editBtn = screen.getByText('Modifier', { selector: 'button' });
		expect(editBtn).toBeInTheDocument();

		fireEvent.click(editBtn);
		expect(mockPush).toHaveBeenCalled();
	});

	it('does not show "Modifier" button when role is Lecture', () => {
		(useAppSelector as jest.Mock).mockReturnValueOnce([{ id: 1, role: 'Lecture' }]);

		(useGetClientQuery as jest.Mock).mockReturnValue({
			isLoading: false,
			error: undefined,
			data: mockClientPM,
		});

		renderWithProviders(<ClientsViewClient {...defaultProps} />);
		expect(screen.queryByText('Modifier', { selector: 'button' })).not.toBeInTheDocument();
	});

	it('does not show "Modifier" button during loading', () => {
		(useGetClientQuery as jest.Mock).mockReturnValue({
			isLoading: true,
			error: undefined,
			data: undefined,
		});

		renderWithProviders(<ClientsViewClient {...defaultProps} />);
		expect(screen.queryByText('Modifier', { selector: 'button' })).not.toBeInTheDocument();
	});

	it('does not show "Modifier" button on error', () => {
		(useGetClientQuery as jest.Mock).mockReturnValue({
			isLoading: false,
			error: { data: { message: 'Erreur serveur' } },
			data: undefined,
		});

		renderWithProviders(<ClientsViewClient {...defaultProps} />);
		expect(screen.queryByText('Modifier', { selector: 'button' })).not.toBeInTheDocument();
	});

	it('renders account statement like the printed sample', () => {
		(useGetClientQuery as jest.Mock).mockReturnValue({
			isLoading: false,
			error: undefined,
			data: mockClientPM,
		});
		(useGetClientHistoryQuery as jest.Mock).mockReturnValue({
			isLoading: false,
			data: {
				...emptyHistory,
				factures: [
					{
						id: 10,
						numero_facture: 'F/2026/06/10',
						date_facture: '2026-06-10',
						date_echeance: '2026-06-20',
						total_ttc_apres_remise: '1200',
						devise: 'MAD',
					},
				],
				reglements: [
					{
						id: 11,
						facture_client_numero: 'F/2026/06/10',
						date_reglement: '2026-06-15',
						date_echeance: '2026-06-15',
						montant: '500',
						devise: 'MAD',
					},
				],
			},
		});

		renderWithProviders(<ClientsViewClient {...defaultProps} />);

		expect(screen.getByText('Extrait de Compte Client')).toBeInTheDocument();
		expect(screen.getByText('Échéance')).toBeInTheDocument();
		expect(screen.getByText('Pièce')).toBeInTheDocument();
		expect(screen.getByText('Libellé')).toBeInTheDocument();
		expect(screen.getByText('Facture')).toBeInTheDocument();
		expect(screen.getByText('N° : F/2026/06/10')).toBeInTheDocument();
		expect(screen.getByText('Encaissement')).toBeInTheDocument();
		expect(screen.getByText('Reg fact N°(F/2026/06/10) TestCorp')).toBeInTheDocument();
		expect(screen.getByText('Solde')).toBeInTheDocument();
		expect(screen.getAllByText('1 200,00')).not.toHaveLength(0);
		expect(screen.getAllByText('500,00')).not.toHaveLength(0);
		expect(screen.getByText('700,00')).toBeInTheDocument();
	});
	describe('statement PDF', () => {
		const pickStatementDay = async (label: string, day: number, user: ReturnType<typeof userEvent.setup>) => {
			const picker = label === 'Du' ? 0 : 1;
			await user.click(screen.getAllByRole('button', { name: /choose date/i })[picker]);
			const calendar = within(screen.getByRole('grid'));
			await user.click(calendar.getByRole('gridcell', { name: String(day) }));
		};
		const createObjectURL = jest.fn(() => 'blob:statement-pdf');
		const revokeObjectURL = jest.fn();
		const onError = jest.fn();
		const originalCreate = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
		const originalRevoke = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL');

		beforeAll(() => {
			Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
			Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL });
		});

		afterAll(() => {
			if (originalCreate) Object.defineProperty(URL, 'createObjectURL', originalCreate);
			else Reflect.deleteProperty(URL, 'createObjectURL');
			if (originalRevoke) Object.defineProperty(URL, 'revokeObjectURL', originalRevoke);
			else Reflect.deleteProperty(URL, 'revokeObjectURL');
		});

		beforeEach(() => {
			(useToast as jest.Mock).mockReturnValue({ onSuccess: jest.fn(), onError });
			(useGetClientQuery as jest.Mock).mockReturnValue({ data: mockClientPM, isLoading: false });
			(useGetClientHistoryQuery as jest.Mock).mockReturnValue({
				isLoading: false,
				data: {
					...emptyHistory,
					factures: [
						{
							id: 10,
							numero_facture: 'FAC/26',
							date_facture: '2026-06-10',
							total_ttc_apres_remise: '1200',
							devise: 'MAD',
						},
					],
				},
			});
		});

		it('opens the authenticated PDF with the selected language and current filters', async () => {
			jest.useFakeTimers();
			jest.setSystemTime(new Date(2026, 5, 10, 12));
			const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
			const blob = new Blob(['pdf'], { type: 'application/pdf' });
			jest.mocked(fetchPdfBlob).mockResolvedValue(blob);
			const open = jest.spyOn(window, 'open').mockReturnValue(null);
			renderWithProviders(<ClientsViewClient {...defaultProps} />);
			await pickStatementDay('Du', 1, user);
			await pickStatementDay('Au', 30, user);
			fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Type' }));
			fireEvent.click(screen.getByRole('option', { name: 'Factures' }));
			fireEvent.click(screen.getByRole('button', { name: 'Imprimer le relevé' }));
			expect(fetchPdfBlob).not.toHaveBeenCalled();
			fireEvent.click(screen.getByRole('button', { name: /English|Anglais/ }));
			await waitFor(() => expect(open).toHaveBeenCalledWith('blob:statement-pdf', '_blank'));
			const [url, token] = jest.mocked(fetchPdfBlob).mock.calls[0];
			expect(url).toContain('/client/pdf/en/123/?');
			expect(new URLSearchParams(url.split('?')[1])).toEqual(
				new URLSearchParams({ company_id: '1', date_from: '2026-06-01', date_to: '2026-06-30', type: 'invoice' }),
			);
			expect(token).toBe('test-token');
			expect(createObjectURL).toHaveBeenCalledWith(blob);
			jest.advanceTimersByTime(60_000);
			expect(revokeObjectURL).toHaveBeenCalledWith('blob:statement-pdf');
		});

		it('disables dates outside the selected statement range in both calendars', async () => {
			jest.useFakeTimers();
			jest.setSystemTime(new Date(2026, 5, 10, 12));
			const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
			renderWithProviders(<ClientsViewClient {...defaultProps} />);
			await pickStatementDay('Du', 15, user);
			await pickStatementDay('Au', 20, user);

			await user.click(screen.getAllByRole('button', { name: /choose date/i })[1]);
			let calendar = within(screen.getByRole('grid'));
			expect(calendar.getByRole('gridcell', { name: '14' })).toBeDisabled();
			expect(calendar.getByRole('gridcell', { name: '15' })).not.toBeDisabled();
			await user.keyboard('{Escape}');

			await user.click(screen.getAllByRole('button', { name: /choose date/i })[0]);
			calendar = within(screen.getByRole('grid'));
			expect(calendar.getByRole('gridcell', { name: '21' })).toBeDisabled();
			expect(calendar.getByRole('gridcell', { name: '20' })).not.toBeDisabled();
			expect(fetchPdfBlob).not.toHaveBeenCalled();
		});

		it('reports a failed PDF request through the existing toast', async () => {
			jest.mocked(fetchPdfBlob).mockRejectedValue(new Error('Request failed'));
			const open = jest.spyOn(window, 'open').mockReturnValue(null);
			renderWithProviders(<ClientsViewClient {...defaultProps} />);
			fireEvent.click(screen.getByRole('button', { name: 'Imprimer le relevé' }));
			fireEvent.click(screen.getByRole('button', { name: /Français/ }));
			await waitFor(() => expect(onError).toHaveBeenCalledWith("Erreur lors de l'ouverture du document"));
			expect(open).not.toHaveBeenCalled();
		});

		it('cancels language selection without requesting a PDF', () => {
			renderWithProviders(<ClientsViewClient {...defaultProps} />);
			fireEvent.click(screen.getByRole('button', { name: 'Imprimer le relevé' }));
			fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
			expect(fetchPdfBlob).not.toHaveBeenCalled();
		});

		it('hides printing for the read-only role', () => {
			(useAppSelector as jest.Mock).mockReturnValue([{ id: 1, role: 'Lecture' }]);
			renderWithProviders(<ClientsViewClient {...defaultProps} />);
			expect(screen.queryByRole('button', { name: 'Imprimer le relevé' })).not.toBeInTheDocument();
		});

		it('disables printing while history is loading', () => {
			(useGetClientHistoryQuery as jest.Mock).mockReturnValue({ data: emptyHistory, isLoading: true });
			renderWithProviders(<ClientsViewClient {...defaultProps} />);
			expect(screen.getByRole('button', { name: 'Imprimer le relevé' })).toBeDisabled();
		});
	});
});
