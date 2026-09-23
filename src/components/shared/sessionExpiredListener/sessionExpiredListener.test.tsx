import { render, cleanup, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ToastContext } from '@/contexts/toastContext';
import { LanguageContext } from '@/contexts/languageContext';
import type { ToastContextType } from '@/types/uiTypes';
import { translations } from '@/translations';
import SessionExpiredListener from './sessionExpiredListener';

afterEach(() => {
	cleanup();
	jest.clearAllMocks();
});

const renderWithToast = (toast: ToastContextType) =>
	render(
		<ToastContext.Provider value={toast}>
			<SessionExpiredListener />
		</ToastContext.Provider>,
	);

describe('SessionExpiredListener', () => {
	it('renders nothing (null)', () => {
		const toast: ToastContextType = { onSuccess: jest.fn(), onError: jest.fn() };
		const { container } = renderWithToast(toast);
		expect(container.innerHTML).toBe('');
	});

	it('calls toast.onError when a session-expired event is dispatched', () => {
		const toast: ToastContextType = { onSuccess: jest.fn(), onError: jest.fn() };
		renderWithToast(toast);

		act(() => {
			window.dispatchEvent(new Event('session-expired'));
		});

		expect(toast.onError).toHaveBeenCalledTimes(1);
		expect(toast.onError).toHaveBeenCalledWith('Votre session a expiré, veuillez vous reconnecter.');
	});

	it('does not call toast.onSuccess on session-expired', () => {
		const toast: ToastContextType = { onSuccess: jest.fn(), onError: jest.fn() };
		renderWithToast(toast);

		act(() => {
			window.dispatchEvent(new Event('session-expired'));
		});

		expect(toast.onSuccess).not.toHaveBeenCalled();
	});

	it('removes the event listener on unmount', () => {
		const toast: ToastContextType = { onSuccess: jest.fn(), onError: jest.fn() };
		const { unmount } = renderWithToast(toast);

		unmount();

		act(() => {
			window.dispatchEvent(new Event('session-expired'));
		});

		expect(toast.onError).not.toHaveBeenCalled();
	});

	it('handles multiple session-expired events', () => {
		const toast: ToastContextType = { onSuccess: jest.fn(), onError: jest.fn() };
		renderWithToast(toast);

		act(() => {
			window.dispatchEvent(new Event('session-expired'));
			window.dispatchEvent(new Event('session-expired'));
			window.dispatchEvent(new Event('session-expired'));
		});

		expect(toast.onError).toHaveBeenCalledTimes(3);
	});

	it('keeps one listener and uses the latest toast and language', () => {
		const addListener = jest.spyOn(window, 'addEventListener');
		const removeListener = jest.spyOn(window, 'removeEventListener');
		const firstToast: ToastContextType = { onSuccess: jest.fn(), onError: jest.fn() };
		const nextToast: ToastContextType = { onSuccess: jest.fn(), onError: jest.fn() };
		const withProviders = (toast: ToastContextType, language: 'fr' | 'en') => (
			<LanguageContext.Provider value={{ language, setLanguage: jest.fn(), t: translations[language] }}>
				<ToastContext.Provider value={toast}>
					<SessionExpiredListener />
				</ToastContext.Provider>
			</LanguageContext.Provider>
		);

		try {
			const { rerender, unmount } = render(withProviders(firstToast, 'fr'));
			rerender(withProviders(nextToast, 'en'));

			act(() => window.dispatchEvent(new Event('session-expired')));
			expect(firstToast.onError).not.toHaveBeenCalled();
			expect(nextToast.onError).toHaveBeenCalledWith(translations.en.shared.sessionExpired);
			expect(addListener.mock.calls.filter(([event]) => event === 'session-expired')).toHaveLength(1);

			unmount();
			expect(removeListener.mock.calls.filter(([event]) => event === 'session-expired')).toHaveLength(1);
		} finally {
			addListener.mockRestore();
			removeListener.mockRestore();
		}
	});

	it('does not crash when toast context is undefined', () => {
		// Render without provider value (undefined context)
		expect(() => {
			render(
				<ToastContext.Provider value={undefined as unknown as ToastContextType}>
					<SessionExpiredListener />
				</ToastContext.Provider>,
			);
			act(() => {
				window.dispatchEvent(new Event('session-expired'));
			});
		}).not.toThrow();
	});
});
