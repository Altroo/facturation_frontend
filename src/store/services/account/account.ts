import { createApi } from '@reduxjs/toolkit/query/react';
import {allowAnyInstance} from "@/utils/helpers";
import {axiosBaseQuery} from "@/utils/axiosBaseQuery";
import {SuccessResponseType} from "@/types/_init/_initTypes";

export const accountApi = createApi({
  reducerPath: 'accountApi',
  baseQuery: axiosBaseQuery(() => allowAnyInstance()),
  endpoints: (builder) => ({
    sendPasswordResetCode: builder.mutation<SuccessResponseType, { email: string }>({
      query: (payload) => ({
        url: process.env.NEXT_PUBLIC_ACCOUNT_SEND_PASSWORD_RESET as string,
        method: 'POST',
        data: payload,
      }),
    }),

    passwordReset: builder.mutation<SuccessResponseType, { email: string, code: string }>({
      query: (payload) => ({
        url: `${process.env.NEXT_PUBLIC_ACCOUNT_PASSWORD_RESET}/${payload.email}/${payload.code}/`,
        method: 'GET',
      }),
    }),
  }),
});

export const { useSendPasswordResetCodeMutation, usePasswordResetMutation } = accountApi;
