import { createApi } from '@reduxjs/toolkit/query/react';
import { isAuthenticatedInstance } from '@/utils/helpers';
import { axiosBaseQuery } from '@/utils/axiosBaseQuery';
import { getInitStateToken } from '@/store/selectors';
import type { ClientClass } from '@/models/classes';
import type { ApiErrorResponseType, PaginationResponseType, SuccessResponseType } from '@/types/_initTypes';
import type { RootState } from '@/store/store';
import { initToken } from '@/store/slices/_initSlice';

export const clientApi = createApi({
	reducerPath: 'clientApi',
	tagTypes: ['Client'],
	baseQuery: axiosBaseQuery((api) =>
		isAuthenticatedInstance(
			() => getInitStateToken(api.getState() as RootState),
			() => api.dispatch(initToken()),
		),
	),
	endpoints: (builder) => ({
		getClientsList: builder.query<
			Array<Partial<ClientClass>> | PaginationResponseType<ClientClass>,
			{
				company_id: number;
				with_pagination?: boolean;
				page?: number;
				pageSize?: number;
				search?: string;
				archived?: boolean;
			}
		>({
			query: ({ company_id, with_pagination, page, pageSize, search, archived }) => ({
				url: process.env.NEXT_PUBLIC_CLIENT_LIST,
				method: 'GET',
				params: {
					company_id,
					pagination: !!with_pagination,
					page: with_pagination ? page : undefined,
					page_size: with_pagination ? pageSize : undefined,
					search,
					archived,
				},
			}),
			providesTags: ['Client'],
		}),

		getClient: builder.query<ClientClass, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_CLIENT_ROOT}/${id}/`,
				method: 'GET',
			}),
			providesTags: ['Client'],
		}),
		getCodeClient: builder.query<Pick<ClientClass, 'code_client'>, void>({
			query: () => ({
				url: process.env.NEXT_PUBLIC_CLIENT_GENERATE_CODE_CLIENT,
				method: 'GET',
			}),
			providesTags: ['Client'],
		}),
		deleteClient: builder.mutation<void | ApiErrorResponseType, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_CLIENT_ROOT}/${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['Client'],
		}),
		editClient: builder.mutation<SuccessResponseType<ClientClass>, { id: number; data: Partial<ClientClass> }>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_CLIENT_ROOT}/${id}/`,
				method: 'PUT',
				data,
			}),
			invalidatesTags: ['Client'],
		}),
		addClient: builder.mutation<SuccessResponseType<ClientClass>, { data: Partial<ClientClass> }>({
			query: ({ data }) => ({
				url: `${process.env.NEXT_PUBLIC_CLIENT_ROOT}/`,
				method: 'POST',
				data,
			}),
			invalidatesTags: ['Client'],
		}),
		patchArchive: builder.mutation<SuccessResponseType<ClientClass>, { id: number; data: { archived: boolean } }>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_ARCHIVE_CLIENT}${id}/`,
				method: 'PATCH',
				data,
			}),
			invalidatesTags: ['Client'],
		}),
	}),
});

export const {
	useGetClientsListQuery,
	useDeleteClientMutation,
	useEditClientMutation,
	useGetCodeClientQuery,
	useGetClientQuery,
	useAddClientMutation,
	usePatchArchiveMutation,
} = clientApi;
