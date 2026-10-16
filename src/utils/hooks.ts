'use client';

import { useContext, useSyncExternalStore } from 'react';
import type { TypedUseSelectorHook } from 'react-redux';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/store/store';
import { getProfilState } from '@/store/selectors';
import type { ToastContextType } from '@/types/uiTypes';
import { ToastContext } from '@/contexts/toastContext';
import type { LanguageContextType } from '@/types/languageTypes';
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

const fallbackToast: ToastContextType = {
	onSuccess: (message) => {
		if (typeof window !== 'undefined') window.alert(message);
	},
	onError: (message) => {
		if (typeof window !== 'undefined') window.alert(message);
	},
};

export const useToast = (): ToastContextType => {
	const ctx = useContext(ToastContext);
	// The root layout supplies styled toasts. Keep feedback visible if a consumer
	// is accidentally mounted outside that provider, without crashing the page.
	return ctx ?? fallbackToast;
};

export const useLanguage = (): LanguageContextType => {
	return useContext(LanguageContext);
};
