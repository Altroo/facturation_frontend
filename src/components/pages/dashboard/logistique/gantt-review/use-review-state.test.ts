import { act, renderHook } from '@testing-library/react';
import { useReviewState } from './use-review-state';
import { useGetLogisticsFieldReviewQuery, useSaveLogisticsFieldReviewMutation } from '@/store/services/logistique';
import type { LogisticsFieldReview } from '@/types/logistiqueTypes';

jest.mock('@/store/services/logistique', () => ({
	useGetLogisticsFieldReviewQuery: jest.fn(),
	useSaveLogisticsFieldReviewMutation: jest.fn(),
}));
const getQuery = jest.mocked(useGetLogisticsFieldReviewQuery);
const saveMutation = jest.fn();
const unwrap = jest.fn();
const saved: LogisticsFieldReview = {
	decisions: { '1-1': { choice: 'Conserver', note: 'Déjà enregistré' } },
	updated_at: '2026-10-06T12:00:00Z',
	can_edit: true,
};
let query: { currentData?: LogisticsFieldReview; isError: boolean; isFetching: boolean; refetch: jest.Mock };
beforeEach(() => {
	jest.clearAllMocks();
	query = { currentData: saved, isError: false, isFetching: false, refetch: jest.fn() };
	getQuery.mockImplementation(() => query as ReturnType<typeof useGetLogisticsFieldReviewQuery>);
	saveMutation.mockReturnValue({ unwrap });
	jest
		.mocked(useSaveLogisticsFieldReviewMutation)
		.mockReturnValue([saveMutation, { isLoading: false }] as unknown as ReturnType<
			typeof useSaveLogisticsFieldReviewMutation
		>);
});

it('loads the shared review and requests fresh data when reopening or focusing', () => {
	const { result } = renderHook(() => useReviewState(7, true));
	expect(result.current.review.decisions).toEqual(saved.decisions);
	expect(result.current.dirty).toBe(false);
	expect(getQuery).toHaveBeenCalledWith(
		{ company_id: 7 },
		{ skip: false, refetchOnMountOrArgChange: true, refetchOnFocus: true },
	);
});

it('sends only changed properties and immediately displays the server merge', async () => {
	const { result } = renderHook(() => useReviewState(7, true));
	act(() => result.current.setDecision('1-1', { note: 'Mon commentaire' }));
	const merged = {
		...saved,
		decisions: {
			'1-1': { choice: 'Modifier', note: 'Mon commentaire' },
			'1-2': { choice: 'Supprimer', note: 'Autre compte' },
		},
		updated_at: '2026-10-06T12:01:00Z',
	};
	unwrap.mockResolvedValueOnce(merged);
	await act(() => result.current.save());
	expect(saveMutation).toHaveBeenCalledWith({ company_id: 7, decisions: { '1-1': { note: 'Mon commentaire' } } });
	expect(result.current.review.decisions).toEqual(merged.decisions);
	expect(result.current.dirty).toBe(false);
});

it('keeps multiple edits after a failed save and retries successfully', async () => {
	const { result } = renderHook(() => useReviewState(7, true));
	act(() => result.current.setDecision('1-1', { note: 'Premier' }));
	act(() => result.current.setDecision('1-2', { choice: 'Supprimer' }));
	unwrap.mockRejectedValueOnce(new Error('offline'));
	await act(() => result.current.save());
	expect(result.current.saveError).toBe(true);
	expect(result.current.dirty).toBe(true);
	expect(result.current.review.decisions['1-1'].note).toBe('Premier');
	unwrap.mockResolvedValueOnce({ ...saved, decisions: result.current.review.decisions });
	await act(() => result.current.save());
	expect(result.current.saveError).toBe(false);
	expect(result.current.dirty).toBe(false);
});

it('does not show a new editable form when loading fails', () => {
	query = { ...query, currentData: undefined, isError: true };
	const { result } = renderHook(() => useReviewState(7, true));
	expect(result.current.ready).toBe(false);
	expect(result.current.loadError).toBe(true);
	act(() => result.current.setDecision('1-1', { note: 'Blocked' }));
	expect(result.current.dirty).toBe(false);
});

it('keeps unsaved comments when a newer shared review is fetched', () => {
	const { result, rerender } = renderHook(() => useReviewState(7, true));
	act(() => result.current.setDecision('1-1', { note: 'Brouillon' }));
	query.currentData = { ...saved, decisions: { '1-1': { choice: 'Supprimer', note: 'Autre' } } };
	rerender();
	expect(result.current.review.decisions['1-1']).toEqual({ choice: 'Supprimer', note: 'Brouillon' });
});

it('blocks duplicate saves and edits while a save is in flight', async () => {
	let finish!: (value: LogisticsFieldReview) => void;
	unwrap.mockReturnValueOnce(
		new Promise<LogisticsFieldReview>((resolve) => {
			finish = resolve;
		}),
	);
	const { result } = renderHook(() => useReviewState(7, true));
	act(() => result.current.setDecision('1-1', { note: 'À enregistrer' }));
	let pending!: Promise<void>;
	act(() => {
		pending = result.current.save();
	});
	act(() => result.current.setDecision('1-1', { note: 'Too late' }));
	await act(() => result.current.save());
	expect(saveMutation).toHaveBeenCalledTimes(1);
	expect(result.current.review.decisions['1-1'].note).toBe('À enregistrer');
	await act(async () => {
		finish(saved);
		await pending;
	});
});

it('read-only members can view saved decisions but cannot edit', () => {
	query.currentData = { ...saved, can_edit: false };
	const { result } = renderHook(() => useReviewState(7, true));
	expect(result.current.review.decisions).toEqual(saved.decisions);
	act(() => result.current.setDecision('1-1', { choice: 'Supprimer' }));
	expect(result.current.dirty).toBe(false);
});

it('refreshes the server review when the window receives focus', () => {
	renderHook(() => useReviewState(7, true));
	act(() => window.dispatchEvent(new Event('focus')));
	expect(query.refetch).toHaveBeenCalledTimes(1);
});

it('uses refreshed permissions even after a successful save with the same timestamp', async () => {
	const { result, rerender } = renderHook(() => useReviewState(7, true));
	act(() => result.current.setDecision('1-1', { note: 'Saved' }));
	unwrap.mockResolvedValueOnce(saved);
	await act(() => result.current.save());
	query.currentData = { ...saved, can_edit: false };
	rerender();
	expect(result.current.canEdit).toBe(false);
	act(() => result.current.setDecision('1-1', { note: 'Blocked' }));
	expect(result.current.dirty).toBe(false);
});

it('allows cancelling a company switch while edits are unsaved', () => {
	const confirm = jest.spyOn(window, 'confirm').mockReturnValue(false);
	const { result } = renderHook(() => useReviewState(7, true));
	act(() => result.current.setDecision('1-1', { note: 'Unsaved' }));
	const list = document.createElement('div');
	list.setAttribute('data-company-tabs', '');
	const tab = document.createElement('button');
	tab.setAttribute('role', 'tab');
	tab.setAttribute('aria-selected', 'false');
	list.appendChild(tab);
	document.body.appendChild(list);
	const click = new MouseEvent('click', { bubbles: true, cancelable: true });
	act(() => tab.dispatchEvent(click));
	expect(confirm).toHaveBeenCalledTimes(1);
	expect(click.defaultPrevented).toBe(true);
	list.remove();
	confirm.mockRestore();
});
