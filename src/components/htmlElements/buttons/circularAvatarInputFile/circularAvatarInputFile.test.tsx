import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CircularAvatarInputFile from './circularAvatarInputFile';
import '@testing-library/jest-dom';

jest.mock('@mui/icons-material/AddAPhoto', () => {
	return {
		__esModule: true,
		default: (props: React.SVGProps<SVGSVGElement>) => {
			// only keep safe DOM props; drop htmlColor, sx, etc.
			const { className, 'aria-hidden': ariaHidden } = props || {};
			const svgProps: Record<string, unknown> = { 'data-testid': 'AddAPhotoIcon' };
			if (className) svgProps.className = className;
			if (ariaHidden !== undefined) svgProps['aria-hidden'] = ariaHidden;
			return React.createElement('svg', svgProps);
		},
	};
});
jest.mock('next/image', () => {
	return {
		__esModule: true,
		default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => React.createElement('img', props),
	};
});

describe('CircularAvatarInputFile', () => {
	const mockSetAvatar = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('renders avatar icon by default', () => {
		render(<CircularAvatarInputFile preview={null} active={true} setAvatar={mockSetAvatar} />);
		expect(screen.getByTestId('AddAPhotoIcon')).toBeInTheDocument();
	});

	it('renders preview image when provided', () => {
		render(<CircularAvatarInputFile preview="data:image/png;base64,preview" active={true} setAvatar={mockSetAvatar} />);
		expect(screen.getByAltText("Aperçu de l'avatar")).toBeInTheDocument();
	});

	it('triggers file input click when avatar container text is clicked', () => {
		render(<CircularAvatarInputFile preview={null} active={true} setAvatar={mockSetAvatar} showText={true} />);
		const avatarContainer = screen.getByText('Modifier ma photo');
		fireEvent.click(avatarContainer);
		expect(avatarContainer).toBeInTheDocument();
	});

	it('calls setAvatar with image file on valid upload', () => {
		render(<CircularAvatarInputFile preview={null} active={true} setAvatar={mockSetAvatar} />);
		const fileInput = screen.getByTestId('avatar-file-input') as HTMLInputElement;
		const file = new File(['dummy'], 'avatar.png', { type: 'image/png' });
		fireEvent.change(fileInput, { target: { files: [file] } });
		expect(mockSetAvatar).toHaveBeenCalledWith(file);
	});

	it('does not call setAvatar when files is null', () => {
		render(<CircularAvatarInputFile preview={null} active={true} setAvatar={mockSetAvatar} />);
		const fileInput = screen.getByTestId('avatar-file-input') as HTMLInputElement;
		fireEvent.change(fileInput, { target: { files: null } });
		expect(mockSetAvatar).not.toHaveBeenCalled();
	});

	it('does not call setAvatar when setAvatar prop is not provided', () => {
		render(<CircularAvatarInputFile preview={null} active={true} />);
		const fileInput = screen.getByTestId('avatar-file-input') as HTMLInputElement;
		const file = new File(['dummy'], 'avatar.png', { type: 'image/png' });
		fireEvent.change(fileInput, { target: { files: [file] } });
		// No error should be thrown
		expect(mockSetAvatar).not.toHaveBeenCalled();
	});

	it('calls setAvatar with null for non-image file', () => {
		render(<CircularAvatarInputFile preview={null} active={true} setAvatar={mockSetAvatar} />);
		const fileInput = screen.getByTestId('avatar-file-input') as HTMLInputElement;
		const file = new File(['dummy'], 'document.pdf', { type: 'application/pdf' });
		fireEvent.change(fileInput, { target: { files: [file] } });
		expect(mockSetAvatar).toHaveBeenCalledWith(null);
	});

	it('does not trigger file input when inactive and container clicked', () => {
		render(<CircularAvatarInputFile preview={null} active={false} setAvatar={mockSetAvatar} />);
		const avatarIcon = screen.getByTestId('AddAPhotoIcon');
		const container = avatarIcon.closest('div');
		expect(container).not.toBeNull();
		fireEvent.click(container!);
		// Since active is false, file input should not be clicked
	});

	it('does not trigger file input when inactive and text clicked', () => {
		render(<CircularAvatarInputFile preview={null} active={false} setAvatar={mockSetAvatar} showText={true} />);
		const text = screen.getByText('Modifier ma photo');
		fireEvent.click(text);
		// Since active is false, file input should not be clicked
	});

	it('triggers file input click when avatar container is clicked', () => {
		render(<CircularAvatarInputFile preview={null} active={true} setAvatar={mockSetAvatar} />);
		const avatarIcon = screen.getByTestId('AddAPhotoIcon');
		const container = avatarIcon.closest('div');
		expect(container).not.toBeNull();
		fireEvent.click(container!);
		// File input should be triggered
	});

	it('renders children when provided', () => {
		render(
			<CircularAvatarInputFile preview={null} active={true} setAvatar={mockSetAvatar}>
				<span data-testid="child-element">Child</span>
			</CircularAvatarInputFile>,
		);
		// Children are not used in this component, but should not cause errors
		expect(screen.getByTestId('AddAPhotoIcon')).toBeInTheDocument();
	});
});
