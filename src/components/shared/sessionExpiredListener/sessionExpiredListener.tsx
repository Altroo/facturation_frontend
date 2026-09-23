'use client';

import { useContext, useEffect, useEffectEvent, type FC } from 'react';
import { ToastContext } from '@/contexts/toastContext';
import { useLanguage } from '@/utils/hooks';

/**
 * Listens for the global 'session-expired' event and displays
 * a toast notification when the session expires.
 * Must be mounted inside ToastContextProvider.
 */
const SessionExpiredListener: FC = () => {
	const { t } = useLanguage();
	const toast = useContext(ToastContext);
	const onSessionExpired = useEffectEvent(() => {
		toast?.onError(t.shared.sessionExpired);
	});

	useEffect(() => {
		const handler = () => {
			onSessionExpired();
		};
		window.addEventListener('session-expired', handler);
		return () => window.removeEventListener('session-expired', handler);
	}, []);

	return null;
};

export default SessionExpiredListener;
