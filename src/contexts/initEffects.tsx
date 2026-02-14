'use client';

import React, { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/utils/hooks';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { initAppSessionTokensAction } from '@/store/actions/_initActions';
import { getAccessToken } from '@/store/selectors';
import { useGetProfilQuery, useGetGroupsQuery } from '@/store/services/account';
import { accountSetGroupesAction, accountSetProfilAction } from '@/store/actions/accountActions';
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

	// Queries — parameter queries removed (they require company_id, fetched per-company in forms)
	const { data: user } = useGetProfilQuery(undefined, { skip });
	const { data: groupes } = useGetGroupsQuery(undefined, { skip });
	const { data: companies } = useGetUserCompaniesQuery(undefined, { skip });

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
