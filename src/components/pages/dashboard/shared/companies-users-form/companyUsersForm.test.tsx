import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { getAccessTokenFromSession } from '@/store/session';
import CompanyUsersForm from './companyUsersForm';
import { Session } from 'next-auth';

jest.mock('@/store/session', () => ({
	getAccessTokenFromSession: jest.fn(),
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

jest.mock('@/components/layouts/protected/protected', () => ({
	__esModule: true,
	Protected: ({ children }: { children: React.ReactNode }) => <div data-testid="protected">{children}</div>,
}));

describe('CompanyUsersForm', () => {
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
		name?: string;
	};

	beforeEach(() => {
		jest.resetAllMocks();
	});

	it('renders FormikComponent in edit mode and passes token, id and extra props', () => {
		(getAccessTokenFromSession as jest.Mock).mockReturnValue('token-123');

		const FormikCalled = jest.fn() as jest.Mock<void, [FormikComponentProps]>;
		const FormikComponent: React.FC<FormikComponentProps> = (props) => {
			FormikCalled(props);
			return <div data-testid="mock-form">FORM</div>;
		};

		render(
			<CompanyUsersForm
				session={mockSession}
				id={7}
				entityName="entreprise"
				FormikComponent={FormikComponent}
				extraFormikProps={{ name: 'ACME' }}
			/>,
		);

		expect(screen.getByTestId('nav')).toBeInTheDocument();
		expect(screen.getByTestId('protected')).toBeInTheDocument();
		expect(screen.getByText("Modifier l'entreprise")).toBeInTheDocument();
		expect(screen.getByTestId('mock-form')).toBeInTheDocument();

		expect(FormikCalled).toHaveBeenCalledTimes(1);
		const calledProps = FormikCalled.mock.calls[0][0];
		expect(calledProps.token).toBe('token-123');
		expect(calledProps.id).toBe(7);
		expect(calledProps.name).toBe('ACME');
	});

	it('renders FormikComponent in add mode and passes token and extra props with undefined id', () => {
		(getAccessTokenFromSession as jest.Mock).mockReturnValue('token-xyz');

		const FormikCalled = jest.fn() as jest.Mock<void, [FormikComponentProps]>;
		const FormikComponent: React.FC<FormikComponentProps> = (props) => {
			FormikCalled(props);
			return <div data-testid="mock-form-add">FORM-ADD</div>;
		};

		render(
			<CompanyUsersForm
				session={mockSession}
				entityName="entreprise"
				FormikComponent={FormikComponent}
				extraFormikProps={{ name: 'NewCo' }}
			/>,
		);

		expect(screen.getByTestId('nav')).toBeInTheDocument();
		expect(screen.getByTestId('protected')).toBeInTheDocument();
		expect(screen.getByText('Ajouter une entreprise')).toBeInTheDocument();
		expect(screen.getByTestId('mock-form-add')).toBeInTheDocument();

		expect(FormikCalled).toHaveBeenCalledTimes(1);
		const calledProps = FormikCalled.mock.calls[0][0];
		expect(calledProps.token).toBe('token-xyz');
		expect(calledProps.id).toBeUndefined();
		expect(calledProps.name).toBe('NewCo');
	});
});
