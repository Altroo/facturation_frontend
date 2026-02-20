import { createApi } from '@reduxjs/toolkit/query/react';
import { isAuthenticatedInstance } from '@/utils/helpers';
import { axiosBaseQuery } from '@/utils/axiosBaseQuery';
import { getInitStateToken } from '@/store/selectors';
import type { FactureClass } from '@/models/classes';
import type { ApiErrorResponseType, PaginationResponseType, SuccessResponseType } from '@/types/_initTypes';
import type { RootState } from '@/store/store';
import { initToken } from '@/store/slices/_initSlice';
import type { TypeFactureLivraisonDevisStatus } from '@/types/devisTypes';
import { factureClientApi } from '@/store/services/factureClient';

export const factureProFormaApi = createApi({
	reducerPath: 'factureProFormaApi',
	tagTypes: ['FactureProForma', 'Dashboard'],
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
				date_after?: string;
				date_before?: string;
				[key: string]: string | number | boolean | undefined;
			}
		>({
			query: ({ company_id, with_pagination, page, pageSize, search, date_after, date_before, ...extraFilters }) => ({
				url: process.env.NEXT_PUBLIC_FACTURE_PROFORMA_LIST,
				method: 'GET',
				params: {
					company_id,
					pagination: !!with_pagination,
					page: with_pagination ? page : undefined,
					page_size: with_pagination ? pageSize : undefined,
					search,
					date_after,
					date_before,
					...extraFilters,
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
		getNumFactureProForma: builder.query<Pick<FactureClass, 'numero_facture'>, { company_id: number }>({
			query: ({ company_id }) => ({
				url: process.env.NEXT_PUBLIC_FACTURE_PROFORMA_GENERATE_NUM_FACTURE,
				method: 'GET',
				params: { company_id },
			}),
			providesTags: ['FactureProForma'],
		}),
		deleteFactureProForma: builder.mutation<void | ApiErrorResponseType, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_FACTURE_PROFORMA_ROOT}/${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['FactureProForma', 'Dashboard'],
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
			invalidatesTags: ['FactureProForma', 'Dashboard'],
		}),
		addFactureProForma: builder.mutation<FactureClass, { data: Partial<FactureClass> }>({
			query: ({ data }) => ({
				url: `${process.env.NEXT_PUBLIC_FACTURE_PROFORMA_ROOT}/`,
				method: 'POST',
				data,
			}),
			invalidatesTags: ['FactureProForma', 'Dashboard'],
		}),
		patchStatut: builder.mutation<
			SuccessResponseType<FactureClass>,
			{ id: number; data: { statut: TypeFactureLivraisonDevisStatus } }
		>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_FACTURE_PROFORMA_SWITCH_STATUT}${id}/`,
				method: 'PATCH',
				data,
			}),
			invalidatesTags: ['FactureProForma', 'Dashboard'],
		}),
		convertFactureProFormaToFacture: builder.mutation<{ id: number }, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_FACTURE_PROFORMAT_CONVERT_TO_FACTURE_CLIENT}${id}/`,
				method: 'POST',
			}),
			invalidatesTags: ['FactureProForma', 'Dashboard'],
			async onQueryStarted(arg, { dispatch, queryFulfilled }) {
				try {
					await queryFulfilled;
					dispatch(factureClientApi.util.invalidateTags(['FactureClient']));
				} catch {
					// ignore
				}
			},
		}),
		bulkDeleteFactureProForma: builder.mutation<void | ApiErrorResponseType, { ids: number[] }>({
			query: ({ ids }) => ({
				url: `${process.env.NEXT_PUBLIC_FACTURE_PROFORMA_ROOT}/bulk_delete/`,
				method: 'DELETE',
				data: { ids },
			}),
			invalidatesTags: ['FactureProForma', 'Dashboard'],
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
	useConvertFactureProFormaToFactureMutation,
	useBulkDeleteFactureProFormaMutation,
} = factureProFormaApi;
