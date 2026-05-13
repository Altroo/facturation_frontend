import { createApi } from '@reduxjs/toolkit/query/react';
import { isAuthenticatedInstance } from '@/utils/helpers';
import { axiosBaseQuery } from '@/utils/axiosBaseQuery';
import { getInitStateToken } from '@/store/selectors';
import type { FactureAvoirClass } from '@/models/classes';
import type { ApiErrorResponseType, SuccessResponseType } from '@/types/_initTypes';
import type { FactureAvoirListResponseType } from '@/types/companyDocumentsTypes';
import type { RootState } from '@/store/store';
import { initToken } from '@/store/slices/_initSlice';
import type { TypeFactureLivraisonDevisStatus } from '@/types/devisTypes';

export type FactureAvoirFromFactureResponse = Partial<FactureAvoirClass> & {
	facture_total?: string;
	already_credited_total?: string;
};

export const factureAvoirApi = createApi({
	reducerPath: 'factureAvoirApi',
	tagTypes: ['FactureAvoir', 'FactureClient', 'Dashboard'],
	baseQuery: axiosBaseQuery((api) =>
		isAuthenticatedInstance(
			() => getInitStateToken(api.getState() as RootState),
			() => api.dispatch(initToken()),
		),
	),
	endpoints: (builder) => ({
		getFactureAvoirList: builder.query<
			Array<Partial<FactureAvoirClass>> | FactureAvoirListResponseType,
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
				url: process.env.NEXT_PUBLIC_FACTURE_AVOIR_LIST,
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
			providesTags: ['FactureAvoir'],
		}),
		getFactureAvoir: builder.query<FactureAvoirClass, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_FACTURE_AVOIR_ROOT}/${id}/`,
				method: 'GET',
			}),
			providesTags: ['FactureAvoir'],
		}),
		getNumFactureAvoir: builder.query<Pick<FactureAvoirClass, 'numero_avoir'>, { company_id: number }>({
			query: ({ company_id }) => ({
				url: process.env.NEXT_PUBLIC_FACTURE_AVOIR_GENERATE_NUM_FACTURE,
				method: 'GET',
				params: { company_id },
			}),
			providesTags: ['FactureAvoir'],
		}),
		getFactureAvoirFromFacture: builder.query<FactureAvoirFromFactureResponse, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_FACTURE_AVOIR_FROM_FACTURE}${id}/`,
				method: 'GET',
			}),
			providesTags: ['FactureClient'],
		}),
		editFactureAvoir: builder.mutation<SuccessResponseType<FactureAvoirClass>, { id: number; data: Partial<FactureAvoirClass> }>(
			{
				query: ({ id, data }) => ({
					url: `${process.env.NEXT_PUBLIC_FACTURE_AVOIR_ROOT}/${id}/`,
					method: 'PUT',
					data,
				}),
				invalidatesTags: ['FactureAvoir', 'FactureClient', 'Dashboard'],
			},
		),
		addFactureAvoir: builder.mutation<FactureAvoirClass, { data: Partial<FactureAvoirClass> }>({
			query: ({ data }) => ({
				url: `${process.env.NEXT_PUBLIC_FACTURE_AVOIR_ROOT}/`,
				method: 'POST',
				data,
			}),
			invalidatesTags: ['FactureAvoir', 'FactureClient', 'Dashboard'],
		}),
		patchFactureAvoirStatut: builder.mutation<
			SuccessResponseType<FactureAvoirClass>,
			{ id: number; data: { statut: TypeFactureLivraisonDevisStatus } }
		>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_FACTURE_AVOIR_SWITCH_STATUT}${id}/`,
				method: 'PATCH',
				data,
			}),
			invalidatesTags: ['FactureAvoir', 'FactureClient', 'Dashboard'],
		}),
		noDeleteFactureAvoir: builder.mutation<void | ApiErrorResponseType, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_FACTURE_AVOIR_ROOT}/${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['FactureAvoir'],
		}),
	}),
});

export const {
	useGetFactureAvoirListQuery,
	useGetFactureAvoirQuery,
	useGetNumFactureAvoirQuery,
	useGetFactureAvoirFromFactureQuery,
	useLazyGetFactureAvoirFromFactureQuery,
	useEditFactureAvoirMutation,
	useAddFactureAvoirMutation,
	usePatchFactureAvoirStatutMutation,
	useNoDeleteFactureAvoirMutation,
} = factureAvoirApi;
