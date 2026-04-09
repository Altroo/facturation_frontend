'use client';

import React, { useEffect, useRef } from 'react';
import { useAppDispatch } from '@/utils/hooks';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { initAppAction, initAppSessionTokensAction } from '@/store/actions/_initActions';
import { useGetGroupsQuery, useGetProfilQuery } from '@/store/services/account';
import { accountSetGroupesAction, accountSetProfilAction } from '@/store/actions/accountActions';
import { useGetUserCompaniesQuery } from '@/store/services/company';
import { companiesSetUserCompaniesAction } from '@/store/actions/companiesActions';
import { DASHBOARD_PASSWORD } from '@/utils/routes';
import { useInitAccessToken } from '@/contexts/InitContext';

export const InitEffects: React.FC = () => {
	const { data: session, status } = useSession();
	const dispatch = useAppDispatch();
	const router = useRouter();
	const pathname = usePathname();
	const accessToken = useInitAccessToken();
	const skip = !accessToken || status !== 'authenticated';

	const appInitializedRef = useRef(false);
	const lastAccessTokenRef = useRef<string | null>(null);

	useEffect(() => {
		if (!appInitializedRef.current) {
			dispatch(initAppAction());
			appInitializedRef.current = true;
		}
	}, [dispatch]);

	// Queries — parameter queries removed (they require company_id, fetched per-company in forms)
	const { data: user } = useGetProfilQuery(undefined, { skip });
	const { data: groupes } = useGetGroupsQuery(undefined, { skip });
	const { data: companies } = useGetUserCompaniesQuery(undefined, { skip });

	// Sync Redux tokens whenever the access token changes (covers initial login + every refresh)
	useEffect(() => {
		if (status === 'authenticated' && session?.accessToken && lastAccessTokenRef.current !== session.accessToken) {
			lastAccessTokenRef.current = session.accessToken;
			dispatch(initAppSessionTokensAction(session));
		}
		if (status !== 'authenticated') {
			lastAccessTokenRef.current = null;
		}
	}, [status, session, dispatch]);

	// Consolidate all data dispatches into single useEffect
	// React 18+ automatically batches these dispatches to minimize re-renders
	useEffect(() => {
		if (user) dispatch(accountSetProfilAction(user));
		if (groupes) dispatch(accountSetGroupesAction(groupes));
		if (companies) dispatch(companiesSetUserCompaniesAction(companies));
	}, [dispatch, user, groupes, companies]);

	// Redirect to password change page if user still has default password
	useEffect(() => {
		if (user && user.default_password_set && pathname !== '/dashboard/settings/password') {
			router.push(DASHBOARD_PASSWORD);
		}
	}, [user, pathname, router]);

	return null; // This component only runs effects, no UI
};
