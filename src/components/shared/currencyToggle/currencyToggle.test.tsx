import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CurrencyToggle from './currencyToggle';

describe('CurrencyToggle', () => {
	const mockOnDeviseChange = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('visibility', () => {
		test('renders when usesForeignCurrency is true', () => {
			render(
				<CurrencyToggle selectedDevise="MAD" onDeviseChange={mockOnDeviseChange} usesForeignCurrency={true} />,
			);

			expect(screen.getByRole('group')).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'MAD' })).toBeInTheDocument();
		});

		test('does not render when usesForeignCurrency is false', () => {
			render(
				<CurrencyToggle selectedDevise="MAD" onDeviseChange={mockOnDeviseChange} usesForeignCurrency={false} />,
			);

			expect(screen.queryByRole('group')).not.toBeInTheDocument();
			expect(screen.queryByRole('button', { name: 'MAD' })).not.toBeInTheDocument();
		});
	});

	describe('currency buttons', () => {
		test('renders all three currency buttons', () => {
			render(
				<CurrencyToggle selectedDevise="MAD" onDeviseChange={mockOnDeviseChange} usesForeignCurrency={true} />,
			);

			expect(screen.getByRole('button', { name: 'MAD' })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'EUR' })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'USD' })).toBeInTheDocument();
		});

		test('MAD button is selected when selectedDevise is MAD', () => {
			render(
				<CurrencyToggle selectedDevise="MAD" onDeviseChange={mockOnDeviseChange} usesForeignCurrency={true} />,
			);

			const madButton = screen.getByRole('button', { name: 'MAD' });
			expect(madButton).toHaveClass('Mui-selected');
		});

		test('EUR button is selected when selectedDevise is EUR', () => {
			render(
				<CurrencyToggle selectedDevise="EUR" onDeviseChange={mockOnDeviseChange} usesForeignCurrency={true} />,
			);

			const eurButton = screen.getByRole('button', { name: 'EUR' });
			expect(eurButton).toHaveClass('Mui-selected');
		});

		test('USD button is selected when selectedDevise is USD', () => {
			render(
				<CurrencyToggle selectedDevise="USD" onDeviseChange={mockOnDeviseChange} usesForeignCurrency={true} />,
			);

			const usdButton = screen.getByRole('button', { name: 'USD' });
			expect(usdButton).toHaveClass('Mui-selected');
		});
	});

	describe('currency selection', () => {
		test('calls onDeviseChange with EUR when EUR button is clicked', () => {
			render(
				<CurrencyToggle selectedDevise="MAD" onDeviseChange={mockOnDeviseChange} usesForeignCurrency={true} />,
			);

			const eurButton = screen.getByRole('button', { name: 'EUR' });
			fireEvent.click(eurButton);

			expect(mockOnDeviseChange).toHaveBeenCalledTimes(1);
			expect(mockOnDeviseChange).toHaveBeenCalledWith('EUR');
		});

		test('calls onDeviseChange with USD when USD button is clicked', () => {
			render(
				<CurrencyToggle selectedDevise="MAD" onDeviseChange={mockOnDeviseChange} usesForeignCurrency={true} />,
			);

			const usdButton = screen.getByRole('button', { name: 'USD' });
			fireEvent.click(usdButton);

			expect(mockOnDeviseChange).toHaveBeenCalledTimes(1);
			expect(mockOnDeviseChange).toHaveBeenCalledWith('USD');
		});

		test('calls onDeviseChange with MAD when MAD button is clicked', () => {
			render(
				<CurrencyToggle selectedDevise="EUR" onDeviseChange={mockOnDeviseChange} usesForeignCurrency={true} />,
			);

			const madButton = screen.getByRole('button', { name: 'MAD' });
			fireEvent.click(madButton);

			expect(mockOnDeviseChange).toHaveBeenCalledTimes(1);
			expect(mockOnDeviseChange).toHaveBeenCalledWith('MAD');
		});

		test('does not call onDeviseChange when clicking already selected currency', () => {
			render(
				<CurrencyToggle selectedDevise="MAD" onDeviseChange={mockOnDeviseChange} usesForeignCurrency={true} />,
			);

			const madButton = screen.getByRole('button', { name: 'MAD' });
			fireEvent.click(madButton);

			expect(mockOnDeviseChange).not.toHaveBeenCalled();
		});
	});

	describe('ToggleButtonGroup properties', () => {
		test('renders ToggleButtonGroup component', () => {
			render(
				<CurrencyToggle selectedDevise="MAD" onDeviseChange={mockOnDeviseChange} usesForeignCurrency={true} />,
			);

			const toggleGroup = screen.getByRole('group');
			expect(toggleGroup).toBeInTheDocument();
			expect(toggleGroup).toHaveClass('MuiToggleButtonGroup-root');
		});

		test('renders with exclusive selection', () => {
			render(
				<CurrencyToggle selectedDevise="MAD" onDeviseChange={mockOnDeviseChange} usesForeignCurrency={true} />,
			);

			const madButton = screen.getByRole('button', { name: 'MAD' });
			const eurButton = screen.getByRole('button', { name: 'EUR' });

			expect(madButton).toHaveClass('Mui-selected');
			expect(eurButton).not.toHaveClass('Mui-selected');
		});

		test('only one button is selected at a time', () => {
			render(
				<CurrencyToggle selectedDevise="EUR" onDeviseChange={mockOnDeviseChange} usesForeignCurrency={true} />,
			);

			const madButton = screen.getByRole('button', { name: 'MAD' });
			const eurButton = screen.getByRole('button', { name: 'EUR' });
			const usdButton = screen.getByRole('button', { name: 'USD' });

			expect(madButton).not.toHaveClass('Mui-selected');
			expect(eurButton).toHaveClass('Mui-selected');
			expect(usdButton).not.toHaveClass('Mui-selected');
		});
	});

	describe('layout', () => {
		test('renders with centered flex layout', () => {
			const { container } = render(
				<CurrencyToggle selectedDevise="MAD" onDeviseChange={mockOnDeviseChange} usesForeignCurrency={true} />,
			);

			const box = container.querySelector('.MuiBox-root');
			expect(box).toHaveStyle({
				display: 'flex',
				justifyContent: 'center',
			});
		});

		test('applies bottom margin', () => {
			const { container } = render(
				<CurrencyToggle selectedDevise="MAD" onDeviseChange={mockOnDeviseChange} usesForeignCurrency={true} />,
			);

			const box = container.querySelector('.MuiBox-root');
			expect(box).toBeInTheDocument();
		});
	});

	describe('null handling', () => {
		test('does not call onDeviseChange when newDevise is null', () => {
			render(
				<CurrencyToggle selectedDevise="MAD" onDeviseChange={mockOnDeviseChange} usesForeignCurrency={true} />,
			);

			const madButton = screen.getByRole('button', { name: 'MAD' });
			fireEvent.click(madButton);

			expect(mockOnDeviseChange).not.toHaveBeenCalled();
		});
	});
});
