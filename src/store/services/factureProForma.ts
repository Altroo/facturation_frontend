import { createApi } from '@reduxjs/toolkit/query/react';
import { isAuthenticatedInstance } from '@/utils/helpers';
import { axiosBaseQuery } from '@/utils/axiosBaseQuery';
import { getInitStateToken } from '@/store/selectors';
import type { FactureClass } from '@/models/classes';
import type { ApiErrorResponseType, PaginationResponseType, SuccessResponseType } from '@/types/_initTypes';
import type { RootState } from '@/store/store';
import { initToken } from '@/store/slices/_initSlice';
import type { TypeFactureDevisStatus } from '@/types/devisTypes';

export const factureProFormaApi = createApi({
	reducerPath: 'factureProFormaApi',
	tagTypes: ['FactureProForma'],
	baseQuery: axiosBaseQuery((api) =>
		isAuthenticatedInstance(
			() => getInitStateToken(api.getState() as RootState),
			() => api.dispatch(initToken()),
		),
	),
	endpoints: (builder) => ({
		getFactureProFormaList: builder.query<
			Array<Partial<FactureClass>> | PaginationResponseType<FactureClass>,
			{
				company_id: number;
				with_pagination?: boolean;
				page?: number;
				pageSize?: number;
				search?: string;
			}
		>({
			query: ({ company_id, with_pagination, page, pageSize, search }) => ({
				url: process.env.NEXT_PUBLIC_FACTURE_PROFORMA_LIST as string,
				method: 'GET',
				params: {
					company_id,
					pagination: !!with_pagination,
					page: with_pagination ? page : undefined,
					page_size: with_pagination ? pageSize : undefined,
					search,
				},
			}),
			providesTags: ['FactureProForma'],
		}),

		getFactureProForma: builder.query<FactureClass, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_FACTURE_PROFORMA_ROOT}/${id}/`,
				method: 'GET',
			}),
			providesTags: ['FactureProForma'],
		}),
		getNumFactureProForma: builder.query<Pick<FactureClass, 'numero_facture'>, void>({
			query: () => ({
				url: `${process.env.NEXT_PUBLIC_FACTURE_PROFORMA_GENERATE_NUM_FACTURE}`,
				method: 'GET',
			}),
			providesTags: ['FactureProForma'],
		}),
		deleteFactureProForma: builder.mutation<void | ApiErrorResponseType, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_FACTURE_PROFORMA_ROOT}/${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['FactureProForma'],
		}),
		editFactureProForma: builder.mutation<
			SuccessResponseType<FactureClass>,
			{ id: number; data: Partial<FactureClass> }
		>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_FACTURE_PROFORMA_ROOT}/${id}/`,
				method: 'PUT',
				data,
			}),
			invalidatesTags: ['FactureProForma'],
		}),
		addFactureProForma: builder.mutation<FactureClass, { data: Partial<FactureClass> }>({
			query: ({ data }) => ({
				url: `${process.env.NEXT_PUBLIC_FACTURE_PROFORMA_ROOT}/`,
				method: 'POST',
				data,
			}),
			invalidatesTags: ['FactureProForma'],
		}),
		patchStatut: builder.mutation<
			SuccessResponseType<FactureClass>,
			{ id: number; data: { statut: TypeFactureDevisStatus } }
		>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_FACTURE_PROFORMA_SWITCH_STATUT}${id}/`,
				method: 'PATCH',
				data,
			}),
			invalidatesTags: ['FactureProForma'],
		}),
	}),
});

export const {
	useGetFactureProFormaListQuery,
	useDeleteFactureProFormaMutation,
	useEditFactureProFormaMutation,
	useGetNumFactureProFormaQuery,
	useGetFactureProFormaQuery,
	useAddFactureProFormaMutation,
	usePatchStatutMutation,
} = factureProFormaApi;
