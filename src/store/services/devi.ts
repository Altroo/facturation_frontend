import { createApi } from '@reduxjs/toolkit/query/react';
import { isAuthenticatedInstance } from '@/utils/helpers';
import { axiosBaseQuery } from '@/utils/axiosBaseQuery';
import { getInitStateToken } from '@/store/selectors';
import type { DeviClass } from '@/models/Classes';
import type { ApiErrorResponseType, PaginationResponseType, SuccessResponseType } from '@/types/_initTypes';
import type { RootState } from '@/store/store';
import { initToken } from '@/store/slices/_initSlice';
import { TypeFactureDevisStatus } from '@/types/devisTypes';
import { factureProFormaApi } from '@/store/services/factureProForma';

export const deviApi = createApi({
	reducerPath: 'deviApi',
	tagTypes: ['Devi'],
	baseQuery: axiosBaseQuery((api) =>
		isAuthenticatedInstance(
			() => getInitStateToken(api.getState() as RootState),
			() => api.dispatch(initToken()),
		),
	),
	endpoints: (builder) => ({
		getDevisList: builder.query<
			Array<Partial<DeviClass>> | PaginationResponseType<DeviClass>,
			{
				company_id: number;
				with_pagination?: boolean;
				page?: number;
				pageSize?: number;
				search?: string;
			}
		>({
			query: ({ company_id, with_pagination, page, pageSize, search }) => ({
				url: process.env.NEXT_PUBLIC_DEVIS_LIST as string,
				method: 'GET',
				params: {
					company_id,
					pagination: !!with_pagination,
					page: with_pagination ? page : undefined,
					page_size: with_pagination ? pageSize : undefined,
					search,
				},
			}),
			providesTags: ['Devi'],
		}),

		getDevi: builder.query<DeviClass, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_DEVIS_ROOT}/${id}/`,
				method: 'GET',
			}),
			providesTags: ['Devi'],
		}),
		getNumDevis: builder.query<Pick<DeviClass, 'numero_devis'>, void>({
			query: () => ({
				url: `${process.env.NEXT_PUBLIC_DEVIS_GENERATE_NUM_DEVIS}`,
				method: 'GET',
			}),
			providesTags: ['Devi'],
		}),
		deleteDevi: builder.mutation<void | ApiErrorResponseType, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_DEVIS_ROOT}/${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['Devi'],
		}),
		editDevi: builder.mutation<SuccessResponseType<DeviClass>, { id: number; data: Partial<DeviClass> }>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_DEVIS_ROOT}/${id}/`,
				method: 'PUT',
				data,
			}),
			invalidatesTags: ['Devi'],
		}),
		addDevi: builder.mutation<DeviClass, { data: Partial<DeviClass> }>({
			query: ({ data }) => ({
				url: `${process.env.NEXT_PUBLIC_DEVIS_ROOT}/`,
				method: 'POST',
				data,
			}),
			invalidatesTags: ['Devi'],
		}),
		convertDeviToFactureProForma: builder.mutation<SuccessResponseType<DeviClass>, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_DEVIS_CONVERT_TO_FACTURE_PRO_FORMA}${id}/`,
				method: 'POST',
			}),
			invalidatesTags: ['Devi'],
			async onQueryStarted(arg, { dispatch, queryFulfilled }) {
				try {
					await queryFulfilled;
					// Invalidate the factureProFormaApi tag so its list refetches
					dispatch(factureProFormaApi.util.invalidateTags(['FactureProForma']));
				} catch {
					// ignore
				}
			},
		}),
		patchStatut: builder.mutation<
			SuccessResponseType<DeviClass>,
			{ id: number; data: { statut: TypeFactureDevisStatus } }
		>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_DEVIS_SWITCH_STATUT}${id}/`,
				method: 'PATCH',
				data,
			}),
			invalidatesTags: ['Devi'],
		}),
	}),
});

export const {
	useGetDevisListQuery,
	useDeleteDeviMutation,
	useEditDeviMutation,
	useGetNumDevisQuery,
	useGetDeviQuery,
	useAddDeviMutation,
	usePatchStatutMutation,
	useConvertDeviToFactureProFormaMutation,
} = deviApi;
