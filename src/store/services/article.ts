import { createApi } from '@reduxjs/toolkit/query/react';
import { isAuthenticatedInstance } from '@/utils/helpers';
import { axiosBaseQuery } from '@/utils/axiosBaseQuery';
import { getInitStateToken } from '@/store/selectors';
import type { ArticleClass } from '@/models/classes';
import type { ApiErrorResponseType, PaginationResponseType, SuccessResponseType } from '@/types/_initTypes';
import type { ImportArticlesResponseType } from '@/types/articleTypes';
import type { RootState } from '@/store/store';
import { initToken } from '@/store/slices/_initSlice';

export const articleApi = createApi({
	reducerPath: 'articleApi',
	tagTypes: ['Article', 'Dashboard'],
	baseQuery: axiosBaseQuery((api) =>
		isAuthenticatedInstance(
			() => getInitStateToken(api.getState() as RootState),
			() => api.dispatch(initToken()),
		),
	),
	endpoints: (builder) => ({
		getArticlesList: builder.query<
			Array<Partial<ArticleClass>> | PaginationResponseType<ArticleClass>,
			{
				company_id: number;
				with_pagination?: boolean;
				page?: number;
				pageSize?: number;
				search?: string;
				archived?: boolean;
				date_created_after?: string;
				date_created_before?: string;
				[key: string]: string | number | boolean | undefined;
			}
		>({
			query: ({ company_id, with_pagination, page, pageSize, search, archived, date_created_after, date_created_before, ...extraFilters }) => ({
				url: process.env.NEXT_PUBLIC_ARTICLE_LIST,
				method: 'GET',
				params: {
					company_id,
					pagination: !!with_pagination,
					page: with_pagination ? page : undefined,
					page_size: with_pagination ? pageSize : undefined,
					search,
					archived,
					date_created_after,
					date_created_before,
					...extraFilters,
				},
			}),
			providesTags: ['Article'],
		}),

		getArticle: builder.query<ArticleClass, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_ARTICLE_ROOT}/${id}/`,
				method: 'GET',
			}),
			providesTags: ['Article'],
		}),
		getCodeReference: builder.query<Pick<ArticleClass, 'reference'>, { company_id: number }>({
			query: ({ company_id }) => ({
				url: process.env.NEXT_PUBLIC_ARTICLE_GENERATE_CODE_REFERENCE,
				method: 'GET',
				params: { company_id },
			}),
			providesTags: ['Article'],
		}),
		deleteArticle: builder.mutation<void | ApiErrorResponseType, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_ARTICLE_ROOT}/${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['Article', 'Dashboard'],
		}),
		editArticle: builder.mutation<SuccessResponseType<ArticleClass>, { id: number; data: Partial<ArticleClass> }>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_ARTICLE_ROOT}/${id}/`,
				method: 'PUT',
				data,
			}),
			invalidatesTags: ['Article', 'Dashboard'],
		}),
		addArticle: builder.mutation<SuccessResponseType<ArticleClass>, { data: Partial<ArticleClass> }>({
			query: ({ data }) => ({
				url: `${process.env.NEXT_PUBLIC_ARTICLE_ROOT}/`,
				method: 'POST',
				data,
			}),
			invalidatesTags: ['Article', 'Dashboard'],
		}),
		patchArchive: builder.mutation<SuccessResponseType<ArticleClass>, { id: number; data: { archived: boolean } }>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_ARCHIVE_ARTICLE}${id}/`,
				method: 'PATCH',
				data,
			}),
			invalidatesTags: ['Article', 'Dashboard'],
		}),
		importArticles: builder.mutation<ImportArticlesResponseType, { file: File; company_id: number }>({
			query: ({ file, company_id }) => {
				const formData = new FormData();
				formData.append('file', file);
				formData.append('company_id', String(company_id));
				return {
					url: process.env.NEXT_PUBLIC_ARTICLE_IMPORT,
					method: 'POST',
					data: formData,
				};
			},
			invalidatesTags: ['Article'],
		}),
		sendCSVExampleEmail: builder.mutation<{ message: string }, { company_id: number }>({
			query: ({ company_id }) => ({
				url: process.env.NEXT_PUBLIC_ARTICLE_SEND_CSV_EXAMPLE_EMAIL,
				method: 'POST',
				data: { company_id },
			}),
		}),
		bulkDeleteArticles: builder.mutation<void | ApiErrorResponseType, { ids: number[] }>({
			query: ({ ids }) => ({
				url: `${process.env.NEXT_PUBLIC_ARTICLE_ROOT}/bulk_delete/`,
				method: 'DELETE',
				data: { ids },
			}),
			invalidatesTags: ['Article'],
		}),
		bulkArchiveArticles: builder.mutation<{ updated: number } | ApiErrorResponseType, { ids: number[]; archived: boolean }>({
			query: ({ ids, archived }) => ({
				url: `${process.env.NEXT_PUBLIC_ARTICLE_ROOT}/bulk_archive/`,
				method: 'PATCH',
				data: { ids, archived },
			}),
			invalidatesTags: ['Article'],
		}),
	}),
});

export const {
	useGetArticlesListQuery,
	useLazyGetArticlesListQuery,
	useDeleteArticleMutation,
	useEditArticleMutation,
	useGetCodeReferenceQuery,
	useGetArticleQuery,
	useAddArticleMutation,
	usePatchArchiveMutation,
	useImportArticlesMutation,
	useSendCSVExampleEmailMutation,
	useBulkDeleteArticlesMutation,
	useBulkArchiveArticlesMutation,
} = articleApi;
