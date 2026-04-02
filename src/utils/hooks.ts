'use client';
import { useContext, useSyncExternalStore } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from '@/store/store';
import { getProfilState } from '@/store/selectors';
import type { ToastContextType } from '@/contexts/toastContext';
import { ToastContext } from '@/contexts/toastContext';
import type { LanguageContextType } from '@/contexts/languageContext';
import { LanguageContext } from '@/contexts/languageContext';

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const usePermission = () => {
	const { is_staff } = useAppSelector(getProfilState);
	return { is_staff };
};

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

export const useLanguage = (): LanguageContextType => {
	return useContext(LanguageContext);
};
