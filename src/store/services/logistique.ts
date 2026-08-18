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
	LogistiqueLaunchStatus,
	LogistiqueOrder,
	LogistiqueResponsibleOption,
	LogistiqueSourcePreview,
	LogistiqueStats,
	LogistiqueStatut,
	LogistiqueSupplierProformaReviewAction,
} from '@/types/logistiqueTypes';
import { factureProFormaApi } from '@/store/services/factureProForma';

const LOGISTIQUE_ROOT = process.env.NEXT_PUBLIC_LOGISTIQUE_ROOT || '/logistique';
const LOGISTIQUE_LIST = process.env.NEXT_PUBLIC_LOGISTIQUE_LIST || `${LOGISTIQUE_ROOT}/`;
const LOGISTIQUE_DASHBOARD = process.env.NEXT_PUBLIC_LOGISTIQUE_DASHBOARD || `${LOGISTIQUE_ROOT}/dashboard/`;
const LOGISTIQUE_SWITCH_GLOBAL_STATUS =
	process.env.NEXT_PUBLIC_LOGISTIQUE_SWITCH_GLOBAL_STATUS || `${LOGISTIQUE_ROOT}/switch_global_status/`;
const LOGISTIQUE_GENERATE_NUM =
	process.env.NEXT_PUBLIC_LOGISTIQUE_GENERATE_NUM || `${LOGISTIQUE_ROOT}/generate_num_commande/`;
const LOGISTIQUE_RESPONSABLES = process.env.NEXT_PUBLIC_LOGISTIQUE_RESPONSABLES || `${LOGISTIQUE_ROOT}/responsables/`;
const LOGISTIQUE_SOURCE_PREVIEW =
	process.env.NEXT_PUBLIC_LOGISTIQUE_SOURCE_PREVIEW || `${LOGISTIQUE_ROOT}/source_preview/`;

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
		addLogistique: builder.mutation<
			LogistiqueCreateResponse,
			{ company_id: number; data: Partial<LogistiqueFormValues> | FormData }
		>({
			query: ({ company_id, data }) => ({
				url: `${LOGISTIQUE_ROOT}/`,
				method: 'POST',
				params: { company_id },
				data: data instanceof FormData ? data : { ...data, company_id },
			}),
			invalidatesTags: [{ type: 'Logistique', id: 'LIST' }, 'Dashboard'],
			async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
				try {
					await queryFulfilled;
					dispatch(factureProFormaApi.util.invalidateTags(['FactureProForma']));
				} catch {
					// Keep the source list unchanged when logistics creation fails.
				}
			},
		}),
		editLogistique: builder.mutation<LogistiqueOrder, { id: number; data: Partial<LogistiqueFormValues> | FormData }>({
			query: ({ id, data }) => ({
				url: `${LOGISTIQUE_ROOT}/${id}/`,
				method: 'PUT',
				data,
			}),
			invalidatesTags: (_result, _error, { id }) => [
				{ type: 'Logistique', id: 'LIST' },
				{ type: 'Logistique', id },
				'Dashboard',
			],
		}),
		deleteLogistique: builder.mutation<void | ApiErrorResponseType, { id: number }>({
			query: ({ id }) => ({
				url: `${LOGISTIQUE_ROOT}/${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: [{ type: 'Logistique', id: 'LIST' }, 'Dashboard'],
			async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
				try {
					await queryFulfilled;
					dispatch(factureProFormaApi.util.invalidateTags(['FactureProForma']));
				} catch {}
			},
		}),
		bulkDeleteLogistique: builder.mutation<void | ApiErrorResponseType, { ids: number[] }>({
			query: ({ ids }) => ({
				url: `${LOGISTIQUE_ROOT}/bulk_delete/`,
				method: 'DELETE',
				data: { ids },
			}),
			invalidatesTags: [{ type: 'Logistique', id: 'LIST' }, 'Dashboard'],
			async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
				try {
					await queryFulfilled;
					dispatch(factureProFormaApi.util.invalidateTags(['FactureProForma']));
				} catch {}
			},
		}),
		patchLogistiqueStatut: builder.mutation<
			Pick<LogistiqueOrder, 'statut_global'>,
			{ id: number; data: { statut: LogistiqueStatut } }
		>({
			query: ({ id, data }) => ({
				url: `${LOGISTIQUE_SWITCH_GLOBAL_STATUS}${id}/`,
				method: 'PATCH',
				data,
			}),
			invalidatesTags: (_result, _error, { id }) => [
				{ type: 'Logistique', id: 'LIST' },
				{ type: 'Logistique', id },
				'Dashboard',
			],
		}),
		patchLogistiqueLaunchStatus: builder.mutation<
			LogistiqueOrder,
			{ id: number; data: { statut: LogistiqueLaunchStatus } }
		>({
			query: ({ id, data }) => ({
				url: `${LOGISTIQUE_ROOT}/${id}/launch_status/`,
				method: 'PATCH',
				data,
			}),
			invalidatesTags: (_result, _error, { id }) => [
				{ type: 'Logistique', id: 'LIST' },
				{ type: 'Logistique', id },
				'Dashboard',
			],
		}),
		recordLogistiqueProformaRequest: builder.mutation<
			LogistiqueOrder,
			{ id: number; prochaine_relance_proforma: string }
		>({
			query: ({ id, prochaine_relance_proforma }) => ({
				url: `${LOGISTIQUE_ROOT}/${id}/record_proforma_request/`,
				method: 'POST',
				data: { prochaine_relance_proforma },
			}),
			invalidatesTags: (_result, _error, { id }) => [
				{ type: 'Logistique', id: 'LIST' },
				{ type: 'Logistique', id },
				'Dashboard',
			],
		}),
		reviewLogistiqueSupplierProforma: builder.mutation<
			LogistiqueOrder,
			{ id: number; action: LogistiqueSupplierProformaReviewAction; data: FormData }
		>({
			query: ({ id, action, data }) => {
				data.set('action', action);
				return {
					url: `${LOGISTIQUE_ROOT}/${id}/review_supplier_proforma/`,
					method: 'POST',
					data,
				};
			},
			invalidatesTags: (_result, _error, { id }) => [
				{ type: 'Logistique', id: 'LIST' },
				{ type: 'Logistique', id },
				'Dashboard',
			],
		}),
		requestLogistiquePayment: builder.mutation<
			LogistiqueOrder,
			{
				id: number;
				echeancier: Array<{ date_echeance: string; montant_prevu: string; devise: string }>;
			}
		>({
			query: ({ id, echeancier }) => ({
				url: `${LOGISTIQUE_ROOT}/${id}/request_payment/`,
				method: 'POST',
				data: { echeancier },
			}),
			invalidatesTags: (_result, _error, { id }) => [
				{ type: 'Logistique', id: 'LIST' },
				{ type: 'Logistique', id },
				'Dashboard',
			],
		}),
		retryLogistiquePaymentEmail: builder.mutation<LogistiqueOrder, { id: number }>({
			query: ({ id }) => ({
				url: `${LOGISTIQUE_ROOT}/${id}/retry_payment_email/`,
				method: 'POST',
			}),
			invalidatesTags: (_result, _error, { id }) => [
				{ type: 'Logistique', id: 'LIST' },
				{ type: 'Logistique', id },
				'Dashboard',
			],
		}),
		startLogistiquePayment: builder.mutation<LogistiqueOrder, { id: number; echeance_id: number }>({
			query: ({ id, echeance_id }) => ({
				url: `${LOGISTIQUE_ROOT}/${id}/start_payment/`,
				method: 'POST',
				data: { echeance_id },
			}),
			invalidatesTags: (_result, _error, { id }) => [
				{ type: 'Logistique', id: 'LIST' },
				{ type: 'Logistique', id },
				'Dashboard',
			],
		}),
		recordLogistiquePaymentExecution: builder.mutation<
			LogistiqueOrder,
			{
				id: number;
				data: {
					echeance_id: number;
					date_paiement: string;
					montant_paye: string;
					devise_paiement: string;
					banque_paiement: string;
					reference_paiement: string;
					methode_paiement: string;
					commentaire_paiement: string;
				};
			}
		>({
			query: ({ id, data }) => ({
				url: `${LOGISTIQUE_ROOT}/${id}/record_payment_execution/`,
				method: 'POST',
				data,
			}),
			invalidatesTags: (_result, _error, { id }) => [
				{ type: 'Logistique', id: 'LIST' },
				{ type: 'Logistique', id },
				'Dashboard',
			],
		}),
		validateLogistiquePayment: builder.mutation<
			LogistiqueOrder,
			{
				id: number;
				data: FormData;
			}
		>({
			query: ({ id, data }) => ({
				url: `${LOGISTIQUE_ROOT}/${id}/validate_payment/`,
				method: 'POST',
				data,
			}),
			invalidatesTags: (_result, _error, { id }) => [
				{ type: 'Logistique', id: 'LIST' },
				{ type: 'Logistique', id },
				'Dashboard',
			],
		}),
		rejectLogistiquePayment: builder.mutation<LogistiqueOrder, { id: number; data?: { note?: string } }>({
			query: ({ id, data }) => ({
				url: `${LOGISTIQUE_ROOT}/${id}/reject_payment/`,
				method: 'POST',
				data: data ?? {},
			}),
			invalidatesTags: (_result, _error, { id }) => [
				{ type: 'Logistique', id: 'LIST' },
				{ type: 'Logistique', id },
				'Dashboard',
			],
		}),
		sendLogistiqueSwift: builder.mutation<LogistiqueOrder, { id: number; echeance_id: number }>({
			query: ({ id, echeance_id }) => ({
				url: `${LOGISTIQUE_ROOT}/${id}/send_swift/`,
				method: 'POST',
				data: { echeance_id },
			}),
			invalidatesTags: (_result, _error, { id }) => [
				{ type: 'Logistique', id: 'LIST' },
				{ type: 'Logistique', id },
				'Dashboard',
			],
		}),
		confirmLogistiquePaymentReceipt: builder.mutation<LogistiqueOrder, { id: number; echeance_id: number }>({
			query: ({ id, echeance_id }) => ({
				url: `${LOGISTIQUE_ROOT}/${id}/confirm_payment_receipt/`,
				method: 'POST',
				data: { echeance_id },
			}),
			invalidatesTags: (_result, _error, { id }) => [
				{ type: 'Logistique', id: 'LIST' },
				{ type: 'Logistique', id },
				'Dashboard',
			],
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
	usePatchLogistiqueLaunchStatusMutation,
	useRecordLogistiqueProformaRequestMutation,
	useReviewLogistiqueSupplierProformaMutation,
	useRequestLogistiquePaymentMutation,
	useRetryLogistiquePaymentEmailMutation,
	useStartLogistiquePaymentMutation,
	useRecordLogistiquePaymentExecutionMutation,
	useValidateLogistiquePaymentMutation,
	useRejectLogistiquePaymentMutation,
	useSendLogistiqueSwiftMutation,
	useConfirmLogistiquePaymentReceiptMutation,
} = logistiqueApi;
