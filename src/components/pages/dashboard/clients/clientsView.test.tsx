import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ClientsViewClient from './clientsView';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import { useGetClientQuery } from '@/store/services/client';
import '@testing-library/jest-dom';
import type { AppSession } from '@/types/_initTypes';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/utils/hooks';

// Router mock
jest.mock('next/navigation', () => ({
	useRouter: jest.fn(),
	usePathname: jest.fn(() => '/mock-path'),
}));

// RTK Query mock
jest.mock('@/store/services/client', () => {
	const actual = jest.requireActual('@/store/services/client');
	return { ...actual, useGetClientQuery: jest.fn() };
});

// Session util mock
jest.mock('@/store/session', () => ({
	getAccessTokenFromSession: () => 'mock-token',
}));

// Selector mock
jest.mock('@/utils/hooks', () => ({
	useAppSelector: jest.fn(),
}));

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

const renderWithProviders = (ui: React.ReactElement) => render(<Provider store={store}>{ui}</Provider>);

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

describe('ClientsViewClient', () => {
	const mockPush = jest.fn();

	beforeEach(() => {
		(useRouter as jest.Mock).mockReturnValue({
			push: mockPush,
			replace: jest.fn(),
			refresh: jest.fn(),
			back: jest.fn(),
			forward: jest.fn(),
			prefetch: jest.fn(),
		});

		// Default: Admin role
		(useAppSelector as jest.Mock).mockReturnValue([{ id: 1, role: 'Admin' }]);
	});

	afterEach(() => {
		jest.clearAllMocks();
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
		expect(mockPush).toHaveBeenCalled();
	});

	it('shows and navigates with "Modifier" button when role is Admin', () => {
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

	it('does not show "Modifier" button when role is not Admin', () => {
		(useAppSelector as jest.Mock).mockReturnValueOnce([{ id: 1, role: 'User' }]);

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
});
