import type { ReactNode } from 'react';
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
		const { createContext } = require('react');
		return {
			__esModule: true,
			ToastContext: createContext(mockToastCtx),
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
	const { createElement, Fragment } = require('react');
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const { render, screen } = require('@testing-library/react');
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const { useToast } = require('./hooks');
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const { ToastContext } = require('@/contexts/toastContext');

	function TestComponent() {
		const ctx = useToast();
		return createElement(
			Fragment,
			null,
			createElement('div', { 'data-testid': 'has-show' }, typeof ctx.showToast),
			createElement('div', { 'data-testid': 'has-hide' }, typeof ctx.hideToast),
		);
	}

	it('returns the mocked toast context value', () => {
		render(createElement(ToastContext.Provider, { value: mockToastCtx }, createElement(TestComponent)));

		expect(screen.getByTestId('has-show').textContent).toBe('function');
		expect(screen.getByTestId('has-hide').textContent).toBe('function');
	});
});

describe('usePermission', () => {
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const { renderHook } = require('@testing-library/react');

	it('returns is_staff from profil state', () => {
		jest.doMock('@/store/selectors', () => ({
			getProfilState: () => ({ is_staff: true }),
		}));
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const { usePermission } = require('./hooks');
		const { result } = renderHook(() => usePermission());
		expect(result.current.is_staff).toBe(true);
		jest.dontMock('@/store/selectors');
	});
});

describe('useIsClient', () => {
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const { renderHook } = require('@testing-library/react');
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const { useIsClient } = require('./hooks');

	it('returns true on client side', () => {
		const { result } = renderHook(() => useIsClient());
		expect(result.current).toBe(true);
	});
});

describe('useLanguage', () => {
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const { createElement } = require('react');
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const { renderHook } = require('@testing-library/react');
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const { useLanguage } = require('./hooks');
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const { LanguageContext } = require('@/contexts/languageContext');
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const { translations } = require('@/translations');

	it('returns the language context value', () => {
		const mockCtx = {
			language: 'en',
			setLanguage: jest.fn(),
			t: translations.en,
		};
		const wrapper = ({ children }: { children: ReactNode }) =>
			createElement(LanguageContext.Provider, { value: mockCtx }, children);

		const { result } = renderHook(() => useLanguage(), { wrapper });
		expect(result.current.language).toBe('en');
		expect(result.current.t).toEqual(translations.en);
	});
});
