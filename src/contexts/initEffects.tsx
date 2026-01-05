'use client';

import React, { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/utils/hooks';
import { useSession } from 'next-auth/react';
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
	useGetModeReglementListQuery,
	useGetLivreParListQuery,
} from '@/store/services/parameter';
import {
	parameterSetCategoriesAction,
	parameterSetCitiesAction,
	parameterSetEmplacementsAction,
	parameterSetMarquesAction,
	parameterSetUnitesAction,
	parameterSetModeReglementAction,
	parameterSetModePaiementAction,
	parameterSetLivreParAction,
} from '@/store/actions/parameterActions';
import { useGetUserCompaniesQuery } from '@/store/services/company';
import { companiesSetUserCompaniesAction } from '@/store/actions/companiesActions';

export const InitEffects: React.FC = () => {
	const { data: session, status } = useSession();
	const dispatch = useAppDispatch();
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
	const { data: modeReglement } = useGetModeReglementListQuery(undefined, { skip });
	const { data: livrePar } = useGetLivreParListQuery(undefined, { skip });

	// Initialize tokens once
	useEffect(() => {
		if (status === 'authenticated' && session && !tokensInitializedRef.current) {
			dispatch(initAppSessionTokensAction(session));
			tokensInitializedRef.current = true;
		}
	}, [status, session, dispatch]);

	// Dispatch data actions
	useEffect(() => {
		if (user) dispatch(accountSetProfilAction(user));
	}, [dispatch, user]);

	useEffect(() => {
		if (groupes) dispatch(accountSetGroupesAction(groupes));
	}, [dispatch, groupes]);

	useEffect(() => {
		if (cities) dispatch(parameterSetCitiesAction(cities));
	}, [dispatch, cities]);

	useEffect(() => {
		if (categories) dispatch(parameterSetCategoriesAction(categories));
	}, [dispatch, categories]);

	useEffect(() => {
		if (emplacements) dispatch(parameterSetEmplacementsAction(emplacements));
	}, [dispatch, emplacements]);

	useEffect(() => {
		if (unites) dispatch(parameterSetUnitesAction(unites));
	}, [dispatch, unites]);

	useEffect(() => {
		if (marques) dispatch(parameterSetMarquesAction(marques));
	}, [dispatch, marques]);

	useEffect(() => {
		if (modePaiement) dispatch(parameterSetModePaiementAction(modePaiement));
	}, [dispatch, modePaiement]);

	useEffect(() => {
		if (modeReglement) dispatch(parameterSetModeReglementAction(modeReglement));
	}, [dispatch, modeReglement]);

	useEffect(() => {
		if (livrePar) dispatch(parameterSetLivreParAction(livrePar));
	}, [dispatch, livrePar]);

	useEffect(() => {
		if (companies) dispatch(companiesSetUserCompaniesAction(companies));
	}, [dispatch, companies]);

	return null; // This component only runs effects, no UI
};
