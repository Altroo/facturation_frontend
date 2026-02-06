import { articleApi } from '@/store/services/article';
import { setupApiStore } from '@/store/setupApiStore';

beforeAll(() => {
	process.env.NEXT_PUBLIC_ARTICLE_LIST ||= 'https://example.com/articles/';
	process.env.NEXT_PUBLIC_ARTICLE_ROOT ||= 'https://example.com/article';
	process.env.NEXT_PUBLIC_ARCHIVE_ARTICLE ||= 'https://example.com/article/archive/';
	process.env.NEXT_PUBLIC_ARTICLE_GENERATE_CODE_REFERENCE ||= 'https://example.com/article/code';
});

// Mock axiosBaseQuery so all endpoints succeed
jest.mock('@/utils/axiosBaseQuery', () => ({
	//eslint-disable-next-line @typescript-eslint/no-unused-vars
	axiosBaseQuery: () => async (_args: unknown, _api: unknown) => ({ data: { ok: true } }),
}));

describe('articleApi', () => {
	const storeRef = setupApiStore(articleApi);

	it('getArticlesList query with pagination should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			articleApi.endpoints.getArticlesList.initiate({
				company_id: 123,
				with_pagination: true,
				page: 1,
				pageSize: 10,
				search: 'abc',
				archived: false,
			}),
		);
		expect('error' in result).toBe(false);
	});

	it('getArticle query should complete without error', async () => {
		const result = await storeRef.store.dispatch(articleApi.endpoints.getArticle.initiate({ id: 123 }));
		expect('error' in result).toBe(false);
	});

	it('getCodeReference query should complete without error', async () => {
		const result = await storeRef.store.dispatch(articleApi.endpoints.getCodeReference.initiate({ company_id: 123 }));
		expect('error' in result).toBe(false);
	});

	it('deleteArticle mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(articleApi.endpoints.deleteArticle.initiate({ id: 456 }));
		expect('error' in result).toBe(false);
	});

	it('editArticle mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			articleApi.endpoints.editArticle.initiate({
				id: 789,
				data: { designation: 'Updated Article' },
			}),
		);
		expect('error' in result).toBe(false);
	});

	it('addArticle mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			articleApi.endpoints.addArticle.initiate({
				data: { designation: 'New Article' },
			}),
		);
		expect('error' in result).toBe(false);
	});

	it('patchArchive mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			articleApi.endpoints.patchArchive.initiate({
				id: 321,
				data: { archived: true },
			}),
		);
		expect('error' in result).toBe(false);
	});
});
