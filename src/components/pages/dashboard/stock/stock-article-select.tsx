'use client';

import { useEffect, useRef, useState } from 'react';
import { CircularProgress, useTheme } from '@mui/material';
import { Inventory2 as Inventory2Icon } from '@mui/icons-material';
import CustomAutoCompleteSelect from '@/components/formikElements/customAutoCompleteSelect/customAutoCompleteSelect';
import { useGetArticleQuery, useGetArticlesListQuery } from '@/store/services/article';
import type { ArticleClass } from '@/models/classes';
import type { DropDownType } from '@/types/accountTypes';
import type { StockArticleSelectProps } from '@/types/stockTypes';

const articleOption = (article: Partial<ArticleClass>): DropDownType => ({
	value: String(article.id),
	code: `${article.reference ?? ''} : ${article.designation ?? ''}`,
});

const StockArticleSelect = ({
	company_id,
	enabled,
	value,
	onChange,
	onBlur,
	error,
	helperText,
}: StockArticleSelectProps) => {
	const theme = useTheme();
	const [input, setInput] = useState('');
	const paginationScroll = useRef<{ element: HTMLUListElement; top: number; search: string } | null>(null);
	const [query, setQuery] = useState({ search: '', page: 1 });
	const [loaded, setLoaded] = useState<{ search: string; articles: Partial<ArticleClass>[] }>({
		search: '',
		articles: [],
	});
	const [selection, setSelection] = useState<{ article: Partial<ArticleClass>; option: DropDownType } | null>(null);

	useEffect(() => {
		const timeout = setTimeout(() => {
			setQuery((previous) => (previous.search === input.trim() ? previous : { search: input.trim(), page: 1 }));
		}, 300);
		return () => clearTimeout(timeout);
	}, [input]);

	const {
		currentData,
		isFetching,
		error: articlesError,
	} = useGetArticlesListQuery(
		{
			company_id,
			with_pagination: true,
			page: query.page,
			pageSize: 10,
			type_article: 'Produit',
			archived: false,
			search: query.search,
		},
		{ skip: !enabled },
	);
	const pageData = Array.isArray(currentData) ? undefined : currentData;

	useEffect(() => {
		if (!pageData) return;
		setLoaded((previous) => ({
			search: query.search,
			articles: [
				...new Map(
					[...(query.page === 1 || previous.search !== query.search ? [] : previous.articles), ...pageData.results].map(
						(article) => [article.id, article],
					),
				).values(),
			],
		}));
	}, [pageData, query.page, query.search]);

	// MUI may resync its highlighted option after an asynchronous page append.
	useEffect(() => {
		const scroll = paginationScroll.current;
		if (!scroll || scroll.search !== loaded.search || scroll.search !== input.trim()) return;
		const frame = requestAnimationFrame(() => {
			if (scroll.element.isConnected) scroll.element.scrollTop = scroll.top;
			if (paginationScroll.current === scroll) paginationScroll.current = null;
		});
		return () => cancelAnimationFrame(frame);
	}, [loaded, input]);

	const debouncing = input.trim() !== query.search;
	const articles = loaded.search === query.search && !debouncing ? loaded.articles : [];
	const selected = selection?.article.id === value ? selection : null;
	const loadedSelection =
		articles.find((article) => article.id === value) ?? pageData?.results.find((article) => article.id === value);
	const {
		currentData: selectedArticle,
		isFetching: selectedLoading,
		error: selectedError,
	} = useGetArticleQuery({ id: value ?? 0 }, { skip: !enabled || !value || Boolean(selected || loadedSelection) });

	useEffect(() => {
		const article = loadedSelection ?? selectedArticle;
		if (value && !selected && article?.id === value) {
			setSelection({ article, option: articleOption(article) });
		}
	}, [value, selected, loadedSelection, selectedArticle]);

	const items = articles.map(articleOption);
	if (selected && !items.some((option) => option.value === selected.option.value)) items.unshift(selected.option);
	const loading = enabled && (isFetching || selectedLoading || debouncing);
	const queryError = articlesError || (!selected && selectedError);

	return (
		<CustomAutoCompleteSelect
			id="article"
			label="Article"
			placeholder="Recherchez une référence ou une désignation"
			items={items}
			value={selected?.option ?? null}
			serverFiltered
			listboxMaxHeight="min(40vh, 240px)"
			loading={loading}
			loadingText="Chargement des articles…"
			endIcon={
				loading ? <CircularProgress size={16} color="inherit" aria-label="Chargement des articles" /> : undefined
			}
			onInputChange={(_, text, reason) => {
				if (reason === 'input' || reason === 'clear') setInput(text);
			}}
			onListboxScroll={(event) => {
				const list = event.currentTarget;
				if (
					!loading &&
					!articlesError &&
					pageData?.next &&
					list.scrollHeight - list.scrollTop - list.clientHeight <= 32
				) {
					paginationScroll.current = { element: list, top: list.scrollTop, search: query.search };
					setQuery((previous) => (previous.page === query.page ? { ...previous, page: previous.page + 1 } : previous));
				}
			}}
			onChange={(_, option) => {
				const article = option
					? (articles.find((entry) => String(entry.id) === option.value) ?? selected?.article ?? null)
					: null;
				setSelection(article ? { article, option: articleOption(article) } : null);
				onChange(article);
			}}
			onBlur={onBlur}
			error={Boolean(error || queryError)}
			helperText={helperText || (queryError ? 'Impossible de charger les articles. Réessayez la recherche.' : '')}
			noOptionsText="Aucun article"
			disabled={!enabled}
			fullWidth
			size="small"
			theme={theme}
			startIcon={<Inventory2Icon fontSize="small" />}
			required
		/>
	);
};

export default StockArticleSelect;
