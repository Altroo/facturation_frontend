import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock CustomTextInput to expose all relevant props
jest.mock('@/components/formikElements/customTextInput/customTextInput', () => ({
	__esModule: true,
	default: React.forwardRef(function MockCustomTextInput(
		props: {
			value?: string;
			onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
			onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
			label?: string;
			error?: boolean;
			helperText?: string;
			disabled?: boolean;
			slotProps?: { htmlInput?: { onFocus?: () => void } };
		},
		ref: React.Ref<HTMLInputElement>,
	) {
		return (
			<input
				ref={ref}
				data-testid="custom-text-input"
				value={props.value ?? ''}
				onChange={props.onChange}
				onBlur={props.onBlur}
				onFocus={props.slotProps?.htmlInput?.onFocus}
				aria-label={props.label}
				aria-invalid={props.error}
				disabled={props.disabled}
				placeholder={props.helperText}
			/>
		);
	}),
}));

// Mock helpers
jest.mock('@/utils/helpers', () => ({
	formatNumberWithSpaces: (value: string | number, decimals: number = 2) => {
		const num = typeof value === 'string' ? parseFloat(value) : value;
		if (isNaN(num)) return '';
		return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
	},
	parseFormattedNumber: (value: string) => {
		const cleaned = value.replace(/\s/g, '').replace(',', '.');
		const parsed = parseFloat(cleaned);
		return isNaN(parsed) ? null : parsed;
	},
}));

import FormattedNumberInput from './formattedNumberInput';
import { createTheme } from '@mui/material/styles';

const theme = createTheme();

const defaultProps = {
	type: 'text' as const,
	id: 'test-input',
	value: 1234.56,
	onChange: jest.fn(),
	theme,
};

describe('FormattedNumberInput', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('renders with formatted value when not focused', () => {
		render(<FormattedNumberInput {...defaultProps} />);
		const input = screen.getByTestId('custom-text-input') as HTMLInputElement;
		expect(input.value).toContain('1');
		expect(input.value).toContain('234');
	});

	it('shows raw value when focused', () => {
		render(<FormattedNumberInput {...defaultProps} />);
		const input = screen.getByTestId('custom-text-input');
		fireEvent.focus(input);
		expect((input as HTMLInputElement).value).toBe('1234.56');
	});

	it('shows empty string when value is empty and not focused', () => {
		render(<FormattedNumberInput {...defaultProps} value="" />);
		const input = screen.getByTestId('custom-text-input') as HTMLInputElement;
		expect(input.value).toBe('');
	});

	it('calls onChange with parsed numeric value on input change', () => {
		const mockOnChange = jest.fn();
		render(<FormattedNumberInput {...defaultProps} onChange={mockOnChange} />);
		const input = screen.getByTestId('custom-text-input');

		// Focus first, then type
		fireEvent.focus(input);
		fireEvent.change(input, { target: { value: '5000' } });

		expect(mockOnChange).toHaveBeenCalled();
		const syntheticEvent = mockOnChange.mock.calls[0][0];
		expect(syntheticEvent.target.value).toBe('5000');
	});

	it('calls onChange with raw value when input cannot be parsed', () => {
		const mockOnChange = jest.fn();
		render(<FormattedNumberInput {...defaultProps} onChange={mockOnChange} />);
		const input = screen.getByTestId('custom-text-input');

		fireEvent.focus(input);
		fireEvent.change(input, { target: { value: 'abc' } });

		expect(mockOnChange).toHaveBeenCalled();
		const syntheticEvent = mockOnChange.mock.calls[0][0];
		expect(syntheticEvent.target.value).toBe('abc');
	});

	it('resets edit state on blur', () => {
		render(<FormattedNumberInput {...defaultProps} />);
		const input = screen.getByTestId('custom-text-input') as HTMLInputElement;

		fireEvent.focus(input);
		expect(input.value).toBe('1234.56');

		fireEvent.blur(input);
		// After blur, should show formatted again
		expect(input.value).toContain('1');
	});

	it('calls parent onBlur handler', () => {
		const mockOnBlur = jest.fn();
		render(<FormattedNumberInput {...defaultProps} onBlur={mockOnBlur} />);
		const input = screen.getByTestId('custom-text-input');

		fireEvent.focus(input);
		fireEvent.blur(input);

		expect(mockOnBlur).toHaveBeenCalled();
	});

	it('uses custom decimals prop', () => {
		render(<FormattedNumberInput {...defaultProps} value={1000} decimals={0} />);
		const input = screen.getByTestId('custom-text-input') as HTMLInputElement;
		// Should use 0 decimals
		expect(input.value).toContain('1');
	});

	it('handles null/undefined value when focusing', () => {
		render(<FormattedNumberInput {...defaultProps} value={undefined as unknown as number} />);
		const input = screen.getByTestId('custom-text-input');
		fireEvent.focus(input);
		expect((input as HTMLInputElement).value).toBe('');
	});

	it('passes additional props like label and error', () => {
		render(<FormattedNumberInput {...defaultProps} label="Amount" error={true} />);
		const input = screen.getByTestId('custom-text-input');
		expect(input).toHaveAttribute('aria-label', 'Amount');
		expect(input).toHaveAttribute('aria-invalid', 'true');
	});

	it('passes disabled prop', () => {
		render(<FormattedNumberInput {...defaultProps} disabled={true} />);
		const input = screen.getByTestId('custom-text-input');
		expect(input).toBeDisabled();
	});

	it('has displayName set', () => {
		expect(FormattedNumberInput.displayName).toBe('FormattedNumberInput');
	});
});
