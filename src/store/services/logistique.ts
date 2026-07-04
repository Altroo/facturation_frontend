import { createApi } from '@reduxjs/toolkit/query/react';
import { isAuthenticatedInstance } from '@/utils/helpers';
import { axiosBaseQuery } from '@/utils/axiosBaseQuery';
import { getInitStateToken } from '@/store/selectors';
import { initToken } from '@/store/slices/_initSlice';
import type { RootState } from '@/store/store';
import type { ApiErrorResponseType } from '@/types/_initTypes';
import type {
	LogistiqueCreateResponse,
	LogistiqueFormValues,
	LogistiqueListResponse,
	LogistiqueOrder,
	LogistiquePaymentMethod,
	LogistiqueResponsibleOption,
	LogistiqueStatut,
} from '@/types/logistiqueTypes';

const LOGISTIQUE_ROOT = process.env.NEXT_PUBLIC_LOGISTIQUE_ROOT || '/logistique';
const LOGISTIQUE_LIST = process.env.NEXT_PUBLIC_LOGISTIQUE_LIST || `${LOGISTIQUE_ROOT}/`;
const LOGISTIQUE_SWITCH_STATUT = process.env.NEXT_PUBLIC_LOGISTIQUE_SWITCH_STATUT || `${LOGISTIQUE_ROOT}/switch_statut/`;
const LOGISTIQUE_GENERATE_NUM = process.env.NEXT_PUBLIC_LOGISTIQUE_GENERATE_NUM || `${LOGISTIQUE_ROOT}/generate_num_commande/`;
const LOGISTIQUE_RESPONSABLES = process.env.NEXT_PUBLIC_LOGISTIQUE_RESPONSABLES || `${LOGISTIQUE_ROOT}/responsables/`;

export const logistiqueApi = createApi({
	reducerPath: 'logistiqueApi',
	tagTypes: ['Logistique', 'Dashboard'],
	baseQuery: axiosBaseQuery((api) =>
		isAuthenticatedInstance(
			() => getInitStateToken(api.getState() as RootState),
			() => api.dispatch(initToken()),
		),
	),
	endpoints: (builder) => ({
		getLogistiqueList: builder.query<
			LogistiqueListResponse,
			{
				company_id: number;
				with_pagination?: boolean;
				page?: number;
				pageSize?: number;
				search?: string;
				[key: string]: string | number | boolean | undefined;
			}
		>({
			query: ({ company_id, with_pagination, page, pageSize, search, ...extraFilters }) => ({
				url: LOGISTIQUE_LIST,
				method: 'GET',
				params: {
					company_id,
					pagination: !!with_pagination,
					page: with_pagination ? page : undefined,
					page_size: with_pagination ? pageSize : undefined,
					search,
					...extraFilters,
				},
			}),
			providesTags: ['Logistique'],
		}),
		getLogistique: builder.query<LogistiqueOrder, { id: number }>({
			query: ({ id }) => ({
				url: `${LOGISTIQUE_ROOT}/${id}/`,
				method: 'GET',
			}),
			providesTags: ['Logistique'],
		}),
		getNumLogistique: builder.query<{ numero_commande: string }, { company_id: number }>({
			query: ({ company_id }) => ({
				url: LOGISTIQUE_GENERATE_NUM,
				method: 'GET',
				params: { company_id },
			}),
			providesTags: ['Logistique'],
		}),
		getLogistiqueResponsables: builder.query<LogistiqueResponsibleOption[], { company_id: number }>({
			query: ({ company_id }) => ({
				url: LOGISTIQUE_RESPONSABLES,
				method: 'GET',
				params: { company_id },
			}),
			providesTags: ['Logistique'],
		}),
		addLogistique: builder.mutation<LogistiqueCreateResponse, { company_id: number; data: Partial<LogistiqueFormValues> | FormData }>({
			query: ({ company_id, data }) => ({
				url: `${LOGISTIQUE_ROOT}/`,
				method: 'POST',
				params: { company_id },
				data: data instanceof FormData ? data : { ...data, company_id },
			}),
			invalidatesTags: ['Logistique', 'Dashboard'],
		}),
		editLogistique: builder.mutation<LogistiqueOrder, { id: number; data: Partial<LogistiqueFormValues> | FormData }>({
			query: ({ id, data }) => ({
				url: `${LOGISTIQUE_ROOT}/${id}/`,
				method: 'PUT',
				data,
			}),
			invalidatesTags: ['Logistique', 'Dashboard'],
		}),
		deleteLogistique: builder.mutation<void | ApiErrorResponseType, { id: number }>({
			query: ({ id }) => ({
				url: `${LOGISTIQUE_ROOT}/${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['Logistique', 'Dashboard'],
		}),
		bulkDeleteLogistique: builder.mutation<void | ApiErrorResponseType, { ids: number[] }>({
			query: ({ ids }) => ({
				url: `${LOGISTIQUE_ROOT}/bulk_delete/`,
				method: 'DELETE',
				data: { ids },
			}),
			invalidatesTags: ['Logistique', 'Dashboard'],
		}),
		patchLogistiqueStatut: builder.mutation<LogistiqueOrder, { id: number; data: { statut: LogistiqueStatut } }>({
			query: ({ id, data }) => ({
				url: `${LOGISTIQUE_SWITCH_STATUT}${id}/`,
				method: 'PATCH',
				data,
			}),
			invalidatesTags: ['Logistique', 'Dashboard'],
		}),
		requestLogistiquePayment: builder.mutation<LogistiqueOrder, { id: number }>({
			query: ({ id }) => ({
				url: `${LOGISTIQUE_ROOT}/${id}/request_payment/`,
				method: 'POST',
			}),
			invalidatesTags: ['Logistique', 'Dashboard'],
		}),
		validateLogistiquePayment: builder.mutation<
			LogistiqueOrder,
			{
				id: number;
				data: {
					date_paiement?: string;
					montant_paiement?: string | number;
					reference_paiement?: string;
					methode_paiement?: LogistiquePaymentMethod;
					swift_file?: File | null;
				} | FormData;
			}
		>({
			query: ({ id, data }) => ({
				url: `${LOGISTIQUE_ROOT}/${id}/validate_payment/`,
				method: 'POST',
				data,
			}),
			invalidatesTags: ['Logistique', 'Dashboard'],
		}),
		rejectLogistiquePayment: builder.mutation<LogistiqueOrder, { id: number; data?: { note?: string } }>({
			query: ({ id, data }) => ({
				url: `${LOGISTIQUE_ROOT}/${id}/reject_payment/`,
				method: 'POST',
				data: data ?? {},
			}),
			invalidatesTags: ['Logistique', 'Dashboard'],
		}),
		sendLogistiqueSwift: builder.mutation<LogistiqueOrder, { id: number }>({
			query: ({ id }) => ({
				url: `${LOGISTIQUE_ROOT}/${id}/send_swift/`,
				method: 'POST',
			}),
			invalidatesTags: ['Logistique', 'Dashboard'],
		}),
	}),
});

export const {
	useGetLogistiqueListQuery,
	useGetLogistiqueQuery,
	useGetNumLogistiqueQuery,
	useGetLogistiqueResponsablesQuery,
	useAddLogistiqueMutation,
	useEditLogistiqueMutation,
	useDeleteLogistiqueMutation,
	useBulkDeleteLogistiqueMutation,
	usePatchLogistiqueStatutMutation,
	useRequestLogistiquePaymentMutation,
	useValidateLogistiquePaymentMutation,
	useRejectLogistiquePaymentMutation,
	useSendLogistiqueSwiftMutation,
} = logistiqueApi;
