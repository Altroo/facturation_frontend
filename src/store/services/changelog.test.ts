import { configureStore } from '@reduxjs/toolkit';
import { axiosBaseQuery } from '@/utils/axiosBaseQuery';
import { changelogApi } from './changelog';

jest.mock('@/utils/axiosBaseQuery', () => {
	const query = jest.fn(async () => ({ data: [] }));
	return { axiosBaseQuery: jest.fn(() => query) };
});
jest.mock('@/utils/helpers', () => ({ isAuthenticatedInstance: jest.fn() }));

it('requests web releases so mobile-only announcements stay out of the web changelog', async () => {
	jest.useFakeTimers();
	const store = configureStore({
		reducer: { [changelogApi.reducerPath]: changelogApi.reducer },
		middleware: (get) => get().concat(changelogApi.middleware),
	});
	try {
		const request = store.dispatch(changelogApi.endpoints.getChangelog.initiate());
		await request.unwrap();
		const query = jest.mocked(axiosBaseQuery).mock.results[0].value;
		expect(query).toHaveBeenCalledWith(
			{ url: '/ws/changelog/', method: 'GET', params: { platform: 'web' } },
			expect.anything(),
			undefined,
		);
		request.unsubscribe();
	} finally {
		store.dispatch(changelogApi.util.resetApiState());
		await jest.runOnlyPendingTimersAsync();
		jest.useRealTimers();
	}
});
