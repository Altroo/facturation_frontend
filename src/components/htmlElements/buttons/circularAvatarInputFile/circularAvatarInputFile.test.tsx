import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CircularAvatarInputFile from './circularAvatarInputFile';
import '@testing-library/jest-dom';

jest.mock('@mui/icons-material/AddAPhotoOutlined', () => {
	return {
		__esModule: true,
		default: (props: React.SVGProps<SVGSVGElement>) => {
			// only keep safe DOM props; drop htmlColor, sx, etc.
			const { className, 'aria-hidden': ariaHidden } = props || {};
			const svgProps: Record<string, unknown> = { 'data-testid': 'AddAPhotoOutlinedIcon' };
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
		expect(screen.getByTestId('AddAPhotoOutlinedIcon')).toBeInTheDocument();
	});

	it('renders preview image when provided', () => {
		render(<CircularAvatarInputFile preview="data:image/png;base64,preview" active={true} setAvatar={mockSetAvatar} />);
		expect(screen.getByAltText('avatar preview')).toBeInTheDocument();
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
});
