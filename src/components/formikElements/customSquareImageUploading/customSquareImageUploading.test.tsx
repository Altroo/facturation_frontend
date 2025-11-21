import { render, screen, fireEvent } from '@testing-library/react';
import CustomSquareImageUploading from './customSquareImageUploading';
import '@testing-library/jest-dom';

describe('CustomSquareImageUploading (no mocks)', () => {
	const mockOnChange = jest.fn();
	const mockOnCrop = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('renders upload button when no image is provided', () => {
		render(<CustomSquareImageUploading image={null} onChange={mockOnChange} onCrop={mockOnCrop} />);

		const button = screen.getByRole('button');
		expect(button).toBeInTheDocument();
	});

	it('renders cropper when image is provided and no croppedImage', () => {
		render(
			<CustomSquareImageUploading image="data:image/png;base64,test" onChange={mockOnChange} onCrop={mockOnCrop} />,
		);

		const cropper = screen.getByRole('presentation'); // Cropper renders a canvas inside a div
		expect(cropper).toBeInTheDocument();
	});

	it('renders cropped image preview when not editing', () => {
		render(
			<CustomSquareImageUploading
				image="data:image/png;base64:original"
				croppedImage="data:image/png;base64:cropped"
				onChange={mockOnChange}
				onCrop={mockOnCrop}
			/>,
		);

		const preview = screen.getByAltText('Cropped preview');
		expect(preview).toBeInTheDocument();
	});

	it('calls onChange and onCrop when clear button is clicked', () => {
		render(
			<CustomSquareImageUploading image="data:image/png;base64,test" onChange={mockOnChange} onCrop={mockOnCrop} />,
		);

		const clearButton = screen.getByTestId('clear-button');
		fireEvent.click(clearButton);

		expect(mockOnChange).toHaveBeenCalledWith(null);
		expect(mockOnCrop).toHaveBeenCalledWith(null);
	});

	it('enters editing mode when cropped image is clicked', () => {
		render(
			<CustomSquareImageUploading
				image="data:image/png;base64:original"
				croppedImage="data:image/png;base64:cropped"
				onChange={mockOnChange}
				onCrop={mockOnCrop}
			/>,
		);

		const preview = screen.getByAltText('Cropped preview');
		fireEvent.click(preview);

		const cropper = screen.getByRole('presentation');
		expect(cropper).toBeInTheDocument();
	});
});
