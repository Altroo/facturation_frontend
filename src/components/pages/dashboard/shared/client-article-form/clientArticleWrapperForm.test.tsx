import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useAppSelector } from '@/utils/hooks';
import ClientArticleWrapperForm from './clientArticleWrapperForm';
import { Session } from 'next-auth';
import { useInitAccessToken } from '@/contexts/InitContext';

jest.mock('@/contexts/InitContext', () => ({
	useInitAccessToken: jest.fn(() => 'test-token'),
}));

jest.mock('@/utils/hooks', () => ({
	useAppSelector: jest.fn(),
}));

jest.mock('@/components/layouts/navigationBar/navigationBar', () => ({
	__esModule: true,
	default: ({ children, title }: { children: React.ReactNode; title?: string }) => (
		<div data-testid="nav">
			<h1>{title}</h1>
			{children}
		</div>
	),
}));

describe('ClientArticleFormWrapper', () => {
	// typed mock session
	const mockSession: Session = {
		user: {
			pk: 1,
			email: 'test@example.com',
			first_name: 'John',
			last_name: 'Doe',
			id: '',
			emailVerified: null,
			name: '',
		},
		accessToken: 'access-token',
		refreshToken: 'refresh-token',
		accessTokenExpiration: '2025-01-01',
		refreshTokenExpiration: '2025-01-02',
		expires: '2025-01-03',
	};

	type FormikComponentProps = {
		token?: string;
		id?: number;
		company_id: number;
	};

	beforeEach(() => {
		jest.resetAllMocks();
	});

	it('renders FormikComponent when company role is Caissier and passes token and props', () => {
		(useInitAccessToken as jest.Mock).mockReturnValue('token-123');
		const companies = [{ id: 42, role: 'Caissier' }];
		(useAppSelector as jest.Mock).mockImplementation(() => companies);

		const FormikCalled = jest.fn() as jest.Mock<void, [FormikComponentProps]>;
		const FormikComponent: React.FC<FormikComponentProps> = (props) => {
			FormikCalled(props);
			return <div data-testid="mock-form">FORM</div>;
		};

		render(
			<ClientArticleWrapperForm
				session={mockSession}
				company_id={42}
				id={7}
				entityName="article"
				FormikComponent={FormikComponent}
			/>,
		);

		expect(screen.getByTestId('nav')).toBeInTheDocument();
		// title should reflect edit mode when id provided
		expect(screen.getByText("Modifier l'article")).toBeInTheDocument();
		expect(screen.getByTestId('mock-form')).toBeInTheDocument();
		expect(FormikCalled).toHaveBeenCalledTimes(1);
		const calledProps = FormikCalled.mock.calls[0][0];
		expect(calledProps.company_id).toBe(42);
		expect(calledProps.token).toBe('token-123');
		expect(calledProps.id).toBe(7);
	});

	it('renders denied message when company role is not Admin and does not render FormikComponent', () => {
		const companies = [{ id: 100, role: 'Lecture' }];
		(useAppSelector as jest.Mock).mockImplementation(() => companies);

		const FormikComponent: React.FC<FormikComponentProps> = () => <div data-testid="should-not-render">NO</div>;

		render(
			<ClientArticleWrapperForm
				session={mockSession}
				company_id={100}
				entityName="client"
				FormikComponent={FormikComponent}
			/>,
		);

		expect(screen.queryByTestId('should-not-render')).not.toBeInTheDocument();
		expect(screen.getByText(/Vous n'avez pas la permission d'accéder à cette page/i)).toBeInTheDocument();
	});
});
