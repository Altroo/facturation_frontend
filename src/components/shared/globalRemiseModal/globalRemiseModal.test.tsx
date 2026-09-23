import { type ChangeEvent, type ReactNode, type FC, createElement, isValidElement, type ReactElement } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import GlobalRemiseModal from './globalRemiseModal';

type TextInputProps = {
	id?: string;
	type?: string;
	label?: string;
	value?: string;
	onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
	fullWidth?: boolean;
	size?: string;
	theme?: unknown;
	endIcon?: ReactNode;
};

type DropDownItem = { value: string; label: string };
type DropDownProps = {
	id?: string;
	items: DropDownItem[];
	value?: string;
	onChange?: (e: ChangeEvent<HTMLSelectElement>) => void;
	label?: string;
	theme?: unknown;
};

jest.mock('@/components/formikElements/customTextInput/customTextInput', () => {
	const MockTextInput: FC<TextInputProps> = (props: TextInputProps) => {
		const id = props.id ?? 'mock-text';
		return createElement(
			'div',
			{ 'data-testid': `mock-text-${id}` },
			createElement('label', { htmlFor: id }, props.label ?? ''),
			createElement('input', {
				id,
				'data-testid': id,
				type: props.type ?? 'text',
				value: props.value ?? '',
				onChange: (e: ChangeEvent<HTMLInputElement>) => props.onChange?.(e),
			}),
			createElement(
				'span',
				{ 'data-testid': `${id}-endicon` },
				(() => {
					if (isValidElement(props.endIcon)) {
						const el = props.endIcon as ReactElement<{ children?: ReactNode }>;
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
	const MockDropDown: FC<DropDownProps> = (props: DropDownProps) => {
		const id = props.id ?? 'mock-select';
		return createElement(
			'div',
			{ 'data-testid': `mock-select-${id}` },
			createElement('label', { htmlFor: id }, props.label ?? ''),
			createElement(
				'select',
				{
					id,
					'data-testid': id,
					value: props.value ?? '',
					onChange: (e: ChangeEvent<HTMLSelectElement>) => props.onChange?.(e),
				},
				(props.items ?? []).map((it: DropDownItem) =>
					createElement('option', { key: it.value, value: it.value }, it.label),
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

	it('shows error when percentage is greater than 100', async () => {
		const onApply = jest.fn();
		const onClose = jest.fn();

		render(<GlobalRemiseModal open={true} onClose={onClose} currentType="" currentValue={0} onApply={onApply} />);

		const select = screen.getByTestId('global_remise_type') as HTMLSelectElement;
		fireEvent.change(select, { target: { value: 'Pourcentage' } });

		const input = (await screen.findByTestId('remise_value')) as HTMLInputElement;
		fireEvent.change(input, { target: { value: '150' } });

		// Try to apply - should set error
		fireEvent.click(screen.getByText('Appliquer'));

		// onApply should not be called due to validation error
		await waitFor(() => {
			expect(onApply).not.toHaveBeenCalled();
		});
	});

	it('shows error when value is below minimum', async () => {
		const onApply = jest.fn();
		const onClose = jest.fn();

		render(<GlobalRemiseModal open={true} onClose={onClose} currentType="" currentValue={0} onApply={onApply} />);

		const select = screen.getByTestId('global_remise_type') as HTMLSelectElement;
		fireEvent.change(select, { target: { value: 'Fixe' } });

		const input = (await screen.findByTestId('remise_value')) as HTMLInputElement;
		fireEvent.change(input, { target: { value: '0' } });

		// Try to apply - should set error
		fireEvent.click(screen.getByText('Appliquer'));

		// onApply should not be called due to validation error
		await waitFor(() => {
			expect(onApply).not.toHaveBeenCalled();
		});
	});

	it('displays MAD suffix for Fixe type', async () => {
		const onApply = jest.fn();
		const onClose = jest.fn();

		render(<GlobalRemiseModal open={true} onClose={onClose} currentType="" currentValue={0} onApply={onApply} />);

		const select = screen.getByTestId('global_remise_type') as HTMLSelectElement;
		fireEvent.change(select, { target: { value: 'Fixe' } });

		await waitFor(() => {
			expect(screen.getByTestId('remise_value-endicon').textContent).toContain('MAD');
		});
	});

	it('applies valid fixed amount correctly', async () => {
		const onApply = jest.fn();
		const onClose = jest.fn();

		render(<GlobalRemiseModal open={true} onClose={onClose} currentType="" currentValue={0} onApply={onApply} />);

		const select = screen.getByTestId('global_remise_type') as HTMLSelectElement;
		fireEvent.change(select, { target: { value: 'Fixe' } });

		const input = (await screen.findByTestId('remise_value')) as HTMLInputElement;
		fireEvent.change(input, { target: { value: '50' } });

		fireEvent.click(screen.getByText('Appliquer'));

		await waitFor(() => {
			expect(onApply).toHaveBeenCalledWith('Fixe', 50);
		});
	});

	it('initializes with existing currentType and currentValue', async () => {
		const onApply = jest.fn();
		const onClose = jest.fn();

		render(<GlobalRemiseModal open={true} onClose={onClose} currentType="Fixe" currentValue={100} onApply={onApply} />);

		// Input should be visible with type Fixe
		const input = await screen.findByTestId('remise_value');
		expect(input).toBeInTheDocument();
		expect((input as HTMLInputElement).value).toBe('100');
	});

	it('validates percentage is exactly 100', async () => {
		const onApply = jest.fn();
		const onClose = jest.fn();

		render(<GlobalRemiseModal open={true} onClose={onClose} currentType="" currentValue={0} onApply={onApply} />);

		const select = screen.getByTestId('global_remise_type') as HTMLSelectElement;
		fireEvent.change(select, { target: { value: 'Pourcentage' } });

		const input = (await screen.findByTestId('remise_value')) as HTMLInputElement;
		fireEvent.change(input, { target: { value: '100' } });

		fireEvent.click(screen.getByText('Appliquer'));

		await waitFor(() => {
			expect(onApply).toHaveBeenCalledWith('Pourcentage', 100);
		});
	});
});
