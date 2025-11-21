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
				with_pagination?: boolean;
				page?: number;
				pageSize?: number;
				search?: string;
				archived?: boolean;
			}
		>({
			query: ({ token, with_pagination, page, pageSize, search, archived }) => ({
				url: with_pagination
					? `${process.env.NEXT_PUBLIC_CLIENT_LIST}?search=${search}&page=${page}&page_size=${pageSize}&archived=${archived}`
					: (process.env.NEXT_PUBLIC_CLIENT_LIST as string),
				method: 'GET',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
				params: with_pagination ? { pagination: true } : undefined,
			}),
			providesTags: ['Client'],
		}),
		getClient: builder.query<ClientClass, { token: string | undefined; id: number }>({
			query: ({ token, id }) => ({
				url: `${process.env.NEXT_PUBLIC_CLIENT_ROOT}/${id}/`,
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
				url: `${process.env.NEXT_PUBLIC_ARCHIVE_CLIENT}/${id}/`,
				method: 'PUT',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
				data,
			}),
		}),
	}),
});

export const {
	useGetClientsListQuery,
	useDeleteClientMutation,
	useEditClientMutation,
	useGetClientQuery,
	useAddClientMutation,
	usePatchArchiveMutation,
} = clientApi;
