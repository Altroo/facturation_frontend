import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/utils/axiosBaseQuery';
import { isAuthenticatedInstance } from '@/utils/helpers';
import { store } from '@/store/store';
import {getInitStateToken} from "@/store/selectors";

export const accountApi = createApi({
  reducerPath: 'accountApi',
  baseQuery: axiosBaseQuery(() => {
    const token = getInitStateToken(store.getState());
    return isAuthenticatedInstance(token);
  }),
  endpoints: (builder) => ({
    sendPasswordResetCode: builder.mutation<void, { email: string }>({
      query: (payload) => ({
        url: '/account/password-reset',
        method: 'POST',
        data: payload,
      }),
    }),
  }),
});

export const { useSendPasswordResetCodeMutation } = accountApi;
