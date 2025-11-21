import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CustomSwipeModal from './CustomSwipeModal';

// Mock next/image
jest.mock('next/image', () => ({
	__esModule: true,
	default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
		// eslint-disable-next-line @next/next/no-img-element
		return <img {...props} alt="" />;
	},
}));

// Mock the SVG import
jest.mock('../../../../../public/assets/svgs/navigationIcons/close.svg', () => ({
	__esModule: true,
	default: '/close.svg',
}));

describe('CustomSwipeModal', () => {
	it('renders children when open is true', () => {
		render(
			<CustomSwipeModal open transition={false}>
				<div>Modal Content</div>
			</CustomSwipeModal>,
		);
		expect(screen.getByText('Modal Content')).toBeInTheDocument();
	});

	it('does not render children when open is false', () => {
		render(
			<CustomSwipeModal open={false} transition={false}>
				<div>Modal Content</div>
			</CustomSwipeModal>,
		);
		expect(screen.queryByText('Modal Content')).not.toBeInTheDocument();
	});

	it('renders close icon when showCloseIcon is true', () => {
		render(
			<CustomSwipeModal open transition={false} showCloseIcon handleClose={jest.fn()}>
				Content
			</CustomSwipeModal>,
		);
		const closeIcon = screen.getByAltText('');
		expect(closeIcon).toBeInTheDocument();
	});

	it('calls handleClose when close icon is clicked', () => {
		const handleClose = jest.fn();
		render(
			<CustomSwipeModal open transition={false} showCloseIcon handleClose={handleClose}>
				Content
			</CustomSwipeModal>,
		);
		const closeIcon = screen.getByAltText('');
		fireEvent.click(closeIcon);
		expect(handleClose).toHaveBeenCalledTimes(1);
	});
});
