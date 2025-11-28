'use client';

import React, { createContext, PropsWithChildren, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/utils/hooks';
import type { InitStateInterface, InitStateToken } from '@/types/_initTypes';
import { initAppSessionTokensAction } from '@/store/actions/_initActions';
import { emptyInitStateToken } from '@/store/slices/_initSlice';
import { getInitStateToken } from '@/store/selectors';
import { useSession } from 'next-auth/react';
import { useGetProfilQuery, useGetGroupsQuery } from '@/store/services/account';
import { accountSetGroupesAction, accountSetProfilAction } from '@/store/actions/accountActions';
import { useGetCitiesListQuery } from '@/store/services/parameter';
import { parameterSetCitiesAction } from '@/store/actions/parameterActions';
import { useGetUserCompaniesQuery } from '@/store/services/company';
import { companiesSetUserCompaniesAction } from '@/store/actions/companiesActions';

const InitContext = createContext<InitStateInterface<InitStateToken>>({
	initStateToken: emptyInitStateToken,
});

export const InitContextProvider: React.FC<PropsWithChildren<Record<string, unknown>>> = (props) => {
	const dispatch = useAppDispatch();
	const token = useAppSelector(getInitStateToken);
	const { data: session, status } = useSession();
	const skip = !token || status !== 'authenticated';
	// Use ref to track if tokens have been initialized
	const tokensInitializedRef = useRef(false);
	// get user profile
	const { data: user } = useGetProfilQuery(token, {
		skip: skip,
	});
	// get groupes
	const { data: groupes } = useGetGroupsQuery(token, {
		skip: skip,
	});
	// get cities
	const { data: cities } = useGetCitiesListQuery(token, {
		skip: skip,
	});
	// get user companies
	const { data: companies } = useGetUserCompaniesQuery(token, {
		skip: skip,
	});

	// Initialize tokens once when session becomes authenticated
	useEffect(() => {
		if (status === 'authenticated' && session && !tokensInitializedRef.current) {
			dispatch(initAppSessionTokensAction(session));
			tokensInitializedRef.current = true;
		}
	}, [status, session, dispatch]);

	// Dispatch data actions when data is available
	useEffect(() => {
		if (user) {
			dispatch(accountSetProfilAction(user));
		}
	}, [dispatch, user]);

	useEffect(() => {
		if (groupes) {
			dispatch(accountSetGroupesAction(groupes));
		}
	}, [dispatch, groupes]);

	useEffect(() => {
		if (cities) {
			dispatch(parameterSetCitiesAction(cities));
		}
	}, [dispatch, cities]);

	useEffect(() => {
		if (companies) {
			dispatch(companiesSetUserCompaniesAction(companies));
		}
	}, [dispatch, companies]);

	// CRITICAL: Always render children to avoid hydration mismatch
	// The context value will be available even if tokens aren't loaded yet
	const contextValue: InitStateInterface<InitStateToken> = {
		initStateToken: token || emptyInitStateToken,
	};

	return <InitContext.Provider value={contextValue}>{props.children}</InitContext.Provider>;
};

export default InitContext;
