import { render, screen, fireEvent } from '@testing-library/react';
import SquareImageInputFile from './squareImageInputFile';
import '@testing-library/jest-dom';

describe('SquareImageInputFile', () => {
	const mockUpload = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('renders button with label text', () => {
		render(<SquareImageInputFile onImageUpload={mockUpload} />);
		expect(screen.getByText('Ajouter une image')).toBeInTheDocument();
	});

	it('calls onImageUpload when button is clicked', () => {
		render(<SquareImageInputFile onImageUpload={mockUpload} />);
		fireEvent.click(screen.getByRole('button'));
		expect(mockUpload).toHaveBeenCalled();
	});
});
