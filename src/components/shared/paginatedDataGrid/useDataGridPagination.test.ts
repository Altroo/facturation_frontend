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
