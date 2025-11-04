'use client';

import React, { createContext, PropsWithChildren, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/utils/hooks';
import { InitStateInterface, InitStateToken } from '@/types/_init/_initTypes';
import { initAppAction, initAppSessionTokensAction } from '@/store/actions/_init/_initActions';
import { emptyInitStateToken } from '@/store/slices/_init/_initSlice';
import { getInitStateToken } from '@/store/selectors';
import { useSession } from 'next-auth/react';
import { useGetProfilQuery, useGetGroupsQuery } from '@/store/services/account/account';
import { accountSetGroupesAction, accountSetProfilAction } from '@/store/actions/account/accountActions';

const InitContext = createContext<InitStateInterface<InitStateToken>>({
	initStateToken: emptyInitStateToken,
});

export const InitContextProvider: React.FC<PropsWithChildren<Record<string, unknown>>> = (props) => {
	const dispatch = useAppDispatch();
	const token = useAppSelector(getInitStateToken);
	const { data: session, status } = useSession();
	const { data: user } = useGetProfilQuery(token, {
		skip: !token || status !== 'authenticated',
	});
	const { data: groupes } = useGetGroupsQuery(token, {
		skip: !token || status !== 'authenticated',
	});
	const [appTokenSessionLoaded, setAppTokenSessionLoaded] = useState<boolean>(false);

	useEffect(() => {
		// When next-auth session is known and authenticated, initialize store tokens once
		if (!appTokenSessionLoaded && status === 'authenticated' && session) {
			dispatch(initAppSessionTokensAction(session));
			dispatch(initAppAction());
			setAppTokenSessionLoaded(true);
		}

		// If session is explicitly unauthenticated, mark loaded so children render without token
		if (!appTokenSessionLoaded && status === 'unauthenticated') {
			setAppTokenSessionLoaded(true);
		}
	}, [appTokenSessionLoaded, dispatch, session, status]);

	useEffect(() => {
		// Dispatch init actions here :
		if (user) {
			dispatch(accountSetProfilAction(user));
		}
		if (groupes) {
			dispatch(accountSetGroupesAction(groupes));
		}
	}, [dispatch, user, groupes]);

	// Do not render children until we've attempted to initialize the token state
	if (!appTokenSessionLoaded) {
		return null;
	}

	const contextValue: InitStateInterface<InitStateToken> = { initStateToken: token };

	return <InitContext.Provider value={contextValue}>{props.children}</InitContext.Provider>;
};

export default InitContext;
