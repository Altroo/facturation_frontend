import { notificationApi } from '@/store/services/notification';
import { setupApiStore } from '@/store/setupApiStore';

beforeAll(() => {
	process.env.NEXT_PUBLIC_FACTURATION_NOTIFICATIONS ||= '/notification/';
	process.env.NEXT_PUBLIC_FACTURATION_NOTIFICATION_PREFERENCES ||= '/notification/preferences/';
	process.env.NEXT_PUBLIC_FACTURATION_NOTIFICATION_MARK_READ ||= '/notification/mark-read/';
	process.env.NEXT_PUBLIC_FACTURATION_NOTIFICATION_UNREAD_COUNT ||= '/notification/unread-count/';
});

jest.mock('@/utils/axiosBaseQuery', () => ({
	axiosBaseQuery: () => async () => ({ data: { ok: true } }),
}));

describe('notificationApi endpoints', () => {
	const storeRef = setupApiStore(notificationApi);
	const endpointCalls: Array<[string, () => Promise<unknown>]> = [
		[
			'getNotifications',
			async () => storeRef.store.dispatch(notificationApi.endpoints.getNotifications.initiate({ page: 2 })).unwrap(),
		],
		[
			'getNotificationPreferences',
			async () => storeRef.store.dispatch(notificationApi.endpoints.getNotificationPreferences.initiate()).unwrap(),
		],
		[
			'updateNotificationPreferences',
			async () =>
				storeRef.store.dispatch(notificationApi.endpoints.updateNotificationPreferences.initiate({})).unwrap(),
		],
		[
			'markNotificationsRead',
			async () =>
				storeRef.store.dispatch(notificationApi.endpoints.markNotificationsRead.initiate({ ids: [1, 2] })).unwrap(),
		],
		[
			'getUnreadNotificationCount',
			async () => storeRef.store.dispatch(notificationApi.endpoints.getUnreadNotificationCount.initiate()).unwrap(),
		],
	];

	it.each(endpointCalls)('%s completes without an API error', async (_name, callEndpoint) => {
		await expect(callEndpoint()).resolves.toEqual(expect.objectContaining({ ok: true }));
	});

	it('exposes every tested endpoint', () => {
		expect(Object.keys(notificationApi.endpoints)).toHaveLength(endpointCalls.length);
	});
});
