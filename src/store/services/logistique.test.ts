import { logistiqueApi } from '@/store/services/logistique';
import { setupApiStore } from '@/store/setupApiStore';

const logistiqueEnvKeys = [
	'NEXT_PUBLIC_LOGISTIQUE_DASHBOARD',
	'NEXT_PUBLIC_LOGISTIQUE_GENERATE_NUM',
	'NEXT_PUBLIC_LOGISTIQUE_LIST',
	'NEXT_PUBLIC_LOGISTIQUE_RESPONSABLES',
	'NEXT_PUBLIC_LOGISTIQUE_ROOT',
	'NEXT_PUBLIC_LOGISTIQUE_SOURCE_PREVIEW',
	'NEXT_PUBLIC_LOGISTIQUE_SWITCH_GLOBAL_STATUS',
	'NEXT_PUBLIC_LOGISTIQUE_SWITCH_STATUT',
] as const;
const originalLogistiqueEnv = Object.fromEntries(logistiqueEnvKeys.map((key) => [key, process.env[key]]));
const mockBaseQuery = jest.fn(async (request: { url: string }) => {
	void request;
	return { data: { ok: true, logistics_order: 1 } };
});

beforeAll(() => {
	logistiqueEnvKeys.forEach((key) => delete process.env[key]);
});

afterAll(() => {
	logistiqueEnvKeys.forEach((key) => {
		const value = originalLogistiqueEnv[key];
		if (value === undefined) {
			delete process.env[key];
		} else {
			process.env[key] = value;
		}
	});
});

jest.mock('@/utils/axiosBaseQuery', () => ({
	axiosBaseQuery: () => (request: { url: string }) => mockBaseQuery(request),
}));

describe('logistiqueApi endpoints', () => {
	const storeRef = setupApiStore(logistiqueApi);
	const formData = () => new FormData();
	const endpointCalls: Array<[string, () => Promise<unknown>]> = [
		[
			'getLogistiqueSupplier',
			async () =>
				storeRef.store
					.dispatch(logistiqueApi.endpoints.getLogistiqueSupplier.initiate({ id: 8, company_id: 1 }))
					.unwrap(),
		],
		[
			'addLogistiqueSupplier',
			async () =>
				storeRef.store
					.dispatch(logistiqueApi.endpoints.addLogistiqueSupplier.initiate({ company_id: 1, nom: 'Test', email: '' }))
					.unwrap(),
		],
		[
			'editLogistiqueSupplier',
			async () =>
				storeRef.store
					.dispatch(
						logistiqueApi.endpoints.editLogistiqueSupplier.initiate({ id: 8, company_id: 1, nom: 'Test', email: '' }),
					)
					.unwrap(),
		],
		[
			'deleteLogistiqueSupplier',
			async () =>
				storeRef.store
					.dispatch(logistiqueApi.endpoints.deleteLogistiqueSupplier.initiate({ id: 8, company_id: 1 }))
					.unwrap(),
		],
		[
			'bulkDeleteLogistiqueSuppliers',
			async () =>
				storeRef.store
					.dispatch(logistiqueApi.endpoints.bulkDeleteLogistiqueSuppliers.initiate({ company_id: 1, ids: [7, 8] }))
					.unwrap(),
		],
		[
			'purchaseAction',
			async () =>
				storeRef.store
					.dispatch(
						logistiqueApi.endpoints.purchaseAction.initiate({
							id: 1,
							data: { action: 'reception', lignes: [{ logistics_line: 2, article: 3, quantity: '2', emplacement: 4 }] },
						}),
					)
					.unwrap(),
		],
		[
			'requestPurchasePayment',
			async () =>
				storeRef.store
					.dispatch(
						logistiqueApi.endpoints.requestPurchasePayment.initiate({
							id: 1,
							echeance_id: 2,
							date_echeance: '2026-10-16',
						}),
					)
					.unwrap(),
		],
		[
			'extractImportTitle',
			async () =>
				storeRef.store
					.dispatch(logistiqueApi.endpoints.extractImportTitle.initiate({ id: 1, data: formData() }))
					.unwrap(),
		],
		[
			'getLogistiqueList',
			async () =>
				storeRef.store.dispatch(logistiqueApi.endpoints.getLogistiqueList.initiate({ company_id: 1 })).unwrap(),
		],
		[
			'getLogistiqueDashboard',
			async () =>
				storeRef.store.dispatch(logistiqueApi.endpoints.getLogistiqueDashboard.initiate({ company_id: 1 })).unwrap(),
		],
		[
			'getLogistique',
			async () => storeRef.store.dispatch(logistiqueApi.endpoints.getLogistique.initiate({ id: 1 })).unwrap(),
		],
		[
			'getNumLogistique',
			async () =>
				storeRef.store.dispatch(logistiqueApi.endpoints.getNumLogistique.initiate({ company_id: 1 })).unwrap(),
		],
		[
			'getLogistiqueResponsables',
			async () =>
				storeRef.store.dispatch(logistiqueApi.endpoints.getLogistiqueResponsables.initiate({ company_id: 1 })).unwrap(),
		],
		[
			'getLogistiqueSuppliers',
			async () =>
				storeRef.store.dispatch(logistiqueApi.endpoints.getLogistiqueSuppliers.initiate({ company_id: 1 })).unwrap(),
		],
		[
			'getLogistiqueSourcePreview',
			async () =>
				storeRef.store
					.dispatch(logistiqueApi.endpoints.getLogistiqueSourcePreview.initiate({ company_id: 1, proformas: [2] }))
					.unwrap(),
		],
		[
			'addLogistique',
			async () =>
				storeRef.store.dispatch(logistiqueApi.endpoints.addLogistique.initiate({ company_id: 1, data: {} })).unwrap(),
		],
		[
			'editLogistique',
			async () =>
				storeRef.store.dispatch(logistiqueApi.endpoints.editLogistique.initiate({ id: 1, data: {} })).unwrap(),
		],
		[
			'deleteLogistique',
			async () => storeRef.store.dispatch(logistiqueApi.endpoints.deleteLogistique.initiate({ id: 1 })).unwrap(),
		],
		[
			'bulkDeleteLogistique',
			async () =>
				storeRef.store.dispatch(logistiqueApi.endpoints.bulkDeleteLogistique.initiate({ ids: [1, 2] })).unwrap(),
		],
		[
			'patchLogistiqueStatut',
			async () =>
				storeRef.store
					.dispatch(logistiqueApi.endpoints.patchLogistiqueStatut.initiate({ id: 1, data: { statut: 'Brouillon' } }))
					.unwrap(),
		],
		[
			'patchLogistiqueWorkflowStatus',
			async () =>
				storeRef.store
					.dispatch(
						logistiqueApi.endpoints.patchLogistiqueWorkflowStatus.initiate({ id: 1, data: { statut: 'Proforma' } }),
					)
					.unwrap(),
		],
		[
			'patchLogistiqueLaunchStatus',
			async () =>
				storeRef.store
					.dispatch(
						logistiqueApi.endpoints.patchLogistiqueLaunchStatus.initiate({ id: 1, data: { statut: 'En cours' } }),
					)
					.unwrap(),
		],
		[
			'recordLogistiqueProformaRequest',
			async () =>
				storeRef.store
					.dispatch(
						logistiqueApi.endpoints.recordLogistiqueProformaRequest.initiate({
							id: 1,
							prochaine_relance_proforma: '2026-09-20',
						}),
					)
					.unwrap(),
		],
		[
			'reviewLogistiqueSupplierProforma',
			async () =>
				storeRef.store
					.dispatch(
						logistiqueApi.endpoints.reviewLogistiqueSupplierProforma.initiate({
							id: 1,
							action: 'control',
							data: formData(),
						}),
					)
					.unwrap(),
		],
		[
			'requestLogistiquePayment',
			async () =>
				storeRef.store
					.dispatch(
						logistiqueApi.endpoints.requestLogistiquePayment.initiate({
							id: 1,
							echeancier: [{ date_echeance: '2026-09-20', pourcentage: '100' }],
						}),
					)
					.unwrap(),
		],
		[
			'retryLogistiquePaymentEmail',
			async () =>
				storeRef.store.dispatch(logistiqueApi.endpoints.retryLogistiquePaymentEmail.initiate({ id: 1 })).unwrap(),
		],
		[
			'startLogistiquePayment',
			async () =>
				storeRef.store
					.dispatch(logistiqueApi.endpoints.startLogistiquePayment.initiate({ id: 1, echeance_id: 2 }))
					.unwrap(),
		],
		[
			'recordLogistiquePaymentExecution',
			async () =>
				storeRef.store
					.dispatch(
						logistiqueApi.endpoints.recordLogistiquePaymentExecution.initiate({
							id: 1,
							data: {
								echeance_id: 2,
								date_paiement: '2026-09-19',
								montant_paye: '100',
								devise_paiement: 'MAD',
								banque_paiement: 'Bank',
								reference_paiement: 'REF-1',
								methode_paiement: 'Virement',
								commentaire_paiement: '',
							},
						}),
					)
					.unwrap(),
		],
		[
			'validateLogistiquePayment',
			async () =>
				storeRef.store
					.dispatch(logistiqueApi.endpoints.validateLogistiquePayment.initiate({ id: 1, data: formData() }))
					.unwrap(),
		],
		[
			'rejectLogistiquePayment',
			async () =>
				storeRef.store
					.dispatch(
						logistiqueApi.endpoints.rejectLogistiquePayment.initiate({ id: 1, data: { note: 'Missing proof' } }),
					)
					.unwrap(),
		],
		[
			'setLogistiqueProofEmailStatus',
			async () =>
				storeRef.store
					.dispatch(
						logistiqueApi.endpoints.setLogistiqueProofEmailStatus.initiate({
							id: 1,
							echeance_id: 2,
							email_envoye: true,
						}),
					)
					.unwrap(),
		],
		[
			'confirmLogistiquePaymentReceipt',
			async () =>
				storeRef.store
					.dispatch(logistiqueApi.endpoints.confirmLogistiquePaymentReceipt.initiate({ id: 1, echeance_id: 2 }))
					.unwrap(),
		],
		[
			'addLogistiqueProcessNote',
			async () =>
				storeRef.store
					.dispatch(logistiqueApi.endpoints.addLogistiqueProcessNote.initiate({ id: 1, data: formData() }))
					.unwrap(),
		],
	];

	it.each(endpointCalls)('%s completes without an API error', async (_name, callEndpoint) => {
		mockBaseQuery.mockClear();
		await expect(callEndpoint()).resolves.toEqual(expect.objectContaining({ ok: true }));
		const [request] = mockBaseQuery.mock.calls.at(-1) ?? [];
		expect(request?.url).toMatch(/^\/logistique\//);
		expect(request?.url).not.toContain('undefined');
	});

	it('sends supplier bulk deletion with the selected IDs and company scope', async () => {
		mockBaseQuery.mockClear();
		await storeRef.store
			.dispatch(logistiqueApi.endpoints.bulkDeleteLogistiqueSuppliers.initiate({ company_id: 2, ids: [7, 8] }))
			.unwrap();
		expect(mockBaseQuery).toHaveBeenCalledWith({
			url: '/logistique/fournisseurs/bulk_delete/',
			method: 'DELETE',
			params: { company_id: 2 },
			data: { ids: [7, 8] },
		});
	});

	it('sends supplier sorting, search and filters with server pagination', async () => {
		mockBaseQuery.mockClear();
		await storeRef.store
			.dispatch(
				logistiqueApi.endpoints.getLogistiqueSuppliers.initiate({
					company_id: 2,
					with_pagination: true,
					page: 3,
					pageSize: 25,
					ordering: '-total_dossiers',
					search: 'Alpha',
					email__isempty: 'false',
				}),
			)
			.unwrap();
		expect(mockBaseQuery).toHaveBeenLastCalledWith(
			expect.objectContaining({
				url: '/logistique/fournisseurs/',
				method: 'GET',
				params: {
					company_id: 2,
					pagination: true,
					page: 3,
					page_size: 25,
					ordering: '-total_dossiers',
					search: 'Alpha',
					email__isempty: 'false',
				},
			}),
		);
	});

	it('exposes every tested endpoint', () => {
		expect(Object.keys(logistiqueApi.endpoints)).toHaveLength(endpointCalls.length);
	});
});
