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
	LogistiqueSourcePreview,
	LogistiqueStats,
	LogistiqueStatut,
} from '@/types/logistiqueTypes';

const LOGISTIQUE_ROOT = process.env.NEXT_PUBLIC_LOGISTIQUE_ROOT || '/logistique';
const LOGISTIQUE_LIST = process.env.NEXT_PUBLIC_LOGISTIQUE_LIST || `${LOGISTIQUE_ROOT}/`;
const LOGISTIQUE_DASHBOARD = process.env.NEXT_PUBLIC_LOGISTIQUE_DASHBOARD || `${LOGISTIQUE_ROOT}/dashboard/`;
const LOGISTIQUE_SWITCH_STATUT = process.env.NEXT_PUBLIC_LOGISTIQUE_SWITCH_STATUT || `${LOGISTIQUE_ROOT}/switch_statut/`;
const LOGISTIQUE_GENERATE_NUM = process.env.NEXT_PUBLIC_LOGISTIQUE_GENERATE_NUM || `${LOGISTIQUE_ROOT}/generate_num_commande/`;
const LOGISTIQUE_RESPONSABLES = process.env.NEXT_PUBLIC_LOGISTIQUE_RESPONSABLES || `${LOGISTIQUE_ROOT}/responsables/`;
const LOGISTIQUE_SOURCE_PREVIEW = process.env.NEXT_PUBLIC_LOGISTIQUE_SOURCE_PREVIEW || `${LOGISTIQUE_ROOT}/source_preview/`;

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
			providesTags: [{ type: 'Logistique', id: 'LIST' }],
		}),
		getLogistiqueDashboard: builder.query<LogistiqueStats, { company_id: number }>({
			query: ({ company_id }) => ({
				url: LOGISTIQUE_DASHBOARD,
				method: 'GET',
				params: { company_id },
			}),
			providesTags: ['Dashboard'],
		}),
		getLogistique: builder.query<LogistiqueOrder, { id: number }>({
			query: ({ id }) => ({
				url: `${LOGISTIQUE_ROOT}/${id}/`,
				method: 'GET',
			}),
			providesTags: (_result, _error, { id }) => [{ type: 'Logistique', id }],
		}),
		getNumLogistique: builder.query<{ numero_commande: string }, { company_id: number }>({
			query: ({ company_id }) => ({
				url: LOGISTIQUE_GENERATE_NUM,
				method: 'GET',
				params: { company_id },
			}),
			providesTags: [{ type: 'Logistique', id: 'LIST' }],
		}),
		getLogistiqueResponsables: builder.query<LogistiqueResponsibleOption[], { company_id: number }>({
			query: ({ company_id }) => ({
				url: LOGISTIQUE_RESPONSABLES,
				method: 'GET',
				params: { company_id },
			}),
			providesTags: [{ type: 'Logistique', id: 'LIST' }],
		}),
		getLogistiqueSourcePreview: builder.query<LogistiqueSourcePreview, { company_id: number; proformas: number[] }>({
			query: ({ company_id, proformas }) => ({
				url: LOGISTIQUE_SOURCE_PREVIEW,
				method: 'POST',
				data: { company_id, proformas },
			}),
		}),
		addLogistique: builder.mutation<LogistiqueCreateResponse, { company_id: number; data: Partial<LogistiqueFormValues> | FormData }>({
			query: ({ company_id, data }) => ({
				url: `${LOGISTIQUE_ROOT}/`,
				method: 'POST',
				params: { company_id },
				data: data instanceof FormData ? data : { ...data, company_id },
			}),
			invalidatesTags: [{ type: 'Logistique', id: 'LIST' }, 'Dashboard'],
		}),
		editLogistique: builder.mutation<LogistiqueOrder, { id: number; data: Partial<LogistiqueFormValues> | FormData }>({
			query: ({ id, data }) => ({
				url: `${LOGISTIQUE_ROOT}/${id}/`,
				method: 'PUT',
				data,
			}),
			invalidatesTags: (_result, _error, { id }) => [{ type: 'Logistique', id: 'LIST' }, { type: 'Logistique', id }, 'Dashboard'],
		}),
		deleteLogistique: builder.mutation<void | ApiErrorResponseType, { id: number }>({
			query: ({ id }) => ({
				url: `${LOGISTIQUE_ROOT}/${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: [{ type: 'Logistique', id: 'LIST' }, 'Dashboard'],
		}),
		bulkDeleteLogistique: builder.mutation<void | ApiErrorResponseType, { ids: number[] }>({
			query: ({ ids }) => ({
				url: `${LOGISTIQUE_ROOT}/bulk_delete/`,
				method: 'DELETE',
				data: { ids },
			}),
			invalidatesTags: [{ type: 'Logistique', id: 'LIST' }, 'Dashboard'],
		}),
		patchLogistiqueStatut: builder.mutation<LogistiqueOrder, { id: number; data: { statut: LogistiqueStatut } }>({
			query: ({ id, data }) => ({
				url: `${LOGISTIQUE_SWITCH_STATUT}${id}/`,
				method: 'PATCH',
				data,
			}),
			invalidatesTags: (_result, _error, { id }) => [{ type: 'Logistique', id: 'LIST' }, { type: 'Logistique', id }, 'Dashboard'],
		}),
		requestLogistiquePayment: builder.mutation<LogistiqueOrder, { id: number }>({
			query: ({ id }) => ({
				url: `${LOGISTIQUE_ROOT}/${id}/request_payment/`,
				method: 'POST',
			}),
			invalidatesTags: (_result, _error, { id }) => [{ type: 'Logistique', id: 'LIST' }, { type: 'Logistique', id }, 'Dashboard'],
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
			invalidatesTags: (_result, _error, { id }) => [{ type: 'Logistique', id: 'LIST' }, { type: 'Logistique', id }, 'Dashboard'],
		}),
		rejectLogistiquePayment: builder.mutation<LogistiqueOrder, { id: number; data?: { note?: string } }>({
			query: ({ id, data }) => ({
				url: `${LOGISTIQUE_ROOT}/${id}/reject_payment/`,
				method: 'POST',
				data: data ?? {},
			}),
			invalidatesTags: (_result, _error, { id }) => [{ type: 'Logistique', id: 'LIST' }, { type: 'Logistique', id }, 'Dashboard'],
		}),
		sendLogistiqueSwift: builder.mutation<LogistiqueOrder, { id: number }>({
			query: ({ id }) => ({
				url: `${LOGISTIQUE_ROOT}/${id}/send_swift/`,
				method: 'POST',
			}),
			invalidatesTags: (_result, _error, { id }) => [{ type: 'Logistique', id: 'LIST' }, { type: 'Logistique', id }, 'Dashboard'],
		}),
	}),
});

export const {
	useGetLogistiqueListQuery,
	useGetLogistiqueDashboardQuery,
	useGetLogistiqueQuery,
	useGetNumLogistiqueQuery,
	useGetLogistiqueResponsablesQuery,
	useGetLogistiqueSourcePreviewQuery,
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
