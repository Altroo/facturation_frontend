'use client';

import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Dispatch, SetStateAction } from 'react';
import { rememberListPagination, type ListScope } from '@/utils/listReturn';
import type { GridPaginationModel, GridSortModel } from '@mui/x-data-grid';
import { dataGridPageSizes } from '@/utils/rawData';

const DATA_GRID_PAGE_PARAM = 'page';
const DATA_GRID_PAGE_SIZE_PARAM = 'page_size';

export const parseDataGridPagination = (search: string, defaultPageSize = 10): GridPaginationModel => {
	const searchParams = new URLSearchParams(search);
	const parsedPage = Number.parseInt(searchParams.get(DATA_GRID_PAGE_PARAM) ?? '', 10);
	const parsedPageSize = Number.parseInt(searchParams.get(DATA_GRID_PAGE_SIZE_PARAM) ?? '', 10);

	return {
		page: Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage - 1 : 0,
		pageSize: dataGridPageSizes.has(parsedPageSize) ? parsedPageSize : defaultPageSize,
	};
};

export type DataGridSorting = {
	ordering: string;
	sortModel: GridSortModel;
	onSortModelChange: (model: GridSortModel) => void;
};

export const parseDataGridOrdering = (search: string, gridKey = '') => {
	const value = new URLSearchParams(search).get(gridKey ? `${gridKey}_ordering` : 'ordering') ?? '';
	return /^-?[a-zA-Z_][a-zA-Z0-9_]*$/.test(value) ? value : '';
};

export const useDataGridPagination = (
	defaultPageSize = 10,
	scope: ListScope = {},
): [GridPaginationModel, Dispatch<SetStateAction<GridPaginationModel>>, DataGridSorting] => {
	const search = useSearchParams()?.toString() ?? '';
	const paginationModel = parseDataGridPagination(search, defaultPageSize);
	const companyId = scope.company_id;
	const storeId = scope.store_id;
	useEffect(() => {
		rememberListPagination(window.location.href, { company_id: companyId, store_id: storeId });
	}, [search, companyId, storeId]);

	const setPaginationModel: Dispatch<SetStateAction<GridPaginationModel>> = (value) => {
		const currentPaginationModel = parseDataGridPagination(window.location.search, defaultPageSize);
		const nextPaginationModel = typeof value === 'function' ? value(currentPaginationModel) : value;

		if (
			nextPaginationModel.page === currentPaginationModel.page &&
			nextPaginationModel.pageSize === currentPaginationModel.pageSize
		) {
			return;
		}

		const url = new URL(window.location.href);
		url.searchParams.set(DATA_GRID_PAGE_PARAM, String(nextPaginationModel.page + 1));
		url.searchParams.set(DATA_GRID_PAGE_SIZE_PARAM, String(nextPaginationModel.pageSize));
		window.history.replaceState(null, '', url);
	};

	const ordering = parseDataGridOrdering(search);
	// MUI emits a sort-change event when this array's identity changes. Keep it
	// stable across page/filter updates so it does not reset pagination again.
	const sortModel = useMemo<GridSortModel>(
		() => (ordering ? [{ field: ordering.replace(/^-/, ''), sort: ordering.startsWith('-') ? 'desc' : 'asc' }] : []),
		[ordering],
	);
	const onSortModelChange = (model: GridSortModel) => {
		const item = model[0];
		const nextOrdering = item?.sort ? `${item.sort === 'desc' ? '-' : ''}${item.field}` : '';
		const url = new URL(window.location.href);
		if (nextOrdering === parseDataGridOrdering(url.search)) return;
		if (nextOrdering) url.searchParams.set('ordering', nextOrdering);
		else url.searchParams.delete('ordering');
		url.searchParams.set('page', '1');
		window.history.replaceState(null, '', url);
	};
	return [paginationModel, setPaginationModel, { ordering, sortModel, onSortModelChange }];
};
