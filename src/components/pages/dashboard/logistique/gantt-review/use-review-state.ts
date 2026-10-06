import { useEffect, useRef, useState } from 'react';
import { useGetLogisticsFieldReviewQuery, useSaveLogisticsFieldReviewMutation } from '@/store/services/logistique';
import type { LogisticsFieldDecision, LogisticsFieldReview, LogisticsReviewChanges } from '@/types/logistiqueTypes';

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
	const [saveError, setSaveError] = useState(false);
	const inFlight = useRef(false);
	const server =
		saved && (!query.currentData?.updated_at || saved.updated_at! >= query.currentData.updated_at)
			? saved
			: query.currentData;
	const decisions = { ...server?.decisions };
	for (const [key, change] of Object.entries(changes)) {
		decisions[key] = { ...(decisions[key] ?? { choice: '', note: '' }), ...change };
	}
	const dirty = Object.keys(changes).length > 0;
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
	const save = async () => {
		if (inFlight.current || !dirty || !canEdit) return;
		inFlight.current = true;
		setSaveError(false);
		try {
			const result = await saveMutation({ company_id: companyId, decisions: changes }).unwrap();
			setSaved(result);
			setChanges({});
		} catch {
			setSaveError(true);
		} finally {
			inFlight.current = false;
		}
	};
	return {
		review: { decisions },
		ready: !!server,
		loading: query.isFetching,
		loadError: query.isError,
		retry: query.refetch,
		canEdit,
		saving,
		dirty,
		saveError,
		savedAt: server?.updated_at,
		setDecision,
		save,
	};
};
