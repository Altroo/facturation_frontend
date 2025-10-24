"use client";

import React, {createContext, PropsWithChildren, useEffect, useState} from 'react';
import {useAppDispatch, useAppSelector} from '@/utils/hooks';
import {
  InitStateInterface,
  InitStateToken,
} from "@/types/_init/_initTypes";
import {
  initAppAction,
  initAppSessionTokensAction
} from "@/store/actions/_init/_initActions";
import {emptyInitStateToken} from '@/store/slices/_init/_initSlice';
import {
  getInitStateToken,
} from "@/store/selectors";
import {useSession} from "next-auth/react";

const InitContext = createContext<InitStateInterface<InitStateToken>>({
  initStateToken: emptyInitStateToken,
});

export const InitContextProvider = (props: PropsWithChildren<Record<string, unknown>>) => {
  const dispatch = useAppDispatch();
  const token = useAppSelector(getInitStateToken);
  const {data: session} = useSession();
  const [appTokenSessionLoaded, setAppTokenSessionLoaded] = useState<boolean>(false);

  useEffect(() => {
    // init app tokens from cookies
    if (!appTokenSessionLoaded && (session && session.accessToken)) {
      dispatch(initAppSessionTokensAction(session));
      // Initialize states
      dispatch(initAppAction());
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAppTokenSessionLoaded(true);
    }
  }, [appTokenSessionLoaded, dispatch, session, token]);

  const contextValue: InitStateInterface<InitStateToken> = {
    initStateToken: token,
  };

  return <InitContext.Provider value={contextValue}>{props.children}</InitContext.Provider>;
};

export default InitContext;
