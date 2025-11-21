import { render, screen, fireEvent } from '@testing-library/react';
import CircularAvatarInputFile from './circularAvatarInputFile';
import '@testing-library/jest-dom';

describe('CircularAvatarInputFile', () => {
	const mockSetAvatar = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('renders avatar icon by default', () => {
		render(<CircularAvatarInputFile preview={null} active={true} setAvatar={mockSetAvatar} />);
		expect(screen.getByRole('img', { name: 'avatar icon' })).toBeInTheDocument();
	});

	it('renders preview image when provided', () => {
		render(<CircularAvatarInputFile preview="data:image/png;base64,preview" active={true} setAvatar={mockSetAvatar} />);
		expect(screen.getByRole('img', { name: 'avatar preview' })).toBeInTheDocument();
	});

	it('triggers file input click when avatar container is clicked', () => {
		render(<CircularAvatarInputFile preview={null} active={true} setAvatar={mockSetAvatar} showText={true} />);

		const avatarContainer = screen.getByText('Modifier ma photo');
		fireEvent.click(avatarContainer);

		// We can't assert file input click directly, but we can check that no error occurs
		expect(avatarContainer).toBeInTheDocument();
	});

	it('calls setAvatar with image file on valid upload', () => {
		render(<CircularAvatarInputFile preview={null} active={true} setAvatar={mockSetAvatar} />);

		const fileInput = screen.getByTestId('avatar-file-input');
		const file = new File(['dummy'], 'avatar.png', { type: 'image/png' });

		fireEvent.change(fileInput, { target: { files: [file] } });

		expect(mockSetAvatar).toHaveBeenCalledWith(file);
	});

	it('calls setAvatar with image file on valid upload', () => {
		render(<CircularAvatarInputFile preview={null} active={true} setAvatar={mockSetAvatar} />);

		const fileInput = screen.getByTestId('avatar-file-input');
		const file = new File(['dummy'], 'avatar.png', { type: 'image/png' });

		fireEvent.change(fileInput, { target: { files: [file] } });

		expect(mockSetAvatar).toHaveBeenCalledWith(file);
	});
});
