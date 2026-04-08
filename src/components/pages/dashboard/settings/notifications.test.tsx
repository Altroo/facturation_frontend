import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

const mockStore = configureStore({
	reducer: {
		_init: () => ({}),
		account: () => ({}),
	},
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: false,
		}),
});

const mockOnSuccess = jest.fn();
const mockOnError = jest.fn();
const mockUpdatePreferences = jest.fn().mockReturnValue({ unwrap: () => Promise.resolve({}) });

jest.mock('@/utils/hooks', () => ({
	__esModule: true,
	useToast: () => ({ onSuccess: mockOnSuccess, onError: mockOnError }),
	useAppSelector: jest.fn(() => null),
	useLanguage: () => ({ language: 'fr' as const, setLanguage: jest.fn(), t: jest.requireActual('@/translations').translations.fr }),
}));

jest.mock('@/components/layouts/navigationBar/navigationBar', () => ({
	__esModule: true,
	default: ({ children, title }: { children: React.ReactNode; title: string }) => (
		<div data-testid="navigation-bar">
			<h1 data-testid="nav-title">{title}</h1>
			{children}
		</div>
	),
}));

jest.mock('@/store/services/notification', () => ({
	__esModule: true,
	useGetNotificationPreferencesQuery: () => ({
		data: {
			notify_overdue_invoice: true,
			notify_expiring_quote: false,
			notify_uninvoiced_bdl: true,
			quote_expiry_days: 7,
		},
		isLoading: false,
	}),
	useUpdateNotificationPreferencesMutation: () => [mockUpdatePreferences, { isLoading: false }],
}));

jest.mock('@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton', () => ({
	__esModule: true,
	default: ({ buttonText, onClick }: { buttonText: string; onClick: () => void }) => (
		<button data-testid="submit-button" onClick={onClick}>
			{buttonText}
		</button>
	),
}));

jest.mock('@/components/formikElements/apiLoading/apiProgress/apiProgress', () => ({
	__esModule: true,
	default: () => <div data-testid="api-loader">Loading...</div>,
}));

jest.mock('@/utils/helpers', () => ({
	setFormikAutoErrors: jest.fn(),
}));

jest.mock('@/styles/dashboard/settings/settings.module.sass', () => ({
	flexRootStack: 'flexRootStack',
	pageTitle: 'pageTitle',
	form: 'form',
	maxWidth: 'maxWidth',
	mobileButton: 'mobileButton',
	submitButton: 'submitButton',
	main: 'main',
	fixMobile: 'fixMobile',
}));

import NotificationsClient from './notifications';

const renderWithProviders = (ui: React.ReactElement) => render(<Provider store={mockStore}>{ui}</Provider>);

describe('NotificationsClient', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterEach(() => {
		cleanup();
	});

	it('renders the page title', () => {
		renderWithProviders(<NotificationsClient />);
		expect(screen.getAllByText('Préférences de notification').length).toBeGreaterThan(0);
	});

	it('renders notification switches and quote expiry input', () => {
		renderWithProviders(<NotificationsClient />);
		expect(screen.getByText('Factures en retard de paiement')).toBeInTheDocument();
		expect(screen.getByText('Devis expirant bientôt')).toBeInTheDocument();
		expect(screen.getByText('Bons de livraison non facturés')).toBeInTheDocument();
		expect(screen.getByLabelText('Alerter X jours après envoi du devis')).toBeInTheDocument();
	});

	it('populates the form with preferences data', () => {
		renderWithProviders(<NotificationsClient />);
		expect(screen.getByLabelText('Factures en retard de paiement')).toBeChecked();
		expect(screen.getByLabelText('Devis expirant bientôt')).not.toBeChecked();
		expect(screen.getByLabelText('Bons de livraison non facturés')).toBeChecked();
	});

	it('calls updatePreferences on submit', async () => {
		renderWithProviders(<NotificationsClient />);
		fireEvent.click(screen.getByTestId('submit-button'));
		await waitFor(() => {
			expect(mockUpdatePreferences).toHaveBeenCalledWith({
				notify_overdue_invoice: true,
				notify_expiring_quote: false,
				notify_uninvoiced_bdl: true,
				quote_expiry_days: 7,
			});
		});
	});

	it('requests browser notification permission on mount', () => {
		const requestPermission = jest.fn().mockResolvedValue('granted');
		Object.defineProperty(window, 'Notification', {
			value: { permission: 'default', requestPermission },
			writable: true,
			configurable: true,
		});

		renderWithProviders(<NotificationsClient />);
		expect(requestPermission).toHaveBeenCalled();
	});
});