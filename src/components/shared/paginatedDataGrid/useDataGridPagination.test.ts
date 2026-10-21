// Model Next's canonical query independently of the browser history commit.
let mockCanonicalSearch: string | null = null;
jest.mock('next/navigation', () => ({
	useSearchParams: () => {
		const React = jest.requireActual<typeof import('react')>('react');
		const search = React.useSyncExternalStore(
			(listener) => {
				window.addEventListener('popstate', listener);
				window.addEventListener('test-next-query', listener);
				return () => {
					window.removeEventListener('popstate', listener);
					window.removeEventListener('test-next-query', listener);
				};
			},
			() => mockCanonicalSearch ?? window.location.search,
			() => '',
		);
		return new URLSearchParams(search);
	},
}));
const replaceState = window.history.replaceState.bind(window.history);
beforeAll(() =>
	jest.spyOn(window.history, 'replaceState').mockImplementation((...args) => {
		replaceState(...args);
		window.dispatchEvent(new Event('test-next-query'));
	}),
);
afterAll(() => jest.restoreAllMocks());
afterEach(() => {
	mockCanonicalSearch = null;
});

import { listReturnUrl } from '@/utils/helpers';
import { act, renderHook } from '@testing-library/react';
import type { GridPaginationModel } from '@mui/x-data-grid';
import { parseDataGridPagination, useDataGridPagination } from './useDataGridPagination';

describe('useDataGridPagination', () => {
	it('parses one-based page and supported page size values from the URL', () => {
		expect(parseDataGridPagination('?page=3&page_size=50')).toEqual({ page: 2, pageSize: 50 });
		expect(parseDataGridPagination('?page=0&page_size=12')).toEqual({ page: 0, pageSize: 10 });
	});

	it('updates the URL while preserving its other parameters and hash', () => {
		window.history.replaceState({}, '', '/dashboard/devis?company_id=7&page=3&page_size=50#documents');

		const { result } = renderHook(() => useDataGridPagination());
		expect(result.current[0]).toEqual({ page: 2, pageSize: 50 });

		act(() => {
			result.current[1]((current: GridPaginationModel) => ({ ...current, page: 4, pageSize: 25 }));
		});

		expect(result.current[0]).toEqual({ page: 4, pageSize: 25 });
		expect(window.location.pathname).toBe('/dashboard/devis');
		expect(window.location.search).toBe('?company_id=7&page=5&page_size=25');
		expect(window.location.hash).toBe('#documents');
	});

	it('restores pagination when browser history changes', () => {
		window.history.replaceState({}, '', '/dashboard/articles');
		const { result } = renderHook(() => useDataGridPagination());

		act(() => {
			window.history.pushState({}, '', '/dashboard/articles?page=6&page_size=100');
			window.dispatchEvent(new PopStateEvent('popstate'));
		});

		expect(result.current[0]).toEqual({ page: 5, pageSize: 100 });
	});
});

describe('server ordering', () => {
	it('toggles ascending/descending and resets only the page, preserving filters and size', () => {
		window.history.replaceState({}, '', '/dashboard/clients?company_id=7&page=4&page_size=25&archived=false#grid');
		const { result } = renderHook(() => useDataGridPagination());
		act(() => result.current[2].onSortModelChange([{ field: 'raison_sociale', sort: 'asc' }]));
		expect(result.current[0]).toEqual({ page: 0, pageSize: 25 });
		expect(result.current[2].ordering).toBe('raison_sociale');
		act(() => result.current[1]({ page: 1, pageSize: 25 }));
		expect(result.current[2].sortModel).toEqual([{ field: 'raison_sociale', sort: 'asc' }]);
		act(() => result.current[2].onSortModelChange([{ field: 'raison_sociale', sort: 'desc' }]));
		expect(result.current[2].ordering).toBe('-raison_sociale');
		expect(result.current[0].page).toBe(0);
		expect(window.location.search).toContain('archived=false');
		expect(window.location.hash).toBe('#grid');
		act(() => result.current[2].onSortModelChange([]));
		expect(result.current[2].ordering).toBe('');
	});
});

it('preserves the sort model identity when only the page changes', () => {
	window.history.replaceState({}, '', '/dashboard/list?ordering=name');
	const { result } = renderHook(() => useDataGridPagination());
	const sortModel = result.current[2].sortModel;
	act(() => result.current[1]({ page: 2, pageSize: 10 }));
	expect(result.current[2].sortModel).toBe(sortModel);
});

it('records list pagination for an explicit return after unmount, without restoring fresh navigation', () => {
	window.sessionStorage.clear();
	window.history.replaceState({}, '', '/dashboard/users?page=3&page_size=10');
	const first = renderHook(() => useDataGridPagination());
	first.unmount();
	window.history.replaceState({}, '', '/dashboard/users/42');
	expect(listReturnUrl('/dashboard/users')).toBe('/dashboard/users?page=3&page_size=10');
	window.history.replaceState({}, '', '/dashboard/users');
	const fresh = renderHook(() => useDataGridPagination());
	expect(fresh.result.current[0].page).toBe(0);
	expect(listReturnUrl('/dashboard/users')).toBe('/dashboard/users');
});

it('reads the destination query before Next commits browser history', () => {
	window.history.replaceState({}, '', '/dashboard/items/42');
	mockCanonicalSearch = '?page=3&page_size=25&ordering=-name';
	const { result } = renderHook(() => useDataGridPagination());
	expect(result.current[0]).toEqual({ page: 2, pageSize: 25 });
	expect(result.current[2].ordering).toBe('-name');
	expect(window.location.pathname).toBe('/dashboard/items/42');
});

it('does not pass Next internal history markers when changing pagination', () => {
	window.history.replaceState({ __NA: true }, '', '/dashboard/items?page=3&page_size=25');
	const { result } = renderHook(() => useDataGridPagination());
	act(() => result.current[1]({ page: 3, pageSize: 25 }));
	expect(window.history.replaceState).toHaveBeenLastCalledWith(null, '', expect.any(URL));
	expect(result.current[0]).toEqual({ page: 3, pageSize: 25 });
});
