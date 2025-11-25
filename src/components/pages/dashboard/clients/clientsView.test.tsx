import React from 'react';
import { render, screen } from '@testing-library/react';
import ClientsViewClient from './clientsView';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import { useGetClientQuery } from '@/store/services/client';
import '@testing-library/jest-dom';
import { AppSession } from '@/types/_initTypes';

// Mock Next.js App Router
jest.mock('next/navigation', () => ({
	useRouter: () => ({
		push: jest.fn(),
		replace: jest.fn(),
		refresh: jest.fn(),
		back: jest.fn(),
		forward: jest.fn(),
		prefetch: jest.fn(),
	}),
	usePathname: () => '/mock-path',
}));

// Mock RTK Query hook (keep other exports from the real module)
jest.mock('@/store/services/client', () => {
	const actual = jest.requireActual('@/store/services/client');
	return {
		...actual,
		useGetClientQuery: jest.fn(),
	};
});

// Mock session util
jest.mock('@/store/session', () => ({
	getAccessTokenFromSession: () => 'mock-token',
}));

// Mock session
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

// Render helper using your real store
const renderWithProviders = (ui: React.ReactElement) => render(<Provider store={store}>{ui}</Provider>);

// Component props
const defaultProps = {
	session: mockSession,
	company_id: 1,
	id: 123,
};

// Mock client data
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
			error: { data: { message: 'Erreur serveur' } },
		});

		renderWithProviders(<ClientsViewClient {...defaultProps} />);
		expect(screen.getByText('Erreur serveur')).toBeInTheDocument();
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
});
