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
	proposed_fields: {},
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

it('saves new proposals and decisions together and preserves a failed save', async () => {
	const { result } = renderHook(() => useReviewState(7, true));
	act(() => result.current.addProposal('2'));
	const id = Object.keys(result.current.review.proposed_fields)[0];
	act(() => result.current.setProposal(id, { name: 'Mode de livraison', description: 'Choisir une seule réponse' }));
	act(() => result.current.setDecision('1-1', { choice: 'Modifier' }));
	unwrap.mockRejectedValueOnce(new Error('offline'));
	await act(() => result.current.save());
	expect(result.current.dirty).toBe(true);
	expect(result.current.review.proposed_fields[id].name).toBe('Mode de livraison');
	unwrap.mockResolvedValueOnce({ ...saved, ...result.current.review });
	await act(() => result.current.save());
	expect(saveMutation).toHaveBeenLastCalledWith({
		company_id: 7,
		decisions: { '1-1': { choice: 'Modifier' } },
		proposed_fields: { [id]: { stage: '2', name: 'Mode de livraison', description: 'Choisir une seule réponse' } },
	});
	expect(result.current.dirty).toBe(false);
});

it('requires a name, including when the unnamed proposal is in another step', async () => {
	const { result } = renderHook(() => useReviewState(7, true));
	act(() => result.current.addProposal('8'));
	await act(() => result.current.save());
	expect(saveMutation).not.toHaveBeenCalled();
	expect(result.current.invalidProposalStages).toEqual(['8']);
	const id = Object.keys(result.current.review.proposed_fields)[0];
	act(() => result.current.setProposal(id, { name: 'Date' }));
	expect(result.current.invalidProposalStages).toEqual([]);
});

it('sends partial proposal edits, preserves other additions, and removes only the selected proposal', async () => {
	const field = { stage: 'common', name: 'Date', description: 'Initial' };
	query.currentData = { ...saved, proposed_fields: { first: field } };
	const { result, rerender } = renderHook(() => useReviewState(7, true));
	act(() => result.current.setProposal('first', { description: 'Ma description' }));
	query.currentData = { ...saved, proposed_fields: { first: { ...field, name: 'Autre nom' }, second: field } };
	rerender();
	expect(result.current.review.proposed_fields.first).toEqual({
		...field,
		name: 'Autre nom',
		description: 'Ma description',
	});
	unwrap.mockResolvedValueOnce({ ...saved, ...result.current.review });
	await act(() => result.current.save());
	expect(saveMutation).toHaveBeenLastCalledWith({
		company_id: 7,
		proposed_fields: { first: { description: 'Ma description' } },
	});
	act(() => result.current.removeProposal('first'));
	expect(Object.keys(result.current.review.proposed_fields)).toEqual(['second']);
	unwrap.mockResolvedValueOnce({ ...saved, ...result.current.review });
	await act(() => result.current.save());
	expect(saveMutation).toHaveBeenLastCalledWith({ company_id: 7, proposed_fields: { first: null } });
});

it('keeps an edited proposal visible if another reviewer deletes it before saving', () => {
	const field = { stage: '1', name: 'Date', description: 'Initial' };
	query.currentData = { ...saved, proposed_fields: { first: field } };
	const { result, rerender } = renderHook(() => useReviewState(7, true));
	act(() => result.current.setProposal('first', { description: 'Brouillon' }));
	query.currentData = { ...saved, proposed_fields: {} };
	rerender();
	expect(result.current.review.proposed_fields.first).toEqual({ ...field, description: 'Brouillon' });
});

it('prevents read-only members from adding, editing, or removing proposals', () => {
	query.currentData = {
		...saved,
		can_edit: false,
		proposed_fields: { first: { stage: '1', name: 'Date', description: '' } },
	};
	const { result } = renderHook(() => useReviewState(7, true));
	act(() => {
		result.current.addProposal('1');
		result.current.setProposal('first', { name: 'Changed' });
		result.current.removeProposal('first');
	});
	expect(result.current.dirty).toBe(false);
	expect(result.current.review.proposed_fields.first.name).toBe('Date');
});

it('recovers a concurrently deleted proposal without losing the draft or other decisions', async () => {
	query.currentData = { ...saved, proposed_fields: { first: { stage: '1', name: 'Date', description: '' } } };
	const { result } = renderHook(() => useReviewState(7, true));
	act(() => result.current.setProposal('first', { description: 'Mon texte' }));
	act(() => result.current.setDecision('1-1', { note: 'À garder' }));
	unwrap.mockRejectedValueOnce({ data: { details: { removed_proposal: 'first' } } });
	await act(() => result.current.save());
	expect(result.current.removedProposal).toEqual({ id: 'first', name: 'Date' });
	expect(result.current.saveError).toBe(false);
	act(() => result.current.restoreProposal());
	unwrap.mockResolvedValueOnce({ ...saved });
	await act(() => result.current.save());
	const payload = saveMutation.mock.calls.at(-1)[0];
	expect(payload.decisions).toEqual({ '1-1': { note: 'À garder' } });
	expect(payload.proposed_fields.first).toBeNull();
	expect(Object.values(payload.proposed_fields).filter(Boolean)).toEqual([
		{ stage: '1', name: 'Date', description: 'Mon texte' },
	]);
	expect(result.current.dirty).toBe(false);
});
