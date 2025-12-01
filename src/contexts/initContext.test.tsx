import React from 'react';
import { render, screen } from '@testing-library/react';
import { InitContextProvider } from './InitContext';
import { useAppSelector } from '@/utils/hooks';
import { getInitStateToken } from '@/store/selectors';

jest.mock('@/utils/hooks');
jest.mock('@/store/selectors');

describe('InitContextProvider', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		(useAppSelector as jest.Mock).mockImplementation((selector) => {
			if (selector === getInitStateToken) return 'mock-token';
			return undefined;
		});
	});

	it('renders children while session is loading', () => {
		render(
			<InitContextProvider>
				<div data-testid="child">Child</div>
			</InitContextProvider>,
		);
		expect(screen.getByTestId('child')).toBeInTheDocument();
	});

	it('renders children when session is unauthenticated', () => {
		render(
			<InitContextProvider>
				<div data-testid="child">Child</div>
			</InitContextProvider>,
		);
		expect(screen.getByTestId('child')).toBeInTheDocument();
	});

	it('provides initStateToken from selector', () => {
		render(
			<InitContextProvider>
				<div data-testid="child">Child</div>
			</InitContextProvider>,
		);
		expect(useAppSelector).toHaveBeenCalledWith(getInitStateToken);
	});
});
