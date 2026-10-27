import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { useGetArticleQuery, useGetArticlesListQuery } from '@/store/services/article';
import StockArticleSelect from './stock-article-select';

jest.mock('@/store/services/article', () => ({
	useGetArticlesListQuery: jest.fn(),
	useGetArticleQuery: jest.fn(),
}));

const listQuery = jest.mocked(useGetArticlesListQuery);
const detailQuery = jest.mocked(useGetArticleQuery);
const article = (id: number) => ({
	id,
	reference: `REF-${id}`,
	designation: `Article ${id}`,
	emplacement: 2,
	type_article: 'Produit',
});
const firstPage = {
	count: 19,
	next: '/articles/?page=2',
	previous: null,
	results: Array.from({ length: 10 }, (_, i) => article(i + 1)),
};
const lastPage = {
	count: 19,
	next: null,
	previous: '/articles/?page=1',
	results: Array.from({ length: 10 }, (_, i) => article(i + 10)),
};
const searchPage = { count: 1, next: null, previous: null, results: [article(51)] };
const onChange = jest.fn();

const renderPicker = (value: number | null = null) =>
	render(<StockArticleSelect company_id={1} enabled value={value} onChange={onChange} />);
const input = () => screen.getByRole('combobox', { name: 'Article' });
const tick = (ms = 300) =>
	act(() => {
		jest.advanceTimersByTime(ms);
	});
const scrollToBottom = () => {
	const list = screen.getByRole('listbox');
	Object.defineProperties(list, {
		scrollHeight: { configurable: true, value: 500 },
		clientHeight: { configurable: true, value: 100 },
		scrollTop: { configurable: true, writable: true, value: 400 },
	});
	act(() => {
		fireEvent.scroll(list);
		fireEvent.scroll(list);
	});
};

beforeEach(() => {
	jest.useFakeTimers();
	jest.clearAllMocks();
	listQuery.mockImplementation(
		(params) =>
			({
				currentData:
					typeof params !== 'symbol' && params.search
						? searchPage
						: typeof params !== 'symbol' && params.page === 2
							? lastPage
							: firstPage,
				isFetching: false,
			}) as unknown as ReturnType<typeof useGetArticlesListQuery>,
	);
	detailQuery.mockReturnValue({ isFetching: false } as unknown as ReturnType<typeof useGetArticleQuery>);
});
afterEach(() => {
	jest.clearAllTimers();
	jest.useRealTimers();
});

it('requests only ten active products in the selected company', () => {
	renderPicker();
	expect(listQuery).toHaveBeenCalledWith(
		{
			company_id: 1,
			with_pagination: true,
			page: 1,
			pageSize: 10,
			type_article: 'Produit',
			archived: false,
			search: '',
		},
		{ skip: false },
	);
	fireEvent.mouseDown(input());
	expect(screen.getAllByRole('option')).toHaveLength(10);
});

it('debounces typing and shows the server search results without filtering them again', () => {
	renderPicker();
	fireEvent.focus(input());
	fireEvent.change(input(), { target: { value: 'arm' } });
	fireEvent.focus(input());
	fireEvent.change(input(), { target: { value: 'armoire' } });
	tick(299);
	expect(listQuery.mock.calls.some(([params]) => typeof params !== 'symbol' && Boolean(params.search))).toBe(false);
	tick(1);
	expect(listQuery).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'armoire', page: 1 }), { skip: false });
	expect(screen.getByRole('option', { name: 'REF-51 : Article 51' })).toBeInTheDocument();
});

it('appends the next page once on scroll, deduplicates articles, and stops at the last page', () => {
	renderPicker();
	fireEvent.mouseDown(input());
	scrollToBottom();
	expect(listQuery).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }), { skip: false });
	expect(screen.getAllByRole('option')).toHaveLength(19);
	tick(20);
	expect(screen.getByRole('listbox').scrollTop).toBe(400);
	expect(screen.getByRole('option', { name: 'REF-1 : Article 1' })).toBeInTheDocument();
	expect(screen.getByRole('option', { name: 'REF-19 : Article 19' })).toBeInTheDocument();
	scrollToBottom();
	expect(listQuery.mock.calls.some(([params]) => typeof params !== 'symbol' && Number(params.page) > 2)).toBe(false);
});

it('starts a new search at page one and discards previous suggestions', () => {
	renderPicker();
	fireEvent.mouseDown(input());
	scrollToBottom();
	fireEvent.focus(input());
	fireEvent.change(input(), { target: { value: 'nouvelle recherche' } });
	tick();
	expect(listQuery).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'nouvelle recherche', page: 1 }), {
		skip: false,
	});
	expect(screen.getAllByRole('option')).toHaveLength(1);
	expect(screen.queryByRole('option', { name: 'REF-1 : Article 1' })).not.toBeInTheDocument();
});

it('keeps the chosen article when searches change and allows clearing it', () => {
	const Form = () => {
		const [value, setValue] = useState<number | null>(null);
		return (
			<StockArticleSelect
				company_id={1}
				enabled
				value={value}
				onChange={(entry) => {
					onChange(entry);
					setValue(entry?.id ?? null);
				}}
			/>
		);
	};
	render(<Form />);
	fireEvent.mouseDown(input());
	fireEvent.click(screen.getByRole('option', { name: 'REF-2 : Article 2' }));
	expect(input()).toHaveValue('REF-2 : Article 2');
	fireEvent.focus(input());
	fireEvent.change(input(), { target: { value: 'autre recherche' } });
	tick();
	expect(input()).toHaveValue('autre recherche');
	fireEvent.blur(input());
	expect(input()).toHaveValue('REF-2 : Article 2');
	expect(onChange).toHaveBeenCalledTimes(1);
	expect(onChange).toHaveBeenLastCalledWith(article(2));
	fireEvent.focus(input());
	fireEvent.click(screen.getByTitle('Clear'));
	expect(input()).toHaveValue('');
	expect(onChange).toHaveBeenLastCalledWith(null);
});

it('fetches a preselected article separately when it is outside the loaded page', () => {
	const selected = article(99);
	detailQuery.mockReturnValue({ currentData: selected, isFetching: false } as unknown as ReturnType<
		typeof useGetArticleQuery
	>);
	renderPicker(99);
	expect(detailQuery).toHaveBeenCalledWith({ id: 99 }, { skip: false });
	expect(input()).toHaveValue('REF-99 : Article 99');
	expect(onChange).not.toHaveBeenCalled();
	fireEvent.focus(input());
	fireEvent.change(input(), { target: { value: 'autre recherche' } });
	tick();
	fireEvent.blur(input());
	expect(input()).toHaveValue('REF-99 : Article 99');
});

it('keeps the field usable while suggestions load and reports an error inline', () => {
	listQuery.mockReturnValue({ currentData: undefined, isFetching: true } as unknown as ReturnType<
		typeof useGetArticlesListQuery
	>);
	const { rerender } = renderPicker();
	expect(input()).not.toBeDisabled();
	expect(screen.getByRole('progressbar', { name: 'Chargement des articles' })).toBeInTheDocument();
	listQuery.mockReturnValue({
		currentData: undefined,
		isFetching: false,
		error: { status: 500 },
	} as unknown as ReturnType<typeof useGetArticlesListQuery>);
	rerender(<StockArticleSelect company_id={1} enabled value={null} onChange={onChange} />);
	expect(input()).not.toBeDisabled();
	expect(screen.getByText('Impossible de charger les articles. Réessayez la recherche.')).toBeInTheDocument();
});

it('skips both queries when stock is disabled', () => {
	render(<StockArticleSelect company_id={1} enabled={false} value={99} onChange={onChange} />);
	expect(listQuery).toHaveBeenLastCalledWith(expect.anything(), { skip: true });
	expect(detailQuery).toHaveBeenLastCalledWith({ id: 99 }, { skip: true });
	expect(input()).toBeDisabled();
});
