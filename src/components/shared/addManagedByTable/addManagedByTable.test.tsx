import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ManagedByTableSection from './addManagedByTable';
import '@testing-library/jest-dom';
import { ManagedByType } from '@/types/companyTypes';
import { UserCompaniesType } from '@/types/usersTypes';
import { AddManagedBySectionProps } from '../addManagedBySection/addManagedBySection';
import { SelectChangeEvent } from '@mui/material/Select';

// ✅ Mock AddManagedBySection
jest.mock('../addManagedBySection/addManagedBySection', () => {
	return {
		__esModule: true,
		default: (props: AddManagedBySectionProps) => (
			<div data-testid="add-managed-by-section">
				<button onClick={props.onAdd} disabled={props.isAddDisabled}>
					Ajouter
				</button>
			</div>
		),
	};
});

// ✅ Mock CustomDropDownSelect
interface DropdownProps {
	id: string;
	label: string;
	value: string;
	onChange: (event: SelectChangeEvent) => void;
	items: { value: string; code: string }[];
	theme: object;
	disabled?: boolean;
}

jest.mock('@/components/formikElements/customDropDownSelect/customDropDownSelect', () => {
	return {
		__esModule: true,
		default: (props: DropdownProps) => (
			<select
				data-testid={`dropdown-${props.id}`}
				id={props.id}
				value={props.value}
				onChange={(e) =>
					props.onChange({
						target: { value: e.target.value },
					} as SelectChangeEvent)
				}
				disabled={props.disabled}
			>
				{props.items.map((item) => (
					<option key={item.code} value={item.value}>
						{item.value}
					</option>
				))}
			</select>
		),
	};
});

jest.mock('@/utils/themes', () => ({
	customDropdownTheme: () => ({}),
}));

describe('ManagedByTableSection', () => {
	const roleOptions = [
		{ value: 'Admin', code: 'admin' },
		{ value: 'Manager', code: 'manager' },
	];

	const addSectionProps: AddManagedBySectionProps = {
		title: 'Ajouter',
		isMobile: false,
		selectId: 'user-select',
		selectLabel: 'Utilisateur',
		selectItems: [],
		selectValue: null,
		onSelectChange: jest.fn(),
		selectIcon: <span />,
		roleId: 'role-select',
		roleLabel: 'Rôle',
		roleOptions,
		roleValue: 'Admin',
		onRoleChange: jest.fn(),
		roleIcon: <span />,
		onAdd: jest.fn(),
		isAddDisabled: false,
	};

	it('renders empty state when data is empty', () => {
		render(
			<ManagedByTableSection
				title="Gestionnaires"
				icon={<span data-testid="icon" />}
				emptyIcon={<span data-testid="empty-icon" />}
				emptyMessage="Aucun gestionnaire"
				headers={['Nom', 'Rôle']}
				data={[]}
				isUserTable={true}
				roleOptions={roleOptions}
				onRoleChange={jest.fn()}
				onDelete={jest.fn()}
				addSectionProps={addSectionProps}
			/>,
		);

		expect(screen.getByText('Aucun gestionnaire')).toBeInTheDocument();
		expect(screen.getByTestId('empty-icon')).toBeInTheDocument();
		expect(screen.getByTestId('add-managed-by-section')).toBeInTheDocument();
	});

	it('renders user table with chip for current user and handles role change and delete', () => {
		const onRoleChange = jest.fn();
		const onDelete = jest.fn();

		const userData: ManagedByType[] = [
			{ id: 1, first_name: 'Alice', last_name: 'Smith', role: 'Admin' },
			{ id: 2, first_name: 'Bob', last_name: 'Jones', role: 'Manager' },
		];

		render(
			<ManagedByTableSection
				title="Gestionnaires"
				icon={<span data-testid="icon" />}
				emptyIcon={<span />}
				emptyMessage="Aucun gestionnaire"
				headers={['Nom', 'Rôle']}
				data={userData}
				isUserTable={true}
				currentUserId={1}
				roleOptions={roleOptions}
				onRoleChange={onRoleChange}
				onDelete={onDelete}
				addSectionProps={addSectionProps}
			/>,
		);

		expect(screen.getByText('Alice Smith')).toBeInTheDocument();
		expect(screen.getByText('Bob Jones')).toBeInTheDocument();
		expect(screen.getByText('vous')).toBeInTheDocument();

		fireEvent.change(screen.getByTestId('dropdown-role_1'), {
			target: { value: 'Admin' },
		});
		expect(onRoleChange).toHaveBeenCalledWith(1, 'Admin');

		const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
		fireEvent.click(deleteButtons[1]); // Click Bob's delete button
		expect(onDelete).toHaveBeenCalledWith(1);
	});

	it('renders company table and disables nothing', () => {
		const companyData: UserCompaniesType[] = [
			{
				membership_id: 10,
				company_id: 100,
				raison_sociale: 'Acme Corp',
				role: 'Manager',
			},
		];

		render(
			<ManagedByTableSection
				title="Entreprises"
				icon={<span data-testid="icon" />}
				emptyIcon={<span />}
				emptyMessage="Aucune entreprise"
				headers={['Entreprise', 'Rôle']}
				data={companyData}
				isUserTable={false}
				roleOptions={roleOptions}
				onRoleChange={jest.fn()}
				onDelete={jest.fn()}
				addSectionProps={addSectionProps}
			/>,
		);

		expect(screen.getByText('Acme Corp')).toBeInTheDocument();
		expect(screen.getByTestId('dropdown-role_0')).not.toBeDisabled();
	});
});
