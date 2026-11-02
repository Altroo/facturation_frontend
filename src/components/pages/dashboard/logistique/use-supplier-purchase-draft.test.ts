import { act, renderHook, waitFor } from '@testing-library/react';
import { useGetArticleQuery } from '@/store/services/article';
import { purchaseDraft } from '@/utils/helpers';
import type { PurchaseFormValues, SupplierPurchaseDraftOptions } from '@/types/supplierPurchaseTypes';
import { useSupplierPurchaseDraft } from './use-supplier-purchase-draft';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
	useRouter: () => ({ push: mockPush }),
	useSearchParams: () => new URLSearchParams(window.location.search),
}));
jest.mock('@/store/services/article', () => ({ useGetArticleQuery: jest.fn() }));
jest.mock('@/utils/helpers', () => ({ purchaseDraft: jest.fn() }));

const values = () => ({ devise_proforma_fournisseur: 'EUR', lignes: [] }) as unknown as PurchaseFormValues;
const options = (): SupplierPurchaseDraftOptions => ({
	company_id: 12,
	id: 7,
	token: 'token',
	mode: 'proforma',
	userId: 27,
	formik: { values: values(), setValues: jest.fn().mockResolvedValue(undefined) },
	setApiError: jest.fn(),
});

beforeEach(() => {
	jest.clearAllMocks();
	window.history.replaceState(
		null,
		'',
		'/dashboard/logistique/7/edit?company_id=12&etape=proforma&brouillon=existing&article_id=9',
	);
	jest.mocked(useGetArticleQuery).mockReturnValue({ refetch: jest.fn() });
	jest.mocked(purchaseDraft).mockResolvedValue(values());
});

it('waits for the returned article before restoring the draft and appending it once', async () => {
	const props = options();
	const { result, rerender } = renderHook(() => useSupplierPurchaseDraft(props));
	expect(result.current.draftReady).toBe(false);
	expect(purchaseDraft).not.toHaveBeenCalled();
	jest.mocked(useGetArticleQuery).mockReturnValue({
		refetch: jest.fn(),
		data: {
			id: 9,
			company: 12,
			reference: 'ART009',
			designation: 'Table',
			devise_prix_achat: 'EUR',
			prix_achat: '25.00',
			emplacement: 3,
		},
	});
	rerender();
	await waitFor(() => expect(result.current.draftReady).toBe(true));
	expect(props.formik.setValues).toHaveBeenCalledWith(
		expect.objectContaining({
			lignes: [expect.objectContaining({ article: 9, quantity: '1', prix_achat: '25.00', expected_emplacement: 3 })],
		}),
	);
	rerender();
	expect(props.formik.setValues).toHaveBeenCalledTimes(1);
});

it('restores the draft without accepting an article from another company', async () => {
	const props = options();
	jest
		.mocked(useGetArticleQuery)
		.mockReturnValue({ refetch: jest.fn(), data: { id: 9, company: 99, reference: 'PRIVATE' } });
	const { result } = renderHook(() => useSupplierPurchaseDraft(props));
	await waitFor(() => expect(result.current.draftReady).toBe(true));
	expect(props.formik.setValues).toHaveBeenCalledWith(expect.objectContaining({ lignes: [] }));
	expect(props.setApiError).toHaveBeenCalledWith(expect.stringContaining('n’appartient pas à cette société'));
});

it('does not duplicate an existing article or replace its entered quantity and price', async () => {
	const draft = values();
	draft.lignes = [
		{
			article: 9,
			article_reference: 'ART009',
			designation: 'Table',
			quantity: '150',
			prix_achat: '22',
			expected_emplacement: 3,
		},
	];
	jest.mocked(purchaseDraft).mockResolvedValue(draft);
	jest
		.mocked(useGetArticleQuery)
		.mockReturnValue({ refetch: jest.fn(), data: { id: 9, company: 12, reference: 'ART009' } });
	const props = options();
	const { result } = renderHook(() => useSupplierPurchaseDraft(props));
	await waitFor(() => expect(result.current.draftReady).toBe(true));
	expect(props.formik.setValues).toHaveBeenCalledWith(draft);
	expect(draft.lignes).toHaveLength(1);
	expect(draft.lignes[0].quantity).toBe('150');
});

it('keeps the form open if storing its draft fails', async () => {
	window.history.replaceState(null, '', '/dashboard/logistique/7/edit?company_id=12&etape=proforma');
	jest.mocked(purchaseDraft).mockRejectedValue(new Error('Storage unavailable'));
	const props = options();
	const { result } = renderHook(() => useSupplierPurchaseDraft(props));
	await act(() => result.current.addNewArticle());
	expect(mockPush).not.toHaveBeenCalled();
	expect(props.setApiError).toHaveBeenCalledWith(expect.stringContaining('Le formulaire reste ouvert'));
});
