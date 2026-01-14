import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AddManagedBySection, { AddManagedBySectionProps } from './addManagedBySection';
import '@testing-library/jest-dom';
import type { SelectChangeEvent } from '@mui/material/Select';
import type { DropDownType } from '@/types/accountTypes';

// ✅ Define minimal prop types for mocked components
interface AutocompleteProps {
	id: string;
	label: string;
	fullWidth: boolean;
	items: DropDownType[];
	value: DropDownType | null;
	onChange: (event: React.SyntheticEvent, value: DropDownType | null) => void;
	theme: object;
	startIcon: React.ReactNode;
}

interface DropdownProps {
	id: string;
	label: string;
	items: { value: string; code: string }[];
	value: string;
	onChange: (event: SelectChangeEvent) => void;
	theme: object;
	startIcon: React.ReactNode;
}
// ✅ Mock CustomAutocompleteSelect with startIcon rendered
jest.mock('@/components/formikElements/customAutoCompleteSelect/customAutoCompleteSelect', () => {
	return {
		__esModule: true,
		default: (props: AutocompleteProps & { noOptionsText?: string }) => (
			<div data-testid="custom-autocomplete">
				{props.startIcon}
				<label htmlFor={props.id}>{props.label}</label>
				<input id={props.id} value={props.value?.value ?? ''} onChange={() => {}} />
				{props.items.length === 0 && <span data-testid="no-options">{props.noOptionsText}</span>}
			</div>
		),
	};
});

// ✅ Mock CustomDropDownSelect with startIcon rendered
jest.mock('@/components/formikElements/customDropDownSelect/customDropDownSelect', () => {
	return {
		__esModule: true,
		default: (props: DropdownProps) => (
			<div data-testid="custom-dropdown">
				{props.startIcon}
				<label htmlFor={props.id}>{props.label}</label>
				<select id={props.id} value={props.value} onChange={() => {}}>
					{props.items.map((item) => (
						<option key={item.code} value={item.value}>
							{item.value}
						</option>
					))}
				</select>
			</div>
		),
	};
});

jest.mock('@/utils/themes', () => ({
	customDropdownTheme: () => ({}),
}));

describe('AddManagedBySection', () => {
	const mockSelectChange = jest.fn();
	const mockRoleChange = jest.fn();
	const mockAddClick = jest.fn();

	const defaultProps: AddManagedBySectionProps = {
		title: 'Ajouter un gestionnaire',
		isMobile: false,
		selectId: 'user-select',
		selectLabel: 'Utilisateur',
		selectItems: [
			{ value: 'Alice', code: 'alice-code' },
			{ value: 'Bob', code: 'bob-code' },
		],
		selectValue: { value: 'Alice', code: 'alice-code' },
		onSelectChange: mockSelectChange,
		selectIcon: <span data-testid="select-icon" />,

		roleId: 'role-select',
		roleLabel: 'Rôle',
		roleOptions: [
			{ value: 'Caissier', code: 'caissier' },
			{ value: 'Lecture', code: 'lecture' },
		],
		roleValue: 'Caissier',
		onRoleChange: mockRoleChange,
		roleIcon: <span data-testid="role-icon" />,

		onAdd: mockAddClick,
		isAddDisabled: false,
		sx: undefined,
	};

	it('renders all elements correctly in desktop mode', () => {
		render(<AddManagedBySection {...defaultProps} />);

		expect(screen.getByText('Ajouter un gestionnaire')).toBeInTheDocument();
		expect(screen.getByLabelText('Utilisateur')).toBeInTheDocument();
		expect(screen.getByLabelText('Rôle')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Ajouter' })).toBeEnabled();
		expect(screen.getByTestId('select-icon')).toBeInTheDocument();
		expect(screen.getByTestId('role-icon')).toBeInTheDocument();
	});

	it('renders stacked layout in mobile mode', () => {
		render(<AddManagedBySection {...defaultProps} isMobile={true} />);
		const button = screen.getByRole('button', { name: 'Ajouter' });
		const stack = button.closest('div');
		expect(stack).toHaveStyle('flex-direction: column');
	});

	it('disables the add button when isAddDisabled is true', () => {
		render(<AddManagedBySection {...defaultProps} isAddDisabled={true} />);
		expect(screen.getByRole('button', { name: 'Ajouter' })).toBeDisabled();
	});

	it('calls onAdd when the button is clicked', () => {
		render(<AddManagedBySection {...defaultProps} />);
		fireEvent.click(screen.getByRole('button', { name: 'Ajouter' }));
		expect(mockAddClick).toHaveBeenCalled();
	});
	it('renders noOptionsText when there are no selectItems', () => {
		render(
			<AddManagedBySection
				{...defaultProps}
				selectItems={[]} // empty list
				selectValue={null}
			/>,
		);
		expect(screen.getByTestId('no-options')).toHaveTextContent('Aucun utilisateur trouvé');
	});
});
