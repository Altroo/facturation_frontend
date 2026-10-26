import { render, screen, fireEvent } from '@testing-library/react';
import { createRef } from 'react';
import { Tooltip } from '@mui/material';
import PrimaryLoadingButton from './primaryLoadingButton';
import '@testing-library/jest-dom';

describe('PrimaryLoadingButton', () => {
	const mockClick = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('renders button with correct text', () => {
		render(<PrimaryLoadingButton buttonText="Load" loading={false} active={true} />);
		expect(screen.getByRole('button', { name: 'Load' })).toBeInTheDocument();
	});

	it('renders as disabled when active is false', () => {
		render(<PrimaryLoadingButton buttonText="Load" loading={false} active={false} />);
		expect(screen.getByRole('button', { name: 'Load' })).toBeDisabled();
	});

	it('calls onClick when button is clicked and active is true', () => {
		render(<PrimaryLoadingButton buttonText="Load" loading={false} active={true} onClick={mockClick} />);
		fireEvent.click(screen.getByRole('button', { name: 'Load' }));
		expect(mockClick).toHaveBeenCalled();
	});

	it('does not call onClick when button is disabled', () => {
		render(<PrimaryLoadingButton buttonText="Load" loading={false} active={false} onClick={mockClick} />);
		fireEvent.click(screen.getByRole('button', { name: 'Load' }));
		expect(mockClick).not.toHaveBeenCalled();
	});

	it('applies custom class when cssClass is provided', () => {
		render(<PrimaryLoadingButton buttonText="Load" loading={false} active={true} cssClass="custom-class" />);
		const button = screen.getByRole('button', { name: 'Load' });
		expect(button.className).toMatch(/custom-class/);
	});

	it('applies the inverse primary style when requested', () => {
		render(<PrimaryLoadingButton buttonText="Inverse" loading={false} active inverted />);
		expect(screen.getByRole('button', { name: 'Inverse' }).className).toMatch(/primaryButtonInverse/);
	});
});

it('keeps compact icon actions accessible and forwards the ref and tooltip events', async () => {
	const ref = createRef<HTMLButtonElement>();
	render(
		<Tooltip title="Retirer cet article" describeChild>
			<PrimaryLoadingButton
				ref={ref}
				buttonText="Supprimer"
				iconOnly
				size="small"
				loading={false}
				active
				startIcon={<span aria-hidden>×</span>}
			/>
		</Tooltip>,
	);
	const button = screen.getByRole('button', { name: 'Supprimer' });
	expect(ref.current).toBe(button);
	fireEvent.mouseOver(button);
	expect(await screen.findByRole('tooltip')).toHaveTextContent('Retirer cet article');
});

it('does not submit the parent form for a compact action and blocks clicks while loading', () => {
	const submit = jest.fn((event) => event.preventDefault());
	const click = jest.fn();
	const { rerender } = render(
		<form onSubmit={submit}>
			<PrimaryLoadingButton buttonText="Ajouter un article" size="small" loading={false} active onClick={click} />
		</form>,
	);
	fireEvent.click(screen.getByRole('button', { name: 'Ajouter un article' }));
	expect(click).toHaveBeenCalledTimes(1);
	expect(submit).not.toHaveBeenCalled();
	rerender(
		<form onSubmit={submit}>
			<PrimaryLoadingButton buttonText="Ajouter un article" size="small" loading active onClick={click} />
		</form>,
	);
	fireEvent.click(screen.getByRole('button', { name: 'Ajouter un article' }));
	expect(click).toHaveBeenCalledTimes(1);
	expect(screen.getByRole('progressbar')).toBeInTheDocument();
});
