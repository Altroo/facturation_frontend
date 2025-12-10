import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import GlobalRemiseModal from './globalRemiseModal';

type TextInputProps = {
	id?: string;
	type?: string;
	label?: string;
	value?: string;
	onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
	fullWidth?: boolean;
	size?: string;
	theme?: unknown;
	endIcon?: React.ReactNode;
};

type DropDownItem = { value: string; label: string };
type DropDownProps = {
	id?: string;
	items: DropDownItem[];
	value?: string;
	onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
	label?: string;
	theme?: unknown;
};

jest.mock('@/components/formikElements/customTextInput/customTextInput', () => {
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const React = require('react') as typeof import('react');

	const MockTextInput: React.FC<TextInputProps> = (props: TextInputProps) => {
		const id = props.id ?? 'mock-text';
		return React.createElement(
			'div',
			{ 'data-testid': `mock-text-${id}` },
			React.createElement('label', { htmlFor: id }, props.label ?? ''),
			React.createElement('input', {
				id,
				'data-testid': id,
				type: props.type ?? 'text',
				value: props.value ?? '',
				onChange: (e: React.ChangeEvent<HTMLInputElement>) => props.onChange?.(e),
			}),
			React.createElement(
				'span',
				{ 'data-testid': `${id}-endicon` },
				(() => {
					if (React.isValidElement(props.endIcon)) {
						const el = props.endIcon as React.ReactElement<{ children?: React.ReactNode }>;
						return el.props.children ?? '';
					}
					return '';
				})(),
			),
		);
	};

	return { __esModule: true, default: MockTextInput };
});

jest.mock('@/components/formikElements/customDropDownSelect/customDropDownSelect', () => {
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const React = require('react') as typeof import('react');

	const MockDropDown: React.FC<DropDownProps> = (props: DropDownProps) => {
		const id = props.id ?? 'mock-select';
		return React.createElement(
			'div',
			{ 'data-testid': `mock-select-${id}` },
			React.createElement('label', { htmlFor: id }, props.label ?? ''),
			React.createElement(
				'select',
				{
					id,
					'data-testid': id,
					value: props.value ?? '',
					onChange: (e: React.ChangeEvent<HTMLSelectElement>) => props.onChange?.(e),
				},
				(props.items ?? []).map((it: DropDownItem) =>
					React.createElement('option', { key: it.value, value: it.value }, it.label),
				),
			),
		);
	};

	return { __esModule: true, default: MockDropDown };
});

describe('GlobalRemiseModal', () => {
	it('renders title and buttons when open', () => {
		render(<GlobalRemiseModal open={true} onClose={() => {}} currentType="" currentValue={0} onApply={() => {}} />);

		expect(screen.getByText('Remise globale')).toBeInTheDocument();
		expect(screen.getByText('Annuler')).toBeInTheDocument();
		expect(screen.getByText('Appliquer')).toBeInTheDocument();
		expect(screen.getByTestId('global_remise_type')).toBeInTheDocument();
	});

	it('shows numeric input when selecting a type and calls onApply with parsed number', async () => {
		const onApply = jest.fn();
		const onClose = jest.fn();

		render(<GlobalRemiseModal open={true} onClose={onClose} currentType="" currentValue={0} onApply={onApply} />);

		const select = screen.getByTestId('global_remise_type') as HTMLSelectElement;
		fireEvent.change(select, { target: { value: 'Pourcentage' } });

		const input = (await screen.findByTestId('remise_value')) as HTMLInputElement;
		expect(input).toBeInTheDocument();
		expect(screen.getByTestId('remise_value-endicon').textContent).toContain('%');

		fireEvent.change(input, { target: { value: '12.5' } });

		const apply = screen.getByText('Appliquer');
		fireEvent.click(apply);

		await waitFor(() => {
			expect(onApply).toHaveBeenCalledTimes(1);
			expect(onApply).toHaveBeenCalledWith('Pourcentage', 12.5);
		});
	});

	it('empty type resets value to 0 and onApply called with empty type and 0', async () => {
		const onApply = jest.fn();
		const onClose = jest.fn();

		render(
			<GlobalRemiseModal open={true} onClose={onClose} currentType="Pourcentage" currentValue={5} onApply={onApply} />,
		);

		expect(screen.getByTestId('remise_value')).toBeInTheDocument();

		const select = screen.getByTestId('global_remise_type') as HTMLSelectElement;
		fireEvent.change(select, { target: { value: '' } });

		await waitFor(() => {
			expect(screen.queryByTestId('remise_value')).toBeNull();
		});

		fireEvent.click(screen.getByText('Appliquer'));
		await waitFor(() => {
			expect(onApply).toHaveBeenCalledWith('', 0);
		});
	});

	it('calls onClose when clicking Annuler', () => {
		const onApply = jest.fn();
		const onClose = jest.fn();

		render(<GlobalRemiseModal open={true} onClose={onClose} currentType="" currentValue={0} onApply={onApply} />);

		fireEvent.click(screen.getByText('Annuler'));
		expect(onClose).toHaveBeenCalledTimes(1);
	});
});
