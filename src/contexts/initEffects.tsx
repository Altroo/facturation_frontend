'use client';

import React, { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/utils/hooks';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { initAppSessionTokensAction } from '@/store/actions/_initActions';
import { getAccessToken } from '@/store/selectors';
import { useGetProfilQuery, useGetGroupsQuery } from '@/store/services/account';
import { accountSetGroupesAction, accountSetProfilAction } from '@/store/actions/accountActions';
import {
	useGetCitiesListQuery,
	useGetCategorieListQuery,
	useGetEmplacementListQuery,
	useGetUniteListQuery,
	useGetMarqueListQuery,
	useGetModePaiementListQuery,
	useGetLivreParListQuery,
} from '@/store/services/parameter';
import {
	parameterSetCategoriesAction,
	parameterSetCitiesAction,
	parameterSetEmplacementsAction,
	parameterSetMarquesAction,
	parameterSetUnitesAction,
	parameterSetModePaiementAction,
	parameterSetLivreParAction,
} from '@/store/actions/parameterActions';
import { useGetUserCompaniesQuery } from '@/store/services/company';
import { companiesSetUserCompaniesAction } from '@/store/actions/companiesActions';
import { DASHBOARD_PASSWORD } from '@/utils/routes';

export const InitEffects: React.FC = () => {
	const { data: session, status } = useSession();
	const dispatch = useAppDispatch();
	const router = useRouter();
	const pathname = usePathname();
	const initState = useAppSelector(getAccessToken);
	const accessToken = initState ?? undefined;
	const skip = !accessToken || status !== 'authenticated';

	const tokensInitializedRef = useRef(false);

	// Queries
	const { data: user } = useGetProfilQuery(undefined, { skip });
	const { data: groupes } = useGetGroupsQuery(undefined, { skip });
	const { data: cities } = useGetCitiesListQuery(undefined, { skip });
	const { data: categories } = useGetCategorieListQuery(undefined, { skip });
	const { data: emplacements } = useGetEmplacementListQuery(undefined, { skip });
	const { data: unites } = useGetUniteListQuery(undefined, { skip });
	const { data: marques } = useGetMarqueListQuery(undefined, { skip });
	const { data: companies } = useGetUserCompaniesQuery(undefined, { skip });
	const { data: modePaiement } = useGetModePaiementListQuery(undefined, { skip });
	const { data: livrePar } = useGetLivreParListQuery(undefined, { skip });

	// Initialize tokens once
	useEffect(() => {
		if (status === 'authenticated' && session && !tokensInitializedRef.current) {
			dispatch(initAppSessionTokensAction(session));
			tokensInitializedRef.current = true;
		}
	}, [status, session, dispatch]);

	// Consolidate all data dispatches into single useEffect
	// React 18+ automatically batches these dispatches to minimize re-renders
	useEffect(() => {
		if (user) dispatch(accountSetProfilAction(user));
		if (groupes) dispatch(accountSetGroupesAction(groupes));
		if (cities) dispatch(parameterSetCitiesAction(cities));
		if (categories) dispatch(parameterSetCategoriesAction(categories));
		if (emplacements) dispatch(parameterSetEmplacementsAction(emplacements));
		if (unites) dispatch(parameterSetUnitesAction(unites));
		if (marques) dispatch(parameterSetMarquesAction(marques));
		if (modePaiement) dispatch(parameterSetModePaiementAction(modePaiement));
		if (livrePar) dispatch(parameterSetLivreParAction(livrePar));
		if (companies) dispatch(companiesSetUserCompaniesAction(companies));
	}, [dispatch, user, groupes, cities, categories, emplacements, unites, marques, modePaiement, livrePar, companies]);

	// Redirect to password change page if user still has default password
	useEffect(() => {
		if (user && user.default_password_set && pathname !== '/dashboard/settings/password') {
			router.push(DASHBOARD_PASSWORD);
		}
	}, [user, pathname, router]);

	return null; // This component only runs effects, no UI
};
