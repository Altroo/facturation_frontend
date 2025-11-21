import React from 'react';
import { render, screen } from '@testing-library/react';
import { Desktop, TabletAndMobile } from './clientHelpers';
import { useMediaQuery } from 'react-responsive';
import { useComponentHydrated } from 'react-hydration-provider';

// Mock react-responsive
jest.mock('react-responsive', () => ({
	useMediaQuery: jest.fn(),
}));

// Mock react-hydration-provider
jest.mock('react-hydration-provider', () => ({
	useComponentHydrated: jest.fn(),
}));

describe('MediaQueryComponents', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	test('renders Desktop children when hydrated and media query matches', () => {
		(useComponentHydrated as jest.Mock).mockReturnValue(true);
		(useMediaQuery as jest.Mock).mockReturnValue(true);

		render(
			<Desktop>
				<div>Desktop Content</div>
			</Desktop>,
		);
		expect(screen.getByText('Desktop Content')).toBeInTheDocument();
	});

	test('does not render Desktop children when media query does not match', () => {
		(useComponentHydrated as jest.Mock).mockReturnValue(true);
		(useMediaQuery as jest.Mock).mockReturnValue(false);

		render(
			<Desktop>
				<div>Desktop Content</div>
			</Desktop>,
		);
		expect(screen.queryByText('Desktop Content')).toBeNull();
	});

	test('renders TabletAndMobile children when hydrated and media query matches', () => {
		(useComponentHydrated as jest.Mock).mockReturnValue(true);
		(useMediaQuery as jest.Mock).mockReturnValue(true);

		render(
			<TabletAndMobile>
				<div>Mobile Content</div>
			</TabletAndMobile>,
		);
		expect(screen.getByText('Mobile Content')).toBeInTheDocument();
	});

	test('does not render TabletAndMobile children when media query does not match', () => {
		(useComponentHydrated as jest.Mock).mockReturnValue(true);
		(useMediaQuery as jest.Mock).mockReturnValue(false);

		render(
			<TabletAndMobile>
				<div>Mobile Content</div>
			</TabletAndMobile>,
		);
		expect(screen.queryByText('Mobile Content')).toBeNull();
	});

	test('uses fallback deviceWidth when not hydrated', () => {
		(useComponentHydrated as jest.Mock).mockReturnValue(false);
		(useMediaQuery as jest.Mock).mockImplementation((_, fallback) => {
			return fallback?.deviceWidth === 992; // Simulate Desktop match
		});

		render(
			<Desktop>
				<div>Desktop Fallback</div>
			</Desktop>,
		);
		expect(screen.getByText('Desktop Fallback')).toBeInTheDocument();
	});
});
