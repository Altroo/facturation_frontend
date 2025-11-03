import { createApi } from '@reduxjs/toolkit/query/react';
import { allowAnyInstance, isAuthenticatedInstance } from '@/utils/helpers';
import { axiosBaseQuery } from '@/utils/axiosBaseQuery';
import { SuccessResponseType } from '@/types/_init/_initTypes';
import { store } from '@/store/store';
import { getInitStateToken } from '@/store/selectors';
import { UserClass } from '@/models/account/UserClass';
import { UpdateProfilResponse, PasswordResetResponse } from '@/types/account/accountTypes';

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
		passwordReset: builder.mutation<SuccessResponseType, { email: string; code: string }>({
			query: (payload) => ({
				url: `${process.env.NEXT_PUBLIC_ACCOUNT_PASSWORD_RESET}${payload.email}/${payload.code}/`,
				method: 'GET',
			}),
		}),
		SetPassword: builder.mutation<
			SuccessResponseType,
			{ email: string; code: string; new_password: string; new_password2: string }
		>({
			query: (payload) => ({
				url: `${process.env.NEXT_PUBLIC_ACCOUNT_PASSWORD_RESET}`,
				method: 'PUT',
				data: payload,
			}),
		}),
	}),
});

export const profilApi = createApi({
	reducerPath: 'profilApi',
	baseQuery: axiosBaseQuery(() => {
		// pass function which will be used by the interceptor to read the latest token from redux
		return isAuthenticatedInstance(() => getInitStateToken(store.getState()));
	}),
	endpoints: (builder) => ({
		getProfil: builder.query<UserClass, string | undefined>({
			query: (token) => ({
				url: process.env.NEXT_PUBLIC_ACCOUNT_PROFIL as string,
				method: 'GET',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
			}),
		}),
		updateProfil: builder.mutation<SuccessResponseType, UpdateProfilResponse>({
			query: ({ token, data }) => ({
				url: process.env.NEXT_PUBLIC_ACCOUNT_PROFIL as string,
				method: 'PATCH',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
				data,
			}),
		}),
		updatePassword: builder.mutation<SuccessResponseType, PasswordResetResponse>({
			query: ({ token, data }) => ({
				url: process.env.NEXT_PUBLIC_ACCOUNT_PASSWORD_CHANGE as string,
				method: 'PUT',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
				data,
			}),
		}),
	}),
});

export const { useSendPasswordResetCodeMutation, usePasswordResetMutation, useSetPasswordMutation } = accountApi;
export const { useGetProfilQuery, useUpdateProfilMutation, useUpdatePasswordMutation } = profilApi;
