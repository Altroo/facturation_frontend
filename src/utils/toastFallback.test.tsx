import { act, renderHook } from '@testing-library/react';
import { ToastContext } from '@/contexts/toastContext';
import { useToast } from './hooks';

it('keeps feedback visible without crashing when the toast provider is missing', () => {
	const alert = jest.spyOn(window, 'alert').mockImplementation(() => {});
	try {
		const { result } = renderHook(() => useToast());
		act(() => result.current.onError('L’enregistrement a échoué. Réessayez.'));
		expect(alert).toHaveBeenCalledWith('L’enregistrement a échoué. Réessayez.');
		act(() => result.current.onSuccess('Enregistré.'));
		expect(alert).toHaveBeenLastCalledWith('Enregistré.');
	} finally {
		alert.mockRestore();
	}
});
it('uses the existing toast provider for normal application feedback', () => {
	const toast = { onError: jest.fn(), onSuccess: jest.fn() };
	const { result } = renderHook(() => useToast(), {
		wrapper: ({ children }) => <ToastContext.Provider value={toast}>{children}</ToastContext.Provider>,
	});
	act(() => result.current.onError('Erreur expliquée'));
	expect(toast.onError).toHaveBeenCalledWith('Erreur expliquée');
});
