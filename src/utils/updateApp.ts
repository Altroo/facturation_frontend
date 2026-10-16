import { isAppVersion, isNewerAppVersion } from '@/utils/appVersion';

export const APP_UPDATE_PARAM = '_app_update';

type AppUpdateResult = { url: string; error?: never } | { url?: never; error: true };

export const getAppUpdateUrl = async (targetVersion: string, currentUrl: string): Promise<AppUpdateResult> => {
	if (!isAppVersion(targetVersion)) return { error: true };
	try {
		// Do not reload into an old frontend if the backend was published first.
		const response = await fetch(`/api/app-version?check=${Date.now()}`, {
			cache: 'no-store',
			signal: AbortSignal.timeout(10_000),
		});
		if (!response.ok) return { error: true };
		const data: unknown = await response.json();
		if (
			!data ||
			typeof data !== 'object' ||
			!('version' in data) ||
			!isAppVersion(data.version) ||
			isNewerAppVersion(targetVersion, data.version)
		)
			return { error: true };
		const url = new URL(currentUrl);
		url.searchParams.set(APP_UPDATE_PARAM, `${targetVersion}-${Date.now()}`);
		return { url: url.href };
	} catch {
		return { error: true };
	}
};

export const reloadApp = (url: string) => window.location.replace(url);
