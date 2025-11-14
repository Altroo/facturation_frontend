import { createApi } from '@reduxjs/toolkit/query/react';
import { allowAnyInstance, isAuthenticatedInstance } from '@/utils/helpers';
import { axiosBaseQuery } from '@/utils/axiosBaseQuery';
import type { ApiErrorResponseType, PaginationResponseType, SuccessResponseType } from '@/types/_initTypes';
import { store } from '@/store/store';
import { getInitStateToken } from '@/store/selectors';
import { GroupClass, UserClass } from '@/models/Classes';
import type { EditProfilResponse, PasswordResetResponse } from '@/types/accountTypes';
import { UserWithCompaniesResponseType } from '@/types/usersTypes';

export const accountApi = createApi({
	reducerPath: 'accountApi',
	baseQuery: axiosBaseQuery(() => allowAnyInstance()),
	endpoints: (builder) => ({
		sendPasswordResetCode: builder.mutation<void | ApiErrorResponseType, { email: string }>({
			query: (payload) => ({
				url: process.env.NEXT_PUBLIC_ACCOUNT_SEND_PASSWORD_RESET as string,
				method: 'POST',
				data: payload,
			}),
		}),
		passwordReset: builder.mutation<void | ApiErrorResponseType, { email: string; code: string }>({
			query: (payload) => ({
				url: `${process.env.NEXT_PUBLIC_ACCOUNT_PASSWORD_RESET}${payload.email}/${payload.code}/`,
				method: 'GET',
			}),
		}),
		SetPassword: builder.mutation<
			void | ApiErrorResponseType,
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
	}),
});

export const usersApi = createApi({
	reducerPath: 'usersApi',
	tagTypes: ['Users'],
	baseQuery: axiosBaseQuery(() => {
		// pass function which will be used by the interceptor to read the latest token from redux
		return isAuthenticatedInstance(() => getInitStateToken(store.getState()));
	}),
	endpoints: (builder) => ({
		getUsersList: builder.query<
			SuccessResponseType<Array<Partial<UserClass>>> | PaginationResponseType<Partial<UserClass>>,
			{ token?: string; with_pagination?: boolean; page?: number; pageSize?: number; search?: string }
		>({
			query: ({ token, with_pagination, page, pageSize, search }) => ({
				url: with_pagination
					? `${process.env.NEXT_PUBLIC_USERS_ROOT}?search=${search}&page=${page}&page_size=${pageSize}`
					: (process.env.NEXT_PUBLIC_USERS_ROOT as string),
				method: 'GET',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
				params: with_pagination ? { pagination: true } : undefined,
			}),
			providesTags: ['Users'],
		}),
		getUser: builder.query<UserWithCompaniesResponseType, { token: string | undefined; id: number }>({
			query: ({ token, id }) => ({
				url: `${process.env.NEXT_PUBLIC_USERS_ROOT}${id}/`,
				method: 'GET',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
			}),
		}),
		checkEmail: builder.query<void | ApiErrorResponseType, { token: string | undefined; email: string }>({
			query: ({ token, email }) => ({
				// this is using Account app endpoint
				url: `${process.env.NEXT_PUBLIC_ACCOUNT_CHECK_EMAIL}${email}/`,
				method: 'GET',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
			}),
		}),
		deleteUser: builder.mutation<void | ApiErrorResponseType, { token: string | undefined; id: number }>({
			query: ({ token, id }) => ({
				url: `${process.env.NEXT_PUBLIC_USERS_ROOT}${id}/`,
				method: 'DELETE',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
			}),
		}),
		editUser: builder.mutation<UserClass, { token: string | undefined; id: number; data: Partial<UserClass> }>({
			query: ({ token, id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_USERS_ROOT}${id}/`,
				method: 'PUT',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
				data,
			}),
		}),
		addUser: builder.mutation<UserClass, { token: string | undefined; data: Partial<UserClass> }>({
			query: ({ token, data }) => ({
				url: `${process.env.NEXT_PUBLIC_USERS_ROOT}`,
				method: 'POST',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
				data,
			}),
			invalidatesTags: ['Users'],
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
		editProfil: builder.mutation<UserClass, EditProfilResponse>({
			query: ({ token, data }) => ({
				url: process.env.NEXT_PUBLIC_ACCOUNT_PROFIL as string,
				method: 'PATCH',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
				data,
			}),
		}),
		editPassword: builder.mutation<void | ApiErrorResponseType, PasswordResetResponse>({
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
export const { useGetGroupsQuery } = groupApi;
export const {
	useGetUsersListQuery,
	useDeleteUserMutation,
	useEditUserMutation,
	useGetUserQuery,
	useAddUserMutation,
	useCheckEmailQuery,
} = usersApi;
