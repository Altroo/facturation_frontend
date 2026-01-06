import { createApi } from '@reduxjs/toolkit/query/react';
import { isAuthenticatedInstance } from '@/utils/helpers';
import { axiosBaseQuery } from '@/utils/axiosBaseQuery';
import { getInitStateToken } from '@/store/selectors';
import type { ArticleClass } from '@/models/classes';
import type { ApiErrorResponseType, PaginationResponseType, SuccessResponseType } from '@/types/_initTypes';
import type { RootState } from '@/store/store';
import { initToken } from '@/store/slices/_initSlice';

export const articleApi = createApi({
	reducerPath: 'articleApi',
	tagTypes: ['Article'],
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
			}
		>({
			query: ({ company_id, with_pagination, page, pageSize, search, archived, date_created_after, date_created_before }) => ({
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
		getCodeReference: builder.query<Pick<ArticleClass, 'reference'>, void>({
			query: () => ({
				url: process.env.NEXT_PUBLIC_ARTICLE_GENERATE_CODE_REFERENCE,
				method: 'GET',
			}),
			providesTags: ['Article'],
		}),
		deleteArticle: builder.mutation<void | ApiErrorResponseType, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_ARTICLE_ROOT}/${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['Article'],
		}),
		editArticle: builder.mutation<SuccessResponseType<ArticleClass>, { id: number; data: Partial<ArticleClass> }>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_ARTICLE_ROOT}/${id}/`,
				method: 'PUT',
				data,
			}),
			invalidatesTags: ['Article'],
		}),
		addArticle: builder.mutation<SuccessResponseType<ArticleClass>, { data: Partial<ArticleClass> }>({
			query: ({ data }) => ({
				url: `${process.env.NEXT_PUBLIC_ARTICLE_ROOT}/`,
				method: 'POST',
				data,
			}),
			invalidatesTags: ['Article'],
		}),
		patchArchive: builder.mutation<SuccessResponseType<ArticleClass>, { id: number; data: { archived: boolean } }>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_ARCHIVE_ARTICLE}${id}/`,
				method: 'PATCH',
				data,
			}),
			invalidatesTags: ['Article'],
		}),
	}),
});

export const {
	useGetArticlesListQuery,
	useDeleteArticleMutation,
	useEditArticleMutation,
	useGetCodeReferenceQuery,
	useGetArticleQuery,
	useAddArticleMutation,
	usePatchArchiveMutation,
} = articleApi;
