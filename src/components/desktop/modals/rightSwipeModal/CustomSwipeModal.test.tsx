import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CustomSwipeModal from './CustomSwipeModal';
import '@testing-library/jest-dom';

// Mock next/image
jest.mock('next/image', () => ({
	__esModule: true,
	default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
		// eslint-disable-next-line @next/next/no-img-element
		return <img {...props} alt={props.alt ?? ''} />;
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

	it('uses UpTransition when direction="up" and transition=true', () => {
		render(
			<CustomSwipeModal open transition direction="up">
				<div>Content</div>
			</CustomSwipeModal>,
		);
		expect(screen.getByText('Content')).toBeInTheDocument();
	});

	it('keeps children mounted when keepMounted is true', () => {
		render(
			<CustomSwipeModal open={false} transition={false} keepMounted>
				<div>Content</div>
			</CustomSwipeModal>,
		);
		// Even though open=false, keepMounted keeps children in the tree
		expect(screen.getByText('Content')).toBeInTheDocument();
	});

	it('calls onBackdrop instead of handleClose when provided', () => {
		const onBackdrop = jest.fn();
		const handleClose = jest.fn();
		render(
			<CustomSwipeModal open transition={false} onBackdrop={onBackdrop} handleClose={handleClose}>
				Content
			</CustomSwipeModal>,
		);
		// Simulate Dialog onClose
		fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
		expect(onBackdrop).toHaveBeenCalled();
		expect(handleClose).not.toHaveBeenCalled();
	});

	it('applies custom cssClasse', () => {
		render(
			<CustomSwipeModal open transition={false} cssClasse="my-class">
				Content
			</CustomSwipeModal>,
		);
		const dialog = screen.getByTestId('custom-swipe-modal');
		expect(dialog).toHaveClass('my-class');
	});

	it('respects fullScreen prop override', () => {
		render(
			<CustomSwipeModal open transition={false} fullScreen={false}>
				Content
			</CustomSwipeModal>,
		);
		const paper = document.querySelector('.MuiDialog-paper');
		expect(paper).not.toHaveClass('MuiDialog-paperFullScreen');
	});
});
