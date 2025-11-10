import { createApi } from '@reduxjs/toolkit/query/react';
import { allowAnyInstance, isAuthenticatedInstance } from '@/utils/helpers';
import { axiosBaseQuery } from '@/utils/axiosBaseQuery';
import { SuccessResponseType } from '@/types/_initTypes';
import { store } from '@/store/store';
import { getInitStateToken } from '@/store/selectors';
import { GroupClass, UserClass } from '@/models/Classes';
import { EditProfilResponse, PasswordResetResponse } from '@/types/accountTypes';

export const accountApi = createApi({
	reducerPath: 'accountApi',
	baseQuery: axiosBaseQuery(() => allowAnyInstance()),
	endpoints: (builder) => ({
		sendPasswordResetCode: builder.mutation<void | SuccessResponseType, { email: string }>({
			query: (payload) => ({
				url: process.env.NEXT_PUBLIC_ACCOUNT_SEND_PASSWORD_RESET as string,
				method: 'POST',
				data: payload,
			}),
		}),
		passwordReset: builder.mutation<void | SuccessResponseType, { email: string; code: string }>({
			query: (payload) => ({
				url: `${process.env.NEXT_PUBLIC_ACCOUNT_PASSWORD_RESET}${payload.email}/${payload.code}/`,
				method: 'GET',
			}),
		}),
		SetPassword: builder.mutation<
			void | SuccessResponseType,
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

export const groupApi = createApi({
	reducerPath: 'groupApi',
	baseQuery: axiosBaseQuery(() => {
		// pass function which will be used by the interceptor to read the latest token from redux
		return isAuthenticatedInstance(() => getInitStateToken(store.getState()));
	}),
	endpoints: (builder) => ({
		getGroups: builder.query<GroupClass, string | undefined>({
			query: (token) => ({
				url: process.env.NEXT_PUBLIC_ACCOUNT_GROUPS as string,
				method: 'GET',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
			}),
		}),
		getUsers: builder.query<Array<Partial<UserClass>>, string | undefined>({
			query: (token) => ({
				url: process.env.NEXT_PUBLIC_ACCOUNT_USERS as string,
				method: 'GET',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
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
		editProfil: builder.mutation<SuccessResponseType<UserClass>, EditProfilResponse>({
			query: ({ token, data }) => ({
				url: process.env.NEXT_PUBLIC_ACCOUNT_PROFIL as string,
				method: 'PATCH',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
				data,
			}),
		}),
		editPassword: builder.mutation<void | SuccessResponseType, PasswordResetResponse>({
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
export const { useGetProfilQuery, useEditProfilMutation, useEditPasswordMutation } = profilApi;
export const { useGetGroupsQuery, useGetUsersQuery } = groupApi;
