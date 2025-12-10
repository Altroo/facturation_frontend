import { useContext, useSyncExternalStore } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from '@/store/store';

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

import { getProfilState } from '@/store/selectors';
import { ToastContext, ToastContextType } from '@/contexts/toastContext';

export const usePermission = () => {
	const { is_staff } = useAppSelector(getProfilState);
	return { is_staff };
};

/**
 * Hook to check if code is running on client
 * Uses useSyncExternalStore to avoid hydration mismatches
 */
export const useIsClient = () => {
	return useSyncExternalStore(
		() => () => {},
		() => true,
		() => false,
	);
};

export const useToast = (): ToastContextType => {
	const ctx = useContext(ToastContext);
	if (!ctx) throw new Error('useToast must be used within ToastProvider');
	return ctx;
};
