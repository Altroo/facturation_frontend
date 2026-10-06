import { useEffect, useRef, useState } from 'react';
import { useGetLogisticsFieldReviewQuery, useSaveLogisticsFieldReviewMutation } from '@/store/services/logistique';
import type {
	LogisticsFieldDecision,
	LogisticsFieldReview,
	LogisticsReviewChanges,
	LogisticsProposedField,
	LogisticsProposalChanges,
} from '@/types/logistiqueTypes';

export const useReviewState = (companyId: number, enabled: boolean) => {
	const query = useGetLogisticsFieldReviewQuery(
		{ company_id: companyId },
		{
			skip: !enabled,
			refetchOnMountOrArgChange: true,
			refetchOnFocus: true,
		},
	);
	const [saveMutation, { isLoading: saving }] = useSaveLogisticsFieldReviewMutation();
	const [saved, setSaved] = useState<LogisticsFieldReview>();
	const [changes, setChanges] = useState<LogisticsReviewChanges>({});
	const [proposalChanges, setProposalChanges] = useState<LogisticsProposalChanges>({});
	const [proposalOriginals, setProposalOriginals] = useState<Record<string, LogisticsProposedField>>({});
	const [validationError, setValidationError] = useState(false);
	const [saveError, setSaveError] = useState(false);
	const [removedProposal, setRemovedProposal] = useState<string>();
	const inFlight = useRef(false);
	const server =
		saved && (!query.currentData?.updated_at || saved.updated_at! >= query.currentData.updated_at)
			? saved
			: query.currentData;
	const decisions = { ...server?.decisions };
	for (const [key, change] of Object.entries(changes)) {
		decisions[key] = { ...(decisions[key] ?? { choice: '', note: '' }), ...change };
	}
	const proposedFields = { ...server?.proposed_fields };
	for (const [key, change] of Object.entries(proposalChanges)) {
		if (change === null) delete proposedFields[key];
		else
			proposedFields[key] = { ...(proposedFields[key] ?? proposalOriginals[key]), ...change } as LogisticsProposedField;
	}
	const unnamedProposals = Object.entries(proposedFields).filter(([, field]) => !field.name?.trim());
	const dirty = Object.keys(changes).length > 0 || Object.keys(proposalChanges).length > 0;
	const canEdit = !!query.currentData?.can_edit && !query.isError;
	const refetch = query.refetch;
	useEffect(() => {
		if (!enabled) return;
		const refresh = () => {
			if (document.visibilityState === 'visible') void refetch();
		};
		window.addEventListener('focus', refresh);
		document.addEventListener('visibilitychange', refresh);
		return () => {
			window.removeEventListener('focus', refresh);
			document.removeEventListener('visibilitychange', refresh);
		};
	}, [enabled, refetch]);
	useEffect(() => {
		if (!dirty) return;
		const warn = (event: BeforeUnloadEvent) => {
			event.preventDefault();
			event.returnValue = '';
		};
		const confirmLeave = (event: MouseEvent) => {
			if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
			const element = event.target instanceof Element ? event.target : null;
			const link = element?.closest('a[href]') as HTMLAnchorElement | null;
			const tab = element?.closest('[role="tab"]');
			const changesCompany = tab?.closest('[data-company-tabs]') && tab.getAttribute('aria-selected') !== 'true';
			const leavesPage =
				link && link.target !== '_blank' && (link.pathname !== location.pathname || link.search !== location.search);
			if (
				(changesCompany || leavesPage) &&
				!window.confirm('Vos modifications ne sont pas enregistrées. Quitter sans enregistrer ?')
			) {
				event.preventDefault();
				event.stopImmediatePropagation();
			}
		};
		window.addEventListener('beforeunload', warn);
		document.addEventListener('click', confirmLeave, true);
		return () => {
			window.removeEventListener('beforeunload', warn);
			document.removeEventListener('click', confirmLeave, true);
		};
	}, [dirty]);
	const setDecision = (key: string, change: Partial<LogisticsFieldDecision>) => {
		if (inFlight.current || !canEdit) return;
		setChanges((previous) => ({ ...previous, [key]: { ...previous[key], ...change } }));
	};
	const addProposal = (stage: string) => {
		if (inFlight.current || !canEdit) return;
		const id = crypto.randomUUID();
		setProposalChanges((previous) => ({ ...previous, [id]: { stage, name: '', description: '' } }));
	};
	const setProposal = (key: string, change: Partial<LogisticsProposedField>) => {
		if (inFlight.current || !canEdit) return;
		setProposalOriginals((previous) => ({ ...previous, [key]: previous[key] ?? proposedFields[key] }));
		setProposalChanges((previous) => ({ ...previous, [key]: { ...previous[key], ...change } }));
	};
	const removeProposal = (key: string) => {
		if (inFlight.current || !canEdit) return;
		setProposalChanges((previous) => ({ ...previous, [key]: null }));
		if (removedProposal === key) setRemovedProposal(undefined);
	};
	const restoreProposal = () => {
		if (inFlight.current || !canEdit || !removedProposal) return;
		const field = proposedFields[removedProposal];
		if (!field) return;
		const id = crypto.randomUUID();
		setProposalChanges((previous) => {
			const next = { ...previous, [id]: field, [removedProposal]: null };
			return next;
		});
		setRemovedProposal(undefined);
	};
	const save = async () => {
		if (inFlight.current || !dirty || !canEdit) return;
		setValidationError(unnamedProposals.length > 0);
		if (unnamedProposals.length > 0) return;
		inFlight.current = true;
		setSaveError(false);
		setRemovedProposal(undefined);
		try {
			const result = await saveMutation({
				company_id: companyId,
				...(Object.keys(changes).length ? { decisions: changes } : {}),
				...(Object.keys(proposalChanges).length ? { proposed_fields: proposalChanges } : {}),
			}).unwrap();
			setSaved(result);
			setChanges({});
			setProposalChanges({});
			setProposalOriginals({});
		} catch (error) {
			const removed = (error as { data?: { details?: { removed_proposal?: unknown } } } | null)?.data?.details
				?.removed_proposal;
			if (typeof removed === 'string' && proposedFields[removed]) setRemovedProposal(removed);
			else setSaveError(true);
		} finally {
			inFlight.current = false;
		}
	};
	return {
		review: { decisions, proposed_fields: proposedFields },
		invalidProposalStages: validationError ? [...new Set(unnamedProposals.map(([, field]) => field.stage))] : [],
		ready: !!server,
		loading: query.isFetching,
		loadError: query.isError,
		retry: query.refetch,
		canEdit,
		saving,
		dirty,
		saveError,
		removedProposal:
			removedProposal && proposedFields[removedProposal]
				? { id: removedProposal, name: proposedFields[removedProposal].name }
				: undefined,
		restoreProposal,
		savedAt: server?.updated_at,
		setDecision,
		addProposal,
		setProposal,
		removeProposal,
		save,
	};
};
