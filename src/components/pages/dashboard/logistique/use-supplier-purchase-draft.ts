'use client';
import { useGetArticleQuery } from '@/store/services/article';
import type { PurchaseFormValues, SupplierPurchaseDraftOptions } from '@/types/supplierPurchaseTypes';
import { purchaseDraft } from '@/utils/helpers';
import { ARTICLES_ADD } from '@/utils/routes';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export function useSupplierPurchaseDraft({
	company_id,
	id,
	token,
	mode,
	userId,
	formik,
	setApiError,
}: SupplierPurchaseDraftOptions) {
	const query = useSearchParams();
	const router = useRouter();
	const draftId = query.get('brouillon');
	const returnedArticleId = Number(query.get('article_id') ?? 0);
	const draftKey = draftId ? `purchase:${userId}:${company_id}:${id}:${draftId}` : null;
	const { data: returnedArticle, error: returnedArticleError } = useGetArticleQuery(
		{ id: returnedArticleId },
		{ skip: !token || !draftId || !returnedArticleId || mode !== 'proforma' },
	);
	const restored = useRef<string | null>(null);
	const [draftReady, setDraftReady] = useState(!draftId || mode !== 'proforma');
	const setValues = formik.setValues;
	useEffect(() => {
		if (
			!draftKey ||
			mode !== 'proforma' ||
			restored.current === draftKey ||
			(returnedArticleId && !returnedArticle && !returnedArticleError)
		)
			return;
		let cancelled = false;
		void purchaseDraft<PurchaseFormValues>(draftKey, 'read')
			.then(async (draft) => {
				if (cancelled) return;
				restored.current = draftKey;
				if (!draft) {
					setApiError('Le brouillon est introuvable ou a expiré.');
					return;
				}
				if (
					returnedArticle &&
					returnedArticle.company === company_id &&
					!draft.lignes.some((line) => line.article === returnedArticle.id)
				) {
					const line = {
						article: returnedArticle.id,
						article_reference: returnedArticle.reference,
						designation: returnedArticle.designation ?? '',
						quantity: '1',
						prix_achat:
							returnedArticle.devise_prix_achat === draft.devise_proforma_fournisseur
								? String(returnedArticle.prix_achat ?? '')
								: '',
						expected_emplacement: returnedArticle.emplacement ?? null,
					};
					const empty = draft.lignes.findIndex((entry) => !entry.article);
					if (empty >= 0) draft.lignes[empty] = line;
					else draft.lignes.push(line);
				}
				await setValues(draft);
				if (returnedArticleError)
					setApiError(
						'Le brouillon est restauré, mais l’article ajouté n’a pas pu être chargé. Sélectionnez-le dans la liste.',
					);
				else if (returnedArticle && returnedArticle.company !== company_id)
					setApiError('Le brouillon est restauré. Cet article n’appartient pas à cette société.');
			})
			.catch(() => {
				if (!cancelled) setApiError('Impossible de restaurer le brouillon.');
			})
			.finally(() => {
				if (!cancelled) setDraftReady(true);
			});
		return () => {
			cancelled = true;
		};
	}, [draftKey, mode, returnedArticle, returnedArticleError, returnedArticleId, company_id, setValues, setApiError]);
	const addNewArticle = async () => {
		const key = draftId || crypto.randomUUID();
		try {
			await purchaseDraft(`purchase:${userId}:${company_id}:${id}:${key}`, 'write', formik.values);
			const back = new URL(window.location.href);
			back.searchParams.set('brouillon', key);
			back.searchParams.delete('article_id');
			router.push(`${ARTICLES_ADD(company_id)}&retour=${encodeURIComponent(back.pathname + back.search)}`);
		} catch {
			setApiError('Impossible de conserver le brouillon. Le formulaire reste ouvert.');
		}
	};

	return { draftKey, draftReady, addNewArticle };
}
