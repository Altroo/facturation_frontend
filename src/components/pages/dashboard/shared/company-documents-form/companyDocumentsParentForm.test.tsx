import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { getAccessTokenFromSession } from '@/store/session';
import { useAppSelector } from '@/utils/hooks';
import CompanyDocumentsParentForm from './companyDocumentsParentForm';
import { Session } from 'next-auth';

jest.mock('@/store/session', () => ({
	getAccessTokenFromSession: jest.fn(),
}));

jest.mock('@/utils/hooks', () => ({
	useAppSelector: jest.fn(),
}));

jest.mock('@/components/layouts/navigationBar/navigationBar', () => ({
	__esModule: true,
	default: ({ children }: { children: React.ReactNode }) => <div data-testid="nav">{children}</div>,
}));

describe('CompanyDocumentsParentForm', () => {
	const docConfig = {
		singular: 'document',
		addTitle: 'Add document',
		editTitle: 'Edit document',
		addDeniedMessage: 'You cannot add',
		editDeniedMessage: 'You cannot edit',
	};

	// Typed mock session
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

	// Explicit props type for the mocked FormComponent
	type FormComponentProps = {
		token?: string;
		company_id: number;
		id?: number;
		isEditMode?: boolean;
	};

	beforeEach(() => {
		jest.resetAllMocks();
	});

	it('renders FormComponent when company role is Admin and passes token and props', () => {
		// Arrange: mock token and companies
		(getAccessTokenFromSession as jest.Mock).mockReturnValue('token-123');
		const companies = [{ id: 42, role: 'Admin' }];
		(useAppSelector as jest.Mock).mockImplementation(() => companies);

		// capture props passed to FormComponent
		const FormComponentCalled = jest.fn() as jest.Mock<void, [FormComponentProps]>;
		const FormComponent: React.FC<FormComponentProps> = (props) => {
			FormComponentCalled(props);
			return <div data-testid="mock-form">FORM</div>;
		};

		// Act
		render(
			<CompanyDocumentsParentForm
				session={mockSession}
				company_id={42}
				id={7}
				documentConfig={docConfig}
				FormComponent={FormComponent}
			/>,
		);

		// Assert
		expect(screen.getByTestId('nav')).toBeInTheDocument();
		expect(screen.getByTestId('mock-form')).toBeInTheDocument();
		expect(FormComponentCalled).toHaveBeenCalledTimes(1);
		const calledProps = FormComponentCalled.mock.calls[0][0];
		expect(calledProps.company_id).toBe(42);
		expect(calledProps.token).toBe('token-123');
		expect(calledProps.id).toBe(7);
		expect(calledProps.isEditMode).toBe(true);
	});

	it('renders denied message when company role is not Admin and does not render FormComponent', () => {
		(getAccessTokenFromSession as jest.Mock).mockReturnValue('token-xyz');
		const companies = [{ id: 100, role: 'User' }];
		(useAppSelector as jest.Mock).mockImplementation(() => companies);

		const FormComponent: React.FC<FormComponentProps> = () => <div data-testid="should-not-render">NO</div>;

		render(
			<CompanyDocumentsParentForm
				session={mockSession}
				company_id={100}
				documentConfig={docConfig}
				FormComponent={FormComponent}
			/>,
		);

		expect(screen.queryByTestId('should-not-render')).not.toBeInTheDocument();
		expect(screen.getByText(docConfig.addDeniedMessage)).toBeInTheDocument();
	});
});
