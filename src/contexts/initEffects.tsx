'use client';

import React, { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/utils/hooks';
import { useSession } from 'next-auth/react';
import { initAppSessionTokensAction } from '@/store/actions/_initActions';
import { getInitStateToken } from '@/store/selectors';
import { useGetProfilQuery, useGetGroupsQuery } from '@/store/services/account';
import { accountSetGroupesAction, accountSetProfilAction } from '@/store/actions/accountActions';
import { useGetCitiesListQuery } from '@/store/services/parameter';
import { parameterSetCitiesAction } from '@/store/actions/parameterActions';
import { useGetUserCompaniesQuery } from '@/store/services/company';
import { companiesSetUserCompaniesAction } from '@/store/actions/companiesActions';

export const InitEffects: React.FC = () => {
	const { data: session, status } = useSession();
	const dispatch = useAppDispatch();
	const initState = useAppSelector(getInitStateToken);
	const accessToken = initState?.access ?? undefined;
	const skip = !accessToken || status !== 'authenticated';

	const tokensInitializedRef = useRef(false);

	// Queries
	const { data: user } = useGetProfilQuery(undefined, { skip });
	const { data: groupes } = useGetGroupsQuery(undefined, { skip });
	const { data: cities } = useGetCitiesListQuery(undefined, { skip });
	const { data: companies } = useGetUserCompaniesQuery(undefined, { skip });

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
		if (companies) dispatch(companiesSetUserCompaniesAction(companies));
	}, [dispatch, companies]);

	return null; // This component only runs effects, no UI
};
