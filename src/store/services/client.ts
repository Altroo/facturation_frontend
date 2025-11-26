import { createApi } from '@reduxjs/toolkit/query/react';
import { isAuthenticatedInstance } from '@/utils/helpers';
import { axiosBaseQuery } from '@/utils/axiosBaseQuery';
import { getInitStateToken } from '@/store/selectors';
import { ClientClass } from '@/models/Classes';
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
				token: string | undefined;
				company_id: number;
				with_pagination?: boolean;
				page?: number;
				pageSize?: number;
				search?: string;
				archived?: boolean;
			}
		>({
			query: ({ token, company_id, with_pagination, page, pageSize, search, archived }) => ({
				url: process.env.NEXT_PUBLIC_CLIENT_LIST as string,
				method: 'GET',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
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

		getClient: builder.query<ClientClass, { token: string | undefined; id: number }>({
			query: ({ token, id }) => ({
				url: `${process.env.NEXT_PUBLIC_CLIENT_ROOT}/${id}/`,
				method: 'GET',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
			}),
			providesTags: ['Client'],
		}),
		getCodeClient: builder.query<Pick<ClientClass, 'code_client'>, { token: string | undefined }>({
			query: ({ token }) => ({
				url: `${process.env.NEXT_PUBLIC_CLIENT_GENERATE_CODE_CLIENT}`,
				method: 'GET',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
			}),
		}),
		deleteClient: builder.mutation<void | ApiErrorResponseType, { token: string | undefined; id: number }>({
			query: ({ token, id }) => ({
				url: `${process.env.NEXT_PUBLIC_CLIENT_ROOT}/${id}/`,
				method: 'DELETE',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
			}),
			invalidatesTags: ['Client'],
		}),
		editClient: builder.mutation<
			SuccessResponseType<ClientClass>,
			{ token: string | undefined; id: number; data: Partial<ClientClass> }
		>({
			query: ({ token, id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_CLIENT_ROOT}/${id}/`,
				method: 'PUT',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
				data,
			}),
			invalidatesTags: ['Client'],
		}),
		addClient: builder.mutation<
			SuccessResponseType<ClientClass>,
			{ token: string | undefined; data: Partial<ClientClass> }
		>({
			query: ({ token, data }) => ({
				url: `${process.env.NEXT_PUBLIC_CLIENT_ROOT}/`,
				method: 'POST',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
				data,
			}),
			invalidatesTags: ['Client'],
		}),
		patchArchive: builder.mutation<
			SuccessResponseType<ClientClass>,
			{ token: string | undefined; id: number; data: { archived: boolean } }
		>({
			query: ({ token, id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_ARCHIVE_CLIENT}${id}/`,
				method: 'PATCH',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
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
