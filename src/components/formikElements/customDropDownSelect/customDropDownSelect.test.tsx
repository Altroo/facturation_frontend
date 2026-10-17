import { type SVGProps } from 'react';

jest.mock('@mui/icons-material/CheckCircleOutlined', () => {
	return {
		__esModule: true,
		default: (props: SVGProps<SVGSVGElement>) => <svg data-testid="CheckCircleOutlinedIcon" {...props} />,
	};
});
import { render, screen, fireEvent } from '@testing-library/react';
import CustomDropDownSelect from './customDropDownSelect';
import { createTheme } from '@mui/material/styles';
import '@testing-library/jest-dom';

const theme = createTheme();

const mockItems = ['Option A', 'Option B', 'Option C'];

describe('CustomDropDownSelect', () => {
	it('shows an empty-state prompt without treating it as an option or a value', () => {
		const onChange = jest.fn();
		const props = {
			id: 'currency',
			label: 'Devise',
			items: ['MAD', 'EUR'],
			theme,
			onChange,
			placeholder: 'Choisissez une devise',
		};
		const { rerender } = render(<CustomDropDownSelect {...props} value="" />);
		expect(screen.getByRole('combobox', { name: 'Devise' })).toHaveTextContent('Choisissez une devise');
		fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Devise' }));
		expect(screen.queryByRole('option', { name: 'Choisissez une devise' })).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole('option', { name: 'EUR' }));
		expect(onChange.mock.calls[0][0].target.value).toBe('EUR');
		rerender(<CustomDropDownSelect {...props} value="EUR" />);
		expect(screen.getByRole('combobox', { name: 'Devise' })).toHaveTextContent('EUR');
		expect(screen.queryByText('Choisissez une devise')).not.toBeInTheDocument();
	});
	it('renders label and options', () => {
		render(<CustomDropDownSelect id="test-select" label="Test Label" items={mockItems} theme={theme} value="" />);

		expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
	});

	it('renders selected value', () => {
		render(
			<CustomDropDownSelect id="test-select" label="Test Label" items={mockItems} theme={theme} value="Option B" />,
		);

		expect(screen.getByDisplayValue('Option B')).toBeInTheDocument();
	});

	it('calls onChange when selection changes', () => {
		const handleChange = jest.fn();

		render(
			<CustomDropDownSelect
				id="test-select"
				label="Test Label"
				items={mockItems}
				theme={theme}
				value=""
				onChange={handleChange}
			/>,
		);

		fireEvent.mouseDown(screen.getByLabelText('Test Label'));
		fireEvent.click(screen.getByText('Option B'));

		expect(handleChange).toHaveBeenCalled();
	});

	it('displays helper text when provided', () => {
		render(
			<CustomDropDownSelect
				id="test-select"
				label="Test Label"
				items={['One', 'Two']}
				theme={theme}
				value=""
				helperText="This is a helper"
			/>,
		);

		// Open the dropdown
		fireEvent.mouseDown(screen.getByLabelText('Test Label'));

		// Now assert the helper text
		expect(screen.getByText((content) => content.includes('This is a helper'))).toBeInTheDocument();
	});

	it('renders disabled select when disabled is true', () => {
		render(
			<CustomDropDownSelect
				id="test-select"
				label="Test Label"
				items={['One', 'Two']}
				theme={theme}
				value=""
				disabled
			/>,
		);

		const select = screen.getByRole('combobox');
		expect(select).toHaveAttribute('aria-disabled', 'true');
	});
});
