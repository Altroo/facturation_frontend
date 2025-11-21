import { render, screen, fireEvent } from '@testing-library/react';
import PrimaryButton from './primaryButton';
import '@testing-library/jest-dom';

describe('PrimaryButton', () => {
	const mockClick = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('renders button with correct text', () => {
		render(<PrimaryButton buttonText="Submit" active={true} />);
		expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
	});

	it('renders as disabled when active is false', () => {
		render(<PrimaryButton buttonText="Submit" active={false} />);
		expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
	});

	it('calls onClick when button is clicked and active is true', () => {
		render(<PrimaryButton buttonText="Submit" active={true} onClick={mockClick} />);
		fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
		expect(mockClick).toHaveBeenCalled();
	});

	it('does not call onClick when button is disabled', () => {
		render(<PrimaryButton buttonText="Submit" active={false} onClick={mockClick} />);
		fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
		expect(mockClick).not.toHaveBeenCalled();
	});

	it('applies custom class when cssClass is provided', () => {
		render(<PrimaryButton buttonText="Submit" active={true} cssClass="custom-class" />);
		const button = screen.getByRole('button', { name: 'Submit' });
		expect(button.className).toMatch(/custom-class/);
	});
});
