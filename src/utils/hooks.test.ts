import { jest } from '@jest/globals';

type MockState = { value: number };
type MockToastCtx = {
	showToast: jest.Mock;
	hideToast: jest.Mock;
};

const mockDispatch = jest.fn();
const mockUseDispatch = () => mockDispatch;
const mockSelector = <TSelected>(selector: (state: MockState) => TSelected): TSelected => selector({ value: 42 });

let mockToastCtx: MockToastCtx;

beforeEach(() => {
	jest.clearAllMocks();
	jest.resetModules();

	mockToastCtx = { showToast: jest.fn(), hideToast: jest.fn() };

	jest.doMock('react-redux', () => {
		const real = jest.requireActual('react-redux') as unknown as Record<string, unknown>;
		return {
			...real,
			useDispatch: mockUseDispatch,
			useSelector: mockSelector,
		};
	});

	jest.doMock('@/contexts/toastContext', () => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const React = require('react');
		return {
			__esModule: true,
			ToastContext: React.createContext(mockToastCtx),
		};
	});
});

afterEach(() => {
	jest.dontMock('react-redux');
	jest.dontMock('@/contexts/toastContext');
});

describe('useAppDispatch / useAppSelector', () => {
	it('useAppDispatch returns react-redux dispatch', () => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const { useAppDispatch } = require('./hooks');
		const dispatch = useAppDispatch();
		expect(dispatch).toBe(mockDispatch);
		dispatch('ACTION');
		expect(mockDispatch).toHaveBeenCalledWith('ACTION');
	});

	it('useAppSelector proxies to react-redux useSelector', () => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const { useAppSelector } = require('./hooks');
		const result = useAppSelector((state: MockState) => state.value);
		expect(result).toBe(42);
	});
});

describe('useToast', () => {
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const React = require('react');
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const { render, screen } = require('@testing-library/react');
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const { useToast } = require('./hooks');
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const { ToastContext } = require('@/contexts/toastContext');

	function TestComponent() {
		const ctx = useToast();
		return React.createElement(
			React.Fragment,
			null,
			React.createElement('div', { 'data-testid': 'has-show' }, typeof ctx.showToast),
			React.createElement('div', { 'data-testid': 'has-hide' }, typeof ctx.hideToast),
		);
	}

	it('returns the mocked toast context value', () => {
		render(React.createElement(ToastContext.Provider, { value: mockToastCtx }, React.createElement(TestComponent)));

		expect(screen.getByTestId('has-show').textContent).toBe('function');
		expect(screen.getByTestId('has-hide').textContent).toBe('function');
	});
});
