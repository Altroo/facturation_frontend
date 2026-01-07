import { createApi } from '@reduxjs/toolkit/query/react';
import { isAuthenticatedInstance } from '@/utils/helpers';
import { axiosBaseQuery } from '@/utils/axiosBaseQuery';
import { getInitStateToken } from '@/store/selectors';
import type { BonDeLivraisonClass } from '@/models/classes';
import type { ApiErrorResponseType, PaginationResponseType, SuccessResponseType } from '@/types/_initTypes';
import type { RootState } from '@/store/store';
import { initToken } from '@/store/slices/_initSlice';
import type { TypeFactureLivraisonDevisStatus } from '@/types/devisTypes';

export const bonDeLivraisonApi = createApi({
	reducerPath: 'bonDeLivraisonApi',
	tagTypes: ['BonDeLivraison'],
	baseQuery: axiosBaseQuery((api) =>
		isAuthenticatedInstance(
			() => getInitStateToken(api.getState() as RootState),
			() => api.dispatch(initToken()),
		),
	),
	endpoints: (builder) => ({
		getBonDeLivraisonList: builder.query<
			Array<Partial<BonDeLivraisonClass>> | PaginationResponseType<BonDeLivraisonClass>,
			{
				company_id: number;
				with_pagination?: boolean;
				page?: number;
				pageSize?: number;
				search?: string;
				date_after?: string;
				date_before?: string;
			}
		>({
			query: ({ company_id, with_pagination, page, pageSize, search, date_after, date_before }) => ({
				url: process.env.NEXT_PUBLIC_BON_DE_LIVRAISON_LIST,
				method: 'GET',
				params: {
					company_id,
					pagination: !!with_pagination,
					page: with_pagination ? page : undefined,
					page_size: with_pagination ? pageSize : undefined,
					search,
					date_after,
					date_before,
				},
			}),
			providesTags: ['BonDeLivraison'],
		}),
		getBonDeLivraisonUninvoicedList: builder.query<
			Array<Partial<BonDeLivraisonClass>> | PaginationResponseType<BonDeLivraisonClass>,
			{
				company_id: number;
				with_pagination?: boolean;
				page?: number;
				pageSize?: number;
				search?: string;
				date_after?: string;
				date_before?: string;
			}
		>({
			query: ({ company_id, with_pagination, page, pageSize, search, date_after, date_before }) => ({
				url: process.env.NEXT_PUBLIC_BON_DE_LIVRAISON_UNINVOICED,
				method: 'GET',
				params: {
					company_id,
					pagination: !!with_pagination,
					page: with_pagination ? page : undefined,
					page_size: with_pagination ? pageSize : undefined,
					search,
					date_after,
					date_before,
				},
			}),
			providesTags: ['BonDeLivraison'],
		}),

		getBonDeLivraison: builder.query<BonDeLivraisonClass, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_BON_DE_LIVRAISON_ROOT}/${id}/`,
				method: 'GET',
			}),
			providesTags: ['BonDeLivraison'],
		}),
		getNumBonDeLivraison: builder.query<Pick<BonDeLivraisonClass, 'numero_bon_livraison'>, void>({
			query: () => ({
				url: process.env.NEXT_PUBLIC_BON_DE_LIVRAISON_GENERATE_NUM_BON_DE_LIVRAISON,
				method: 'GET',
			}),
			providesTags: ['BonDeLivraison'],
		}),
		deleteBonDeLivraison: builder.mutation<void | ApiErrorResponseType, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_BON_DE_LIVRAISON_ROOT}/${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['BonDeLivraison'],
		}),
		editBonDeLivraison: builder.mutation<
			SuccessResponseType<BonDeLivraisonClass>,
			{ id: number; data: Partial<BonDeLivraisonClass> }
		>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_BON_DE_LIVRAISON_ROOT}/${id}/`,
				method: 'PUT',
				data,
			}),
			invalidatesTags: ['BonDeLivraison'],
		}),
		addBonDeLivraison: builder.mutation<BonDeLivraisonClass, { data: Partial<BonDeLivraisonClass> }>({
			query: ({ data }) => ({
				url: `${process.env.NEXT_PUBLIC_BON_DE_LIVRAISON_ROOT}/`,
				method: 'POST',
				data,
			}),
			invalidatesTags: ['BonDeLivraison'],
		}),
		patchStatut: builder.mutation<
			SuccessResponseType<BonDeLivraisonClass>,
			{ id: number; data: { statut: TypeFactureLivraisonDevisStatus } }
		>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_BON_DE_LIVRAISON_SWITCH_STATUT}${id}/`,
				method: 'PATCH',
				data,
			}),
			invalidatesTags: ['BonDeLivraison'],
		}),
	}),
});

export const {
	useGetBonDeLivraisonListQuery,
	useGetBonDeLivraisonUninvoicedListQuery,
	useDeleteBonDeLivraisonMutation,
	useEditBonDeLivraisonMutation,
	useGetNumBonDeLivraisonQuery,
	useGetBonDeLivraisonQuery,
	useAddBonDeLivraisonMutation,
	usePatchStatutMutation,
} = bonDeLivraisonApi;
