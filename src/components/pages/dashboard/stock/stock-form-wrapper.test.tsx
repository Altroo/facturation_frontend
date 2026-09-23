import { type ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { AppSession } from '@/types/_initTypes';
import StockFormWrapper from './stock-form-wrapper';

const mockUseAppSelector = jest.fn();

jest.mock('@/contexts/InitContext', () => ({
	useInitAccessToken: () => 'test-token',
}));

jest.mock('@/utils/hooks', () => ({
	useAppSelector: (...args: unknown[]) => mockUseAppSelector(...args),
}));

jest.mock('@/store/selectors', () => ({
	getUserCompaniesState: jest.fn(),
}));

jest.mock('@/components/layouts/navigationBar/navigationBar', () => ({
	__esModule: true,
	default: ({ title, children }: { title: string; children: ReactNode }) => (
		<section>
			<h1>{title}</h1>
			{children}
		</section>
	),
}));

jest.mock('@/components/shared/noPermission/noPermission', () => ({
	__esModule: true,
	default: () => <div>Accès refusé</div>,
}));

const mockSession = {} as AppSession;

describe('StockFormWrapper', () => {
	it('renders its content when the company role is allowed', () => {
		mockUseAppSelector.mockReturnValue([{ id: 1, role: 'Caissier' }]);

		render(
			<StockFormWrapper session={mockSession} company_id={1} title="Ajustement" allowedRoles={['Caissier']}>
				{(token) => <div>Formulaire {token}</div>}
			</StockFormWrapper>,
		);

		expect(screen.getByRole('heading', { name: 'Ajustement' })).toBeInTheDocument();
		expect(screen.getByText('Formulaire test-token')).toBeInTheDocument();
	});

	it('renders the permission message when the company role is not allowed', () => {
		mockUseAppSelector.mockReturnValue([{ id: 1, role: 'Lecture' }]);

		render(
			<StockFormWrapper session={mockSession} company_id={1} title="Ajustement" allowedRoles={['Caissier']}>
				{() => <div>Formulaire</div>}
			</StockFormWrapper>,
		);

		expect(screen.getByText('Accès refusé')).toBeInTheDocument();
		expect(screen.queryByText('Formulaire')).not.toBeInTheDocument();
	});
});
